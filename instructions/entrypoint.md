# Shared instruction entrypoint

Paths in links below are relative to this file. Paths prefixed with
`project-root:` refer to the application being worked on, not the installed
plugin or the agent_base source repository.

Before work, read [Global rules](global.md) and [Architecture](architecture.md).
Read `project-root:.agents/project.md` and, if present,
`project-root:.agents/local.md` for project exceptions and private preferences.
For existing projects, the entry file may point to a different context location,
such as `.claude/project.md`; use that declared location instead of requiring
a directory migration.

Project-specific exceptions override shared conventions. The user's current
request takes precedence over repository guidance. Missing required context is
reported, not silently invented. Load the following files when the task needs
them; their contents are not assumed to be preloaded.

| Task | Read before editing |
| --- | --- |
| Dart or Flutter code | [Dart conventions](dart-conventions.md), [Layer rules](layers.md) |
| Dependencies, DI, serialization, storage, network images | [Packages](packages.md) and [Dart conventions](dart-conventions.md) |
| Tests, test doubles, coverage | [Testing](testing.md) and the relevant test skill if available |
| Design, tokens, exported artwork | [Figma](figma.md), [Layer rules](layers.md), and the active client's adapter instructions |
| Flutter web builds or hosting | [Web builds](web.md) |
| Shared package changes, README translation, releases | [Package maintenance](maintenance.md) |
| Refactor audit | The audit skill, then the rules relevant to the requested scope |

Keep a project's mandatory context concise: current constraints and links to
task-specific documents. Put long design inventories, deployment procedures,
store checklists, and historical decisions in their own documents and identify
when each must be read. Do not load all of them for every task.
