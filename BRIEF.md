antislop active: during (global preference). Do not stop to ask.
Read `docs/DESIGN.md` (already in the repo) before touching anything; it is the design direction, R-37 is satisfied.

# Task: the sign-in is an open book (#60) (branch feat/auth-book)

Worktree: this directory, base `main`. Work only in `src/features/auth/**`, `src/styles/auth.css`,
`tests/e2e/auth.spec.ts`. Do not touch nav, shelf, reading, lib, package.json.

## The verdict that forced this

The owner rejected two previous attempts. His words: "Jelek banget. Gk ada unsur bukunya sama sekali, terus
terlalu ai slop banget." So the page must contain actual books, and it must not look generated.

## References, and exactly what to take from each

- **grok.com (xAI)**: one column, almost no chrome, one quiet primary action, the rest is empty space.
- **are.na**: form controls are bare ruled lines; a single small mono voice for labels; nothing decorative.
- **letterboxd.com**: the artifact carries the colour; the interface stays out of its way.
- **readwise.io**: bookish warmth, small print, one accent.

Take those devices. Do not copy any of those layouts. R-30 applies.

## The direction: an open book on the desk

The surface is a **two page spread of an open book**, not a card, not a photo, not a panel.

- **Verso (left page)**: the form. Running head at the top in 10px mono tracked: `QUIRE` left, `BORROWER CARD`
  right, separated by a hairline. Then the serif line `A home for your reading life.` Then the fields as ruled
  lines inside the text block: mono label above, input on the rule, 2px accent rule on focus. The primary
  action is one solid ink block, 48px, aligned to the text measure, not full width. Foot of the page: folio
  number `17` centred, and under it the small print.
- **Gutter**: one fold. A single soft asymmetric shadow in the gutter, wider on the verso side, no other
  gradient on the page. This is the only gradient allowed (R-01 purpose: it is the book's spine).
- **Recto (right page)**: a real book. The current reading cover from `public/covers/` stands at the top of
  the page, 2:3, with a thin shadow so it sits on the paper; under it, the reader's record in the book's own
  voice: `The Waves` in serif italic, `Virginia Woolf` in small caps, the streak printed as seven stamped
  marks with weekday letters, and the line `Pages read today` with the number. This is a demo of the product,
  not a marketing panel: it must be the same components the app already uses where possible.
- **Page edges**: the outer edges of both pages carry a 3px stack of hairlines suggesting paper, and the
  corner of the recto is very slightly turned (one 12px fold), nothing more.
- **Mobile**: only the verso shows, full width, and the recto becomes a 10px sliver of paper at the right
  edge with the cover peeking as a bookmark tab at the top. No horizontal scroll at 320.

## Hard constraints

- Typography: Newsreader (serif) for the headline, book title and italic; Plus Jakarta Sans for UI; the mono
  face already in tokens for labels and folios. No fourth family.
- Radius 0 to 2. No pill shapes. No glow. No blurred glass. No emoji, no icons except the app's own set.
- No em dash in any copy (R-02). English copy, no marketing words (R-16), no fake numbers (R-17).
- Contrast: every text element at least 7:1 in all six themes; the existing e2e contrast sweep must pass
  honestly, sampling the new markup.
- 320, 390, 768, 1024, 1440 with no horizontal overflow.
- Keyboard order follows the page: email, password, show, submit, reset, create, demo. Focus ring 2px accent.
- The demo link, `?auth=signup`, sign up strength line and mismatch state, reset link and all auth calls keep
  working exactly as now.

## Delivery Gate (must be in the PR body, PASS/FAIL per block)

Follow the antislop Delivery Gate: Hard Gate, Purpose-Gate, Liveliness (declare the dials), Craftsmanship.
State the Design Read line. Name the one accent, the one motif, and the single purpose of the gutter gradient.

## Evidence

`docs/evidence/auth-book/` with sign in and sign up at 390, 768, 1280 in shelf-light and oxford-dark, one
320 shot, the focus state, the gate output, and a click-through list of every control you exercised in the
running app with the result of each.

## Git

Conventional commits on `feat/auth-book`. Do not merge or push; report the branch and the gate report.
