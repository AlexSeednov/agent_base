'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
const { handleHook, preview, projectName, sendTelegram } = require('../scripts/telegram');

const root = path.resolve(__dirname, '..');
const credentials = { TELEGRAM_BOT_TOKEN: 'test-token', TELEGRAM_CHAT_ID: 'test-chat' };

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-base-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const sent = [];
  return {
    dir,
    sent,
    options: {
      client: 'codex',
      env: credentials,
      payload: { session_id: 'session-one', cwd: dir },
      stateDir: path.join(dir, 'state'),
      send: async (...args) => { sent.push(args); return true; },
    },
  };
}

test('project name uses neutral override, legacy override, pubspec, then folder', (t) => {
  const { dir } = fixture(t);
  fs.writeFileSync(path.join(dir, 'pubspec.yaml'), "name: 'example_app' # comment\n");
  assert.equal(projectName(dir, { AGENT_PROJECT_NAME: 'Новый', CLAUDE_PROJECT_NAME: 'Old' }), 'Новый');
  assert.equal(projectName(dir, { CLAUDE_PROJECT_NAME: 'Old' }), 'Old');
  assert.equal(projectName(dir, {}), 'example_app');
  fs.rmSync(path.join(dir, 'pubspec.yaml'));
  assert.equal(projectName(dir, {}), path.basename(dir));
});

test('previews preserve Cyrillic and complete Unicode code points', () => {
  assert.equal(preview('\n  Исправить доску\nDetails'), 'Исправить доску');
  assert.equal(preview('🧱'.repeat(101)), `${'🧱'.repeat(100)}...`);
  assert.equal(preview('A\u0000B'), 'A B');
});

test('missing credentials produce no network or session files', async (t) => {
  const { dir, sent, options } = fixture(t);
  const result = await handleHook({ ...options, env: {}, event: 'UserPromptSubmit',
    payload: { ...options.payload, prompt: 'Private prompt' } });
  assert.equal(result.status, 'disabled');
  assert.equal(sent.length, 0);
  assert.equal(fs.existsSync(path.join(dir, 'state')), false);
});

test('first prompt names later completions without reading transcripts', async (t) => {
  const { options, sent } = fixture(t);
  for (const prompt of ['Первая задача\nLong details', 'Another turn']) {
    await handleHook({ ...options, event: 'UserPromptSubmit',
      payload: { ...options.payload, prompt } });
  }
  await handleHook({ ...options, event: 'Stop',
    payload: { ...options.payload, transcript_path: '/not/a/real/transcript' } });
  assert.match(sent[0][2], /^✅ Codex: .* — Первая задача$/);
  const files = fs.readdirSync(options.stateDir);
  assert.equal(files.length, 1);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(options.stateDir, files[0]), 'utf8')),
    { title: 'Первая задача' });
});

test('client and session state are isolated', async (t) => {
  const { options, sent } = fixture(t);
  await handleHook({ ...options, event: 'UserPromptSubmit',
    payload: { ...options.payload, prompt: 'Codex task' } });
  await handleHook({ ...options, client: 'claude', event: 'Stop' });
  await handleHook({ ...options, event: 'Stop',
    payload: { ...options.payload, session_id: 'another-session' } });
  assert.match(sent[0][2], /^✅ Claude: .* — done$/);
  assert.match(sent[1][2], /^✅ Codex: .* — done$/);
});

test('questions use each client tool and skip ordinary shell calls', async (t) => {
  const { options, sent } = fixture(t);
  for (const [client, tool] of [
    ['claude', 'AskUserQuestion'], ['codex', 'request_user_input'],
    ['codex', 'functions.request_user_input_async'],
  ]) {
    const result = await handleHook({ ...options, client, event: 'PreToolUse',
      payload: { ...options.payload, tool_name: tool } });
    assert.equal(result.status, 'sent');
  }
  const result = await handleHook({ ...options, event: 'PreToolUse',
    payload: { ...options.payload, tool_name: 'Bash', tool_input: { command: 'rm example' } } });
  assert.equal(result.status, 'ignored');
  assert.equal(sent.length, 3);
});

test('real approval event sends no command text or credentials', async (t) => {
  const { options, sent } = fixture(t);
  await handleHook({ ...options, event: 'PermissionRequest', payload: {
    ...options.payload, tool_name: 'Bash', tool_input: { command: 'tool --token SUPER_SECRET' },
  } });
  assert.match(sent[0][2], / — Approval required$/);
  assert.equal(sent[0][2].includes('SUPER_SECRET'), false);
});

test('completion after a Stop-triggered continuation still produces a notice', async (t) => {
  const { options, sent } = fixture(t);
  assert.equal((await handleHook({ ...options, event: 'Stop',
    payload: { ...options.payload, stop_hook_active: true } })).status, 'sent');
  assert.equal(sent.length, 1);
});

