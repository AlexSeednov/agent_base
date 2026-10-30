# Codex adapter

## Context and tools

- `AGENTS.md` is the project's startup entrypoint. It must explicitly tell Codex
  which shared files to read; Claude `@imports` are not the loading mechanism.
  Follow the shared entrypoint and load detailed rules when the task needs them.
- Use the available file/search/shell tools, normally `rg` for search and
  `apply_patch` for edits. Preserve UTF-8 when editing the working changelog.
- Read the optional, ignored `.agents/local.md` only when the project entrypoint
  declares it. It is a convention of this package, not an auto-loaded Codex file.
  `AGENTS.override.md` replaces the entry file at its directory; it is not an
  automatically additive equivalent of `CLAUDE.local.md`.
- Discover skills and tools actually provided by the client. Do not invoke
  Claude-only slash commands or tool namespaces. A missing integration is
  reported with its required setup, not treated as available.

## Permissions and MCP

- Codex uses `.codex/config.toml` for trusted project configuration and
  `~/.codex/config.toml` for user settings. Do not translate Claude JSON permission
  patterns literally. Sandbox/approval policy and the read-only Git agreement
  are separate; neither a textual rule nor a notification hook is a sandbox.
- Choose access to shared package directories deliberately when setting up a
  consuming project. Do not broaden access or disable approval prompts merely
  to install this package. Respect authorization already granted in the session.
- Configure local MCP servers under `mcp_servers` or use an installed plugin.
  Pass credential names through `env_vars` or private user configuration, not
  secret literals in a committed project file. A root Claude `.mcp.json` is not
  assumed to configure a standalone Codex client.
- Figma access must be verified from actual tools. Read/export support does not
  establish write support; do not assume the Claude plugin's `use_figma`
  namespace exists. Follow the installed Figma integration's own instructions.

## Notifications

The Codex manifest selects `adapters/codex/hooks.json`. Commands resolve
`${PLUGIN_ROOT}` and call the shared notifier with `codex`. Question hooks match
`request_user_input` and `request_user_input_async` when those local tools are
available. Other client question surfaces may not expose that hook path.

Hooks must be reviewed and trusted in a supporting local client before running.
An installed plugin does not bypass hook trust. Cloud-orchestrated Work does
not run these local plugin scripts; don't promise delivery on unsupported
surfaces. `PermissionRequest` only fires when an approval is actually requested;
it may never fire in a session that already allows all required commands.

References: [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md),
[skills](https://learn.chatgpt.com/docs/build-skills),
[configuration](https://learn.chatgpt.com/docs/config-file/config-basic),
[MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli),
[hooks](https://learn.chatgpt.com/docs/hooks).
