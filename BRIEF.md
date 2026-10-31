antislop active: during (global preference). Do not stop to ask.

# Task: sign in and sign up worth looking at (#57) (branch feat/auth-v2)

Worktree: this directory, base `main`. Read `docs/AUTH_ONBOARDING_BRIEF.md` for the current contract, then
replace its visual direction with the one below. Keep every behaviour: sign in, sign up, reset link,
strength and mismatch, demo entry, first-run tour, keyboard path, `?auth=signup`.

You own `src/features/auth/**`, `src/styles/auth.css`, `src/features/demo/DemoSearch.tsx` only if a link
needs rewording, and `tests/e2e/auth.spec.ts`. Do not touch `src/features/nav/**`, `src/features/shelf/**`,
`src/features/reading/**`, `src/lib/**`, `package.json`.

## The verdict

The owner says the current page is still not good and has no references. So: stop imitating a SaaS login.
Three references to borrow from, and what exactly to borrow:

- **Readwise**: the quiet. One narrow column, a large serif line, no card, no shadow, small print at the foot.
- **Airbnb**: the split. One side is the product itself, not a stock photo of a library.
- **Linear**: the restraint. Nothing decorative that is not doing a job.

## The direction

**Delete the photograph and the floating white card.** The page is paper from edge to edge, the form sits
directly on it, and the product becomes the artwork: a wall of the real covers already bundled in
`public/covers/` (bumi, histories, laut, meditations, origin, pride, and the rest), standing on thin shelf
rules with their class colours as spines. No stock photo, no rounded card, no shadow.

Desktop (>= 960px): two columns, 46/54. Left: form. Right: the cover wall, 4 columns of jackets of
unequal height, each standing on a 1px rule, the rules running the full column width, a 2px class colour
strip at the foot of each jacket. The wall is decorative but real: `aria-hidden="true"`, images with empty
alt, and no more than 12 covers so it stays cheap.

Mobile (< 960px): the form first, comfortable margins, then a single horizontal band of 5 covers bleeding
to both edges below the form, half cut by the viewport, clipped with `overflow: hidden`. The band must not
push the submit button below the fold.

## The form

- A serif line at the top: `A home for your reading life.` at 34/38 on desktop, 28/32 on mobile. Below it,
  one small mono line: `BORROWER CARD · QUIRE`.
- Heading `Sign in` / `Create an account` in sans, 20px, not competing with the serif line.
- Fields: label in mono 10px tracked, input with a 1px bottom rule, 44px tall, focus grows the rule to 2px
  in the class colour, error text under the field with a 1px left rule.
- Primary button: full width of the column, 48px, ink fill, 3px radius. Pending prints
  `Signing in...` / `Creating account...` with a 1px moving rule.
- Under the button: `Forgot your password?` on the left and `No account yet? Create one` on the right, in
  one row on desktop, stacked on mobile.
- Then one quiet line, not a box: `Or look around first: try the interactive demo.` The demo link keeps its
  behaviour (`?demo=1#/today`).
- Foot of the column, 10px mono, 55% ink: `Your shelf is private. One account, one library.`

## Rules

- Tokens only, radius at most 3, English copy, no em dash, contrast at least 7:1 in all six themes for
  every text element you render, including the foot line.
- 320, 390, 768, 1024, 1440 with no horizontal scroll.
- Tests: `tests/e2e/auth.spec.ts` must pass on the new markup (update selectors honestly, do not weaken the
  contrast check: it must still sample every text element in the form column and the foot line).
- `npm run gate` must pass.

## Evidence

`docs/evidence/auth-v2/` with screenshots of sign in and sign up at 390 and 1280 in shelf-light and
oxford-dark, one 320px shot, and the gate output.

## Git

Conventional commits on `feat/auth-v2`. Do not merge or push; report the branch.
