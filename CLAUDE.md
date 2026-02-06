# Claude Code Configuration

## Custom Agents

Delegate work to agents in `.claude/agents/`:

| Agent | Model | When to Use |
|-------|-------|-------------|
| **coder** | sonnet | All implementation work - features, bugs, refactoring |
| **a11y** | haiku | Accessibility audits (WCAG 2.1 AA) |
| **visual-designer** | haiku | Design consistency reviews |
| **doc-writer** | haiku | Documentation generation |

**Important**: Use the `coder` agent for coding tasks rather than editing directly. It has full project context.

## Project Overview

Food Plan is a mobile-first PWA for meal planning and shopping lists.

### Tech Stack
- Next.js 15 (App Router)
- TypeScript (strict)
- Tailwind CSS + CSS custom properties
- Zustand (state, persisted to localStorage)
- Playwright (e2e tests)

### Key Directories
```
src/app/           # Pages and API routes
src/components/ui/ # Reusable UI components
src/lib/           # Business logic
src/store/         # Zustand store
src/styles/        # Design tokens (tokens.css)
e2e/               # Playwright tests
```

## Patterns

- **Drawer**: Used for quick inputs (add shopping item, import recipe URL)
- **BottomNav**: Fixed bottom navigation with back button + contextual actions
- **Design tokens**: All styling via CSS custom properties from `tokens.css`
- **Mobile-first**: 44px minimum touch targets, works at 375px width

## Commands

```bash
npm run dev          # Development server
npm run build        # Type check and build
npm run test:e2e     # Run all Playwright tests
npm run storybook    # Component development
```

## Conventions

- Use existing UI components from `src/components/ui/`
- Add `data-testid` attributes for e2e testing
- Follow existing patterns in similar files
- Keep changes minimal and focused
