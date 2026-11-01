# Evidence

Committed captures, gate output, and verification notes, one directory per milestone. Open the
directory's own `README.md` or `NOTES.md` first; it records what was checked and what the
screenshots show.

Generated output stays out of this folder: `test-results/` and `.impeccable/` are ignored by git.

## Authentication

The sign-in evidence runs in order. Later directories supersede the earlier treatments.

- `auth-v2/`: first rebuilt sign-in captures and delivery gate.
- `auth-card/`: borrower card sign-in, issue #59.
- `auth-book/`: open-book sign-in captures.
- `auth-polish2/`: phone page and desktop spread, issue #62. `verify.mjs` repeats the layout checks.
- `auth-cover/`: the opening cover and first screen, issue #63.

## Onboarding

- `onboarding/`: sign-in, registration, and product tour captures.

## Catalogue

- `catalog-add/`: empty, results, and saved states for catalogue entry, issue #3. `browser-check.js` repeats the interaction.
- `catalog-resilience/`: notes for the network resilience pass, issue #22.
- `catalogue-resilience/`: Google Books HTML fallback, issue #54, with recorded provider responses.

## Covers

- `covers/`: uploaded cover rendering, issue #33.
- `cover-enrich/`: the cover backfill CLI, its checks, and shelf captures.

## Reading and demo

- `reading/`: reading loop screenshots and notes.
- `demo/`: interactive demo captures and verification.

## Shelf and shell

- `shelf/`: shelf screen captures and notes.
- `shell/`: app shell and icons.
- `polish2/`: shelf line, Today panes, and shelf filters.
- `responsive-shelf/`: shelf breakpoints, loading, empty, and error states.
- `responsive-shell/`: shell breakpoints, issue #46.
- `design-shelf/`: shelf grid and list in two themes.
- `theme-switcher/`: theme screen and header navigation, issue #19.

## Design, wiring, and quality

- `design-auth/`: borrower card theme checks.
- `wiring/`: screens wired to their routes.
- `scan/`: barcode scan evidence.
- `quality/`: component states for the quality milestone.
- `e2e/`: browser smoke suite notes, issue #21.

## Test-owned paths

Two directories are part of the test suite:

- `tests/e2e/auth.spec.ts` writes captures and `contrast.txt` to `auth-cover/`.
- `tests/e2e/catalogue-resilience.spec.ts` reads `catalogue-resilience/google-html.txt`.

Rename or move either directory only together with those tests.
