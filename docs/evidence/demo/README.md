# Interactive demo verification

Verified locally on 2026-10-29 at `http://127.0.0.1:5173/?demo=1#/today`.
Updated to published cover artwork and one shared fallback, per the user's follow-up.
The existing Vite preview was reused. No deployment was created.

## Automated checks

- PASS: `npm run gate`, 24 test files and 217 tests, typecheck, lint, build, required documents.
- PASS: focused demo tests cover account isolation, logging, Undo, persistence, reset,
  metadata-free entry, notes, rating, switching active books, finishing, blocked storage,
  malformed saved data, stale streaks, and upgrading existing books to real covers without data loss.
- PASS: production `npm run build`.
- PASS: Impeccable detector returned `[]` for the changed UI targets.
- PASS: `git diff --check`.

The gate retains six existing CSS specificity warnings and Vite's bundle-size advisory.
Database smoke and the existing account E2E suite were skipped because local Supabase is down.
The demo was separately exercised in the browser without Supabase.

## Browser interaction record

| Control or state | Observed result |
| --- | --- |
| Sign-in demo link | Opens Today without credentials |
| Today/Shelf/Search/Settings navigation | Each opens its matching screen |
| Skip to main content | Moves keyboard focus to main and preserves the route |
| Pages input and all four step buttons | Update the page preview; invalid subtraction is disabled |
| Log 10 pages | Updates progress, today's pages, and streak |
| Undo | Restores the previous progress and streak |
| Reload during the Undo interval | Keeps the logged progress |
| View book details / Back to shelf | Open details and return to Shelf |
| Grid / List | Switch collection presentation |
| Shelf title search / Clear filters | Show an empty state, then restore all books |
| Language id | Shows the two Indonesian-language sample books |
| Reading status filter | Shows the active book |
| Select Escape | Closes the option list |
| Open Meditations | Opens that book's details |
| Save notes / Rating | Persist across reload |
| Read this book / Continue reading | Open Today with the selected book; one active book remains |
| Mark as finished | Persists Finished and clears the active reading when appropriate |
| Empty Today / Browse catalogue | Presents a recovery action that opens Shelf |
| Sample search / Add to shelf | Adds Pride and Prejudice and disables the duplicate action |
| No sample matches / Enter this book manually | Opens manual entry |
| Manual empty title | Browser validation blocks saving |
| Manual invalid ISBN | Explains the invalid ISBN and how to recover |
| Manual title-only entry | Saves a book with unknown metadata; page logging works |
| Entry tabs ArrowRight / Home | Switch tabs and move keyboard focus |
| All three theme radios / Dark mode | Apply all six palettes |
| Back to catalogue | Opens Search |
| Reset demo / Keep changes | Cancels the reset and keeps the library |
| Reset sample library | Restores six sample books and their original reading activity |
| Both Leave demo buttons | Return to Sign in; the demo link opens the demo again |
| Real covers | All six Shelf covers and all nine Search covers load from local assets; Today and details share the same cover |
| Failed cover request | Blocking waves.webp switches to the shared placeholder; restoring it restores the real cover after reload |

PASS: no page errors or application console warnings on the final demo reload.
PASS: no external requests observed during demo reload, logging, or Shelf filtering.

## Responsive and contrast checks

Today, Shelf, Search, and Settings had no horizontal overflow at 320, 390, 768, 1024,
and 1280 CSS pixels. Book details also fit at 390 pixels. New controls use the existing
48px touch token. Reduced motion produced `animation-name: none` on the screen container.

Computed foreground/background colors were converted through canvas to sRGB, then measured
with WCAG relative luminance. The following are actual demo component pairs, including
the shell's inherited secondary-text colors.

| Theme | Primary action | Secondary text | Notes placeholder | Banner |
| --- | ---: | ---: | ---: | ---: |
| Shelf light | 16.97 | 8.87 | 9.58 | 18.33 |
| Shelf dark | 16.63 | 9.21 | 8.53 | 15.40 |
| Municipal light | 14.43 | 8.45 | 9.08 | 15.52 |
| Municipal dark | 15.47 | 9.35 | 8.35 | 13.82 |
| Oxford light | 16.54 | 7.89 | 8.50 | 17.81 |
| Oxford dark | 16.33 | 9.48 | 8.83 | 15.21 |

