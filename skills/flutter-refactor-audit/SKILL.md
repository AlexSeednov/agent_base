---
name: flutter-refactor-audit
description: Audit a Flutter/Dart feature, layer, or codebase slice for architectural problems, harmful duplication, dead code, and avoidable runtime cost. Use for requested refactoring assessments of existing code; report verified findings and apply fixes only when requested.
---

# Refactor audit

Read [Global rules](../../instructions/global.md), [Architecture](../../instructions/architecture.md),
[Dart conventions](../../instructions/dart-conventions.md), [Layer rules](../../instructions/layers.md),
and [Packages](../../instructions/packages.md). Read the consuming project's
declared context and exceptions. Do not assume any of these are already loaded.

## Scope and checks

Honor the requested scope. For an unspecified mature application, choose a
coherent feature, folder, or cross-cutting concern, explain the starting scope,
and begin. An audit of existing code is different from a review of only the
working diff; preserve any uncommitted user changes.

Exclude generated code from findings: `.g.dart`, `.gr.dart`, `.gen.dart`,
`.config.dart`, and generated localizations. Generated files can still provide
evidence that a supposedly dead symbol is referenced.

Run `fvm flutter analyze` when the environment supports it; distinguish analyzer
findings from the structural audit rather than presenting duplicate discoveries.
Search the chosen scope with the available search tool (`rg` in a shell is
sufficient). Useful candidates include:

| Concern | Look for |
| --- | --- |
| Layers | Forbidden imports, leaked DTOs, a VM bypassing a model |
| DI | Manual production registration/singletons, eager cycles, global VM navigation |
| UI | VM-owned `setState`, broad listenable builders, heavy work in `build` |
| Design | Colors/sizes/assets outside existing token and generated-asset paths |
| Text | Hardcoded UI strings, pinned formatter locales, `Intl.systemLocale` |
| Storage | Changed field/type IDs, renamed keys, temporary stored fields |
| Errors | Cross-layer exceptions, swallowed errors, logging bypasses |
| Lifecycle | Undisposed notifiers/subscriptions and duplicate initialization |
| Maintenance | Drifted copies, unreferenced symbols/assets, undocumented parked code |

Every search hit is a candidate. Read its context before reporting it.

## Judgment and verification

- Report duplication as a cluster: the sites, the behavior they share, where
  they have already drifted, and a proposed common owner. Intentional variation
  is not automatically a reason to merge code.
- Look for avoidable runtime cost: repeated heavy work, unnecessary rebuilds,
  eager lists, repeated asset decoding, or nested linear scans. Explain the
  observable consequence; avoid speculative micro-optimizations.
- Check widget placement and reuse against Layer rules. Shared leaves can be
  reused without merging intentionally different mobile/desktop layouts.
- Consult documented exceptions before calling a literal, lazy DI getter, or
  `TODO`/`Future` a violation. An allowed, explained deviation is context, not a
  defect; a comment does not excuse behavior outside the rule's real exception.
- Re-open every cited location and try to refute each candidate. Search callers,
  tests, routes, generated references, and project decisions before declaring
  something unused or incorrect. Merge findings with the same root cause.
- Keep only confirmed, useful findings. Zero surviving findings is valid; never
  invent findings or rejected-candidate counts to imply a thorough review.

## Report

Name the audited scope. Group findings into **Must do** (defects and consequential
hard-rule violations) and **Worth doing** (maintainability or cost improvements),
ordered by value relative to effort. Empty groups may say there are no findings.

For each finding give the affected file/line, consequence, suggested fix, and
rough effort (S/M/L). A duplication cluster identifies all relevant sites.
Separate a proposal requiring a product/API decision from a routine code fix.
Close with what was checked, what was skipped, and why. Mention documented
deviations briefly when they materially explain the result.

## Requested fixes

The audit is read-only unless the user requests fixes, for example by naming
items or asking for `--fix`. Apply authorized changes in coherent steps, run
analysis and relevant tests, and update the project's working changelog. Ask
only for missing product decisions or changes outside the authorized scope;
do not ask again for routine steps already covered by the request.
