# Claude Code adapter

## Context and tools

- `CLAUDE.md` can import shared startup instructions with `@path`. The project's
  `CLAUDE.local.md` can add private preferences. The shared entrypoint identifies
  detailed files to read for each task; installing a plugin does not activate
  these startup instructions.
- Use the available Read/search and Edit/Write tools. Preserve UTF-8 when editing
  the working changelog. A skill or slash command is usable only when installed;
  do not assume `/code-review`, `/review`, or `/simplify` exists.
- `AskUserQuestion` is a clarification tool. Ordinary authorized edits do not
  require a new confirmation just because a workflow mentions asking questions.

## Permissions and MCP

- Claude configuration belongs in `.claude/settings.json` or private local/user
  settings. Preserve the user's chosen permissions; plugin installation does
  not grant shell access or override the read-only Git agreement.
- Keep tokens in private local configuration or the process environment, never
  in shared settings. A project `.mcp.json` containing credentials is ignored.
- Use `/mcp` to inspect connections. Discover the tools exposed by the connected
  Figma integrations. Read/export tools from `figma-developer-mcp` are distinct
  from an integration that supports writes. Load a connected write tool's skill
  when that integration requires it; do not hardcode another plugin's namespace.

## Notifications

The plugin manifest selects `adapters/claude/hooks.json`. Hook commands resolve
`${CLAUDE_PLUGIN_ROOT}` and call the shared Node.js notifier with `claude`.
Questions match `AskUserQuestion`; approvals use `PermissionRequest`, not a
heuristic over Bash commands. `Stop` means an assistant turn ended, not that
the entire session was closed. Credentials are opt-in; see the package README.

References: [memory](https://code.claude.com/docs/en/memory),
[plugin manifests](https://code.claude.com/docs/en/plugins-reference),
[hooks](https://code.claude.com/docs/en/hooks).