Primary actions use the same ink/surface pairing as Today. Notes placeholders use the
secondary-ink token with full opacity. Nine published cover images are bundled locally, with
their sources recorded in [SOURCES.md](../../../public/covers/SOURCES.md). One neutral SVG
is shared by all missing or failed covers. Book captions stay visible with the placeholder.

## Captures

- [Today, desktop](today-1280.png)
- [Today, phone](today-390.png)
- [Shelf, phone](shelf-390.png)
- [Book details, phone](book-390.png)
- [Shared placeholder after an image failure](placeholder-390.png)

Captures use the browser's reduced-motion or disabled-animation screenshot setting. Fixed
bottom navigation appears at the viewport boundary in full-page phone captures; scrolling
allows the remaining content to be reached.

## Antislop delivery gate

- R-02 PASS: new interface copy contains no em dashes.
- R-03 PASS: the five-width browser sweep found no horizontal overflow.
- R-17 PASS: reading totals are calculated from labelled sample activity.
- R-18 PASS: no testimonials or invented customer identities were added.
- R-23 PASS: the user requested real covers and one placeholder; sources are recorded and sample content is labelled.
- R-24 PASS: all exposed links were exercised against existing routes.
- R-25 PASS: measured new text pairings exceed 7:1 in all six themes.
- R-26 PASS: the interaction record documents real behavior for every exposed control type.
- R-27 PASS: empty searches, empty reading, invalid input, blocked storage, and recovery are handled; local operations are synchronous.
- R-28 PASS: no FAQ was added.
- R-32 PASS: keyboard tabs, select dismissal, skip link, and inherited visible focus were exercised.
- R-33 PASS: UI changes were made directly in source files.
- R-34 PASS: all six palettes were selected using Settings and measured.
- R-35 PASS: the build, test suite, live browser walkthrough, and captures are recorded above.
- R-36 PASS: no security, compliance, or performance claims were added.
- R-37 PASS: the paper interface is retained; the user's real-cover direction replaces cloth jackets.
- R-38 PASS: the persistent banner and catalogue note label illustrative content.
- R-01 PASS: no gradient or glow was added.
- R-04 PASS: existing task-specific navigation icons were retained.
- R-06 PASS: existing book-title serif, interface sans, and progress numerals retain their documented roles.
- R-07 PASS: plain paper surfaces and published cover artwork supply the visual content.
- R-08 PASS: no decorative arrows were added to controls.
- R-09 PASS: a plain explanatory banner identifies the demo; no promotional badges were added.
- R-10 PASS: no glass or blur was added.
- R-12 PASS: new sections use rules and spacing instead of elevation shadows.
- R-13 PASS: no glow was added.
- R-14 PASS: composition follows reading, filtering, entry, and book-record tasks.
- R-19 PASS: existing short route transitions respect reduced motion.
- R-22 PASS: no illustrations were added.
- Liveliness PASS: ENERGY 1 / RHYTHM 2 / MOTION 1, per docs/DEMO.md.
- Focal points PASS: the active book, real shelf covers, search input, and book record lead their screens.
- Whitespace PASS: existing spacing tokens group forms and separate tasks.
- Accent PASS: the existing navigation indicator carries the single accent role.
- Identity PASS: published covers, italic book titles, and DDC group bands identify the collection.
- Design Read PASS: the paper interface and the user's real-cover direction are recorded in docs/DEMO.md.
- C-1 PASS: new controls serve demo identification, collection entry, reading, or recovery.
- C-2 PASS: each interactive control is accounted for in the browser record.
- C-3 PASS: no marketing scaffold or filler section was added.
- C-4 PASS: blocked storage, unknown metadata, themes, narrow widths, and keyboard paths were checked.
- C-5 PASS: sample data is explicitly identified; no commercial claims were added.
- R-05 PASS: different task compositions inherit the established spacing scale.
- R-11 PASS: controls inherit the project's 2px radius.
- R-15 PASS: actions name their operations, including Add to shelf and Save notes.
- R-16 PASS: new copy contains no marketing buzzwords.
- R-20 PASS: the catalogue's actual books and DDC organization preserve Quire's identity.
- R-21 PASS: the saved theme is respected; all light and dark options work.
- R-29 PASS: the existing semantic palette is reused with no extra colors.
- R-30 PASS: the demo extends the incumbent product rather than introducing another product's visual language.
- R-31 PASS: new visual decisions and their purpose are recorded in docs/DEMO.md and this report.