test('SessionEnd removes metadata even after credentials are removed', async (t) => {
  const { options, sent } = fixture(t);
  await handleHook({ ...options, event: 'UserPromptSubmit',
    payload: { ...options.payload, prompt: 'Task' } });
  await handleHook({ ...options, env: {}, event: 'SessionEnd' });
  assert.deepEqual(fs.readdirSync(options.stateDir), []);
  assert.equal(sent.length, 0);
});

test('corrupt state falls back to a completion without blocking', async (t) => {
  const { options, sent } = fixture(t);
  await handleHook({ ...options, event: 'UserPromptSubmit',
    payload: { ...options.payload, prompt: 'Task' } });
  const file = path.join(options.stateDir, fs.readdirSync(options.stateDir)[0]);
  fs.writeFileSync(file, '{broken');
  await handleHook({ ...options, event: 'Stop' });
  assert.match(sent[0][2], / — done$/);
});

test('invalid payloads and unknown clients are ignored', async () => {
  for (const payload of [null, [], 'text']) {
    assert.equal((await handleHook({ client: 'codex', payload })).status, 'ignored');
  }
  assert.equal((await handleHook({ client: 'unknown', payload: {} })).status, 'ignored');
});

test('transport sends valid UTF-8 JSON and checks Telegram API success', async () => {
  let recorded;
  function request(options, callback) {
    const req = new EventEmitter();
    req.destroy = () => {};
    req.end = (body) => {
      recorded = { options, body };
      queueMicrotask(() => {
        const res = new EventEmitter();
        res.statusCode = 200;
        res.setEncoding = () => {};
        callback(res);
        res.emit('data', '{"ok":true}');
        res.emit('end');
      });
    };
    return req;
  }
  assert.equal(await sendTelegram('fake', 'chat', '🧱 Кирпич', { request }), true);
  assert.equal(recorded.options.headers['Content-Length'], Buffer.byteLength(recorded.body));
  assert.deepEqual(JSON.parse(recorded.body), { chat_id: 'chat', text: '🧱 Кирпич' });
});

test('transport has a total deadline even when a request never responds', async () => {
  let destroyed = false;
  const request = () => {
    const req = new EventEmitter();
    req.end = () => {};
    req.destroy = () => { destroyed = true; };
    return req;
  };
  assert.equal(await sendTelegram('fake', 'chat', 'Task', { request, timeoutMs: 10 }), false);
  assert.equal(destroyed, true);
});

test('HTTP and Telegram API failures are not reported as successful delivery', async () => {
  for (const [statusCode, body] of [[401, '{"ok":false}'], [200, '{"ok":false}'], [200, 'invalid']]) {
    const request = (options, callback) => {
      const req = new EventEmitter();
      req.destroy = () => {};
      req.end = () => queueMicrotask(() => {
        const res = new EventEmitter();
        res.statusCode = statusCode;
        res.setEncoding = () => {};
        callback(res);
        res.emit('data', body);
        res.emit('end');
      });
      return req;
    };
    assert.equal(await sendTelegram('fake', 'chat', 'Task', { request }), false);
  }
});

test('network errors resolve without exposing their credential URL', async () => {
  const request = () => {
    const req = new EventEmitter();
    req.destroy = () => {};
    req.end = () => queueMicrotask(() => req.emit('error', new Error('/botSECRET/sendMessage')));
    return req;
  };
  assert.equal(await sendTelegram('fake', 'chat', 'Task', { request }), false);
});

test('every configured hook executes and returns non-blocking JSON without credentials', () => {
  for (const client of ['claude', 'codex']) {
    const config = JSON.parse(fs.readFileSync(path.join(root, 'adapters', client, 'hooks.json')));
    for (const event of Object.keys(config.hooks)) {
      const result = spawnSync(process.execPath, [path.join(root, 'scripts/telegram.js'), client, event], {
        input: JSON.stringify({ cwd: root, hook_event_name: event }),
        encoding: 'utf8',
        env: { ...process.env, TELEGRAM_BOT_TOKEN: '', TELEGRAM_CHAT_ID: '' },
        timeout: 2000,
      });
      assert.equal(result.status, 0, `${client} ${event}: ${result.stderr}`);
      assert.deepEqual(JSON.parse(result.stdout), {});
      assert.equal(result.stderr, '');
    }
  }
});

test('malformed CLI input fails open and never echoes the input', () => {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts/telegram.js'), 'codex', 'Stop'], {
    input: 'PRIVATE invalid JSON', encoding: 'utf8', timeout: 2000,
    env: { ...process.env, TELEGRAM_BOT_TOKEN: '', TELEGRAM_CHAT_ID: '' },
  });
  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout), {});
  assert.equal(result.stderr.includes('PRIVATE'), false);
});
