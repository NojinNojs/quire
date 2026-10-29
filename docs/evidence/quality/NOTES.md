# Quality milestone

Branch: `refactor/quality`, based on `feat/catalog-add` at `0d51262`.
Scope: issues #15, #16, #17 and #18. Shelf and reading loop remain outside this milestone.

## #15 Atomic modules

Extracted search, candidate rows/list, manual entry, entry tabs and flow hook. SearchScreen is composition only. Catalogue styles live in `src/styles/catalog.css`. All extracted files are below 200 lines; SearchScreen is below 120.

Validation: TypeScript passed; all 40 existing unit tests passed after extraction.

## #16 Books data layer

`src/data/books.ts` owns book queries with an injected client. Typed `Book` and `EditionInput` describe persisted rows and save input. Count/list reject failures instead of fabricating zero or empty results; saves return the requested discriminated result. Duplicate checks retain owner scoping, pagination and ISBN normalisation. Unknown language remains null; a migration aligns the database with the nullable language field documented in SCHEMA.md. Insert payloads explicitly select persisted fields, excluding catalogue-only source metadata. Components receive clients or use the session hook rather than importing the singleton.

Validation: 50 tests pass, including 10 data-layer tests for success, 23505, RLS, read failures, owner scope, pagination and ISBN handling. TypeScript passed.

## #17 Honest states and browser evidence

Shared row skeletons and retry panels cover catalogue search, count and save. Session opening, authentication and sign out also show three skeleton rows while pending; authentication/session errors have retries. Manual entry is available on every book-operation error. Authentication remains required before any book can be entered.

Chromium at 390 x 844, with a new account created through the local signup form. Provider responses and deliberate RLS/count failures were intercepted for deterministic state checks. Successful saves, duplicate rejection, pagination queries and counts used real local Supabase. No real provider outage is claimed.

- [Loading](loading.png): clicked Search while holding both provider requests; exactly three rows appeared, with cover, title, metadata and action placeholders.
- [Empty](empty.png): released empty responses; one sentence and one Enter manually action appeared. Clicked it and the manual form opened.
- [Error](error.png): aborted both provider requests; both source messages and Try again/Enter manually appeared, with no misleading empty-results sentence.
- [Partial error](partial-error.png): clicked Try again with Google answering and Open Library failing; the Open Library warning remained visible beside an enabled candidate Save button.
- Clicked Save with an intercepted RLS rejection; permission text and recovery appeared. Clicked its Try again with interception disabled; local Supabase saved the book, Save became Added and count became 1 book.
- Reloaded, searched and saved the same ISBN; the real unique index rejected it, the friendly duplicate message appeared and count stayed 1.
- Opened Enter manually, entered only a title and saved; count became 2. Repeating Save book detected the no-ISBN edition duplicate and left count unchanged.
- Reloaded with a failed count request; header said Book count unavailable. Clicked Try again against local Supabase and count recovered to 2 books.
- All six themes at widths 390, 768 and 1280: document width equalled viewport width; visible buttons had 48px minimum height; row covers measured 48 x 72. ArrowRight selected the manual tab; Tab reached Title.

Repeatable interactions: [browser-check.js](browser-check.js), starting with a fresh signed-in local account.
Validation: 54 tests pass, including four rendered-state regressions for skeletons, empty actions, total failure and nonblocking partial failure.

## #18 Root error boundary

The root class boundary catches render/lifecycle failures, logs the error and component stack through `console.error`, and retries with a new keyed tree.

At 390 x 844, temporarily added an `import.meta.env.DEV` button to App that set local state and threw `Error("Temporary quality boundary evidence")` during render. Entered an unsaved search query and clicked Test boundary.

- [Boundary fallback](boundary.png) showed a readable heading, saved-book reassurance and Try again.
- Console capture contained `Quire could not render the app`, the thrown error, and `componentStack` containing both `App` and `ErrorBoundary`.
- Clicked Try again. Add a book returned, the unsaved query reset to blank, and the real database count remained 2 books. This verifies tree remount rather than a hidden fallback.
- Removed the temporary state, throw and button. Reloaded and verified that the Test boundary control was absent and the catalogue still loaded.

Additional checks: called the real data-layer list operation and verified two owner-scoped rows, with null language/pages/ISBN on the manual edition. Clicked Sign out, submitted the auth form with an intentionally held rejection, saw three skeleton rows, then the error and Try again. Removed interception, entered the correct password and clicked Try again; the real account reopened with 2 books.

## Visual verification

Preserved the existing paper-based catalogue design from DESIGN_SYSTEM.md and the mockup CONSISTENCY.md: calm operation, ENERGY 1 / RHYTHM 1 / MOTION 1. Serif italic remains confined to book titles; mono expresses sourced counts and edition metadata. Skeletons repeat real row anatomy without perpetual motion. The accent identifies the primary form action. No new runtime dependency.

- Hard gate PASS: state screenshots inspected at 390px, keyboard entry tabs verified, no overflow in 18 width/theme combinations, real persisted counts and null unknown metadata.
- Purpose gate PASS: row skeleton geometry communicates pending editions; shared error panels expose recovery without suppressing partial results; no decorative visual effects added.
- Liveliness PASS: retained the incumbent typography, paper/rule surfaces, single action accent and structural section spacing.
- Craft PASS: tested search/manual/save/count/auth retries and the boundary remount; all visible buttons measured at least 48px high; no new marketing claims or fabricated user data. Provider fixtures are explicitly identified as fixtures above.
- Impeccable mechanical detector: ran once on the changed component and stylesheet targets; returned `[]` (no findings).

## Final gate

Local Supabase was running and the nullable-language migration was applied. Database smoke executed and passed; it was not skipped. Exact final output:

```text
> quire@0.1.0 gate
> bash scripts/gate.sh

== biome
Checked 46 files in 11ms. No fixes applied.
== typecheck
== tests

 RUN  v5.0.5 /home/nojin/works/quire


 Test Files  8 passed (8)
      Tests  54 passed (54)
   Start at  09:48:37
   Duration  156ms (import 40%, transform 24%, tests 21%, worker 15%, environment 1%)

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
gate ok
```

## Known gaps

No implementation requirement is known to be unmet. Error/loading provider responses and auth rejection were simulated in Chromium for deterministic evidence; successful persistence, duplicate protection, count recovery and auth retry used local Supabase. Physical-device testing and a full live-provider availability check were outside this verification pass. The boundary catches React render/lifecycle errors; async failures are handled by their respective flow states.
