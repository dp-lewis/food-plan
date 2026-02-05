# ADR-011: UI Component Library with Storybook

## Status

Accepted

## Context

As the application grew, UI patterns were being duplicated across pages with inconsistent implementations. Buttons, inputs, cards, and other common elements had slight variations in styling and behavior. This led to:

- Inconsistent user experience across the app
- Difficulty maintaining and updating shared UI patterns
- No isolated environment to develop and test components
- Hard to verify component states (hover, disabled, loading, etc.)

We needed a systematic approach to building and documenting reusable UI components.

## Decision

We will:

1. **Extract shared UI into a component library** at `src/components/ui/`
2. **Use Storybook** for component development and documentation

### Component Library Structure

```
src/components/ui/
  Button.tsx           # Component implementation
  Button.stories.tsx   # Storybook stories (co-located)
  Input.tsx
  Input.stories.tsx
  ...
```

### Storybook Configuration

- Framework: `@storybook/nextjs-vite` (integrates with our Next.js + Vite setup)
- Addons:
  - `@storybook/addon-docs` - Auto-generated documentation
  - `@storybook/addon-a11y` - Accessibility testing
  - `@storybook/addon-vitest` - Component testing integration
  - `@chromatic-com/storybook` - Visual regression testing (optional)

### Component Guidelines

- Components use CSS custom properties from `tokens.css` (see ADR-010)
- Components are typed with TypeScript interfaces
- Stories demonstrate all variants and states
- Stories tagged with `autodocs` for automatic documentation

## Consequences

**Easier:**
- Consistent UI across the application
- Isolated development environment for components
- Visual documentation of all component states
- Accessibility issues caught early via addon-a11y
- Faster iteration on UI without navigating full app flows
- Easier onboarding - new developers can browse available components

**Harder:**
- Additional tooling to maintain (Storybook config, stories)
- Need discipline to keep stories updated when components change
- Initial setup overhead for each new component
- Build times slightly longer with Storybook in the project
