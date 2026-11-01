# Quire design system

Version 1.0, 28 October 2026. This document defines the tokens, themes, components and rules that
every Quire screen must follow. It is not a UI sketch; it is the contract the UI is built against.

## Approved local extension, 29 October 2026

The direction in [the authentication brief](../briefs/auth-onboarding.md) permits these bounded
exceptions to the catalogue defaults below. They supersede the general serif and radius
prohibitions only on the named surfaces. Shelf light is the sole runtime palette; catalogue's 2px control /
3px container defaults remain.

- Authentication uses a borrower card set in an open book, with Newsreader italic for the
  introductory line and book titles. Catalogue headings retain their existing typography.
- The form uses ruled inputs and an ink-filled primary action. Controls are 48px high,
  reducing to 44px on short viewports. A facing page shows the demo reading record on wider
  screens; on narrow screens the form takes priority.
- Guide invitation, guide controls, header Guide control, and spotlight use 8px corners.
  The floating tour panel uses 12px corners. The surrounding shade highlights a real
  target; it does not establish shadow elevation or a new catalogue card style.
- Quick page-count preset buttons and star-rating touch surfaces use 8px corners and the
  existing 48px minimum touch target. Rating stars are inline SVG with 1.75 stroke weight.
- Auth, guide, and demo primary actions use ink fill with surface-colored text. The base
  primary remains theme-accent colored.

Root [DESIGN.md](../../DESIGN.md) and [.impeccable/design.json](../../.impeccable/design.json) record
the implemented system and these local exceptions without promoting them to global defaults.

## 1. What is fixed and what is a theme

Fixed for the whole product: the type scale, the spacing scale, the radii, the rule weights, the
icon grid, the component anatomy, and the accessibility gates.

Shelf light is the only runtime theme. Its semantic roles supply surface, ink, rule and accent across screens.

## 2. Token architecture

Three tiers, and a value may only flow one way:

| Tier | Example | Rule |
|---|---|---|
| Primitive | `#8C2F39`, `16px`, `1.75` | raw values live only in the theme files |
| Semantic | `--surface`, `--ink-muted`, `--rule`, `--class-800` | named for the job, never for the colour |
| Component | `--nav-height`, `--cover-medium-width` | only what a component cannot derive from a semantic token |

Rules:

1. A component may reference semantic and component tokens, never a hex value.
2. Semantic tokens are named by role, not appearance. `--ink-muted`, never `--grey`.
3. Every new token needs a line in this document saying what it is for. A token without a stated job
   gets deleted at review.
4. Tokens never carry state in their name. `--button-pressed` is forbidden; states are composed in
   the component from `--ink`, `--surface-raised` and `--rule`.

## 3. Theme

Shelf light uses neutral paper and ink, with classification colors providing accents. Its fixed runtime tokens live on `:root` in `src/styles/themes.css`; Settings has no palette selector.

Body text must meet 4.5:1 contrast and large text 3:1. Authentication tests sample rendered text and controls, including error and pending states.

## 4. Colour roles

| Token | Job | Never used for |
|---|---|---|
| `--surface` | page background | text, icons |
| `--surface-raised` | cards, nav bar, inputs | full page background |
| `--ink` | body text, active icon, primary button fill | backgrounds larger than a button |
| `--ink-muted` | secondary text, metadata, inactive icons | text with insufficient contrast |
| `--rule` | 1px separators, input borders | text, fills |
| `--accent` | one primary action per screen, using shelf's class 800 oxblood | decoration, borders, icons repeated |
| `--on-accent` | text on the primary action | anything else |
| `--class-800/900/100/000` | classification bands and spine strips | book jackets |
| `--on-class` | text on a classification band | body text |

One accent per screen. If a screen has two filled buttons, one of them is in the wrong role.

## 5. Type scale

| Role | Token | Size / leading | Weight | Family |
|---|---|---|---|---|
| Display | `--display-*` | 44 / 48 | 700 | sans |
| Page title | `--title-*` | 28 / 32 | 700 | sans |
| Book title | `--book-title-*` | 22 / 28 | 400 italic | serif |
| Body | `--body-*` | 15 / 22 | 400 | sans |
| Secondary | `--small-*` | 13 / 18 | 400 | sans |
| Label | `--label-*` | 11 / 16, `0.08em`, uppercase | 500 | sans |
| Number | `--mono-*` | 12 / 16, tabular figures | 400 | mono |

Rules: body never below 15px. Labels are the only uppercase text. Numbers in columns and rows use
`font-variant-numeric: tabular-nums`. The serif italic is used for book titles and nothing else.

## 6. Spacing

`4, 8, 12, 16, 24, 32, 48`, exposed as `--space-4` to `--space-48`.

| Use | Value |
|---|---|
| Page gutter | 20 |
| Card padding | 16 |
| Gap between sections | 24 |
| Gap between rows inside a card | 12 |
| Gap between icon and its label | 8 |
| Minimum gap between unrelated elements | 8 |

No value off this scale may appear in a stylesheet, including inside inline `style` attributes.

## 7. Radius, rules, elevation

| Element | Radius |
|---|---|
| Band, image flush to an edge, cover | 0 to 1 |
| Input, select, button | 2 |
| Card, sheet | 3 |

Nothing above 3. Separators are always 1px `--rule`. There is no shadow system: depth is expressed by
`--surface-raised` against `--surface`, never by blur.

## 8. Classification colours

