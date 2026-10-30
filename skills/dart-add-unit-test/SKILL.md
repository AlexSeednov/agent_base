---
name: dart-add-unit-test
description: Write or update unit tests for Dart business logic, models, services, entities, and utilities, including regression tests for changed behavior. Use for isolated logic tests rather than widget rendering or device flows.
---

# Unit tests

Read [Testing](../../instructions/testing.md), [Dart conventions](../../instructions/dart-conventions.md),
and the consuming project's context before editing. The subject may be in
`domain/`, `core/`, or a view model; widget rendering belongs in widget tests.

1. Inspect the subject, its callers, existing tests, and collaborator contracts.
   Choose observable cases: normal behavior, relevant failures, boundaries, and
   the regression the change is meant to prevent.
2. Mirror its path under `test/`. In a Flutter app, import `flutter_test` and run
   `fvm flutter test <test-file>`; use the project's existing pure-Dart runner
   when working in a standalone Dart package.
3. Construct the subject with fakes through its testing constructor. Register
   only collaborators fetched internally through getIt. Await resets and clean
   up resources owned by the subject/test, as described in Testing.
4. For `ValueNotifier`, check the initial `.value`, trigger the operation, await
   its actual completion, then check the resulting value. Use controlled
   completers, streams, or a fake clock for timing-sensitive logic, not sleeps.
5. Run the test, read failures against the contract, and fix the cause. Report
   what was run and any remaining coverage limits.

Prefer value assertions through `package:checks` when it is already available.
Avoid asserting private call order or copying the implementation into the test.
