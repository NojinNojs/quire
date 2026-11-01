---
name: Quire
description: Paper and ink for a personal book catalogue and reading tracker.
colors:
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

The catalogue retains compact, ruled forms. Authentication presents a borrower card in a physical open book on a warm light desk. Shelf light is the only runtime theme.

**Key Characteristics:**

- Paper and ink with classification used as information.
- Plus Jakarta Sans UI, Newsreader italic book titles, and tabular monospace numbers.
- Flat catalogue furniture with bounded auth and guide exceptions.
- Real published covers and one shared missing-cover image.

## Colors

Shelf light uses neutral paper and oxblood. Runtime semantic values come from `src/styles/themes.css`; classification colors help books carry the visual identity.

### Primary

Accent and on-accent supply the base primary action. Auth, guide, and demo actions use ink on surface. Active mobile navigation uses class-800. Classification colors convey filing categories rather than decoration.

### Neutral

Surface supplies the page, surface-raised supplies inputs and layered furniture, ink supplies primary text, ink-muted supplies supporting text, and rule supplies separators. The shell, auth, and active tour derive supporting ink through the existing shell-secondary-ink mix. Shell focus mixes accent with ink.

Authentication uses warm light desk and paper tones to frame the open book. A defined spine, page edges and restrained shadow give the pages physical depth, while space above and below separates the book from the viewport. The guide's translucent shade belongs to its spotlight overlay.

On narrow screens, the borrower card becomes an inset pocket book on the same warm desk. Its paper edge and restrained shadow distinguish the reading surface; the ruled account and demo groups keep secondary actions separate from the ink primary. Compact heights reduce margins rather than the 48px mobile controls. Newsreader keeps the book's editorial voice, while the existing monospace running head and labels recall library furniture. Authentication uses ENERGY 2 / RHYTHM 2 / MOTION 2.

**The Theme Roles Rule.** Keep surface, ink, rule, accent, and classification assignments semantic in shelf light.

## Typography

**UI Font:** Plus Jakarta Sans with system sans fallback. **Book Title Font:** Newsreader with Georgia serif fallback, italic. **Number Font:** ui-monospace with SF Mono and Menlo fallbacks.

Sans carries navigation, forms, and explanatory copy. Italic serif identifies book titles and the authentication introduction. Tabular monospace carries counts and edition metadata.

### Hierarchy

Frontmatter records the observed title, book-title, row-title, body, small, label, and number roles. The authentication introduction uses a fluid italic serif and compacts to 24px on short screens; its ruled fields use small monospace labels. Tour headings use the book-title size with sans; short-phone layouts reduce them to 18px/24px.

The declared display scale (44px/48px) remains in `tokens.css`; it is not promoted into a new display component. Existing shell brand also uses serif.

## Layout

Spacing follows the source's seven-step scale, with a separate page gutter (20px). Catalogue content begins with a phone shell (390px). At 768px the bottom navigation becomes a side rail (72px); at 1280px the rail expands (200px) and content is bounded by the existing maximum (1120px). Today gains paired reading and logging areas on wider screens, with an additional 1024px rule.

Authentication uses a borrower-card form in an open book, with a demo reading record on the facing page on wider screens. The spine separates the form from the record; editorial typography makes the introduction and form easy to scan. On narrower screens the form takes priority. The composition keeps controls reachable without page scroll at supported viewport sizes.

Before opening on desktop, a short introduction sits directly on the desk to the left of the closed book. Only the closed book casts a shadow: the empty left half must not look like a blank card. The cover's front and paper inside face share a fixed spine; the login page is revealed as part of that opening rather than replacing a red panel at the end.

The tour panel sits above mobile navigation, scrolls within the viewport, and uses a desktop width (360px) from 768px. Source measures the highlighted control and adjusts placement to keep it visible. A short-phone rule applies below 768px when viewport height is at most 740px.

## Elevation & Depth

There is no shadow elevation system. Raised surfaces, one-pixel rules, and ink contrast separate catalogue furniture. The guide uses a translucent shade around a bordered spotlight and a separately layered panel. Navigation, header, and skip-link retain existing layer tokens; tour backdrop and panel use layers 20 and 21.

