# Borrower card, issue #59

Branch: `feat/auth-card`. The authentication surface is one framed catalogue card. The
only surrounding surface is the active theme's raised paper. On phones, the card fills
the viewport width and retains only its top and bottom frame rules.

The 32px baseline structures the header, 64px field rows, strength rule, and action row.
Typewriter text sits just above the rules. The class ink is mixed with the existing theme
ink so stamp text clears 7:1 in dark themes as well as light themes. The printed number
is literal presentation text; authentication never reads or stores it.

## Captures

| Theme | Width | Sign in | Sign up |
| --- | --- | --- | --- |
| Shelf light | 390 | [Image](shelf-light-signin-390.png) | [Image](shelf-light-signup-390.png) |
| Shelf light | 768 | [Image](shelf-light-signin-768.png) | [Image](shelf-light-signup-768.png) |
| Shelf light | 1280 | [Image](shelf-light-signin-1280.png) | [Image](shelf-light-signup-1280.png) |
| Oxford dark | 390 | [Image](oxford-dark-signin-390.png) | [Image](oxford-dark-signup-390.png) |
| Oxford dark | 768 | [Image](oxford-dark-signin-768.png) | [Image](oxford-dark-signup-768.png) |
| Oxford dark | 1280 | [Image](oxford-dark-signin-1280.png) | [Image](oxford-dark-signup-1280.png) |

Also captured: [320px registration](shelf-light-signup-320.png) and
[keyboard focus on the email rule](shelf-light-focus-1280.png).

Screenshots are full-page captures. Short viewports can scroll vertically to reach
supporting links; the primary action remains visible at all tested widths, including
320px with a 640px viewport height.

## Validation

`npm run gate` passed with 222 unit tests, database smoke checks, and 19 browser tests.
The complete [gate output](gate-output.txt) includes the successful auth browser tests.
Existing CSS specificity warnings in reading/shelf and the existing build chunk-size
warning remain outside this change's scope. No checks were skipped.

`tests/e2e/auth.spec.ts` verifies 320, 390, 768, 960, 1024, and 1440px with no horizontal
scroll, a 48px primary action within the viewport, exact baseline positions, mobile
edge-to-edge field rules, the frame, stamp count and grain, class numbers, and 44px
secondary targets. It also verifies the 1px stamp press, -6 degree rotation, 120ms
transition, non-scaling 1px SVG stroke, and the animated issuing rule. Reduced motion
disables the animation and stamp transition.

The contrast sweep walks every rendered text node across the entire card, including
SVG text and nested links, then samples every input and placeholder. It asserts at
least 7:1 in shelf, municipal, and oxford, both light and dark, across sign in, reset
validation/success, sign-in error/pending, registration strength/mismatch, primary
hover, registration pending, and confirmation. Explicit coverage assertions include
both QUIRE labels, the card number, NEW CARD, all four class numbers, the demo link,
and the retained privacy footnote.

The [antislop delivery report](delivery-gate.md) records design and interaction checks.
The Impeccable detector returned no findings in [detector.json](detector.json).

## Interaction record

| Control or state | Verified result |
| --- | --- |
| Email/password | Native required fields; existing email/password arguments reach Supabase unchanged. |
| Sign up | A real local account opens the first-run tour; generated account is removed afterward. |
| Sign out / sign in | Protected content disappears; signing in returns to the deep-linked route. |
| Create one / Sign in | Changes mode, preserves hash and unrelated query parameters, focuses the heading, and survives reload. |
| Show / Hide | Enter toggles the password type and pressed state. |
| Repeat | Remains optional; mismatch links the alert to the field and prevents submission. |
| Password strength | Weak, Fair, and Strong text accompanies the filling rule. |
| Forgot your password? | Missing email shows the retained alert; a reset response prints the retained success text; unit tests verify network failure and retry. |
| Failed sign in | Existing server/network messages remain inline; Try again permits another request. |
| Pending registration | Issuing card disables submission; both stamps press 1px; the card does not move; confirmation restores controls. |
| Demo | Existing `?demo=1#/today` link opens the interactive demo and tour. |
| Tour | Next changes the tour step, Escape closes it, and Guide reopens it. |
| Keyboard | Email, password, Show, submit, reset, mode switch, demo retain their original tab order and visible focus. |
| Console | All six screenshot scenarios record no browser console errors or uncaught page errors. |
