#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file));

function files(dir = root) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (['.git', 'node_modules', 'coverage'].includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  });
}

function contained(base, reference) {
  const target = path.resolve(base, reference);
  const relative = path.relative(root, target);
  assert(!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative),
    `Path leaves the plugin root: ${reference}`);
  assert(fs.existsSync(target), `Missing path: ${target}`);
  return target;
}

function checkManifest(file, client) {
  const manifest = json(file);
  assert.equal(manifest.name, 'flutter-base');
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert(manifest.description?.trim(), `${file}: missing description`);
  assert.equal(manifest.repository, 'https://github.com/AlexSeednov/agent_base');
  assert.equal(manifest.hooks, `./adapters/${client}/hooks.json`);
  contained(root, manifest.hooks);
  if (client === 'codex') contained(root, manifest.skills);
  return manifest;
}

function checkHooks(client) {
  const config = json(`adapters/${client}/hooks.json`);
  const expected = ['UserPromptSubmit', 'PreToolUse', 'PermissionRequest', 'Stop', 'SessionEnd'];
  assert.deepEqual(Object.keys(config.hooks).sort(), expected.sort());
  for (const [event, groups] of Object.entries(config.hooks)) {
    assert(Array.isArray(groups) && groups.length > 0, `${client}: empty ${event}`);
    for (const group of groups) {
      if (group.matcher) new RegExp(group.matcher);
      for (const hook of group.hooks) {
        assert.equal(hook.type, 'command');
        assert(hook.timeout > 5 || ['UserPromptSubmit', 'SessionEnd'].includes(event),
          `${client}: hook deadline must exceed the transport deadline`);
        const variable = client === 'claude' ? 'CLAUDE_PLUGIN_ROOT' : 'PLUGIN_ROOT';
        assert.equal(hook.command,
          `node "\${${variable}}/scripts/telegram.js" ${client} ${event}`);
        contained(root, './scripts/telegram.js');
      }
    }
  }
  const matcher = new RegExp(config.hooks.PreToolUse[0].matcher);
  const tools = client === 'claude' ? ['AskUserQuestion']
    : ['request_user_input', 'request_user_input_async', 'functions.request_user_input_async'];
  for (const tool of tools) assert(matcher.test(tool), `${client}: question matcher misses ${tool}`);
  assert(!matcher.test('Bash'), `${client}: ordinary Bash is not an approval event`);
}

function main() {
  const all = files();
  for (const file of all.filter((name) => name.endsWith('.json'))) {
    JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  const claude = checkManifest('.claude-plugin/plugin.json', 'claude');
  const codex = checkManifest('.codex-plugin/plugin.json', 'codex');
  assert.equal(codex.version, claude.version, 'Client release versions differ');
  assert(read('CHANGELOG.md').includes(`## [${claude.version}]`), 'Release changelog entry missing');

  for (const [file, name] of [['.claude-plugin/marketplace.json', 'claude-base'],
    ['.agents/plugins/marketplace.json', 'agent-base']]) {
    const marketplace = json(file);
    assert.equal(marketplace.name, name);
    assert.equal(marketplace.plugins.length, 1);
    const plugin = marketplace.plugins[0];
    assert.equal(plugin.name, claude.name);
    assert.equal(contained(root, typeof plugin.source === 'string' ? plugin.source : plugin.source.path), root);
    if (name === 'agent-base') {
      assert.equal(plugin.source.source, 'local');
      assert.equal(plugin.policy.installation, 'AVAILABLE');
      assert.equal(plugin.policy.authentication, 'ON_INSTALL');
      assert(plugin.category);
    }
  }
  checkHooks('claude');
  checkHooks('codex');

  const skills = fs.readdirSync(path.join(root, 'skills'));
  assert(skills.length > 0, 'No skills found');
  for (const skill of skills) {
    const body = read(`skills/${skill}/SKILL.md`);
    const front = body.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    assert(front, `${skill}: missing frontmatter`);
    assert.equal(front[1].match(/^name:\s*(.+)$/m)?.[1], skill);
    assert.match(skill, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert(skill.length <= 64);
    const description = front[1].match(/^description:\s*(.+)$/m)?.[1];
    assert(description && description.length <= 1024, `${skill}: invalid description`);
  }

  for (const file of all.filter((name) => name.endsWith('.md'))) {
    const body = fs.readFileSync(file, 'utf8');
    const prose = body.replace(/^```[^\n]*\n[\s\S]*?^```[^\n]*$/gm, '')
      .replace(/`[^`\n]*`/g, '');
    for (const match of prose.matchAll(/!?\[[^\]]*\]\(([^\s)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
      contained(path.dirname(file), decodeURIComponent(target));
    }
  }
  const codeBlocks = (file) => [...read(file).matchAll(/^```[^\n]*\n[\s\S]*?^```/gm)]
    .map((match) => match[0]);
  assert.deepEqual(codeBlocks('README.md'), codeBlocks('README.ru.md'), 'README code blocks differ');
  assert(fs.statSync(path.join(root, 'templates/AGENTS.md')).size < 32 * 1024);

  for (const file of all.filter((name) => name.endsWith('.js'))) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    assert.equal(result.status, 0, `${file}: ${result.stderr}`);
  }
  process.stdout.write(`agent_base ${claude.version}: manifests, ${skills.length} skills, hooks, links, README parity and JavaScript syntax OK.\n`);
}

try { main(); }
catch (error) {
  process.stderr.write(`Validation failed: ${error.message}\n`);
  process.exitCode = 1;
}
