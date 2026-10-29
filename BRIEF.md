antislop active: during (global preference). Build with the rules applied; do not stop to ask.

# Task: catalogue lookups that do not collapse (#54) (branch feat/catalogue-resilience)

Worktree: this directory, base `main`.

## Diagnosis (measured today, do not re-litigate)

- `https://www.googleapis.com/books/v1/volumes?q=isbn:9786020788036` returns **429**, quota exceeded for the
  day, and `&country=US`, `books.googleapis.com` and the keyless variants all return the same 429.
- `https://openlibrary.org/isbn/9786020788036.json` returns **404**; `search.json?q=isbn:` finds 0, and a
  title search finds 0. Indonesian commercial editions are largely absent from Open Library.
- `https://books.google.com/books?vid=ISBN9786020788036` returns **200** and its `<title>` is
  `Dari dalam kubur: sebuah novel - Soe Tjen Marching - Google Buku`.

So: the API quota dies daily, Open Library never had the book, and the HTML page still knows it. The app
currently shows two red boxes and gives up.

## Build

1. **A fourth source.** Add a server-side lookup through a proxy, because books.google.com sends no CORS
   headers:
   - `vite.config.ts`: `server.proxy` entry for `/gb` -> `https://books.google.com` (changeOrigin, rewrite
     the prefix away).
   - `src/lib/catalogueHtml.ts`: fetch `/gb/books?vid=ISBN<isbn>`, parse the `<title>` into
     `{ title, author }` (the shape is `<title> - <author> - Google Buku`), and return null when the page is
     the "no results" page. Keep the parser small and tested against three fixtures: a normal page, a page
     with no author, and the no-result page.
2. **Order of attempts** in `src/lib/catalog.ts`: Google Books API -> Open Library ISBN -> Open Library
   search -> Google Books HTML (ISBN only). Each failure is silent except the last.
3. **Partial results are results.** If the HTML fallback finds a title, show it as a candidate with the ISBN
   already filled, labelled `Google Books (metadata only)`, and let the user add pages and publisher.
4. **One honest error, not two.** If every source fails, show a single panel: what was tried, and one
   primary action `Enter it manually` that opens the manual form with the ISBN prefilled.
5. Keep the existing rate-limit wording for the API case but do not surface it when a later source worked.

## Rules

- Tokens only, radius at most 3, English copy, no em dash, contrast 7:1 in all six themes.
- Tests: parser fixtures, the attempt order with injected fetchers, "later source wins means no error is
  shown", and the manual action prefilling the ISBN.
- `npm run gate` must pass.

## Evidence

`docs/evidence/catalogue-resilience/` with the real lookup of 9786020788036 through each layer (curl output
per source), a screenshot of the candidate found via HTML, a screenshot of the single error panel, and the
gate output.

## Git

Conventional commits on `feat/catalogue-resilience`. Do not merge or push; report the branch.
