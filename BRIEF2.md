antislop active: during (global preference). Do not stop to ask. Read `DESIGN.md` first.

# Task: finish the open-book sign-in, desktop and phone (#62)

Worktree: this directory, base `main` (which already shows Bumi Manusia on the recto; the demo state and its
tests are green, do not touch `src/features/demo/**` or `tests/e2e/**`).

Own: `src/features/auth/**` and `src/styles/auth.css`.

## Phone (below 760px), the main work

Right now the phone shows only the verso plus a bookmark tab. Build a real phone page:

1. The recto content becomes a printed inset **inside the same page**, directly under the demo link and above
   the foot: a hairline, a running label `FROM YOUR SHELF` in 10px mono, then a row: cover 64px wide on the
   left, and on the right the title in serif italic, the author in small caps, the seven streak marks and the
   `Pages read today` count.
2. The bookmark tab and the recto folio are removed on phones. Nothing may touch the page edge.
3. Every link and the Show control: 44px minimum height, 8px minimum vertical gap.
4. The primary action must stay visible at 320x640 without scrolling.

## Desktop (760px and up)

5. One object: equal top and bottom margins on both pages, the gutter shadow identical from top to bottom, a
   1px page edge only on the outer sides.
6. Vertical rhythm on an 8px grid from running head to folio. More space above the headline than below it.
7. The cover prints flat: 180px wide, 1px hairline, no shadow, no tilt.
8. Focus, hover and active states on every control using the accent colour only.

## Never

No gradients other than the gutter fold. No icons, badges, arrows or extra rules. No new colours. No em dash.
Do not change copy the tests assert. Do not touch the demo fixtures.

## Verify

`npm run gate` must pass (222 unit, 21 e2e). Screenshots at 320, 390, 768 and 1280 in shelf-light and
oxford-dark, plus a focus shot, in `docs/evidence/auth-polish2/`. Report the Design Read and the Delivery Gate
blocks in `docs/evidence/auth-polish2/PR_BODY.md`.

Commit on `feat/auth-polish2`. Do not merge or push.
