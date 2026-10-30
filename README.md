**English** | [Русский](README.ru.md)

# agent_base

Shared instructions and workflows for Flutter/Dart projects using Clean Architecture,
MVVM, getIt/injectable, and ValueNotifier. Claude Code and Codex use the same
engineering rules and four skills, with separate client adapters. Version **0.2.0**.

## Contents

```text
agent_base/
├── .claude/CLAUDE.md     # Imports maintainer instructions
├── .claude-plugin/       # Claude manifest and legacy marketplace identity
├── .codex-plugin/        # Codex manifest
├── .agents/plugins/      # Codex marketplace
├── instructions/         # Shared rules and task routing
├── skills/               # Four shared workflows
├── adapters/             # Client instructions and hook wiring
├── scripts/              # Portable notifier and package validation
├── templates/            # Application entrypoints and context template
├── test/                 # Offline notification tests
├── AGENTS.md             # Instructions for maintaining this package
└── CHANGELOG.md          # Package releases
```

The repository root is also the plugin root. Installed skills can read the
shared `instructions/` inside their own package; no external checkout is assumed
by a skill. `AGENTS.md` and `.claude/CLAUDE.md` govern maintenance of this
package, not consuming applications.

Project names, Figma files, API endpoints, deployment history, credentials, and
personal permissions stay in the consuming project or private local settings.

## Project instructions

Instructions and the installed plugin are **two independent connections**.
Application startup files load shared rules; a plugin supplies skills and hooks.
Installing the plugin alone does not make the rules application-wide.

Choose a delivery method for the shared instructions:

- **Vendored subtree:** a self-contained application checkout pinned to a release.
  Run from the application root after the tag is published:

```bash
git subtree add --prefix .agents/base \
  https://github.com/AlexSeednov/agent_base.git v0.2.0 --squash
```

- **Local source clone:** one checkout per machine, shared by several projects:

```bash
git clone https://github.com/AlexSeednov/agent_base.git ~/Projects/Packages/agent_base
```

For a subtree at `.agents/base/`, merge [templates/AGENTS.md](templates/AGENTS.md)
into the application's `AGENTS.md` and [templates/CLAUDE.md](templates/CLAUDE.md)
into its `CLAUDE.md`. Create `.agents/project.md` from
[templates/project.md](templates/project.md). Merge existing entry files rather
than overwriting their project rules. Use only the entry file for the clients
you actually use.

For a local clone or an existing `.claude/base/` subtree, adapt only the shared
base paths in those templates. Use a real absolute clone path in Codex instructions
and an `@~/Projects/Packages/agent_base/...` import in Claude. Project context
paths remain relative to the application root.

[instructions/entrypoint.md](instructions/entrypoint.md) requires Global rules
and Architecture first, then routes Dart, tests, Figma, web, and package tasks
to their detailed references. Project exceptions override shared conventions.
Long inventories and historical decisions belong in linked task documents.

Private preferences may live in ignored `.agents/local.md`; the templates
explicitly request it when present. Claude can also use `CLAUDE.local.md`.
`AGENTS.override.md` replaces that directory's entry file; it is not an additive
local-preferences file. Keep automatically loaded Codex instructions below its
default 32 KiB discovery limit. Start a new session after changing startup files.

## Claude Code

The marketplace remains **`claude-base`** and the plugin remains
**`flutter-base@claude-base`**, preserving existing identifiers after the repository
rename. Fresh installation:

```text
/plugin marketplace add https://github.com/AlexSeednov/agent_base.git
/plugin install flutter-base@claude-base
```

To recommend and enable it in an application's `.claude/settings.json`, merge:

```json
{
  "extraKnownMarketplaces": {
    "claude-base": {
      "source": {
        "source": "github",
        "repo": "AlexSeednov/agent_base"
      }
    }
  },
  "enabledPlugins": {
    "flutter-base@claude-base": true
  }
}
```

