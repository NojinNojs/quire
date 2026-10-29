# Quire, quality milestone: architecture, data layer, honest states (issues #15 #16 #17 #18)

Work in `/home/nojin/works/quire` on branch `refactor/quality`, based on `feat/catalog-add`.
One milestone. Do not start the shelf or the reading loop.

## Read first

`docs/PRD.md`, `docs/DESIGN_SYSTEM.md`, `docs/SCHEMA.md`, `src/features/catalog/SearchScreen.tsx`,
`src/lib/catalog.ts`, `src/lib/supabase.ts`, `src/features/auth/AuthForm.tsx`,
`app/CONSISTENCY.md` in `../quire-mockups` for the visual rules, and the four issues named above.

## 1. Atomic modules (#15)

`SearchScreen.tsx` is 374 lines. Split it so no file exceeds 200 lines:

```
src/features/catalog/
  SearchScreen.tsx        composition only, under 120 lines
  SearchForm.tsx
  CandidateRow.tsx
  CandidateList.tsx
  ManualForm.tsx
  useCatalogue.ts         the flow: query, run, save, duplicate, count
```

Move styles to `src/styles/catalog.css` if that keeps components readable, still token-only.

## 2. Data layer (#16)

`src/data/books.ts` owns every Supabase call for books:

- `countBooks(client, ownerId): Promise<number>`
- `saveBook(client, input): Promise<{ ok: true; book: Book } | { ok: false; message: string; kind: "duplicate" | "unknown" }>`
- `listBooks(client, ownerId): Promise<Book[]>`

`Book` and `EditionInput` are explicit types in `src/data/types.ts`. The client is injected, so the
functions can be tested with a fake that returns a 23505 error, an RLS error and a success.
Unit tests cover the three mappings. Components must not import `supabase` directly any more.

## 3. Honest states (#17)

Every async surface shows:

- **loading:** three skeleton rows shaped like the real rows, not a spinner;
- **empty:** one sentence and one action, same pattern on every list;
- **error:** the message, a `Try again` button, and the manual entry path.

The catalogue already returns partial errors; keep them visible but never blocking when a source
still answered.

## 4. Error boundary (#18)

`src/features/error/ErrorBoundary.tsx` at the root, class component, readable fallback with a retry
that remounts the tree, and a `console.error` carrying the component stack.

## Constraints

- Mobile first at 390, tokens only, radius at most 3, no em dash in any copy, English UI.
- No new runtime dependency.
- Keep `npm run gate` green (biome, typecheck, unit tests, build, database smoke) with Supabase
  running locally.
- One commit per issue, conventional prefixes. If a requirement cannot be met, say so under
  `Known gaps` in the notes file instead of inventing a result.

## Evidence

`docs/evidence/quality/NOTES.md` plus screenshots of the three states and of the boundary fallback
(reach it by throwing in a temporary dev-only button you remove afterwards). List what you clicked
and what happened, and paste the final gate output.

## Git

Branch `refactor/quality`. Do not merge, do not push, do not open a PR. Report the branch name and
the commit list.
