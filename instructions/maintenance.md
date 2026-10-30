# Package maintenance

## Source and delivery

- Edit shared instructions, skills, and adapters in the `agent_base` source repository, never in a consuming project's vendored copy.
- Shared application packages (`application_base`, `firebase_base`, `metrica_base`) also change in their own repositories. Keep project details out of every shared package.
- Record a package change in its existing release `CHANGELOG.md`. For `agent_base`, update both client manifests to the same version. The user commits, pushes, and tags.
- Refreshing an installed plugin and refreshing a project's instruction checkout/subtree are separate operations. Plugin installation alone does not activate application-wide instructions.
- Use the current delivery and migration steps in the package README. A consuming project may keep `.claude/base/` or use a neutral `.agents/base/`; preserve its declared prefix.
- Subtree updates and Git pulls modify Git state: provide the command for the user rather than executing it. Start a new client session after changing startup instructions, configuration, or installed plugin contents.

## README languages

- `README.md` is the English source of truth; `README.ru.md` is its complete Russian translation. Update both in the same change, with matching sections, order, and content.
- Keep code blocks identical, including comments. Never translate identifiers, commands, or paths. Translate headings and use anchors belonging to that file; if an instruction cites an English heading, retain that name in parentheses in the translated heading.
- Begin each file with the language switcher: `**English** | [Русский](README.ru.md)` and `[English](README.md) | **Русский**`.
- Only the README is duplicated. A package's release `CHANGELOG.md` stays in English; other documentation keeps its intended language.