The Claude manifest selects [adapters/claude/hooks.json](adapters/claude/hooks.json).
Client-specific context and tool guidance live in
[adapters/claude/instructions.md](adapters/claude/instructions.md).

## Codex

The Codex marketplace is **`agent-base`**, exposing the same `flutter-base` plugin.
In a current local Codex CLI:

```bash
codex plugin marketplace add AlexSeednov/agent_base --ref v0.2.0
codex plugin add flutter-base@agent-base
```

The desktop plugin browser can also use the repository marketplace at
`.agents/plugins/marketplace.json`. Where supported, install from that source
and merge this into the trusted application's `.codex/config.toml`:

```toml
[plugins."flutter-base@agent-base"]
enabled = true
```

Installed plugin contents come from a cache; editing the source checkout is not
a live update of an installed plugin. Start a new session after installing or
updating. Review and trust the plugin hooks in a supporting local client; enabling
a plugin does not grant hook trust. These local scripts do not run in
cloud-orchestrated Work.

The Codex manifest selects [adapters/codex/hooks.json](adapters/codex/hooks.json).
Configuration, tool discovery, and local-preference behavior are described in
[adapters/codex/instructions.md](adapters/codex/instructions.md). Client versions
differ; use the plugin browser if a listed CLI command is unavailable.

## Skills and testing rules

| Skill | When to use it |
| --- | --- |
| `dart-add-unit-test` | Isolated business logic and regression tests |
| `flutter-add-widget-test` | Widget rendering, themes, localization, interactions |
| `flutter-add-integration-test` | Complete flows with real application bootstrap |
| `flutter-refactor-audit` | Read-only assessment of an existing feature/layer/slice |

Skills read their shared references explicitly and consult application context.
They do not assume flavors, devices, MCP connections, or a particular theme API.

`package:checks`, test doubles/DI isolation, and coverage are common
[testing rules](instructions/testing.md), not separate skills. The entrypoint
routes coverage and test-double requests there too. Existing fake, assertion, and
coverage behavior is retained without three overlapping discovery entries.

## Optional Telegram notifications

Requires **Node.js 20+**, with no npm dependencies, jq, curl, Bash scripts, or
PowerShell scripts. Both adapters call [scripts/telegram.js](scripts/telegram.js).
The client still needs its normal supported command-hook execution environment.

Provide `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` through the client process
environment or private local client settings. Without either, notifications and
prompt caching are disabled. This package does not install credentials or change
global settings. Keep secret-bearing files out of Git.

Project name resolution is `AGENT_PROJECT_NAME`, legacy `CLAUDE_PROJECT_NAME`,
`name:` from `pubspec.yaml`, then the working-directory name. Examples:

```text
✅ Codex: Example — Add board undo
✅ Claude: Example — Add board undo
❓ Codex: Example — Question
⚠️ Claude: Example — Approval required
```

| Event | Behavior |
| --- | --- |
| `UserPromptSubmit` | Cache the first prompt's first nonempty line, up to 100 Unicode code points |
| `PreToolUse` | Notify for the client's question tool when it uses that local hook path |
| `PermissionRequest` | Notify about a real pending approval, without command text |
| `Stop` | Notify when the client emits Stop, including a continued turn |
| `SessionEnd` | Delete that session's cached title |

Titles are stored in the user's OS temporary directory, separated by client,
session, and working directory. The notifier never parses transcripts or stores
whole prompts. Normal session end removes the title; interrupted clients can
leave a short temporary record until OS/user cleanup. If a title is unavailable,
completion says `done`. Telegram receives the title preview in completion notices;
omit credentials when notifications are not wanted.

Transport has a five-second total deadline. Invalid input or a delivery failure
does not block the agent; diagnostics omit payloads and credential URLs. Hooks
never approve or deny actions. No approval notification is expected when the
client does not need an approval, and unsupported question surfaces cannot be
detected by the local-tool hook.

## Permissions and MCP

