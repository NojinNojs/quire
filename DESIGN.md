---
name: Quire
description: Paper and ink for a personal book catalogue and reading tracker.
colors:
  "municipal-dark-surface": "#14181a"
  "municipal-dark-surface-raised": "#1d2224"
  "municipal-dark-ink": "#edf0e8"
  "municipal-dark-ink-muted": "#a7b3af"
  "municipal-dark-rule": "#333b38"
  "municipal-dark-accent": "#d0614c"
  "municipal-dark-on-accent": "#14181a"
  "municipal-dark-class-800": "#c4575f"
  "municipal-dark-class-900": "#6e93c4"
  "municipal-dark-class-100": "#c7a34a"
  "municipal-dark-class-000": "#9a9a92"
  "municipal-dark-on-class": "#14181a"
  "municipal-light-surface": "#e7e9e2"
  "municipal-light-surface-raised": "#eff1ea"
  "municipal-light-ink": "#14181a"
  "municipal-light-ink-muted": "#3a4c55"
  "municipal-light-rule": "#b9beb2"
  "municipal-light-accent": "#a03526"
  "municipal-light-on-accent": "#f7f8f3"
  "municipal-light-class-800": "#8c2f39"
  "municipal-light-class-900": "#2b4a6f"
  "municipal-light-class-100": "#8a6a1f"
  "municipal-light-class-000": "#4a4a45"
  "municipal-light-on-class": "#ffffff"
  "oxford-dark-surface": "#0f1418"
  "oxford-dark-surface-raised": "#161d22"
  "oxford-dark-ink": "#eef2f4"
  "oxford-dark-ink-muted": "#a2afb6"
  "oxford-dark-rule": "#2c363c"
  "oxford-dark-accent": "#7fa6d9"
  "oxford-dark-on-accent": "#0f1418"
  "oxford-dark-class-800": "#c4575f"
  "oxford-dark-class-900": "#6e93c4"
  "oxford-dark-class-100": "#c7a34a"
  "oxford-dark-class-000": "#9a9a92"
  "oxford-dark-on-class": "#14181a"
  "oxford-light-surface": "#f6f7f5"
  "oxford-light-surface-raised": "#ffffff"
  "oxford-light-ink": "#101820"
  "oxford-light-ink-muted": "#505c65"
  "oxford-light-rule": "#d5d9d4"
  "oxford-light-accent": "#1f3a5f"
  "oxford-light-on-accent": "#f6f7f5"
  "oxford-light-class-800": "#8c2f39"
  "oxford-light-class-900": "#2b4a6f"
  "oxford-light-class-100": "#b0812e"
  "oxford-light-class-000": "#4a4a45"
  "oxford-light-on-class": "#ffffff"
  "shelf-dark-surface": "#121212"
  "shelf-dark-surface-raised": "#1b1b1a"
  "shelf-dark-ink": "#f2f2ee"
  "shelf-dark-ink-muted": "#a8a8a2"
  "shelf-dark-rule": "#33332f"
  "shelf-dark-accent": "#d0614c"
  "shelf-dark-on-accent": "#141412"
  "shelf-dark-class-800": "#c4575f"
  "shelf-dark-class-900": "#6e93c4"
  "shelf-dark-class-100": "#c7a34a"
  "shelf-dark-class-000": "#9a9a92"
  "shelf-dark-on-class": "#141412"
  "shelf-light-surface": "#f4f4f1"
  "shelf-light-surface-raised": "#fcfcfa"
  "shelf-light-ink": "#131313"
  "shelf-light-ink-muted": "#52524d"
  "shelf-light-rule": "#cacac3"
  "shelf-light-accent": "#8c2f39"
  "shelf-light-on-accent": "#fcfcfa"
  "shelf-light-class-800": "#8c2f39"
  "shelf-light-class-900": "#2b4a6f"
  "shelf-light-class-100": "#8a6a1f"
  "shelf-light-class-000": "#4a4a45"
  "shelf-light-on-class": "#ffffff"
  "auth-story-surface": "#173b32"
  "auth-story-ink": "#fafbf6"
  "auth-story-muted": "#d6e1d7"
  "auth-photo-credit-surface": "#132d26"
  "tour-shade": "rgb(6 15 12 / 56%)"
