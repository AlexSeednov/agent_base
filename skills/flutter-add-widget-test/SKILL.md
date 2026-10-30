---
name: flutter-add-widget-test
description: Write or update Flutter widget tests for rendering, localization, theme-dependent UI, and user interactions. Use for screens and components tested with WidgetTester rather than isolated logic or full device flows.
---

# Widget tests

Read [Testing](../../instructions/testing.md), [Layer rules](../../instructions/layers.md),
and the consuming project's theme/localization setup before editing.

- Put tests under `test/presentation/`, mirroring the source path. Reuse the
  project's existing pump helper and support fakes.
- Pump the smallest real scaffold the widget requires: its actual theme
  extensions, localization delegates, supported locales, and router when needed.
  Derive APIs from the project; do not assume `ThemePro.light` or `context.appTheme`.
- Formatted-text tests use the project's `ApplicationLocale` wrapper around
  `MaterialApp.builder`, or set and restore `Intl.defaultLocale` in an isolated
  test. Read Dart Conventions → Date and Number Formatting when it applies.
- Screens resolve VMs through getIt. Prefer a real VM with fake collaborators;
  only implement a fake VM when its class/interface permits it. Await getIt reset
  and register dependencies before pumping.
- Drive the notifiers/actions the widget actually consumes. Test visible results
  with finders; use `package:checks` for ordinary values when available.
- After an action use `pump()` or advance the required duration. Use
  `pumpAndSettle()` only when the tree can settle; continuous animation requires
  bounded pumping. Scroll off-screen targets into view and add keys only when
  existing finders are ambiguous.
- Unmount the widget before disposing collaborators it still references; clean
  up subscriptions and notifiers owned by the test.

Run `fvm flutter test <test-file>`, investigate failures, and report the rendered
states/interactions covered. Keep business-logic-only cases in unit tests.
