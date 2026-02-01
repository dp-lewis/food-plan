# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the Food Plan project.

## What is an ADR?

An ADR documents a significant architectural decision along with its context and consequences. They help us:
- Remember why decisions were made
- Onboard new team members
- Revisit decisions when context changes

## ADR Index

| # | Decision | Status |
|---|----------|--------|
| [001](./001-prototype-first-approach.md) | Prototype-first development approach | Accepted |
| [002](./002-nextjs-single-deployable.md) | Next.js as single deployable | Accepted |
| [003](./003-localstorage-for-prototype.md) | localStorage for prototype storage | Accepted |
| [004](./004-postgresql-for-production.md) | PostgreSQL for production database | Accepted |
| [005](./005-gpt4o-mini-for-ai.md) | GPT-4o-mini for AI generation | Accepted |
| [006](./006-vercel-serverless-hosting.md) | Vercel serverless hosting | Accepted |
| [007](./007-target-user-budget-families.md) | Target user: budget-conscious families | Accepted |
| [008](./008-minimal-design-philosophy.md) | Minimal & focused design philosophy | Accepted |
| [009](./009-single-accent-color-light-mode.md) | Single accent color, light mode only | Accepted |
| [010](./010-css-custom-properties-design-tokens.md) | CSS custom properties for design tokens | Accepted |

## Creating a New ADR

1. Copy `000-template.md` to a new file with the next number
2. Fill in the Status, Context, Decision, and Consequences
3. Add an entry to this index
