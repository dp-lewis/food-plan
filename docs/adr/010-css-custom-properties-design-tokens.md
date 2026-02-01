# ADR-010: CSS Custom Properties for Design Tokens

## Status

Accepted

## Context

We need a system for managing design values (colors, spacing, typography) consistently across the app. Options:

- CSS custom properties (native, no build step)
- Sass/Less variables (requires preprocessor)
- CSS-in-JS (Styled Components, Emotion)
- Tailwind config only (coupled to Tailwind)

## Decision

We will use **CSS custom properties** (CSS variables) defined in a central `tokens.css` file.

Location: `src/styles/tokens.css`

## Consequences

**Easier:**
- No build step required, works natively
- Can be inspected and modified in browser DevTools
- Framework-agnostic (works with Tailwind, plain CSS, or any approach)
- Easy to update values globally
- Supports future theming if needed

**Harder:**
- No compile-time checking (typos fail silently)
- IE11 not supported (not a concern for this project)
- Need discipline to use tokens consistently instead of hardcoding values