typography:
  title:
    fontFamily: "\"Plus Jakarta Sans\", system-ui, sans-serif"
    fontSize: "28px"
    lineHeight: "32px"
    fontWeight: 700
  book-title:
    fontFamily: "\"Newsreader\", Georgia, serif"
    fontSize: "22px"
    lineHeight: "28px"
    fontWeight: 400
  row-title:
    fontFamily: "\"Newsreader\", Georgia, serif"
    fontSize: "17px"
    lineHeight: "22px"
    fontWeight: 400
  body:
    fontFamily: "\"Plus Jakarta Sans\", system-ui, sans-serif"
    fontSize: "15px"
    lineHeight: "22px"
    fontWeight: 400
  small:
    fontFamily: "\"Plus Jakarta Sans\", system-ui, sans-serif"
    fontSize: "13px"
    lineHeight: "18px"
    fontWeight: 400
  label:
    fontFamily: "\"Plus Jakarta Sans\", system-ui, sans-serif"
    fontSize: "11px"
    lineHeight: "16px"
    letterSpacing: "0.08em"
  number:
    fontFamily: "ui-monospace, \"SF Mono\", Menlo, monospace"
    fontSize: "12px"
    lineHeight: "16px"
    fontWeight: 400
  auth-title:
    fontFamily: "\"Plus Jakarta Sans\", system-ui, sans-serif"
    fontSize: "clamp(28px, 3vw, 36px)"
    lineHeight: "1.2"
    letterSpacing: "-0.03em"
    fontWeight: 700
  auth-story-title:
    fontFamily: "\"Plus Jakarta Sans\", system-ui, sans-serif"
    fontSize: "clamp(32px, 3.5vw, 52px)"
    lineHeight: "1.1"
    letterSpacing: "-0.03em"
rounded:
  "input": "2px"
  "card": "3px"
  "band": "0px"
  "auth-control": "8px"
  "guide-control": "8px"
  "guide-panel": "12px"
  "reading-preset": "8px"
  "rating-touch": "8px"
spacing:
  "4": "4px"
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "24": "24px"
  "32": "32px"
  "48": "48px"
components:
  button-primary:
    height: "48px"
    backgroundColor: "{colors.shelf-light-accent}"
    textColor: "{colors.shelf-light-on-accent}"
    rounded: "{rounded.input}"
  auth-primary:
    height: "52px"
    width: "100%"
    backgroundColor: "{colors.shelf-light-ink}"
    textColor: "{colors.shelf-light-surface}"
    rounded: "{rounded.auth-control}"
  guide-primary:
    padding: "8px 16px"
    backgroundColor: "{colors.shelf-light-ink}"
    textColor: "{colors.shelf-light-surface}"
    rounded: "{rounded.guide-control}"
  guide-quiet:
    padding: "8px 16px"
    textColor: "{colors.shelf-light-ink}"
    rounded: "{rounded.guide-control}"
  catalog-input:
    padding: "8px 12px"
    width: "100%"
    backgroundColor: "{colors.shelf-light-surface-raised}"
    textColor: "{colors.shelf-light-ink}"
    rounded: "{rounded.input}"
  auth-input:
    padding: "12px 16px"
    height: "52px"
    width: "100%"
    backgroundColor: "{colors.shelf-light-surface-raised}"
    textColor: "{colors.shelf-light-ink}"
    rounded: "{rounded.auth-control}"
  reading-preset:
    padding: "8px"
    backgroundColor: "{colors.shelf-light-surface-raised}"
    textColor: "{colors.shelf-light-ink}"
    rounded: "{rounded.reading-preset}"
  tour-panel:
    padding: "16px 24px"
    backgroundColor: "{colors.shelf-light-surface-raised}"
    textColor: "{colors.shelf-light-ink}"
    rounded: "{rounded.guide-panel}"
  navigation:
    height: "64px"
    backgroundColor: "{colors.shelf-light-surface-raised}"