DDC classes map to four tokens, used as a 44px band or a 10px spine strip:

| Token | Class | Meaning |
|---|---|---|
| `--class-000` | 000 | general, reference |
| `--class-100` | 100 | philosophy, psychology |
| `--class-800` | 800 | literature |
| `--class-900` | 900 | history, geography |

The colour is a filing system, not decoration. Published cover artwork keeps its original colors.

## 9. Covers

Use images of the actual published book covers. User direction on 2026-10-29 replaces the
previous generated cloth-jacket fallback.

- Prefer uploaded cover photographs, then the catalogue or bundled cover image.
- Missing and failed covers use the same `/covers/placeholder.svg` image across the app.
- Never invent or generate a replacement cover for an individual title.
- Preserve the full cover with `object-fit: contain`; captions identify the title and edition.
- Keep existing cover box dimensions and the DDC grouping outside the cover artwork.

## 10. Icons

One set, drawn on a 24px grid, 1.75 stroke, square caps, miter joins, `fill: none`.

- Sizes: 22 (navigation), 20 (inline), 16 (inside a button).
- Icon-only controls are allowed only when the meaning is unambiguous: navigation, back, settings,
  camera, search. Each carries an `aria-label` and a `title`.
- Never an icon font. Never an emoji. Never a second stroke weight in the same screen.

## 11. Component contracts

Each component below lists its anatomy, its sizes and its states. A component without all six states
is incomplete: rest, hover, focus, pressed, disabled, error.

### Button, primary
Full width, 48 height, radius 2, `--ink` fill, `--on-accent` label, 15px sans. One per screen.

### Button, quiet
Text only, 44 height, underline on hover, `--ink`. Used for back and inline actions.

### Top bar
Height 56. Brand left, one icon action right. 1px `--rule` underneath. Same on every screen.

### Bottom navigation
Height 64 plus safe area. Three icon-only links, 48px targets, equal columns. Active item: 3px inset
rule in `--class-800` and full-ink icon. Inactive: `--ink-muted`.

### Book row
Cover `48x72`, gap 16, title serif italic 17, meta 12 mono muted, status right aligned in 11px
uppercase. 1px rule between rows, 16 padding, no card, no radius.

### Classification band
Full width, 44 height, `--class-*` fill, `--on-class` text, class number right aligned in mono. One
per group.

### Input and select
Height 44, radius 2, 1px `--rule`, `--surface-raised` fill, label above in 11px uppercase. Select
draws its own chevron in CSS. Focus ring 2px `--ink`, offset 2.

### Rating
Five 44px targets, star glyphs at 20px, `--ink` when filled, `--rule` when empty. No half stars.

### Empty state
One sentence, one action, centred, 48px of vertical padding. Same pattern on every list.

## 12. Motion

`--motion-duration: 120ms`, easing `cubic-bezier(0.4, 0, 0.2, 1)`. Allowed: opacity, 1px translate,
progress width. Forbidden: bounce, scale above 1.02, parallax. Under
`prefers-reduced-motion: reduce` every duration becomes 0.

## 13. Accessibility gates

Ship only when all of these are true, measured rather than assumed:

1. Contrast passes in the shipped light theme, including error and pending states.
2. Every interactive element is reachable by Tab, and focus is visible at 2px.
3. Touch targets are at least 48x48.
4. Icon-only controls carry an accessible name.
5. Every list has an empty state; every async screen has loading and error states.
6. Text reflows without horizontal scroll at 390px.

## 14. Changing the palette

The current palette is fixed in `src/styles/themes.css`. Replacing it requires measured contrast, responsive checks, and a documented design decision; Settings does not expose a theme switcher.


## 15. Forbidden

Gradients. `backdrop-filter`. Glow. Radius above 3. Shadow as elevation. A second accent colour. An
icon set with a different stroke weight. Hex values inside a component. Colour tokens named after
colours. Em dash in any copy. Numbers without a source. Slogans on app screens.

## 16. Verification

Two scripts enforce this without opinion:

- `scripts/quire_consistency.py` checks the spacing scale, radii above 3, icon-only navigation,
  slogan strings and em dashes.
- `scripts/quire_verify.py` checks every link target, the bottom navigation, the removal of
  `outline: none`, and the contrast of `--ink` and `--ink-muted`.

Both must pass before a screen is called finished.

## 17. Catalogue metrics

`--cover-row-width` and `--cover-row-height` hold the 48 by 72 row cover box.
`--row-title-size` holds the 17px serif italic title in a catalogue row.

## Bundled demo covers

The demo bundles nine verified published covers as WebP files. See
[cover sources](../../public/covers/SOURCES.md) for provenance. The single neutral missing-cover
SVG is shared by every book without artwork. Existing saved demo books gain the local cover
paths without resetting notes, ratings, or reading activity.

## Authentication and guide exceptions

The modern authentication and step-by-step guide extend the catalogue system locally.
Their implementation is recorded in [DESIGN.md](../../DESIGN.md) and the
[surface brief](../briefs/auth-onboarding.md).

- Authentication uses ruled fields, an ink-filled action, and a facing demo reading record.
  Its compact layout keeps the form prominent on phones and short screens.
- Guide invitation, controls, header Guide button, and spotlight use 8px corners; the tour
  panel uses 12px corners. Quick page presets and rating touch surfaces use 8px corners.

These exceptions take precedence over the general radius and serif restrictions above
only on these surfaces. Catalogue inputs and containers retain their 2px and 3px corners.
