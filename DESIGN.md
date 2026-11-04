---
name: Quire
description: A neutral, ink-green reading workspace with compact progress logging and cover-led collections.
colors:
  "shelf-light-surface": "#f5f7f6"
  "shelf-light-surface-raised": "#ffffff"
  "shelf-light-ink": "#202a27"
  "shelf-light-ink-muted": "#414e48"
  "shelf-light-rule": "#d5dfd9"
  "shelf-light-accent": "#205b48"
  "shelf-light-on-accent": "#ffffff"
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
  "input": "8px"
  "card": "12px"
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
    backgroundColor: "{colors.shelf-light-accent}"
    textColor: "{colors.shelf-light-on-accent}"
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

## Direction

A task-first reading workspace. The user explicitly replaced the beige editorial dashboard with neutral light surfaces and ink-green actions. Continuing the current book and logging pages lead the first viewport. StoryGraph informs familiar reading workflows, not copied branding or unsupported statistics.

## Palette and scope

Application tokens live in `src/styles/dashboard.css`, scoped to `.app-shell`: canvas `#f5f7f6`, white surfaces `#ffffff`, ink `#202a27`, supporting ink `#414e48`, separators `#d5dfd9`, accent `#205b48`, on-accent white. Selected surfaces use `#e4efe8`; subtle areas use `#edf2ef`. Focus, caret and selection use this palette. Separators are decorative, not the only affordance identifying a control.

Authentication keeps the physical book, but its palette now belongs to the same application: canvas `#f5f7f6`, white pages with cool-white page edges (`#eef3f0`, rim `#d5dfd9`), ink `#202a27`, supporting ink `#414e48`, and a dark-green cloth cover `#205b48` carrying `#f5f7f6` titling and a `#17493a` spine shade. Accent, focus, caret and selection use `#205b48` and `#e4efe8`, so sign-in, account creation and password reset read as the same application. The auth roles are scoped to `.auth-page` in `src/styles/auth-base.css` rather than reusing shell tokens. There is one light application theme; no inert theme toggle.

## Typography

Plus Jakarta Sans carries headings, controls and body text. Newsreader is reserved for the Quire wordmark and book titles, not oversized interface greetings. Tabular numerals support progress and totals. Human-readable dates replace raw ISO dates in summaries; stored dates remain date-only values.

## Layout and navigation

Today comes first, followed by Collection and Add book. At 1024px and above, a labelled 216px rail collapses to an 80px icon rail through an accessible toggle. `quire:nav-mode:v1` stores the device preference; blocked storage still permits session-only toggling. Brand, reading destinations and utility actions are separate groups, informed by shadcn's compositional sidebar pattern but implemented with Quire's own typography, colors and existing components. Both modes retain accessible names, focus, Settings and Guide. Below 1024px, a 56px header provides route context and Settings/Guide. The mobile dock is inset 12px, bounded to 480px, and lifted 8px above the safe area. Its opaque white surface, 14px radius and restrained shadow distinguish fixed navigation from scrolling books; three 48px targets retain labels. A sliding active surface tracks the real route and disappears on Settings. Content clearance includes dock height, spacing and the safe area once.

The active book is compact and cover-led, with actual page count, honest percentage only when total pages are known, and nearby logging controls. Desktop places identity and logging side by side where space allows. Mobile stacks them without a decorative giant jacket or empty spacer. Annual goal and activity support the task rather than delaying it.

### Shell reference decisions

