# Quality milestone

Branch: `refactor/quality`, based on `feat/catalog-add` at `0d51262`.
Scope: issues #15, #16, #17 and #18. Shelf and reading loop remain outside this milestone.

## #15 Atomic modules

Extracted search, candidate rows/list, manual entry, entry tabs and flow hook. SearchScreen is composition only. Catalogue styles live in `src/styles/catalog.css`. All extracted files are below 200 lines; SearchScreen is below 120.

Validation: TypeScript passed; all 40 existing unit tests passed after extraction.

## #16 Books data layer

`src/data/books.ts` owns book queries with an injected client. Typed `Book` and `EditionInput` describe persisted rows and save input. Count/list reject failures instead of fabricating zero or empty results; saves return the requested discriminated result. Duplicate checks retain owner scoping, pagination and ISBN normalisation. Unknown language remains null; a migration aligns the database with the nullable language field documented in SCHEMA.md. Insert payloads explicitly select persisted fields, excluding catalogue-only source metadata. Components receive clients or use the session hook rather than importing the singleton.

Validation: 50 tests pass, including 10 data-layer tests for success, 23505, RLS, read failures, owner scope, pagination and ISBN handling. TypeScript passed.

## Known gaps

Final browser evidence and full gate pending implementation of the remaining issues.

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
