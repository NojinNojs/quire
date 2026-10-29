# ADR 0001: paper editorial, not glass

**Status:** accepted, 28 October 2026

## Context

The first three visual directions were dark glass with a gold accent, a cream catalogue card with a
brick accent, and a set of glass screens. Each was rejected as "AI slop" by the owner, and the reason
was consistent: they looked like every other AI-generated product, not like a library.

## Decision

Quire's surface is paper, not glass. Three themes (`shelf`, `municipal`, `oxford`), each in a light and
a dark mode, built from one token set. No backdrop blur, no gradient, no glow, radius 0 to 3. Colour
carries classification, never decoration. One accent per screen.

## Consequences

- Themes only swap colour; type, spacing, radii and component anatomy stay fixed, so a new theme is a
  palette file, not a redesign.
- Every screenshot has to be checked in six modes, which is slower than one.
- The book covers now have to carry the personality, because the interface deliberately does not.
