# Quire design system

Version 1.0, 28 October 2026. This document defines the tokens, themes, components and rules that
every Quire screen must follow. It is not a UI sketch; it is the contract the UI is built against.

## Approved local extension, 29 October 2026

The direction in [AUTH_ONBOARDING_BRIEF.md](AUTH_ONBOARDING_BRIEF.md) permits these bounded
exceptions to the catalogue defaults below. They supersede the general serif and radius
prohibitions only on the named surfaces. The six theme palettes and catalogue's 2px control /
3px container defaults remain.

- Authentication uses Newsreader italic for its brand, emphasized photographic-story title,
  and closing signature. Catalogue headings retain their existing typography.
- Auth fields, primary action, field errors, and sample-library link use the local
  `--auth-control-radius` (8px). Auth inputs and primary action are 52px high; field labels
  use sentence-case 13px sans. Local `--auth-story-surface`, `--auth-story-ink`, and
  `--auth-story-muted` color the story; `--auth-photo-credit-surface` backs the credit.
  These are local story colors, not another reader theme.
- Guide invitation, guide controls, header Guide control, and spotlight use 8px corners.
  The floating tour panel uses 12px corners. The surrounding shade highlights a real
  target; it does not establish shadow elevation or a new catalogue card style.
- Quick page-count preset buttons and star-rating touch surfaces use 8px corners and the
  existing 48px minimum touch target. Rating stars are inline SVG with 1.75 stroke weight.
- Auth, guide, and demo primary actions use ink fill with surface-colored text. The base
  primary remains theme-accent colored.
- Authentication uses a locally bundled real library photograph by Janko Ferlič from
  Unsplash. [Image sources](../public/images/SOURCES.md) and `public/images/library.webp.json`
  record provenance. Published covers and the single shared missing-cover image remain binding.

Root [DESIGN.md](../DESIGN.md) and [.impeccable/design.json](../.impeccable/design.json) record
the implemented system and these local exceptions without promoting them to global defaults.

## 1. What is fixed and what is a theme

Fixed for the whole product: the type scale, the spacing scale, the radii, the rule weights, the
icon grid, the component anatomy, and the accessibility gates.

Switchable by the reader: colour only. Three themes, each in a light and a dark mode. A theme changes
surface, ink, rule and accent. It never changes sizes, spacing, or layout.

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

## 3. Themes

| Theme | Character | Use when |
|---|---|---|
| `shelf` | neutral paper, colour comes from classification | default; the reader wants the books to carry the colour |
| `municipal` | green-grey stock, two inks, institutional | the reader wants a calmer, more archival surface |
| `oxford` | cool white, deep ink blue, academic | the reader wants maximum reading comfort on white |

Each ships two modes, selected with `data-theme` on `<html>`:

```html
<html data-theme="shelf-light">      <!-- also shelf-dark, municipal-light, -->
                                      <!-- municipal-dark, oxford-light, oxford-dark -->
```

Token files live in `design-systems/themes/<theme>-<mode>.css`.

### Measured contrast

Values below are WCAG relative luminance ratios, computed from the shipped token files.

| Theme | Mode | ink / surface | ink-muted / surface | on-accent / accent |
|---|---|---|---|---|
| shelf | light | 16.86 | 7.13 | 7.92 |
| shelf | dark | 16.69 | 7.84 | 4.83 |
| municipal | light | 14.59 | 7.31 | 6.49 |
| municipal | dark | 15.51 | 8.26 | 4.68 |
| oxford | light | 16.65 | 6.39 | 10.69 |
| oxford | dark | 16.45 | 8.24 | 7.37 |

Gate: body text at least 4.5:1, large text at least 3:1, in every shipped theme. A theme that fails
does not ship.

## 4. Colour roles

| Token | Job | Never used for |
|---|---|---|
| `--surface` | page background | text, icons |
| `--surface-raised` | cards, nav bar, inputs | full page background |
| `--ink` | body text, active icon, primary button fill | backgrounds larger than a button |
| `--ink-muted` | secondary text, metadata, inactive icons | text below 15px in a dark mode |
| `--rule` | 1px separators, input borders | text, fills |
| `--accent` | one primary action per screen (shelf and municipal differ: shelf uses the class 800 oxblood, municipal its rust, oxford its ink blue) | decoration, borders, icons repeated |
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

1. Contrast passes in all six theme modes (table in section 3).
2. Every interactive element is reachable by Tab, and focus is visible at 2px.
3. Touch targets are at least 48x48.
4. Icon-only controls carry an accessible name.
5. Every list has an empty state; every async screen has loading and error states.
6. Text reflows without horizontal scroll at 390px.

## 14. Adding a theme

1. Copy a theme file in `design-systems/themes/`, rename it `<name>-<mode>.css`.
2. Set the tokens listed in section 3. Change no other token.
3. Run the contrast script. If any ratio is under the gate, fix the palette, not the gate.
4. Add the theme to the table in this document with its measured ratios.
5. Render one screen in the new theme and check the six states of every interactive element.

A theme that needs a component changed is not a theme. It is a redesign and needs its own document.

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
[cover sources](../public/covers/SOURCES.md) for provenance. The single neutral missing-cover
SVG is shared by every book without artwork. Existing saved demo books gain the local cover
paths without resetting notes, ratings, or reading activity.

## Authentication and guide exceptions

The modern authentication and step-by-step guide extend the catalogue system locally.
Their implementation is recorded in [DESIGN.md](../DESIGN.md) and the
[surface brief](AUTH_ONBOARDING_BRIEF.md).

- Authentication fields, primary actions, field errors, and the demo entry use 8px corners.
- Guide invitation, controls, header Guide button, and spotlight use 8px corners; the tour
  panel uses 12px corners. Quick page presets and rating touch surfaces use 8px corners.
- Authentication uses Newsreader italic for its brand, emphasized story title, and closing
  signature. Catalogue headings retain their existing typography.
- The authentication story uses a local forest palette and sourced library photograph.
  Reader themes and catalogue classification colors retain their existing roles.

These exceptions take precedence over the general radius and serif restrictions above
only on these surfaces. Catalogue inputs and containers retain their 2px and 3px corners.