Permissions are per client and per project. Shared Git guidance is read-only;
it does not configure a sandbox. This package does not copy `bypassPermissions`,
disable approvals, or grant access to sibling projects. Select the needed access
when configuring each consuming project.

Claude uses its settings JSON and MCP configuration. Codex uses trusted
`.codex/config.toml` or private user configuration; local MCP entries belong under
`mcp_servers`. Pass secret variable names from the environment or keep values
in private settings. Do not commit tokens with portable examples.

Figma rules are [shared](instructions/figma.md); connection and tool namespaces
are client-specific. Verify read/export and write capabilities independently.
A mockup edit is complete when it is applied and verified in the real Figma file.

## Migration from 0.1.x

Version 0.2.0 changes package layout and startup routing. Migrate a consuming
project deliberately rather than only bumping a plugin version:

1. Update instruction checkout/subtree from `AlexSeednov/agent_base`; keep an
   existing `.claude/base/` prefix if desired.
2. Merge the appropriate entry templates and keep the project's existing context
   location if moving it is unnecessary. Add the entrypoint and client adapter.
3. Refresh the marketplace/plugin. Its root moved from `plugin/` to the repository
   root; Claude identifiers are unchanged. An old registered marketplace may
   retain its previous URL; update that source in the client.
4. Remove references to `dart-checks-assertions`, `dart-collect-coverage`, and
   `flutter-test-doubles`; their content is in `instructions/testing.md`.
5. Replace calls to the old dispatcher and shell/PowerShell scripts with the new
   adapter hooks. New defaults also notify on real permission requests.
6. Reuse private Telegram variables, optionally rename `CLAUDE_PROJECT_NAME` to
   `AGENT_PROJECT_NAME`, and verify hooks in the actual client.
7. Start a new session and check which instructions, skills, and tools are active.

No application or user-level configuration is migrated automatically. The
published 0.1.x tags keep their original contents. Keep historical release notes
unchanged even where they refer to the former repository name.

## Updating

Refresh the Claude marketplace and plugin separately from project instructions:

```text
/plugin marketplace update claude-base
/plugin update flutter-base@claude-base
```

Refresh the Codex marketplace, then update/reinstall the plugin in the client
plugin browser. If the source is pinned, select the new release ref first:

```bash
codex plugin marketplace upgrade agent-base
```

For a subtree, use its actual prefix and the target release tag. This example
targets 0.2.0; choose the next tag on a later update:

```bash
GIT_MERGE_AUTOEDIT=no git subtree pull --prefix .agents/base \
  https://github.com/AlexSeednov/agent_base.git v0.2.0 --squash -m "Agent Base v0.2.0"
```

For local-clone delivery, the user pulls or selects the required tag in that
clone. That immediately affects every project that reads its files. The agent
provides Git write commands; the user executes them. Restart the session.

## Versioning and validation

Use one release version in `.claude-plugin/plugin.json` and
`.codex-plugin/plugin.json`, an English `CHANGELOG.md` entry, and a matching
`vMAJOR.MINOR.PATCH` tag. In 0.x, a minor bump can carry breaking layout/rule
changes. Keep stable plugin/marketplace identifiers distinct from repository
branding. The user performs commits, pushes, and tags.

Keep `README.md` and `README.ru.md` synchronized, including identical code blocks.
Run from the package root:

```bash
node scripts/validate.js
node --test test/*.test.js
```

Validation checks manifests, paths, links, versions, hooks, skill metadata, and
README code-block parity. Tests exercise notification behavior with fake
transport and isolated temporary directories; they send no real messages.
If Claude Code is installed, also run `claude plugin validate .`. Native
installation, hook trust, connected tools, and delivery must be verified in the
target client after setup.

Sources: [OpenAI plugin packaging](https://developers.openai.com/plugins/build/plugins),
[Codex instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md),
[Codex hooks](https://learn.chatgpt.com/docs/hooks),
[Claude plugin reference](https://code.claude.com/docs/en/plugins-reference),
[Claude hooks](https://code.claude.com/docs/en/hooks).
