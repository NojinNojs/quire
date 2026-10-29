# ADR 0002: the shelf is furniture

**Status:** accepted, 29 October 2026. Supersedes nothing; extends ADR 0001.

## Context

The owner asked for a UI/UX that is unique, not a Goodreads or Bookmory imitation, while keeping the
paper editorial base that replaced the earlier glass attempts. Cover-forward layouts are the obvious
modern direction, and also the crowded one: rounded cards, soft shadows, a warm palette.

## Decision

Covers get somewhere to stand. A 1px shelf line under every group, spine labels on the left margin,
progress as a bookmark strip on the jacket edge, and the streak as stamped marks. Grid first, list on
demand. The typography, palette and tokens do not change.

## Consequences

- The shelf screen now needs real cover images to work at all; the drawn jacket becomes the fallback.
- Group headers are rotated text, which is unusual on mobile and must stay readable at 11px.
- The streak loses the instant "seven days" reading of a bar chart and gains a stamped record that
  matches the product's voice. The number is still printed beside it, so nothing is lost.
- A grid hides publisher and page count, so the list view stays one tap away.
