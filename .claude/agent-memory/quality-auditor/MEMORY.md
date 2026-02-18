# Quality Auditor Memory

See `audit-findings.md` for detailed notes from the Feb 2026 audit.

## Key Facts

- E2E: 15 spec files in `e2e/`, all tied to user stories (US-1.1 through US-9.1). One shared helper at `e2e/helpers/test-utils.ts`.
- Unit tests: Only 2 files — `mappers.test.ts` (pure mapper functions) and `rls.integration.test.ts` (Supabase RLS, needs env vars). Run via Vitest.
- Stories: 15 story files — all 15 UI components in `src/components/ui/` have stories. 100% coverage.
- No stories for composite/feature-level components: `RecipeDrawer`, `AuthProvider`, `StoreHydration`, `StoreSync`.
- No unit tests at all for: `src/lib/shoppingList.ts`, `src/lib/ingredientParser.ts`, `src/lib/planGenerator.ts`, `src/lib/recipeParser.ts`, `src/store/store.ts`.
- Type safety: No `any` or `@ts-ignore` used. Three `as unknown as X` casts in `mappers.ts` (JSONB columns from Supabase — expected pattern).
- Playwright config: chromium only, 10s timeout, no mobile device project defined despite the app being mobile-first PWA.
- E2E tests for sharing (US-9.1) are mostly skipped — server components block page.route() mocking.
- `data-testid` applied consistently: 122 usages across source, 108 in app pages, 14 in components.
