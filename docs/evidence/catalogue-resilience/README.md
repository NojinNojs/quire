# Catalogue resilience (#54)

Branch: `feat/catalogue-resilience`. Captured on 2026-10-29.

## Real lookup

Each `.txt` file contains curl response headers and body. Requests used `curl -sS -L -i --max-time 40`:

| File | URL | Result |
| --- | --- | --- |
| `google-api.txt` | `https://www.googleapis.com/books/v1/volumes?q=isbn:9786020788036` | 429, quota exceeded |
| `open-library-isbn.txt` | `https://openlibrary.org/isbn/9786020788036.json` | 404 |
| `open-library-search.txt` | `https://openlibrary.org/search.json?q=isbn:9786020788036` | 200, zero results |
| `google-html.txt` | `https://books.google.com/books?vid=ISBN9786020788036` | 302 to books.google.co.id, then 200 with title and author |
| `proxy-html.txt` | `http://127.0.0.1:5175/gb/books?vid=ISBN9786020788036` | 200 through the running Vite proxy, same title and author |

The proxy follows redirects on the server so Google's regional redirect does not send the browser to a cross-origin URL. The configured proxy runs in Vite's development server. A static deployment needs the same `/gb` route on its hosting server.

## Browser evidence

`html-candidate.png` and `single-error.png` show the app at 390px in system Chromium (Brave). The browser regression replays the real Google HTML response recorded above, with API 429, Open Library ISBN 404, and empty Open Library search responses. The final-failure screenshot substitutes an HTML 404 after a reload clears the successful-result cache. No production catalogue requests are used by the test suite.

The browser test clicks Add details, checks the title, author and ISBN, and fills pages and publisher. It then checks exactly one error panel and one panel action. Keyboard activation of Enter it manually opens the form with ISBN 9786020788036 prefilled.

`browser-checks.json` records rendered text contrast in the candidate, manual form and final-error states across all six themes. Every checked pairing exceeds 7:1. Each state also passes overflow checks at widths 320, 390, 768 and 1280. `contrast.json` records the underlying token ratios. `design-check.json` is the Impeccable detector result, with no findings.

## Design reasons and antislop delivery gate

Reading: an existing book-entry form for readers, using Quire's paper editorial system. ENERGY 1 / RHYTHM 1 / MOTION 1.

- Hard gate PASS: English interface copy, no new em dash, no added assets or claims, token-only CSS, radii unchanged at 0 to 3px. Rendered contrast is at least 7:1; browser checks verify layout and keyboard recovery.
- Purpose gate PASS: ruled candidate rows preserve the edition hierarchy; one failure panel groups attempted sources with its recovery action. No decorative techniques were added.
- Liveliness PASS: the existing serif book title and ruled rows carry Quire's identity; whitespace separates search, results and recovery. The recovery button is the panel's focal point. The existing navigation accent identifies the active route. Motion remains limited to existing control states.
- Craftsmanship PASS: the actual Indonesian title and author come from recorded HTML. Add details and manual recovery open editable, prefilled forms. Loading and empty guidance remain available. Candidate, error and manual states were exercised across themes and viewport widths.

Catalogue secondary text uses the ink token because some existing muted theme pairings fall below 7:1. Primary controls use surface text on ink, including their disabled state, to meet the same requirement in all six themes. Typography, spacing, rules and radii retain the incumbent system.

## Validation

`gate-output.txt` records `npm run gate`: lint, TypeScript, unit tests, build, live local database smoke checks and browser tests. The lint warnings in unrelated auth, reading and shelf styles predate this change.

Parser fixtures cover title plus author, title without author and a Google no-result title. Injected fetcher tests cover ordered fallbacks, ISBN-10 normalization, text-only searches, retries, deadlines, cached results and successful later sources suppressing errors. Component and browser tests cover ISBN-prefilled manual recovery and editing HTML metadata.
