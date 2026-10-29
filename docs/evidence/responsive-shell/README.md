# Responsive shell, issue #46

Branch: `feat/responsive-shell`.

The phone composition remains a single column with bottom navigation. At 768px the navigation
becomes a docked 72px rail; at 1280px it grows to 200px and the content column centres within the
remaining space, capped at 1120px. Today splits at 1024px, with a 32px gutter and matching top edges.
The header stays at the top of the content column from 768px.

## Screenshots

Captured with local Brave/Chromium at 900px viewport height. The book and 48 logged pages are local
test fixtures; the account and its data are deleted after each test.

| Width | Shelf light | Oxford dark |
| --- | --- | --- |
| 390 | [Phone](shelf-light-390.png) | [Phone](oxford-dark-390.png) |
| 768 | [Compact rail](shelf-light-768.png) | [Compact rail](oxford-dark-768.png) |
| 1280 | [Wide rail and two panes](shelf-light-1280.png) | [Wide rail and two panes](oxford-dark-1280.png) |

[Skip link with keyboard focus](skip-link-focus.png).

## Verification

`npm run gate` passed. [Full output](gate.txt): 178 unit tests, build, all database smoke checks,
and 12 Playwright tests, with no skipped tests. The five CSS specificity warnings are in unchanged
auth and reading styles.

The responsive Playwright suite checks all six themes at 320, 390, 767, 768, 1023, 1024, 1280, and
1440px. Assertions cover navigation geometry and labels, the Today split and gutter, centred content,
7:1 text contrast on the shell and reading controls, and page width. Long unbroken titles are
checked on Today and both shelf views; Search and Settings also receive overflow and docked-header
checks. No JavaScript breakpoint helper was needed.

Keyboard checks use Tab and Enter at phone, compact-rail, and wide-rail sizes. The skip link focuses
the existing main landmark without changing the hash route. Tab reaches all rail destinations and
leaves the rail. The upload label and page input show the 2px accent focus ring. Breakpoint changes
have no rail animation; bookmark transitions are at most 120ms and reduced motion disables the shell
entrance.

Click-through of the shell controls:

- Today opens the active jacket and reading record.
- Shelf opens the shelf, and its List control exposes the full long title.
- Search opens Add a book.
- Settings opens the theme controls; the existing gate test verifies theme changes and reload persistence.
- Skip to main content activates with Enter, focuses main, and preserves `#/shelf`.

All seven screenshots were visually inspected. The Impeccable detector returned `[]` for the changed
UI sources. Verification used desktop Chromium with resized viewports, rather than physical devices.

## Antislop delivery gate

Scope: the responsive shell and its effects on existing screens. Direction is
`docs/DIRECTION_BOOKSHELF.md`, ENERGY 1 / RHYTHM 2 / MOTION 1. The paper rules and printed jackets
remain the identity; the rail provides persistent navigation, and the two panes keep the jacket
beside the record while logging pages.

### Hard gate

- R-02 PASS: new source, labels, and evidence notes contain no em dash.
- R-03 PASS: Playwright checks page width at eight widths, including long titles and both shelf views.
- R-17 PASS: no statistics were added; screenshot reading counts come from identified local fixtures.
- R-18 PASS: no testimonials or fictional people were added.
- R-23 PASS: the requested rail reuses the existing three destinations and icons; no new visual assets.
- R-24 PASS: Today, Shelf, Search, and Settings were each opened in Playwright.
- R-25 PASS: shell and reading text/control contrast assertions pass at 7:1 in all 48 theme/width combinations.
- R-26 PASS: the only new control is the skip link; Enter focuses main without navigating away.
- R-27 PASS: existing loading, error, empty, and populated route branches are preserved; unit tests pass.
- R-28 PASS: no FAQ was added.
- R-32 PASS: keyboard tests reach main and the rail, leave the rail, and verify visible focus.
- R-33 PASS: changes are authored in the shell, stylesheet sources, and additive tokens.
- R-34 PASS: all six themes pass the geometry and contrast matrix; both requested themes have captures.
- R-35 PASS: the app ran against local Supabase, all shell links were exercised, and the full gate passed.
- R-36 PASS: no security, performance, customer, or compliance claims were added to the product.
- R-37 PASS: the existing bookshelf direction was read and the design dials declared before editing.
- R-38 PASS: no fabricated product content was added; screenshot records are documented as test fixtures.

### Purpose gate

- R-01 PASS: no new gradient or glow; the existing paper palette remains.
- R-04 PASS: the existing book, shelf, search, and settings icons retain their named destinations.
- R-06 PASS: the requested 10px mono rail labels follow the catalogue typography.
- R-07 PASS: no background grid or decorative pattern was introduced.
- R-08 PASS: no decorative arrows were added.
- R-09 PASS: no badge or extra heading label was added.
- R-10 PASS: no glass or blur was added.
- R-12 PASS: no shadow was added; rules separate the rail, header, and content.
- R-13 PASS: no glow was added.
- R-14 PASS: the split follows jacket and record responsibilities, without adding cards.
- R-19 PASS: route and progress feedback fit 120ms; the rail has no transition or animation.
- R-22 PASS: no illustration was added.

### Liveliness

- Dials PASS: ENERGY 1 / RHYTHM 2 / MOTION 1 preserve a quiet reading tool with distinct jacket and record groups.
- Consistency PASS: the seven inspected captures retain the same paper, type, and motion language.
- Focal point PASS: the printed jacket and Today heading lead the populated screen in both captured themes.
- Whitespace PASS: the 32px pane gutter and existing record rules separate reading context from logging.
- Accent PASS: the existing route indicator remains on phone; accent ink also identifies keyboard focus.
- Identity PASS: the printed jacket, bookmark strip, rules, and stamps remain visible in every Today capture.
- Design read PASS: paper catalogue direction and dials were declared before implementation.

### Craftsmanship and quality locks

- C-1 PASS: breakpoint dimensions follow the brief; layout and typography retain the documented catalogue identity.
- C-2 PASS: all shell links and the skip link were exercised in Playwright.
- C-3 PASS: no content sections were added; the rail and split serve navigation and page logging.
- C-4 PASS: theme, width, long-title, focus, scrolling, and reduced-motion assertions pass.
- C-5 PASS: no public claims or testimonials were added; fixture data is identified above.
- R-05 PASS: the phone stack, compact rail, wide rail, and Today split have distinct verified geometry.
- R-11 PASS: new controls use the existing 2px radius token; no pill shapes were added.
- R-15 PASS: Skip to main content names its action; destination copy remains Today, Shelf, and Search.
- R-16 PASS: no marketing copy was introduced.
- R-20 PASS: inspected screenshots retain Quire's printed jacket, bookmark, and stamped record.
- R-21 PASS: all six existing theme choices remain available and pass the responsive matrix.
- R-29 PASS: all added colors derive from the existing theme ink and accent tokens.
- R-30 PASS: the bookshelf direction remains the visual authority; no outside product template was introduced.
- R-31 PASS: the rail supports navigation, the header keeps settings available, and the split puts the record beside its book.
