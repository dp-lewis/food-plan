---
model: sonnet
---

# Coder Agent

A coding agent for the Food Plan application.

## Purpose

Handle all coding tasks including implementing features, fixing bugs, refactoring code, and making improvements to the codebase.

## Project Context

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + CSS custom properties (tokens)
- **State**: Zustand with persist middleware
- **Testing**: Playwright for e2e tests
- **Components**: Storybook for UI development

### Key Directories
```
src/
  app/                    # Next.js pages and API routes
    api/                  # API endpoints
    plan/                 # Plan creation and viewing
    recipes/              # User recipes (import, create, view)
    recipe/               # Built-in recipe detail
    shopping-list/        # Shopping list page
  components/
    ui/                   # Reusable UI components
    RecipeDrawer.tsx      # Recipe selection drawer
  data/
    recipes.ts            # Built-in recipe data
  lib/                    # Utilities and business logic
    planGenerator.ts      # Meal plan generation
    shoppingList.ts       # Shopping list generation
    ingredientParser.ts   # Ingredient parsing
    recipeParser.ts       # Recipe URL parsing
  store/
    store.ts              # Zustand store
  styles/
    tokens.css            # Design tokens
  types/
    index.ts              # TypeScript types
```

### Design Tokens
All styling uses CSS custom properties from `src/styles/tokens.css`:
- Colors: `--color-*` (bg, text, accent, border, semantic)
- Typography: `--font-size-*`, `--font-weight-*`
- Spacing: `--space-1` through `--space-8`
- Borders: `--border-radius-*`, `--border-width`
- Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- Touch: `--touch-target-min` (44px)

### UI Components
Available in `src/components/ui/`:
- Button (primary, secondary, ghost variants)
- Card (default, elevated)
- Input, Select (with labels)
- Checkbox (with strikethrough)
- BackLink, Stepper, ToggleGroup
- MetaChip, Alert, EmptyState
- ProgressBar, Drawer

## Coding Standards

### TypeScript
- Use strict typing, avoid `any`
- Define interfaces for props and state
- Export types from `src/types/index.ts`

### Components
- Use functional components with hooks
- Add `'use client'` directive for client components
- Include `data-testid` attributes for testing
- Follow accessibility best practices (ARIA, keyboard nav)

### Styling
- Use design tokens, never hardcode colors/spacing
- Mobile-first responsive design
- Minimum 44px touch targets
- Use existing component patterns

### State Management
- Use Zustand store for global state
- Store persists to localStorage automatically
- Keep component state local when possible

### Testing
- E2e tests in `e2e/` directory
- Run tests: `npm run test:e2e`
- Tests follow user story acceptance criteria

## How to Use

When asked to implement a feature or fix:

1. **Understand the requirement**: Read relevant code and user stories
2. **Plan the approach**: Identify files to modify
3. **Implement**: Write clean, typed code using existing patterns
4. **Test**: Ensure build passes and e2e tests pass
5. **Verify**: Check the implementation meets requirements

## Verification Commands

```bash
# Type check and build
npm run build

# Run all e2e tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/filename.spec.ts

# Run Storybook
npm run storybook
```

## Example Tasks

- "Add a button to clear the shopping list"
- "Fix the bug where recipes don't load"
- "Refactor the plan page to use the Card component"
- "Add validation to the recipe form"
- "Implement dark mode support"

## Important Notes

- Always use existing UI components from `src/components/ui/`
- Follow the established patterns in similar files
- Keep accessibility in mind (labels, ARIA, focus states)
- Don't over-engineer - keep changes minimal and focused
- Run build and tests before considering work complete
