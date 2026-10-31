antislop active: during (global preference). Do not stop to ask. Read `DESIGN.md`.

# Task: the first impression is opening a book (#63) — mobile first

Worktree: this directory, base `main`. Own `src/features/auth/**`, `src/styles/auth.css`,
`tests/e2e/auth.spec.ts`. Do not touch demo state, nav, shelf, reading, lib, package.json.

The owner wants a first impression that makes someone stop, with the book theme carried by structure, not by
decoration. Everything below is flat print language: no glow, no glass, no gradient except paper shading.

## 1. The cover, on the first visit (mobile and desktop)

Before the page, one full-viewport **front cover**: cloth colour from the active theme's class-800 token,
`QUIRE` in Newsreader at 44px (34px on phones), a hairline rule under it, `A personal library` in 10px tracked
mono, and at the foot `Tap to open` in 10px mono. Tapping or pressing Enter opens it.

The opening is a single fold: the cover rotates on its left edge (`transform-origin: left center`,
`rotateY(-105deg)`) over 480ms `cubic-bezier(0.65, 0, 0.35, 1)`, revealing the page beneath, then unmounts.
Under `prefers-reduced-motion: reduce` it cross-fades in 120ms instead. It appears once per browser
(`localStorage` key `quire:cover-seen`), never for the demo route, and never blocks a returning reader: if the
key exists, the page renders immediately.

## 2. The bookmark ribbon

On the page, a 10px ribbon of the accent colour hangs from the top edge, 96px long, with a notched foot drawn
by `clip-path`. It is the only accent object on the surface, and it marks where the page begins.

## 3. FROM YOUR SHELF becomes a bookplate

On phones, the inset gets a printed plate treatment: a 1px frame inset 12px from the text block, the label
`EX LIBRIS` in 9px mono above the title, and the owner line `THIS COPY BELONGS TO A READER` in 9px mono under
the author. It must read as printed on the page, not as a card floating above it.

## 4. Mobile rhythm, the part that must feel expensive

- 24px page margins at 390, 16px at 320, and the text measure never exceeds 44 characters.
- The form rows keep 44px targets and 8px minimum gaps.
- Under the primary action, the two links sit on one line at 390 and stack at 320.
- The whole page scrolls as one sheet: no sticky elements, no fixed bars.
- First screen at 390x844 must show: running head, headline, email, password, and the primary action. Verify it.

## 5. Desktop

Keep the spread, but the cover opening applies there too, sized to the spread (max 1040px wide, 2:3 area).
The gutter fold stays the only shading. The bookplate is desktop-only off (the recto already carries the book).

## Never

No new colours, no icons, no badges, no arrows, no second gradient, no em dash. Do not change copy the tests
assert. Keep every auth behaviour and the demo link.

## Verify

`npm run gate` green (222 unit, 21 e2e or more). Add one e2e test for the cover: it appears once, opens on
click, and does not reappear after reload. Screenshots at 320, 390, 768, 1280 in shelf-light and oxford-dark,
plus the cover itself and the open state, in `docs/evidence/auth-cover/`. Record a click-through list.

Commit on `feat/auth-cover-open`, do not merge or push.
