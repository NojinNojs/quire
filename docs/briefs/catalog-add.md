# Quire, milestone: add a book from the catalogue (issue #3)

Work in `/home/nojin/works/quire` on branch `feat/catalog-add`. One milestone only. Stop when the
acceptance list is green and evidence exists. Do not start the shelf milestone.

## Read first

- `docs/PRD.md`, `docs/APP_FLOW.md` (flow "Menambah Buku"), `docs/DESIGN_SYSTEM.md`, `docs/SCHEMA.md`
- `src/lib/*.ts` (rules layer already written, tested) and `src/features/auth/AuthForm.tsx`
- `supabase/migrations/20261028000001_init.sql` (the table you write to)
- `app/` in `../quire-mockups` is the design reference for layout only; do not copy its markup.

## What to build

A search screen that turns a query into a saved edition, plus manual entry as the fallback.

1. `src/lib/catalog.ts`, pure: takes a query, calls Google Books and Open Library, normalises both
   into one `Candidate` shape (`title, author, publisher, year, pages, isbn, language, coverUrl,
   source`), drops duplicates by ISBN, and sorts by how complete the record is. No React, no DOM.
   The network call is injected (`fetcher` parameter) so it is testable offline.
2. `src/lib/isbn.ts`, pure: validate an ISBN-10 or ISBN-13 check digit, normalise to digits and X,
   convert ISBN-10 to ISBN-13. Reject the rest.
3. `src/features/catalog/SearchScreen.tsx`: one field, results as ruled rows (cover 48x72, title in
   serif italic, publisher, year, pages), a `Save` action per row that writes to `public.books`, and
   an honest empty state. Manual entry as a second tab with title required and everything else
   optional.
4. Saving must use the rules already in `src/lib/edition.ts` for the duplicate check, and must send
   `owner = session user id`, `language` from the record or `id` by default.
5. After a successful save the row shows `Added` and the book count in the header increases. Saving a
   duplicate ISBN shows the database's own message, not a generic error.

## Tests, required

- `src/lib/isbn.test.ts`: valid ISBN-10, valid ISBN-13, invalid check digit, ISBN-10 to 13 conversion.
- `src/lib/catalog.test.ts`: normalises a Google Books response and an Open Library response from
  fixtures in `src/lib/__fixtures__/`, dedupes by ISBN, keeps the more complete record, handles an
  empty result and a network error without throwing.
- Do not call the real network in a test.

## Constraints

- Mobile first at 390 wide, design tokens only, no new CSS framework, radius at most 3px.
- No em dash anywhere. English UI copy.
- No new dependency unless it is unavoidable; if you add one, say why in the PR body.
- Keep `npm run gate` green: biome, typecheck, unit tests, build, the database smoke test.
- The database smoke test needs `supabase start` and a filled `.env`; both already exist locally.
- If a requirement cannot be met, write it plainly in the PR body under `Known gaps` instead of
  faking it.

## Evidence

Leave in `docs/evidence/catalog-add/`: one screenshot of the empty state, one of results, one after
a successful save. Write `docs/evidence/catalog-add/NOTES.md` listing what you clicked and what
happened, plus the exact command output of `npm run gate`.

## Git

- Branch `feat/catalog-add`, small commits with conventional prefixes, no merge commits.
- Do not push. Do not open a PR. Leave the branch ready and tell me the branch name.
