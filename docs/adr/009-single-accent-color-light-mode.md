# ADR-009: Single Accent Color, Light Mode Only

## Status

Accepted

## Context

The visual design needs a color system. Options range from minimal (one accent color) to full palette (primary, secondary, tertiary). We also need to decide whether to support dark mode.

## Decision

We will use:
- **Single accent color** (green) for primary actions and highlights
- **Neutral grays** for text and backgrounds
- **Light mode only** (no dark mode)

## Consequences

**Easier:**
- Faster development (one theme to build and test)
- Consistent visual language
- Simpler CSS, fewer variables
- Green conveys "fresh, healthy, natural" — appropriate for food app

**Harder:**
- No dark mode may disappoint some users
- Limited visual hierarchy options (one accent color)
- Changing the brand color later requires touching many components
