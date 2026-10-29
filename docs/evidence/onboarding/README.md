# Authentication and guided tour verification

Verified locally on 2026-10-29. User direction: a modern, more interactive Quire experience,
real photography, real book covers, and a step-by-step screen tour.

## Checks

- PASS: `npm run gate`, 25 test files and 222 tests, typecheck, lint, build, and required docs.
- PASS: mechanical design detector returned `[]` on the updated UI.
- PASS: raster provenance scan found 10 rasters and no missing source records.
- PASS: sign-in and registration at widths 320, 390, 768, and 1280, with no horizontal overflow.
- PASS: all five tour steps at 320x720, 390x844, and 1280x900. Measured target/panel intersection
  was zero for every step at every size after placement corrections.
- PASS: existing demo data remains intact; tour preferences use separate per-account/demo keys.
- Independent finish review: `ship` for the supplied sign-in, registration, and guided-tour
  captures on desktop and mobile. No material fixes were requested.

Three existing specificity warnings remain in reading.css and shelf.css. Vite reports the
existing bundle-size advisory. Local Supabase is down, so the account database/E2E checks
were skipped; authentication behavior was tested with mocked clients, without sending emails.

## Interaction record

| Control or state | Observed result |
| --- | --- |
| Sign in / Create an account switch | Changes form, preserves the intended hash and other URL parameters |
| Show / Hide password | Toggles visibility with an accessible pressed state |
| Password strength | Updates labelled meter during registration |
| Repeat mismatch | Shows linked error and disables Create account; matching values enable it |
| Sign-in error / retry | Preserves field values and exposes the returned failure |
| Reset-link network failure | Reports a recoverable error; retry can succeed |
| Confirmation-required registration | Shows confirmation instructions instead of claiming a session exists |
| Take a quick tour | Opens the demo and starts the screen tour, without signing in |
| Try the interactive demo | Opens the sample library without an account |
| First-visit invitation / Maybe later | Can start or dismiss; no forced introduction |
| Guide in the app header | Replays the tour, including after completion |
| Next / Back | Visit the correct screen and highlight its real control |
| Tour step buttons on desktop | Jump directly to a chosen step |
| Skip tour / Escape | Close the guide, remember dismissal, and restore focus |
| Finish tour | Stores completion separately from books and reading data |
| Page-count shortcuts | Select 5, 10, or 25 pages within existing page-count limits |
| Log and Undo during the tour | Update and restore real demo progress while the guide remains open |
| Rating stars / Clear rating | Persist a chosen rating or clear it |
| Rating keyboard arrows | Native radio-group navigation changes the selected rating |
| Blocked storage | The guide can still open, skip, and close |

## Measured authentication contrast

Ratios use rendered foreground/background colors and WCAG relative luminance, including
the resolved secondary text color. All six palettes were checked.

| Theme | Input text | Secondary text |
| --- | ---: | ---: |
| Shelf light | 18.33 | 8.87 |
| Shelf dark | 15.40 | 9.21 |
| Municipal light | 15.52 | 8.45 |
| Municipal dark | 13.82 | 9.35 |
| Oxford light | 17.81 | 7.89 |
| Oxford dark | 15.21 | 9.48 |

The photographic credit uses a solid backing at 14.32:1. The story panel text is 11.85:1.
New controls retain 48px touch targets and visible focus. Reduced motion stops the busy
indicator and transition effects. The photo is real, locally bundled, and sourced under
the Unsplash License; see [photography sources](../../../public/images/SOURCES.md).

## Captures

- [Sign-in, desktop](signin-desktop.png)
- [Registration, desktop](signup-desktop.png)
- [Sign-in, mobile](signin-mobile.png)
- [Registration, mobile](signup-mobile.png)
- [Tour while logging, desktop](tour-desktop.png)
- [Tour while logging, mobile](tour-mobile.png)

Auth captures are full-page and begin at the document top. Tour captures show the current
viewport after the guide scrolls its real target into view. Motion was settled or disabled.

## Delivery gate

- Hard gate PASS: no generated book art, unsupported claims, dead controls, new external runtime
  image dependencies, mobile overflow, or unlabelled sample data. Validation, recovery, keyboard
  operation, six themes, build results, and real image sources are recorded above.
- Purpose gate PASS: the photograph establishes a reading space; solid dark green separates
  the story from the auth task. Rounded controls improve the new forms and guide without
  replacing the catalogue. The overlay identifies the currently explained control.
- Liveliness PASS: ENERGY 2 / RHYTHM 2 / MOTION 2. The photo, real books, and reading actions
  carry the page. Motion communicates pressed, loading, and step states and respects reduced motion.
- Craftsmanship PASS: forms keep their real account behavior, the guide runs on real screens,
  presets and stars change existing data, and sources, tests, screenshots, and limits are documented.
