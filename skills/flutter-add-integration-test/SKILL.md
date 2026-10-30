---
name: flutter-add-integration-test
description: Create or update Flutter integration tests for complete user flows on a device, simulator, or configured web test target. Use when the behavior spans real app bootstrap and multiple screens.
---

# Integration tests

Read [Testing](../../instructions/testing.md) and the consuming project's entry
point, DI initialization, backend/test-data rules, and current integration setup.

## Setup and authoring

- Reuse `integration_test/` and the existing driver if present. If absent and
  integration testing is part of the requested task, add the Flutter SDK's
  `integration_test` dev dependency and a `_test.dart` entry under that directory.
- Call `IntegrationTestWidgetsFlutterBinding.ensureInitialized()` in `main()`.
  Use the real bootstrap sequence, awaiting DI and required initialization.
- Use fakes or an isolated test backend for deterministic flows. Use production
  accounts or mutate real remote data only when explicitly authorized.
- Drive actual user interactions and assert observable outcomes across screens.
  Reuse semantic finders or existing keys; add a stable key when necessary.
- Inspect a live widget tree through Dart/Flutter MCP only if that connection
  is available. It is optional; the test must not depend on the agent having MCP.

## Run and diagnose

Start with the project's documented command. For an app without flavors:

```bash
fvm flutter test integration_test/app_test.dart -d <device-id>
```

Add `--flavor <configured-flavor>` only if the project declares that flavor.
For web or performance tracing, inspect the existing `flutter drive` setup and
installed SDK support before introducing a driver.

A settling timeout often means a continuous animation; pump bounded frames or
wait for the specific state. For an absent target, check navigation, async
completion, and scrolling before changing assertions. If no suitable device or
backend is available, report the unverified target explicitly; do not claim an
end-to-end pass from static inspection.
