# Auth cover opening, issue #63

The first visit begins with a cloth cover. Opening it reveals the existing borrower-card spread. On phones, the reading record is a printed bookplate in the same scrolling sheet.

Direction: `DESIGN.md` paper, ink, Newsreader, and the existing theme tokens, with the owner's precise cover brief. ENERGY 2 / RHYTHM 2 / MOTION 2. The cover is the focal point before opening; the reading-life headline leads the page afterward.

## Captures

Shelf light and Oxford dark each have captures at 320x640, 390x844, 768x900, and 1280x900:

- `*-cover-*.png`: first-visit cover, with its 2:3 desktop area.
- `*-open-*.png`: sheet after opening with Enter.
- `*-signin-*.png` and `*-signup-*.png`: both auth modes.
- `*-first-screen-390.png`: viewport-only proof that the running head, headline, email, password, and action are visible together.
- `*-first-screen.json`: measured bounds for those five elements. The action occupies y=424 to y=472 in the 844px viewport.
- `*-cover-*.json`: rendered cloth token, dimensions, hinge origin, and text contrast.
- `shelf-light-focus-1280.png`: visible keyboard focus.

## Click-through

| Element or path | Observed result |
| --- | --- |
| First-visit cover, click | Opens with the 480ms left-edge fold, then unmounts. The stored `quire:cover-seen` key prevents it from returning after reload. An existing empty value also skips it. |
| Cover, Tab and Enter | Tab reaches the cover. Enter opens it, focuses the auth heading, and the next Tab reaches Email. Enter also works without first tabbing. |
| Reduced motion | The actual `animationstart` event reports `auth-cover-fade`, 120ms, and no transform. The cover unmounts afterward. |
| Direct demo entry | Opens the existing demo tour, with no cover and no cover-seen key written. |
| Email, Password, primary Sign in | A real local account signs in. Empty submission focuses Email and exposes native required-field validation. Invalid credentials stay inline and permit retry. |
| Show, Hide | Enter switches the password input between visible text and password masking. |
| Forgot your password? | Empty email requests an address. A simulated recovery failure shows the existing error; retry shows the reset-link confirmation. |
| Create one, Sign in | Switches form mode, focuses the new heading, and persists the mode after reload while preserving unrelated query parameters and the hash. |
| Registration strength, Repeat | Weak, Fair, and Strong labels update. A mismatch describes the Repeat field, disables submission, and clears when corrected. Repeat remains optional. |
| Create account | Real local signup opens the first-run tour. The confirmation-required response retains its existing message. Pending auth disables fields and actions without moving the book. |
| Try the interactive demo | Navigates to `?demo=1#/today`. Next advances the real tour and Escape dismisses it. Returning through auth preserves the demo's saved reading log. |
| Sign out, Sign in | Returns to the auth page, signs in again, and preserves the existing tour replay behavior. |
| Denied local storage | Skips the cover and leaves authentication usable. Missing artwork still resolves to the shared placeholder. |

The browser suite covers both requested themes and all four requested sizes. Rendered text checks also exercise all six themes at 390 and 1280, including reset, error, mismatch, pending, and confirmation states. Auth mode captures collect console and page errors and require an empty error list.

The shared signed-in test fixture has one additional click to open the cover before its existing signup steps. It follows the real first-visit path; it does not bypass the product behavior.

## Design and delivery checks

- R-02 PASS: added UI copy contains no em dash; existing asserted auth copy is preserved.
- R-03 PASS: no horizontal overflow across the tested sizes; margins are 16px at 320 and 24px at 390. Actions remain 48px high with gaps of at least 8px. The links share one row at 390 and stack at 320.
- R-17 / R-18 / R-23 / R-36 / R-38 PASS: published artwork and the existing labeled demo record are preserved. No new imagery, statistics, testimonials, or product claims.
- R-24 / R-26 / R-35 PASS: every auth control is exercised in the click-through above; the demo destination and tour work.
- R-25 / R-34 PASS: `contrast.txt` records all page text, input, and placeholder checks above 7:1 in all six themes. Cover text measures 8.14:1 in Shelf light and 4.88:1 in Oxford dark. Dark cover ink uses the existing black jacket token because the theme's on-class ink falls below 4.5:1 on this cloth.
- R-27 PASS: native required validation, inline failures and retries, pending issuance, password mismatch, and confirmation states are exercised.
- R-28 PASS: no FAQ is introduced.
- R-32 PASS: cover and auth controls support keyboard operation and visible focus. The sheet is inert and hidden from the accessibility tree until the cover opens.
- R-33 PASS: behavior and styles are implemented directly in the auth components and CSS.
- R-37 PASS: the design follows the supplied brief and existing design system; its dials and purpose are recorded above.
- Purpose gate PASS: the single fold explains opening the book. The existing gutter gradient is the only shading. The 10x96px notched ribbon marks the page start. Monospace identifies printed metadata; Newsreader supplies the book's typographic voice. The bookplate's one-pixel frame and 12px inset remain flat on paper. There are no icons, badges, arrows, glass, glows, or floating cards.
- Liveliness PASS: the cloth cover, hinge, ribbon, running head, and bookplate provide the specific identity. Whitespace separates the headline, form, and reading record.
- Craftsmanship and quality locks PASS: the existing content determines the composition. Buttons and fields keep the existing small corners; themes remain selectable through the existing app. No new global design tokens or system changes are introduced.
- Mechanical design scan PASS: only three advisory type-ramp findings. The 34px phone title is explicitly required by the brief; 10px and 16px reading-record sizes are inherited. `design-scan.json` retains the scan output. `DESIGN.md` is unchanged because this is a local auth extension.

`gate-output.txt` records the full local gate, including unit tests, build, database smoke, and browser tests.
