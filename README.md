# Food Plan

A simple meal planning app for families. Generate weekly meal plans, import recipes from your favourite websites, and create shopping lists automatically.

## Features

- **Meal Plan Generation** - Create weekly plans with configurable days, people, and meal types
- **Recipe Import** - Import recipes from URLs (supports sites with schema.org/Recipe data)
- **Manual Recipes** - Add simple family staples like "Schnitzel and salad"
- **Shopping Lists** - Auto-generated from your meal plan, grouped by category
- **Meal Swapping** - Don't like a suggestion? Swap it for something else
- **Offline-First** - All data stored locally in your browser

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase project values:

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous (public) API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (server-side only, for integration tests) |

Get these values from your [Supabase project settings](https://supabase.com/dashboard/project/_/settings/api).

> Note: The app works without Supabase — all data is stored locally in the browser. Supabase is only required for cross-device sync and authentication.

### Installation

```bash
# Clone the repository
git clone https://github.com/dp-lewis/food-plan.git
cd food-plan

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run tests with visible browser
npm run test:e2e:headed

# Run unit tests
npx vitest run
```

### Component Development

```bash
# Start Storybook
npm run storybook
```

## Documentation

- [Implementation Plan](docs/implementation-plan.md) - Project overview and structure
- [Architecture](docs/architecture.md) - System diagrams and data flow
- [Operations](docs/operations.md) - Development, testing, and deployment
- [User Stories](docs/user-stories.md) - Features and acceptance criteria
- [ADRs](docs/adr/README.md) - Architecture decision records

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS |
| State | Zustand with localStorage persistence |
| Testing | Playwright |
| Deployment | Vercel |

## License

MIT
