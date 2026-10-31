antislop active: during (global preference). Do not stop to ask.

# Task: the whole page is a borrower's card (#59) (branch feat/auth-card)

Worktree: this directory, base `main`. Work in `src/features/auth/**`, `src/styles/auth.css`, and
`tests/e2e/auth.spec.ts` only. Do not touch `src/features/nav/**`, `src/features/shelf/**`,
`src/features/reading/**`, `src/lib/**`, `package.json`.

## Why

The owner keeps rejecting the sign-in page and now says: make it the best, the most unusual, different from
everyone else. Drop the photograph, the cover wall and the floating panel entirely.

## The direction: the page is the card

Not "a card on a page". The **whole sign-in surface is one catalogue card**, the kind a librarian typed a
borrower's name onto. Everything else is the desk it lies on.

- Canvas: `--canvas` paper. The card is flush with a 1px frame, 2px radius, no shadow, no gradient.
- Card grid: a 32px baseline. Every rule lands on a baseline; every form row is one or two baselines tall, so
  the type sits **on** the ruled lines the way a typewriter would.
- Head of the card: left, mono 10px tracked `QUIRE` over `BORROWER CARD`; right, mono `NO. 0001` with a class
  colour hairline under it. The number is cosmetic, never stored.
- The stamp: top-right, rotated -6deg, a 1px ring with `QUIRE` inside, in the class colour, drawn as inline
  SVG so it stays crisp, with two faint hairlines for grain. It presses down 1px over 120ms when submitting.
- Fields: mono label above the rule, input on the rule with no box, focus thickens the rule to 2px in the
  class colour. Placeholder in mono, muted but at least 4.5:1.
- Primary action: solid ink bar the width of the inner column, 3px radius, 48px tall. Pending prints
  `Issuing card` and the rule under the label animates.
- Foot strip of the card: `No account yet? Create one` left, `Forgot your password?` right, both 44px targets.
- Sign up: same card, second stamp reading `NEW CARD`, one extra ruled row for the repeat password plus the
  strength line (text + filling rule, never colour alone).
- Mobile: the card is full-bleed, the frame becomes top and bottom rules only, rules run edge to edge.
- One unique detail, and only one: bottom-left of the card prints the class numbers the app actually uses
  (`100 500 800 900`) in 9px mono with class-coloured dots. Signature, not decoration. Add nothing else.

## Keep

Every behaviour: `signInWithPassword`, `signUp`, `resetPasswordForEmail`, `?auth=signup`, the demo link, the
tour hook, keyboard order, error strings, `aria` wiring.

## Rules

- No new palette; local custom properties are fine.
- Radius at most 3, English copy, no em dash, contrast at least 7:1 for every text element in all six themes.
- 320, 390, 768, 1024, 1440 with no horizontal scroll.
- Update `tests/e2e/auth.spec.ts` to the new markup without weakening an assertion; keep the contrast sweep
  sampling every text element.
- `npm run gate` must pass.

## Evidence

`docs/evidence/auth-card/` with sign in and sign up at 390, 768, 1280 in shelf-light and oxford-dark, one 320
shot, the focus state, and the gate output.

## Git

Conventional commits on `feat/auth-card`. Do not merge or push; report the branch.
