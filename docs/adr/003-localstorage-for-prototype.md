# ADR-003: localStorage for Prototype Storage

## Status

Accepted

## Context

The prototype needs to persist user data (meal plans, preferences, shopping list state) between browser sessions. Options:

- localStorage (browser-native, simple)
- IndexedDB (more powerful, more complex)
- Remote database (requires infrastructure)

## Decision

We will use **localStorage** with Zustand for state management in the prototype phase.

## Consequences

**Easier:**
- Zero infrastructure setup
- Instant reads/writes, no async complexity
- Works offline by default
- Zustand provides clean API and persistence middleware

**Harder:**
- Limited to ~5MB storage (sufficient for our use case)
- Data only exists on one device/browser
- No querying capability (must load all data into memory)
- Will need migration path to PostgreSQL in production
