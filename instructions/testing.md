# Testing

Read the consuming project's test setup, actual bootstrap, and documented
exceptions first. Do not assume that dependencies, flavors, devices, or a live
Dart/Flutter MCP connection exist.

## Runner and scope

- Mirror `lib/` under `test/`, with `_test.dart` filenames. Reuse existing
  `test/support/` helpers.
- Flutter applications use `fvm flutter test`, including for domain tests.
  A standalone pure-Dart package uses its own `fvm dart test` setup.
- Verify observable behavior and meaningful invariants. Add regression coverage
  for changed logic; avoid tests that duplicate implementation or merely confirm
  a reversible formatting/documentation change.
- Run the relevant test file while iterating, then the appropriate wider checks
  once. Investigate failures; do not change assertions just to obtain green.

## Test doubles and DI

- Prefer existing fakes, then small interface implementations. Reusable app/test
  fakes belong in `lib/data/fake/`; test-only fakes belong in `test/support/`.
- Construct the subject directly through its `@visibleForTesting` constructor
  with fake collaborators. Do not resolve the subject through getIt just to test
  its business behavior.
- If a collaborator is obtained by an internal `getIt<T>()` lookup, reset getIt
  and register that fake before constructing the subject. **Await** asynchronous
  reset/disposal, including in setup and teardown:

  ```dart
  setUp(() async {
    await getIt.reset();
    getIt.registerSingleton<AccountRepository>(FakeAccountRepository());
  });
  tearDown(() async => getIt.reset());
  ```

- Manual registration is allowed in test setup; the production rule requires
  annotations and generated registration.
- Fakes implement the real contract, including null/typed-result failures.
  A `final class` cannot be implemented outside its library: test a real VM with
  fake collaborators, or fake an interface it depends on.
- Use a mocking library only when a broad collaborator makes a fake impractical.
  Respect pinned dependency versions; check the existing generator setup before
  adding codegen. Async mock results use `thenAnswer`, not `thenReturn`.
- Dispose notifiers, subscriptions, and any subject the test owns. A getIt reset
  does not dispose an object constructed outside getIt.

## Assertions

Prefer `package:checks` for new value assertions when available. Check the
project's dependencies first; add a compatible **exact** dev dependency only
when needed. Do not mass-convert unrelated tests.

| Matcher | checks |
| --- | --- |
| `expect(x, y)` | `check(x).equals(y)` |
| `expect(x, isA<T>())` | `check(x).isA<T>()` |
| `expect(list.length, 1)` | `check(list).length.equals(1)` |
| `expect(s, startsWith('a'))` | `check(s).startsWith('a')` |
| `expect(x.id, '1')` | `check(x).has((it) => it.id, 'id').equals('1')` |

Widget finder assertions still use `flutter_test`:
`expect(find.text('Ready'), findsOneWidget)`. Use its async matchers or the
installed checks version's documented async API; do not guess helper methods.

## Coverage

When measuring coverage, collect and filter generated paths:

```bash
fvm flutter test --coverage
lcov --remove coverage/lcov.info '*.g.dart' '*.gr.dart' '*.gen.dart' '*.config.dart' '*app_localizations*.dart' -o coverage/lcov.filtered.info
genhtml coverage/lcov.filtered.info -o coverage/html
```

`lcov` and `genhtml` are optional local tools; do not install them without a need.
Keep the raw report. Generated code can appear through transitive imports;
filtering the report is what excludes it. Report coverage for real logic and
state what was excluded. Inline `coverage:ignore-line`, `coverage:ignore-start`
and `coverage:ignore-end`, or `coverage:ignore-file` need a real reason, never
the goal of raising a percentage. Add tests only for relevant uncovered behavior.
