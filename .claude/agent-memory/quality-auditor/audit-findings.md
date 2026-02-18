# Audit Findings — February 2026

## E2E Tests

### Strengths
- Strong user-story traceability: each spec file maps 1:1 to a user story with acceptance criteria as comments.
- `clearAppState()` and `createPlanWithMeals()` helpers in `e2e/helpers/test-utils.ts` reduce duplication.
- `localStorage` seeding pattern avoids slow UI setup paths (good for speed/reliability).
- API mocking via `page.route()` used for Supabase OTP and recipe import.
- Thorough shopping list coverage (custom items, categories, persistence, deletion).

### Gaps / Issues
- Playwright config only runs chromium. No `devices['iPhone 13']` or `devices['Pixel 5']` project despite PWA being mobile-first.
- `us-5.1-view-current-plan-summary.spec.ts` has time-of-day-conditional assertions (`hasUpNext || hasTomorrow`) — flaky depending on when tests run.
- US-9.1 share plan: 4 of 5 tests are `test.skip()` because server component pages cannot be intercepted by `page.route()`. Needs server-side seeding or a Supabase test environment.
- No e2e tests for: settings/preferences page (if any), recipe editing (update existing user recipe), error states on network failure during recipe import URL fetch, offline PWA behaviour, service worker scenarios.
- `us-2.3-swap-meal.spec.ts` is named "swap" but covers add/remove — the user story was renamed. Minor naming mismatch.

## Unit Tests

### Coverage
- `mappers.test.ts`: 23 tests covering all mapper functions and round-trip fidelity. Well structured with fixtures. Good.
- `rls.integration.test.ts`: Integration tests for Supabase RLS. Uses `describe.skipIf(!canRun)` gracefully. Covers anon/authenticated boundaries.

### Missing coverage (zero tests)
- `src/lib/shoppingList.ts` — `generateShoppingList`, `groupByCategory`, `mergeShoppingLists` (complex aggregation logic, serving multiplier math)
- `src/lib/ingredientParser.ts` — `parseIngredientString`, `categorizeIngredient`, `parseIngredient` (regex-heavy, fraction parsing, keyword matching)
- `src/lib/planGenerator.ts` — `createEmptyPlan`, `swapMeal` (random selection logic, fallback when all recipes used)
- `src/lib/recipeParser.ts` — `parseRecipeFromHtml`, `extractRecipeFromJsonLd` (multiple JSON-LD formats, @graph, arrays)
- `src/store/store.ts` — all Zustand actions (addMeal, removeMeal, toggleCheckedItem, etc.)

## Storybook

### Coverage
- 15/15 UI components have stories (100%).
- All stories use `tags: ['autodocs']` and `Meta<typeof Component>` typing.

### Quality
- Interactive stories present for Drawer, ToggleGroup, Stepper — good for testing state transitions.
- Button: covers primary/secondary/ghost/small/disabled/loading. Excellent.
- Alert: covers all 4 variants. Good.
- Stepper: covers min/max boundary states. Good.
- Vitest/Storybook integration configured in `vitest.config.ts` (storybook project using browser/playwright). Stories can be run as component tests.

### Gaps
- No stories for composite/feature components: `RecipeDrawer`, `AuthProvider`, `StoreHydration`, `StoreSync`.
- RecipeDrawer is complex and testable in isolation (recipe list, empty state, user recipe section).
- Stories don't include interaction tests using `@storybook/test` `userEvent` for click/keyboard flows.

## Documentation

### Strengths
- README covers features, setup, commands, tech stack, and links to all docs/*.
- Extensive docs directory: `architecture.md`, `implementation-plan.md`, `operations.md`, `user-stories.md`, `design-principles.md`, `plan-food-sharing.md`, and `adr/`.
- CLAUDE.md covers project overview, conventions, and agent delegation.
- Inline JSDoc comments on all public functions in lib files.

### Gaps
- README mentions `npm run test:e2e:headed` but does not document `npm run storybook` or `npm run build`.
- README does not mention Supabase setup (env vars) needed for the backend sync features.
- README does not mention Vitest for unit tests or how to run them (`npm test`? `npx vitest`?).
- CLAUDE.md shows a `vitest.config.ts` storybook project duplicated twice (bug in the config file).

## Type Safety

- No `any` types found anywhere in source.
- No `@ts-ignore`, `@ts-expect-error`, or `@ts-nocheck` in source.
- Three `as unknown as X` casts in `mappers.ts` for Supabase JSONB columns — expected pattern given Supabase's `Json` type.
- `recipeParser.ts` correctly uses `unknown` parameter types for external JSON-LD data.
- Overall: excellent type discipline.
