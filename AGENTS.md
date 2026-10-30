# Working on agent_base

This repository contains shared Flutter/Dart instructions, agent skills, and
client adapters. It is a Node.js tooling and documentation package, not a
Flutter application. The conventions in `instructions/` are for consuming
applications; do not apply their Flutter commands to this repository.

- Keep common rules in `instructions/` and workflows in `skills/`. Put
  client-specific tool names, configuration, and lifecycle wiring in `adapters/`.
- Keep skills self-contained inside the plugin root. Refer to shared instruction
  files with relative Markdown links and load them when needed.
- Project names, design links, API endpoints, credentials, and personal approval
  settings belong in consuming projects or private local configuration.
- Maintain `README.md` in English and `README.ru.md` as its complete Russian
  translation. Keep their code blocks identical. All other package documentation
  and code comments are in English; use the user's language in conversation.
- Preserve the Claude identifiers `claude-base` and `flutter-base`. The Codex
  marketplace is `agent-base`; both clients install the same plugin contents.
- Keep the version identical in `.claude-plugin/plugin.json` and
  `.codex-plugin/plugin.json`. Record releases in the existing English
  `CHANGELOG.md`; the application's branch-based working log does not apply here.
- Validate changes with `node scripts/validate.js` and
  `node --test test/*.test.js`. Notification tests must inject a fake transport;
  never send real Telegram messages as a test.
- Only inspect Git state. The user performs commits, pushes, and tags. Do not
  modify consuming projects or global client configuration as part of a package
  change unless the user explicitly includes them.
