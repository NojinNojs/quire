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
