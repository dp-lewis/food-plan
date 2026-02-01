# ADR-005: GPT-4o-mini for AI Generation

## Status

Accepted

## Context

We need an LLM to generate recipes and meal plans. Options:

- GPT-4 (most capable, expensive)
- GPT-4o-mini (capable, cheap)
- Claude (strong reasoning)
- Local LLM via Ollama (free, requires setup)

## Decision

We will use **GPT-4o-mini** via OpenAI API as the default model.

## Consequences

**Easier:**
- ~90% cost reduction vs GPT-4 (~$0.0013 per meal plan)
- Sufficient quality for recipe generation
- Fast response times
- Simple API integration
- Structured output support (JSON mode)

**Harder:**
- Less capable than GPT-4 for complex reasoning (not needed for recipes)
- API dependency and costs (mitigated by caching and rate limiting)
- Need to handle API failures gracefully