---
# Design System: Quire

## Overview

**Creative North Star: "The Reading Space"**

Quire is a considered reading space: paper surfaces, strong ink, italic book titles, and published cover artwork. Classification colors organize the collection while books carry its visual identity.

This records the current implementation. The catalogue retains compact, ruled forms. Authentication and the guide add local softer corners and a sourced library photograph, extending the existing system without changing its six reader-selectable themes.

**Key Characteristics:**

- Paper and ink with classification used as information.
- Plus Jakarta Sans UI, Newsreader italic book titles, and tabular monospace numbers.
- Flat catalogue furniture with bounded auth and guide exceptions.
- Real published covers and one shared missing-cover image.

## Colors

Shelf uses neutral paper and oxblood; Municipal uses green-grey stock and rust; Oxford uses cool paper and blue ink. Each has light and dark modes. Frontmatter names prefix each existing role with its theme and mode. Runtime values come from `src/styles/themes.css` through `data-theme`; these are recorded variants, not new global palette roles. Component frontmatter illustrates Shelf light; sidecar snippets use the active semantic CSS variables.

### Primary

Accent and on-accent supply the base primary action. Auth, guide, and demo actions use ink on surface. Active mobile navigation uses class-800. Classification colors convey filing categories rather than decoration.

### Neutral

Surface supplies the page, surface-raised supplies inputs and layered furniture, ink supplies primary text, ink-muted supplies supporting text, and rule supplies separators. The shell, auth, and active tour derive supporting ink through the existing shell-secondary-ink mix. Shell focus mixes accent with ink.

The auth story has a local forest surface, pale story ink, and muted story ink; its photo credit has its own dark backing. The guide's translucent shade belongs to its spotlight overlay. Neither becomes a reader theme.

**The Theme Roles Rule.** Keep surface, ink, rule, accent, and classification assignments semantic across all six themes.

## Typography

**UI Font:** Plus Jakarta Sans with system sans fallback. **Book Title Font:** Newsreader with Georgia serif fallback, italic. **Number Font:** ui-monospace with SF Mono and Menlo fallbacks.

Sans carries navigation, forms, and explanatory copy. Italic serif identifies book titles. Tabular monospace carries counts and edition metadata. Auth extends Newsreader italic to its brand, emphasized story title, and closing signature. This is a local story treatment.

### Hierarchy

Frontmatter records the observed title, book-title, row-title, body, small, label, and number roles. Auth headings use fluid sizing; story emphasis retains regular serif weight. Auth field labels use sentence case and the small role. Tour headings use the book-title size with sans; short-phone layouts reduce them to 18px/24px.

The declared display scale (44px/48px) remains in `tokens.css`; it is not promoted into a new display component. Existing shell brand and settings theme samples also use serif. These pre-existing exceptions do not expand the auth exception into a catalogue heading style.

## Layout

Spacing follows the source's seven-step scale, with a separate page gutter (20px). Catalogue content begins with a phone shell (390px). At 768px the bottom navigation becomes a side rail (72px); at 1280px the rail expands (200px) and content is bounded by the existing maximum (1120px). Today gains paired reading and logging areas on wider screens, with an additional 1024px rule.

Authentication is a single column on phones: a compact photograph (140px) introduces a form bounded at 420px. At 768px it becomes a full-height story/form grid with 0.9fr/1.1fr tracks. At 1200px its side padding increases to the largest spacing step.

The tour panel sits above mobile navigation, scrolls within the viewport, and uses a desktop width (360px) from 768px. Source measures the highlighted control and adjusts placement to keep it visible. A short-phone rule applies below 768px when viewport height is at most 740px.

