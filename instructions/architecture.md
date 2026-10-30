# Project Architecture

Clean Architecture + MVVM. Service Locator (getIt) for DI. ValueNotifier for state.

## Structure

```
project/
├── assets/         # Static resources (fonts, images, video)
├── lib/
│   ├── core/       # Base services and data — available to ALL layers
│   ├── data/       # Data sources (API, DB) — implements domain interfaces
│   ├── domain/     # Business logic — no Flutter UI dependencies
│   ├── presentation/ # UI — views, view models, navigation
│   └── theme/      # Styling — colors, fonts, sizes, assets
├── pigeon/         # API definitions for Pigeon (platform channels)
├── analysis_options.yaml
├── l10n.yaml
└── pubspec.yaml
```

**Entry points:** inspect the consuming project. A project may have one
`main.dart`, or flavors such as `main_development.dart`, `main_stage.dart`, and
`main_production.dart`. Examples do not require a flavored setup.

## Layer Import Rules

| Layer | Can import |
|---|---|
| `presentation` | `domain`, `core`, `theme` |
| `data` | `domain`, `core` |
| `domain` | `core` only |
| `theme` | `core` only (or nothing) |
| `core` | nothing |

**FORBIDDEN**: importing `data` from `presentation` or `domain`. Importing `presentation` from `domain` or `data`.

## Key Principles

1. `domain/` has no Flutter UI dependencies. Entities, repository contracts and
   business utilities are pure Dart (packages like `json_annotation` are allowed).
   The stack's model-state convention uses `ValueNotifier` from
   `package:flutter/foundation.dart`; that is the explicit exception for models,
   not permission to import widgets, Material, or presentation types.
2. Data layer implements domain interfaces; binding via `@LazySingleton(as: Interface)` + codegen — never register manually.
3. Presentation never accesses the data layer directly.
4. All assets — via generated constants (`lib/theme/asset/`), never via raw paths.
5. Always use localization (`context.loc`). Strings — in ARB files in `lib/domain/localization/`.
6. Mapping between API/DB schemas and domain entities happens in `data/`, hidden from other layers.
7. Group files by feature (`authorization/`, `profile/`, `project/`…).
8. Prefer `final class`. Singleton — only where justified by lifecycle.
9. **Unidirectional data flow**: data → domain → presentation. User actions — in reverse.

## Entry Point

```dart
void main() => launchApplication(
  application: const AppWidget(),    // root widget — name depends on project
  currentFlavor: FlavorProduction(), // flavor type — name depends on project
);
```

This is an example for a flavored project. Follow the actual bootstrap API and
initialization order in the consuming project and its pinned `application_base`
version. Initialize optional SDKs only when the project uses them.

## Build and Codegen

```bash
fvm dart run build_runner build
```

`build_runner` 2.15+ deletes conflicting outputs by itself; on an older version add `--delete-conflicting-outputs`.

- Localization: add strings to ARB files in `lib/domain/localization/`.
- Assets: auto-generated in `lib/theme/asset/` via `flutter_gen_runner`.
- Pigeon, if used: `fvm dart run pigeon --input pigeon/<name>_api.dart`.