The auth form enters over 240ms, primary actions use an outline on hover and press, and strength feedback changes width. The working indicator moves while a request is pending. Reduced-motion mode removes form and control transitions and uses a short cover fade. Existing shell entry motion and navigation transitions remain as implemented.

## Shapes

Catalogue controls retain input corners; catalogue containers retain card corners; classification bands remain square. Cover frames use input corners and preserve artwork inside their boxes.

Auth fields are ruled and square, while the ink-filled primary action retains the input radius. Guide invitation, guide controls, header Guide control, and spotlight use guide-control corners; the tour panel uses guide-panel corners; quick page amounts and rating touch surfaces use their corresponding local corners.

**The Local Corners Rule.** Use larger corners only on the documented guide, preset, and rating surfaces. Catalogue controls and containers retain their incumbent radii.

## Components

### Buttons

Base primary uses the theme accent pair and input corners. Auth uses a full-width ink primary, 48px high on mobile or 44px on compact-height desktop screens, with an outline on hover and focus. Guide primary uses ink on surface and a minimum touch height (48px); quiet actions underline on hover. Global focus is a two-pixel outline with a two-pixel offset; the shell substitutes its derived focus ink.

### Inputs / Fields

Catalogue fields use raised surface, an ink-muted one-pixel border, input corners, and minimum touch height. Auth fields use transparent, ruled inputs with monospace labels and a password visibility control. Validation stays adjacent to the field; password strength uses text and a filled track.

### Chips

Quick page amounts are action presets with flexible equal widths, small text, and minimum touch height. Selected amounts reverse to ink fill and surface text. They change the amount before the existing logging action is submitted.

### Cards / Containers

The guide invitation is a ruled raised surface with wrapping actions. The tour panel uses local panel corners, supporting copy, Back/Next/Skip, and desktop progress. The authentication demo link opens the interactive demo; its facing page displays a published cover and sample reading record on wider screens. Ordinary catalogue rows remain ruled rows.

### Navigation

Collection is the default destination, with Today and Add book alongside it. Mobile keeps all three labelled and reachable; desktop uses a rail. Settings and the replayable Guide remain in the header. Book details live at `#/book/<id>`.

### Cover and reading furniture

Published covers remain intact in source-defined row, Today, shelf, and authentication reading-record boxes. DDC classification stays outside artwork. Cover provenance is in `public/covers/SOURCES.md`.

### Collection and catalogue direction

Dial: ENERGY 2 / RHYTHM 2 / MOTION 1. Warm paper `#f8f3e8`, desk `#d6c9b5`, dark ink, and burgundy connect the dashboard to authentication. Newsreader gives collection headings and book titles an editorial voice; Plus Jakarta Sans keeps controls readable. Compact cover grids prioritize actual books, while list view exposes edition details. The 8px spacing rhythm separates filters from results; modest nested radii identify controls without decorative cards. Status labels describe real reading state. No decorative illustrations or new animation are needed.

Rating uses five radio controls with inline SVG stars, cumulative filled selection, hover feedback, visible keyboard focus, a status message, and Clear rating.

**The Published Artwork Rule.** Use actual published covers. Every missing or failed cover resolves to the shared /covers/placeholder.svg.

## Do's and Don'ts

### Do:

- **Do** use active theme variables for interface surfaces, text, rules, and focus.
- **Do** preserve complete published covers with object-fit: contain in catalogue cover boxes.
- **Do** preserve the borrower-card and open-book treatment on authentication screens.
- **Do** retain visible focus, at least 44px auth touch targets, and reduced-motion behavior.
- **Do** keep the guide skippable and replayable while highlighting real controls.

### Don't:

- **Don't** make collection covers so large that routine browsing loses density.
- **Don't** use auth's no-scroll layout for the collection; books must remain reachable by scrolling.
- **Don't** generate title-specific replacement covers or multiple missing-cover placeholders.
- **Don't** add shadow elevation, gradients, or backdrop blur to the catalogue.
