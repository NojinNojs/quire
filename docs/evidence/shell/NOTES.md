# App shell evidence

Verified 29 October 2026 on `feat/shell-icons`, using local Supabase and system Brave.

## Screens

| Hash | Screen |
| --- | --- |
| `#/today` | Honest placeholder: page logging in milestone 4, streaks in milestone 5 |
| `#/shelf` | Honest placeholder: grouped shelf and filters in milestone 3 |
| `#/search` | Existing catalogue search, manual entry, and book saving |
| `#/settings` | Existing theme, dark mode, contrast pair, and sign out |

Unknown hashes resolve to Today. Existing `#catalogue` and `#settings` links remain compatible.
For an unauthenticated visit with no hash, book entry remains the first sign-in destination,
preserving the established account flow. Explicit deep links survive authentication. A restored
session with no hash starts on Today. Hash changes, reload, browser back, and forward were checked.

## Design and implementation

The existing Quire design system supplies the direction: a compact reading app with paper surfaces,
ink icons, and a classification-colour active rule. Energy 1, rhythm 1, motion 1. The page title
anchors each placeholder; the catalogue link is its only action. No fabricated book data appears.

The icon shapes follow their actions: open book for Today, three spines for Shelf, catalogue card
and loupe for Search, sliders for Settings. Check and chevron are exported for later use. All six
share a 24px grid, 1.75 stroke, square caps, miter joins, and no fill. An optional `label` produces
an accessible name and title; otherwise the icon is hidden from assistive technology. Icon links
provide their own accessible labels and titles.

Local component tokens in `nav.css`, documented here because the shared design-system document is
outside this task's owned paths:

| Token | Job |
| --- | --- |
| `--shell-width: 390px` | Match the existing mobile content column |
| `--shell-header-height: 56px` | Keep the shared top bar at its contracted height |
| `--nav-icon-size: 22px` | Navigation icon size from the design system |
| `--nav-indicator-size: 3px` | Active classification rule thickness |

The 64px bottom navigation reserves its height plus the device safe area in document flow. All
three links are 48px tall. The active link uses full ink and a separate 3px `--class-800` rule.
Settings has no active primary item. All authored motion lives in `motion.css`: screen opacity
and an 8px rise over the existing 120ms motion token, plus indicator movement and opacity. The
task's explicit 8px rise takes precedence over the older design document's 1px guidance. The old
primary-button opacity transition is disabled there. Reduced motion removes both shell effects.

## Screenshots and browser checks

Screenshots are local artifacts outside the repository because ownership permits only this notes
file under `docs/evidence/shell`. Each uses a 390px viewport and 844px viewport height. Settings
also has a scrolled viewport capture showing its footer above the fixed navigation.

| Screenshot | View |
| --- | --- |
| [today-390.png](/tmp/quire-shell-evidence/today-390.png) | Today placeholder, light theme |
| [shelf-390.png](/tmp/quire-shell-evidence/shelf-390.png) | Shelf placeholder and active rule |
| [search-390.png](/tmp/quire-shell-evidence/search-390.png) | Live catalogue, empty account |
| [settings-390.png](/tmp/quire-shell-evidence/settings-390.png) | Settings, full page |
| [settings-footer-390.png](/tmp/quire-shell-evidence/settings-footer-390.png) | Settings footer after scrolling |
| [today-dark-390.png](/tmp/quire-shell-evidence/today-dark-390.png) | Today in Shelf dark |
| [keyboard-focus-390.png](/tmp/quire-shell-evidence/keyboard-focus-390.png) | Search link keyboard focus |
| [shelf-reduced-motion-390.png](/tmp/quire-shell-evidence/shelf-reduced-motion-390.png) | Shelf with reduced motion |

Browser check script: `/tmp/quire-shell-check.mjs`. Results:
`/tmp/quire-shell-evidence/checks.json`. The preview used the current local Supabase anon key from
CLI status, matching the gate's environment setup; `.env` was not modified. Generated accounts
were deleted after each browser run.

Measured checks:

- PASS: Shelf and Settings survive reload; browser history changes the screen and active link.
- PASS: all four screens have no horizontal overflow at 320, 390, 768, and 1280px.
- PASS: navigation height 64px, link heights 48px, active rule 3px, screen duration 120ms.
- PASS: Settings footer scrolls completely above the navigation.
- PASS: Settings, placeholder catalogue action, and all three primary links are reachable by Tab;
  the computed focus outline is 2px. The navigation links also work with pointer activation.
- PASS: reduced motion computes screen animation `none` and indicator transition duration `0s`.
- PASS: no browser page errors. The six-theme contrast checks all pass.
- PASS: Impeccable mechanical detector returned `[]` for changed UI targets.
- PASS: visual review confirms the existing paper-and-ink style, meaningful icon shapes, and
  milestone copy. No extra decorative surface or motion was added.

Contrast against the raised navigation surface, computed from browser theme tokens:

| Theme | Active ink | Inactive ink | Active bar |
| --- | --- | --- | --- |
| Shelf light | 18.09:1 | 7.65:1 | 7.92:1 |
| Shelf dark | 15.36:1 | 7.21:1 | 4.00:1 |
| Municipal light | 15.69:1 | 7.86:1 | 7.15:1 |
| Municipal dark | 13.95:1 | 7.43:1 | 3.73:1 |
| Oxford light | 17.89:1 | 6.86:1 | 8.14:1 |
| Oxford dark | 15.12:1 | 7.58:1 | 3.95:1 |

## Gate output

`npm run gate` exited 0. Database smoke and Playwright both ran without skipping. Full captured
output: `/tmp/quire-shell-gate-final.log`. Terminal colour warnings are omitted below.

```text
> quire@0.1.0 gate
> bash scripts/gate.sh

== biome
Checked 64 files in 24ms. No fixes applied.
== typecheck
== tests

> quire@0.1.0 test
> vitest run src --passWithNoTests

 RUN  v5.0.5 /home/nojin/works/quire/.worktrees/feat-shell-icons

 Test Files  10 passed (10)
      Tests  90 passed (90)
   Start at  10:36:57
   Duration  290ms (import 40%, tests 25%, transform 24%, worker 11%)

== build
== database smoke (skipped when supabase is down)
ok   insert a book
ok   row level security hides another shelf
ok   duplicate ISBN refused
ok   only one active book allowed
ok   streak 2026-10-26
ok   streak 2026-10-26
ok   streak 2026-10-27
ok   streak 2026-10-29
ok   streak 2026-10-31
ok   streak 2026-11-02
ok   two logs on one day add up

all database checks passed
== docs present
== end to end smoke (skipped when supabase or system Chromium is unavailable)

> quire@0.1.0 test:e2e
> playwright test

Running 4 tests using 1 worker

  1 tests/e2e/auth.spec.ts:3:1 sign up, open the catalogue, and sign out (981ms)
  2 tests/e2e/catalog.spec.ts:3:1 search, save a candidate, and refuse a persisted duplicate (1.8s)
  3 tests/e2e/catalog.spec.ts:60:1 empty query shows guidance and prevents provider searches (750ms)
  4 tests/e2e/settings.spec.ts:3:1 theme chosen in settings is applied and survives a reload (1.0s)

  4 passed (5.9s)
gate ok
```
