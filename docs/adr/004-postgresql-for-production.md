# ADR-004: PostgreSQL for Production Database

## Status

Accepted

## Context

Production needs persistent storage for users, recipes, meal plans, and shopping lists. Options:

- PostgreSQL (relational)
- MongoDB (document)
- SQLite (embedded)
- Supabase/Firebase (BaaS)

## Decision

We will use **PostgreSQL** via Prisma ORM, hosted on Neon or Supabase free tier.

## Consequences

**Easier:**
- Natural fit for relational data (users → plans → meals → recipes)
- Strong typing with Prisma
- Free tiers available (Neon: 512MB, Supabase: 500MB)
- JSON columns available for flexible fields
- Mature ecosystem, extensive documentation

**Harder:**
- Requires schema migrations for changes
- Slightly more setup than document databases
- Connection pooling needed for serverless (Prisma handles this)
