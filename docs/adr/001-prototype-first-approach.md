# ADR-001: Prototype-First Development Approach

## Status

Accepted

## Context

We're building a food planning app with several moving parts: UI, state management, database, authentication, and AI integration. Building everything at once increases complexity and risk. We want to validate the user experience before investing in infrastructure.

## Decision

We will build in two phases:

1. **Prototype** — Browser-only app with localStorage and static recipe data
2. **Production** — Add database, auth, and AI integration

The prototype uses the same frontend stack (Next.js, Tailwind) as production, so UI code is not throwaway.

## Consequences

**Easier:**
- Fast iteration on UI/UX without backend constraints
- No infrastructure costs during design validation
- Clear separation between "does the UX work?" and "does the system work?"

**Harder:**
- Some features (multi-device sync, AI generation) can't be tested until Phase 2
- Need to plan data model carefully so localStorage → PostgreSQL migration is smooth
