# Quire design system

[DESIGN.md](../../DESIGN.md) is the canonical direction, including the token map, component sizes, navigation, field behavior and motion guidance. The runtime source of truth is [`src/styles/`](../../src/styles/); the notes below describe the system without maintaining a second visual brief.

## Theme and tokens

The app has one light theme. `src/styles/themes.css` defines these semantic roles; shell and authentication styles also scope their own values.

| Role | Value | Use |
|---|---|---|
| `--surface` | `#f5f7f6` | page background |
| `--surface-raised` | `#ffffff` | raised surfaces and controls |
| `--surface-selected` | `#e4efe8` | selection |
| `--surface-subtle` | `#edf2ef` | subtle surfaces |
| `--ink` / `--ink-muted` | `#202a27` / `#414e48` | primary and supporting text |
| `--rule` | `#d5dfd9` | separators and borders |
| `--accent` / `--on-accent` | `#205b48` / `#ffffff` | primary action and its label |
| `--class-800` / `--class-900` | `#8c2f39` / `#2b4a6f` | literature / history classification |
| `--class-100` / `--class-000` | `#8a6a1f` / `#4a4a45` | philosophy / general classification |
| `--on-class` | `#ffffff` | text on classification bands |

Classification color identifies a group; published cover artwork retains its own colors. Colors and separators must not be the only signals of state or interactivity.

## Type, spacing and components

Plus Jakarta Sans carries interface text; Newsreader identifies book titles and the wordmark. The canonical scale, spacing values and component dimensions are in `DESIGN.md` frontmatter. Keep labels visible rather than using placeholders as labels. Use tabular figures for numeric comparisons and human-readable dates in summaries.

Controls need rest, hover, focus, pressed, disabled and error states where applicable. Primary, secondary, quiet and destructive actions must be distinguishable. Base UI supplies popup behavior with Quire styling. Tooltips supplement accessible names, while errors and reading Undo stay next to their controls.

The active book and logging controls lead Today. Covers preserve the complete published artwork; missing or failed images use `/covers/placeholder.svg`. No generated title-specific cover substitutes. Collection filters describe actual metadata and status.

## Accessibility and motion

- Measure text contrast at 4.5:1 for normal text and 3:1 for large text, including error and pending states.
- Provide keyboard access, visible focus, accessible names for icon-only controls and focus return from overlays.
- Preserve 44px minimum touch targets, responsive reflow, and safe-area clearance for fixed navigation.
- Provide empty, loading and error states where applicable; do not rely on color alone for selection or validation.
- Honor reduced motion. See `src/styles/motion.css` and `DESIGN.md` for the current timings and transition rules.

These are design requirements, not a claim that the current revision has passed each check. The [evidence index](../evidence/README.md) records dated milestone checks.

## Historical direction

The earlier paper-editorial specification used different theme and radius rules. Its dark-glass predecessor was cancelled; see [ADR 0001](../adr/0001-paper-editorial-not-glass.md). Neither supersedes the current direction.
