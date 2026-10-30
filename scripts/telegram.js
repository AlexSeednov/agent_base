#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const https = require('node:https');
const os = require('node:os');
const path = require('node:path');

const clients = { claude: 'Claude', codex: 'Codex' };

// Keep Telegram previews short without splitting a Unicode code point.
function preview(value, limit = 100) {
  if (typeof value !== 'string') return '';
  const line = value.split(/\r?\n/).map((part) => part.trim()).find(Boolean) || '';
  const chars = Array.from(line.replace(/[\u0000-\u001f\u007f]/g, ' '));
  return chars.length > limit ? `${chars.slice(0, limit).join('')}...` : chars.join('');
}

function projectName(cwd, env = process.env) {
  const explicit = preview(env.AGENT_PROJECT_NAME || env.CLAUDE_PROJECT_NAME);
  if (explicit) return explicit;
  try {
    const pubspec = fs.readFileSync(path.join(cwd, 'pubspec.yaml'), 'utf8');
    const match = pubspec.match(/^name:\s*(?:"([^"\r\n]*)"|'([^'\r\n]*)'|([^#\r\n]*))/m);
    const name = match && preview(match[1] ?? match[2] ?? match[3]);
    if (name) return name;
  } catch {
    // Non-Flutter repositories fall back to their directory name.
  }
  return preview(path.basename(cwd)) || 'Unknown project';
}

function stateFile(client, payload, cwd, stateDir) {
  if (typeof payload.session_id !== 'string' || !payload.session_id) return null;
  const key = crypto.createHash('sha256')
    .update(`${client}\0${cwd}\0${payload.session_id}`).digest('hex');
  return path.join(stateDir, `${key}.json`);
}

// Store only the first prompt's preview; never parse a client's transcript.
function rememberPrompt(file, prompt) {
  const title = preview(prompt);
  if (!file || !title) return;
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  try {
    fs.writeFileSync(file, JSON.stringify({ title }), { flag: 'wx', mode: 0o600 });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

function sessionTitle(file) {
  if (!file) return '';
  try {
    if (fs.statSync(file).size > 4096) return '';
    return preview(JSON.parse(fs.readFileSync(file, 'utf8')).title);
  } catch {
    return '';
  }
}

function isQuestion(client, name) {
  if (typeof name !== 'string') return false;
  if (client === 'claude') return name === 'AskUserQuestion';
  return /^request_user_input(?:_async)?$/.test(name.split(/[.:]/).pop());
}

// Both socket failures and a total deadline resolve without blocking the agent.
function sendTelegram(token, chatId, text, options = {}) {
  const request = options.request || https.request;
  const timeoutMs = options.timeoutMs ?? 5000;
  return new Promise((resolve) => {
    let req;
    let timer;
    let finished = false;
    const finish = (ok) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve(ok);
    };
    try {
      const body = JSON.stringify({ chat_id: chatId, text });
      req = request({
        hostname: 'api.telegram.org',
        path: `/bot${token}/sendMessage`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(body),
        },
      }, (response) => {
        const ok = response.statusCode >= 200 && response.statusCode < 300;
        let result = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          if (result.length + chunk.length > 65536) {
            response.destroy();
            finish(false);
          } else result += chunk;
        });
        response.on('error', () => finish(false));
        response.on('aborted', () => finish(false));
        response.on('end', () => {
          try { finish(ok && JSON.parse(result).ok === true); }
          catch { finish(false); }
        });
      });
      req.on('error', () => finish(false));
      timer = setTimeout(() => {
        finish(false);
        req.destroy();
      }, timeoutMs);
      req.end(body);
    } catch {
      finish(false);
      req?.destroy();
    }
  });
}

async function handleHook(options) {
  const { client, event, payload, env = process.env, send = sendTelegram } = options;
  if (!clients[client] || !payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { status: 'ignored' };
  }
  const cwd = typeof payload.cwd === 'string' && payload.cwd
    ? payload.cwd : (options.cwd || process.cwd());
  const stateDir = options.stateDir || path.join(os.tmpdir(),
    `agent-base-${typeof process.getuid === 'function' ? process.getuid() : 'user'}`);
  const file = stateFile(client, payload, cwd, stateDir);

  if (event === 'SessionEnd') {
    if (file) fs.rmSync(file, { force: true });
    return { status: 'cleaned' };
  }
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { status: 'disabled' };
  if (event === 'UserPromptSubmit') {
    rememberPrompt(file, payload.prompt);
    return { status: 'remembered' };
  }

  let status;
  let icon;
  if (event === 'Stop') {
    status = sessionTitle(file) || 'done';
    icon = '✅';
  } else if (event === 'PreToolUse' && isQuestion(client, payload.tool_name)) {
    status = 'Question';
    icon = '❓';
  } else if (event === 'PermissionRequest') {
    // A suspicious-looking command is not evidence that an approval is pending.
    // Do not forward command text, which can contain credentials.
    status = 'Approval required';
    icon = '⚠️';
  } else return { status: 'ignored' };

  const text = `${icon} ${clients[client]}: ${projectName(cwd, env)} — ${status}`;
  const sent = await send(token, chatId, text);
  return { status: sent ? 'sent' : 'failed' };
}

async function main() {
  try {
    const [client, event] = process.argv.slice(2);
    let raw = '';
    process.stdin.setEncoding('utf8');
    for await (const chunk of process.stdin) {
      raw += chunk;
      if (Buffer.byteLength(raw) > 1024 * 1024) throw new Error('Oversized input');
    }
    const result = await handleHook({ client, event, payload: JSON.parse(raw) });
    if (result.status === 'failed') {
      process.stderr.write('agent_base: Telegram notification failed.\n');
    }
  } catch {
    // Never log request errors: their messages may include a credential URL.
    process.stderr.write('agent_base: notification hook skipped invalid or unavailable input.\n');
  } finally {
    // Empty JSON is valid for Stop and does not make an approval decision.
    process.stdout.write('{}\n');
  }
}

if (require.main === module) main();
module.exports = { handleHook, preview, projectName, sendTelegram };