## Elevation & Depth

There is no shadow elevation system. Raised surfaces, one-pixel rules, and ink contrast separate catalogue furniture. The guide uses a translucent shade around a bordered spotlight and a separately layered panel. Navigation, header, and skip-link retain existing layer tokens; tour backdrop and panel use layers 20 and 21.

Motion uses the source duration and easing. Auth primary actions move one pixel on hover/press, strength feedback changes width, and the working indicator pulses. Reduced-motion mode removes auth animation and transitions. Existing shell entry motion and navigation transitions remain as implemented.

## Shapes

Catalogue controls retain input corners; catalogue containers retain card corners; classification bands remain square. Cover frames use input corners and preserve artwork inside their boxes.

Approved local exceptions are precise: auth fields, primary action, field errors, and sample-library link use auth-control corners; guide invitation, guide controls, header Guide control, and spotlight use guide-control corners; the tour panel uses guide-panel corners; quick page amounts and rating touch surfaces use their corresponding local corners. The circular auth working dot is a status indicator, not a container shape.

**The Local Corners Rule.** Use larger corners only on the documented auth, guide, preset, and rating surfaces. Catalogue controls and containers retain their incumbent radii.

## Components

### Buttons

Base primary uses the theme accent pair and input corners. Auth uses a full-width ink primary (52px high), semibold type, and local corners. Disabled auth actions use raised surface, supporting ink, and a border. Guide primary uses ink on surface and a minimum touch height (48px); quiet actions underline on hover. Global focus is a two-pixel outline with a two-pixel offset; the shell substitutes its derived focus ink.

### Inputs / Fields

Catalogue fields use raised surface, an ink-muted one-pixel border, input corners, and minimum touch height. Auth fields are taller, with larger padding, local corners, sentence-case labels, and password visibility controls. Validation stays adjacent to the field; password strength uses text and a filled track.

### Chips

Quick page amounts are action presets with flexible equal widths, small text, and minimum touch height. Selected amounts reverse to ink fill and surface text. They change the amount before the existing logging action is submitted.

### Cards / Containers

The guide invitation is a ruled raised surface with wrapping actions. The tour panel uses local panel corners, supporting copy, Back/Next/Skip, and desktop progress. The auth sample-library link is a bordered raised entry with real cover images. Ordinary catalogue rows remain ruled rows.

### Navigation

Today, Shelf, and Search use icon-only mobile destinations with accessible names and a classification-colored active indicator. Desktop destinations reveal rail labels. Settings and the replayable Guide control live in the header. Current-page state uses ink and the implemented indicator/underline treatment.

### Cover and reading furniture

Published covers remain intact in source-defined row, Today, and shelf boxes. DDC classification stays outside artwork. The library photograph is the real Janko Ferlič Unsplash image bundled at `public/images/library.webp`, sourced in `public/images/SOURCES.md` and its adjacent JSON record. Cover provenance is in `public/covers/SOURCES.md`.

Rating uses five radio controls with inline SVG stars, cumulative filled selection, hover feedback, visible keyboard focus, a status message, and Clear rating.

**The Published Artwork Rule.** Use actual published covers. Every missing or failed cover resolves to the shared /covers/placeholder.svg.

## Do's and Don'ts

### Do:

- **Do** use active theme variables for interface surfaces, text, rules, and focus.
- **Do** preserve complete published covers with object-fit: contain in catalogue cover boxes.
- **Do** keep authentication photography locally bundled and attributed.
- **Do** retain visible focus, 48px touch targets, and reduced-motion behavior.
- **Do** keep the guide skippable and replayable while highlighting real controls.

### Don't:

- **Don't** extend auth story colors or serif treatment to ordinary catalogue headings.
- **Don't** apply 8px or 12px corners globally.
- **Don't** generate title-specific replacement covers or multiple missing-cover placeholders.
- **Don't** add shadow elevation, gradients, or backdrop blur to the catalogue.
