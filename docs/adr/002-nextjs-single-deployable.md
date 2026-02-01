# ADR-002: Next.js as Single Deployable

## Status

Accepted

## Context

We need a web application with both frontend UI and backend API routes. Options include:

- Separate frontend (React) and backend (Express/Fastify) services
- Full-stack framework (Next.js, Remix, SvelteKit)
- Static site with serverless functions

## Decision

We will use **Next.js 14 with App Router** as a single deployable unit containing both frontend and API routes.

## Consequences

**Easier:**
- Single codebase, single deployment
- Shared TypeScript types between frontend and backend
- Built-in SSR and API routes
- Seamless Vercel deployment
- No CORS configuration needed

**Harder:**
- Scaling frontend and backend independently (not needed at hobby scale)
- Using a different backend language (locked into Node.js)
