# ADR-006: Vercel Serverless Hosting

## Status

Accepted

## Context

We need to host the Next.js application. Options:

- Vercel (serverless, Next.js native)
- AWS (EC2, Lambda, or Amplify)
- Railway/Render (containers)
- Self-hosted (VPS)

## Decision

We will deploy to **Vercel** using their free tier.

## Consequences

**Easier:**
- Zero configuration for Next.js
- Automatic deployments from GitHub
- Free tier covers hobby usage (100GB bandwidth)
- Serverless functions scale to zero
- Built-in edge caching
- No server maintenance

**Harder:**
- Vendor lock-in (mitigated by Next.js being portable)
- Cold starts on serverless functions (minimal impact)
- Free tier limits may require upgrade if app grows
