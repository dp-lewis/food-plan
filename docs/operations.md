# Food Plan - Operations Guide

> **Purpose**: The Guidebook — how to build, run, and operate the system.
>
> Related docs:
> - [architecture.md](./architecture.md) — System structure and diagrams
> - [adr/](./adr/README.md) — Decision records (esp. [005](./adr/005-gpt4o-mini-for-ai.md), [006](./adr/006-vercel-serverless-hosting.md))

---

## API Specification (Production)

### Authentication

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/*` | Various | NextAuth.js handlers |

### Meal Plans

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/plans` | GET | List user's meal plans |
| `/api/plans` | POST | Create new meal plan |
| `/api/plans/[id]` | GET | Get single plan |
| `/api/plans/[id]` | PUT | Update plan |
| `/api/plans/[id]` | DELETE | Delete plan |
| `/api/plans/[id]/shopping-list` | GET | Generate shopping list |

### Recipes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/recipes` | GET | List user's recipes |
| `/api/recipes` | POST | Add custom recipe |
| `/api/recipes/[id]` | GET | Get single recipe |
| `/api/recipes/[id]` | PUT | Update recipe |
| `/api/recipes/[id]` | DELETE | Delete recipe |

### AI Generation

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/generate/plan` | POST | Generate meal plan via AI |
| `/api/generate/recipe` | POST | Generate single recipe via AI |

---

## Environment Variables

```env
# Database (Production only)
DATABASE_URL="postgresql://..."

# Auth (Production only)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generated-secret"

# OpenAI (Production only)
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"
OPENAI_MAX_TOKENS="3000"

# Rate Limiting (Production only)
RATE_LIMIT_PER_DAY="5"
```

### Prototype
No environment variables needed — runs entirely in the browser.

---

## Testing

### E2E Tests (Playwright)

Tests are organised by user story in the `e2e/` folder.

**Commands:**

| Command | Purpose |
|---------|---------|
| `npm run test:e2e` | Run all e2e tests headlessly |
| `npm run test:e2e:ui` | Run with interactive UI for debugging |

**File structure:**

```
e2e/
├── helpers/test-utils.ts       # Shared utilities
├── us-1.1-create-meal-plan.spec.ts
├── us-2.1-view-weekly-calendar.spec.ts
├── us-2.3-swap-meal.spec.ts
├── us-3.1-view-recipe-details.spec.ts
├── us-4.1-view-shopping-list.spec.ts
├── us-4.2-check-off-items.spec.ts
└── us-5.3-empty-state-dashboard.spec.ts
```

**Adding new tests:**

1. Create `e2e/us-X.X-feature-name.spec.ts`
2. Add `data-testid` attributes to components for reliable selectors
3. Use helpers from `test-utils.ts` (e.g., `clearAppState`, `createDefaultPlan`)

**Conventions:**

- Test files named after user story IDs
- Use `data-testid` attributes for test selectors (not CSS classes)
- Each test file covers one user story's acceptance criteria

---

## Infrastructure

### Development

```
Local machine
├── npm run dev (Next.js dev server)
├── Browser localStorage (no DB needed for prototype)
└── OpenAI API key (production testing only)
```

### Production

```
Vercel (Free tier)
├── Next.js app (auto-deployed from GitHub)
├── Serverless functions (API routes)
└── Edge network (static assets)

Neon/Supabase (Free tier)
└── PostgreSQL database

OpenAI
└── API with spending cap
```

---

## Cost Management

### OpenAI API

**Strategies:**

| Strategy | Implementation | Savings |
|----------|----------------|---------|
| Use GPT-4o-mini | Default to cheaper model | ~90% vs GPT-4 |
| Cache recipes | Store AI-generated recipes for reuse | Avoid duplicates |
| Batch generation | Full week in one call | Fewer API calls |
| Prompt optimization | Concise prompts, structured output | Fewer tokens |
| Rate limiting | Max 5 generations/user/day | Prevent abuse |
| Lazy generation | Generate recipes when viewed | Generate less |

**Token Budget:**

```
Meal plan generation (7 days):
├── Prompt:    ~500 tokens
├── Response:  ~2000 tokens
└── Total:     ~2500 tokens

Cost per plan: ~$0.0013
Monthly (100 plans): ~$0.13
```

### Service Costs

| Service | Free Tier Limits |
|---------|------------------|
| **Vercel** | Unlimited deployments, 100GB bandwidth |
| **Neon** | 512MB storage, 100 compute hours/month |
| **Supabase** | 500MB storage, 2GB bandwidth |
| **OpenAI** | Set hard cap at $10/month |

**Total Monthly Estimate: $0 - $5**

---

## Security

### Authentication
- NextAuth.js with secure session handling
- Passwords hashed with bcrypt
- HTTP-only cookies for sessions

### API Security
- All routes require authentication (except public pages)
- Input validation on all endpoints
- Rate limiting on AI generation endpoints

### Data Privacy
- User data isolated by user ID in all queries
- No sharing of user data between accounts
- Recipe data can be kept private or marked public

### API Key Protection
- OpenAI key server-side only (never exposed to client)
- Spending limits set in OpenAI dashboard
- All secrets in environment variables

---

## Simplifications (Hobby Scale)

Things we're **intentionally not doing**:

| Feature | Why Skip It |
|---------|-------------|
| Redis caching | Database is fast enough at this scale |
| CDN for images | No user-uploaded images in MVP |
| Background jobs | Synchronous AI calls fine for single user |
| Microservices | Monolith is simpler and sufficient |
| Kubernetes | Vercel serverless handles everything |
| Analytics | Privacy-friendly, minimal tracking |
| Email service | No email notifications needed |

---

## Future Scaling Path

If the app grows beyond hobby scale:

1. **Caching** — Redis for session and API response caching
2. **Background jobs** — Queue AI generation for better UX
3. **CDN** — Image optimization if recipe photos added
4. **Database replicas** — If query load increases
5. **Rate limiting service** — More sophisticated abuse prevention

For now: **keep it simple**.
