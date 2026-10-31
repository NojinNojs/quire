# Auth v2 evidence

The finished auth surface is a quiet entry to a private reading library, with published
jackets providing product context. This records the local implementation and its review.

## Direction and visual contract

- **Thesis:** make the account task clear while showing the reading library it opens.
- **World:** active-theme paper and ink, Newsreader italic, Plus Jakarta Sans UI, compact
  monospace labels, thin rules, and DDC strips beneath intact published covers.
- **Story:** preserve sign in, account creation, password reset, the interactive demo, and
  the skippable, replayable product tour.
- **First viewport:** at 960px and above, a 46% form workspace with a 400px maximum form
  faces a 54% cover wall. Twelve placements form four columns and three rows, with unequal
  jacket heights. Below 960px, the form comes first, followed by a clipped five-cover band
  that bleeds beyond both edges inside its overflow-hidden container.
- **Form:** code-led Operate surface; ENERGY 2 / RHYTHM 2 / MOTION 1. The primary action
  anchors the form. Whitespace separates entry copy, task, and account alternatives.
- **Finish:** the final reviewer returned **ship** after validating all nine screenshots,
  with no material fixes required. The UI detector returned `[]`.

## Tokens and component behavior

Source: [AuthForm.tsx](../../../src/features/auth/AuthForm.tsx),
[CoverWall.tsx](../../../src/features/auth/CoverWall.tsx),
[auth.css](../../../src/styles/auth.css), and [tokens.css](../../../src/styles/tokens.css).

| Decision | Implemented contract and purpose |
| --- | --- |
| Palette | `--surface`, `--ink`, `--rule`, and classification roles inherit all six themes; real jackets carry the image color. |
| Supporting ink | `--auth-secondary-ink` aliases `--shell-secondary-ink` for readable labels, placeholders, status copy, and the footnote. |
| Focus | `--auth-focus-ink` aliases `--shelf-class-800`; inputs gain a 2px bottom rule and buttons/links a 2px outline with 2px offset. |
| Intro and heading | Newsreader italic intro uses 34px/38px on desktop and existing 28px/32px below 960px; the task heading uses 20px sans. |
| Labels and footnote | Existing 10px/16px monospace roles identify field and borrower-card information without competing with the task. |
| Fields and submit | Transparent 44px inputs use 1px bottom rules and square corners; the full-width ink submit is 48px high with 3px corners. |
| Local measures | `--auth-heading-size`, `--auth-serif-size`, `--auth-serif-leading`, `--auth-column-width`, and `--auth-working-duration` stay scoped to auth. |
| Motion | A 1px issuing rule signals pending work; strength changes width. Reduced motion removes these animations/transitions. |
| Cover treatment | Existing jacket measures and 2px classification strips connect auth to the shelf; no shadow elevation or new artwork. |

The 10px monospace privacy line uses supporting ink at full opacity. This deliberately
replaces the brief's 55% opacity because the required text contrast of at least 7:1 takes
precedence. The automated contrast check includes the footnote, nested demo link, input
text/placeholders, errors, strength labels, pending controls, and primary hover in all six
themes. No exact minimum ratio is claimed beyond the tested floor.

`?auth=signup` survives reload; switching modes preserves unrelated query values and the
hash route, retains email/password, and focuses the new heading. A successful session
removes the auth query. Signup retains optional repeat-password checking, live strength,
mismatch feedback, confirmation-email status, and retry feedback. Password visibility,
busy states, and password-reset feedback remain available. The demo link opens
`?demo=1#/today` and keeps the existing tour behavior.

## Captures and validation

All captures are full-page images after fonts and cover decoding settle. The final review
validated the complete set, including the narrow signup layout.

| Theme / width | Sign in | Create account |
| --- | --- | --- |
| Shelf light / 1280 | [PNG](shelf-light-signin-1280.png) | [PNG](shelf-light-signup-1280.png) |
| Shelf light / 390 | [PNG](shelf-light-signin-390.png) | [PNG](shelf-light-signup-390.png) |
| Oxford dark / 1280 | [PNG](oxford-dark-signin-1280.png) | [PNG](oxford-dark-signup-1280.png) |
| Oxford dark / 390 | [PNG](oxford-dark-signin-390.png) | [PNG](oxford-dark-signup-390.png) |
| Shelf light / 320 | | [PNG](shelf-light-signup-320.png) |

[Gate output](gate.txt): **pass**, with 222 unit tests, 16 end-to-end tests, typecheck,
production build, and live database smoke checks completed. Required checks were not
skipped. [Auth end-to-end coverage](../../../tests/e2e/auth.spec.ts) verifies real account
creation/signout/signin, tour skip/replay, reset and error states, keyboard order and focus,
password visibility, six-theme contrast, and widths 320, 390, 768, 960, 1024, and 1440.
Layout checks require no document overflow and the submit inside the tested viewport.
The gate retains three pre-existing CSS specificity warnings in reading/shelf styles and
the existing bundle-size warning above 500kB.

## Provenance and scope

No assets were created. Nine existing published covers supply twelve wall placements;
[cover provenance](../../../public/covers/SOURCES.md) records their sources. The wall is
decorative (`aria-hidden` with empty image alternatives); the form remains the task.

This handoff writes only this evidence README. Existing user-modified
[BRIEF.md](../../../BRIEF.md) remains untouched. [PRODUCT.md](../../../PRODUCT.md) remains
the product authority. [DESIGN.md](../../../DESIGN.md), `.impeccable/design.json`, and
[the earlier auth brief](../../AUTH_ONBOARDING_BRIEF.md) retain pre-existing auth drift:
photography, the old split, fluid headings, and taller rounded controls no longer describe
this surface. Global design-document refresh is outside this task's write boundary.

[Antislop delivery gate](delivery-gate.md): **PASS** for every required item, with
specific evidence. [Mechanical detector output](detector.json): no findings.
