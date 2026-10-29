# Catalogue add evidence

Branch: `feat/catalog-add`. Scope: issue #3 only. No shelf milestone work.

## Browser walkthrough

Used the running Vite app at `http://localhost:5173`, a fresh confirmed local Supabase account,
and a 390 by 844 viewport. The account session was loaded into the browser before the walkthrough.
No credentials or session tokens are stored in this directory.

The repeatable browser script is `browser-check.js`. Run it through Playwright's code runner
with an authenticated, empty local library. It intercepts only catalogue requests; authentication,
book inserts, duplicate errors, and counts use the real local Supabase stack.
Catalogue fixtures are based on `src/lib/__fixtures__/`; cover fields are omitted for these
screenshots to exercise the honest No cover state.

1. Entered `This Earth of Mankind` and clicked Search with empty provider responses.
   The page showed “No catalogue matches for this search.” and Enter manually. See `empty.png`.
2. Clicked Search with both catalogue fixtures. ISBN-10 and ISBN-13 versions became one row,
   with title, author, publisher, year, pages and source. See `results.png`.
3. Clicked Save. Supabase returned HTTP 201, the row showed Added, and the header changed
   from 0 books to 1 book. See `saved.png`. Queried the inserted row: owner matched the session,
   ISBN was `9780140256352`, and language was `en` from the catalogue.
4. Reloaded, searched again, and clicked Save. Supabase returned HTTP 409. The UI exactly showed
   its response message: `duplicate key value violates unique constraint "no_duplicate_isbn"`.
   The count stayed at 1 book.
5. Clicked Enter manually and Save book with a blank title. Native required validation blocked it.
   Filled title and an invalid ISBN; the page asked for a valid ISBN or a blank field.
   Cleared ISBN and saved the title alone. The count became 2 books. Queried the row and confirmed
   language `id`, with ISBN, author, publisher, pages, and year null.
6. Clicked Save book again. The edition identity check refused the duplicate and count stayed 2.
7. Switched to Search catalogue and aborted both catalogue routes. The page showed provider
   availability messages plus manual fallback.
8. Checked all six themes at widths 390 and 1280: no horizontal overflow, each visible button
   at least 48px tall, and row covers exactly 48 by 72. Checked 200% zoom at 390 without overflow.
   Used ArrowRight to select the manual tab, then Tab to reach Title with visible focus.

## Live provider walkthrough

Removed all catalogue interception, searched for `Bumi Manusia`, and received five actual Open
Library edition records. See `live-results.png`. Clicked Save on the first result, the 1980 Hasta
Mitra edition, 353 pages. The row showed Added and count increased from 2 books to 3 books.
See `live-saved.png`. This live save used the final committed implementation.

Google Books returned HTTP 429 during the live attempt. The page displayed “Google Books is
unavailable. Try again or enter the book manually.” alongside the available Open Library results.
An earlier Open Library attempt timed out; retry succeeded. No live Google success is claimed.

Finally entered `MANUAL evidence book` in the manual form and clicked Save book. The existing
mixed-case title was recognised through `editionKey`, the duplicate was refused, and count stayed 3.

## Verification

- 39 unit tests in six files passed. Catalogue tests inject fetchers and use no real network.
- Required ISBN cases, fixture normalisation, canonical ISBN deduplication, completeness ranking,
  empty results, partial outages, edition fallback and network errors are covered.
- `contrast.json` contains WCAG relative luminance calculations from shipped theme tokens.
  Ink, muted text, raised surfaces and primary button text pass 4.5:1 in all six themes.
- Impeccable mechanical detector on the changed UI and CSS returned `[]`.
- `git diff --check` passed. Added source and app CSS contain no em dash.
- No new dependencies. Radius remains within the existing token system.
- The design document mentions `quire_consistency.py` and `quire_verify.py`, but those files
  are absent from this repository. Actual browser dimensions, contrast calculations, the detector,
  Biome, and the required gate were used instead.
- The gate below actually ran the database smoke checks; they were not skipped.

## Exact output of `npm run gate`

```text

> quire@0.1.0 gate
> bash scripts/gate.sh

== biome
Checked 28 files in 9ms. No fixes applied.
== typecheck
== tests

 RUN  v5.0.5 /home/nojin/works/quire


 Test Files  6 passed (6)
      Tests  39 passed (39)
   Start at  07:46:03
   Duration  122ms (import 38%, transform 22%, tests 21%, worker 18%, environment 1%)

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
