# Food Plan - Operations Guide

> **Purpose**: How to build, run, test, and deploy the application.
>
> Related docs:
> - [architecture.md](./architecture.md) — System structure and diagrams
> - [adr/](./adr/README.md) — Decision records

---

## Development

### Prerequisites

- Node.js 18+
- npm

### Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Environment Variables

No environment variables are required. The app runs entirely in the browser with localStorage.

---

## Testing

### E2E Tests (Playwright)

Tests are organised by user story in the `e2e/` folder.

**Commands:**

| Command | Purpose |
|---------|---------|
| `npm run test:e2e` | Run all e2e tests headlessly |
| `npm run test:e2e:headed` | Run tests with visible browser |
| `npm run test:e2e:ui` | Run with interactive UI for debugging |

**File structure:**

```
e2e/
├── helpers/test-utils.ts
├── us-1.1-create-meal-plan.spec.ts
├── us-2.1-view-weekly-calendar.spec.ts
├── us-2.3-swap-meal.spec.ts
├── us-3.1-view-recipe-details.spec.ts
├── us-4.1-view-shopping-list.spec.ts
├── us-4.2-check-off-items.spec.ts
├── us-5.3-empty-state-dashboard.spec.ts
├── us-7.1-import-recipe-from-url.spec.ts
└── us-7.2-manual-recipe-entry.spec.ts
```

**Conventions:**

- Test files named after user story IDs
- Use `data-testid` attributes for test selectors
- Each test file covers one user story's acceptance criteria

**Adding new tests:**

1. Create `e2e/us-X.X-feature-name.spec.ts`
2. Add `data-testid` attributes to components
3. Use helpers from `test-utils.ts` (e.g., `clearAppState`, `createDefaultPlan`)

---

## Deployment

The app is deployed to **Vercel** with automatic deployments from the `main` branch on GitHub.

### How it works

1. Push to `main` branch
2. Vercel automatically builds and deploys
3. Preview deployments for pull requests

### Build Command

```bash
npm run build
```

### Infrastructure

| Service | Purpose | Cost |
|---------|---------|------|
| Vercel | Hosting (static + serverless) | Free tier |
| GitHub | Source control | Free |

No database or external services required.

---

## API Routes

The app has one API route for server-side recipe parsing:

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/parse-recipe` | POST | Fetch and parse recipe from URL |

This route fetches external recipe pages and extracts schema.org/Recipe JSON-LD data. It runs server-side to avoid CORS issues.

---

## Data Storage

All user data is stored in the browser's localStorage:

- Current meal plan
- User preferences
- Imported/manual recipes
- Shopping list checked items

Data persists across browser sessions but does not sync across devices.