[shadcn Sidebar](https://ui.shadcn.com/docs/components/base/sidebar) supplies the composition model: persistent header/footer, scrollable grouped destinations and an inset reading workspace. [Aceternity Sidebar](https://ui.aceternity.com/components/sidebar) and [Floating Dock](https://ui.aceternity.com/components/floating-dock) inform bounded transitions and clear icon feedback, not automatic hover expansion or pointer-driven magnification. Explicit collapse avoids moving the reading surface unexpectedly; fixed mobile targets remain predictable.

Library and Insights are separate groups. Journal and Reading year get direct destinations instead of masquerading as Today. Navigation search is scoped to application pages, not a misleading book search. Its keyboard shortcut and the mobile More menu supplement visible links; modal overlays must restore focus on cancellation and hand focus to the destination on navigation. All shell enhancements reuse existing Base UI rather than introducing a second component runtime.

## Controls and states

Controls use approximately 8px corners, 44px minimum touch targets, labels and visible focus. Primary actions use ink-green with white text. Presets select a page amount; the input states that it records pages read, not an absolute page position. Preview shows the resulting position before commit.

Every writable field keeps its visible label, and a placeholder adds at most a format example (`e.g. 9780140126938`, `name@example.com`) rather than replacing the label. Autocomplete names appear only where the browser holds real data (email, nickname, current and new passwords); catalogue search, manual edition entry and numeric controls opt out. Selects, file pickers, rating radios and steppers that always hold a value take no placeholder. Field borders, placeholder text and focus rings meet their contrast floors against the surface they sit on, so a control is never identified by a hairline tint alone.

Undo, pending, saved and failure feedback stays next to logging. Pending pages are not reported as persisted annual history. Reduced motion removes decorative transitions. Status, selection and validation must not rely on color alone.

### Component references

Use [Base UI](https://base-ui.com/react/overview/quick-start) for accessible popup behavior, with Quire CSS rather than a second styling framework. [shadcn button variants](https://ui.shadcn.com/docs/components/base/button) inform primary, secondary, quiet and destructive action hierarchy; [tooltip composition](https://ui.shadcn.com/docs/components/base/tooltip) informs contextual icon descriptions. Tooltips supplement accessible names, never replace visible form labels or essential instructions. Toasts confirm completed mutations; field errors and reading Undo remain beside their controls. Pending local work must not be announced as saved to the account.

Popup opening and closing use the same reversible transition, following [Base UI's animation lifecycle](https://base-ui.com/react/handbook/animation). A user reversing an interaction mid-transition must not reset it to the opposite endpoint. Keep exits mounted until their transition completes and honor reduced motion.

## Motion

Motion is a shared interaction language, not perpetual decoration. `motion.css` defines 110ms control feedback, 160ms panel transitions, 260ms route entrances and bounded 20ms row staggering. Navigation owns its 260ms rail/content transition and sliding mobile indicator. Route entrances move only 6px; button presses scale to 0.985 without changing layout. Fields ease border/background changes without delaying input. Real list rows, catalogue results, journal days, calendar disclosures, settings/review feedback, select popovers and guide/dialog surfaces share restrained entry and state feedback. The first eight rows may stagger; later content is immediately available. Auth mode/feedback motion preserves the physical cover animation. Grid/list changes keep existing React nodes rather than forcing remounts to replay animation. Reduced-motion removes nonessential animation and transforms. No scroll hijacking, synthetic loaders, `transition: all`, or permanently moving decoration.

## Collection and detail

Published covers provide visual variety. Preserve complete artwork and use `/covers/placeholder.svg` for missing or failed covers. Compact grids favor scanning; list view exposes edition metadata. Filters describe actual status and metadata. Detail separates identity, lifecycle, review and metadata without a giant cover or blank panel.

## Journal and statistics

Use saved daily aggregates. Year and language filters stay adjacent to their data. Month summaries provide compact navigation into date details instead of hundreds of oversized controls. All dates remain reachable by keyboard and touch. Notes are labelled current book notes, not historical notes. Goal applies only to the current year.

## Constraints

- Keep account and demo equivalent; label local sample activity.
- Do not invent page totals, metrics, covers, social interactions or historical goal snapshots.
- No beige application framing, oversized serif shell headings, gradients, decorative glass or nested card stacks.
- Preserve error/retry, offline queue, undo, one-active-book rules, cover upload, editing, deletion and replayable guide.
