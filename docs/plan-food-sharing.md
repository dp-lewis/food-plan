# Plan: Shared Food Plans with Live Shopping Lists

## User Story

**As a** family meal planner
**I want to** share my food plan with my partner
**So that** we can both see what's for dinner this week and check off shopping items as either of us picks things up, without doubling up or missing anything.

### Acceptance Criteria

- A user can generate a shareable link for their current plan
- Another user can open that link and join the plan
- Both users see the same meal calendar and shopping list
- When either user checks off a shopping item, the other sees it update in real time
- Both users can add or swap meals, and changes sync to the other person

## Current State

- All data lives in localStorage (single browser, single device)
- **User accounts available** via Supabase Auth magic link (optional, no routes protected)
- **Backend database set up** (Supabase PostgreSQL) with schema and seed data
- No real-time infrastructure (Supabase Realtime available when needed)
- One API route exists (`/api/parse-recipe`) showing the pattern for serverless endpoints

## Technology Decisions

| Choice | Selected | Rationale |
|--------|----------|-----------|
| Database | **Supabase** (PostgreSQL) | Free tier, built-in auth, realtime, CLI migrations |
| ORM/Client | **@supabase/supabase-js** | Native client, no extra ORM layer needed |
| Auth | **Supabase Auth** | Comes with the platform, handles sessions via cookies |
| Realtime | **Supabase Realtime** | Built-in, no extra infra for M7 |

## Approach

This plan is broken into small, independently verifiable milestones. Each milestone produces a working app that can be tested end-to-end before moving on. No milestone should take more than a session or two to implement.

The strategy is:

1. Build the backend foundation first (database, auth)
2. Migrate existing features to work with the backend
3. Add sharing as a new capability on top of that foundation

---

## Milestone 1: Database Setup with Supabase ~ COMPLETE

**What:** Set up Supabase PostgreSQL schema and seed it with built-in recipes. No functional changes to the app.

**PR:** [#7 - Add Supabase database schema and seed (M1)](https://github.com/dp-lewis/food-plan/pull/7)

**What was done:**
- Installed `@supabase/supabase-js`, `@supabase/ssr`, `supabase` CLI, `tsx`
- Initialized Supabase project and linked to remote (`fmsmgzfbudbcuafqpylo`)
- Created initial migration (`00001_initial_schema.sql`) with:
  - 4 enum types: `meal_type`, `difficulty`, `budget_level`, `ingredient_category`
  - 5 tables: `recipes`, `meal_plans`, `meals`, `checked_items`, `custom_shopping_items`
  - `updated_at` triggers on `recipes` and `meal_plans`
  - `share_code` column on `meal_plans` (forward-looking for M5)
  - RLS disabled (will be enabled with auth in M2)
- Created browser client (`src/lib/supabase/client.ts`) and server client (`src/lib/supabase/server.ts`)
- Auto-generated TypeScript types from remote schema (`src/types/supabase.ts`)
- Created seed script (`supabase/seed.ts`) — upserts 25 built-in recipes
- Added npm scripts: `db:gen-types`, `db:migrate`, `db:seed`, `db:reset`

**Verified:**
- [x] Migration applied to remote without errors
- [x] 25 recipes seeded successfully
- [x] `npm run build` passes
- [x] App works exactly as before (localStorage unchanged)
- [x] All 87 Playwright tests pass

---

## Milestone 2: Authentication with Supabase Auth ~ COMPLETE

**What:** Add user accounts so data can be associated with a specific person. Passwordless email magic link authentication.

**PR:** [#8 - Add magic link authentication via Supabase Auth (M2)](https://github.com/dp-lewis/food-plan/pull/8)

**What was done:**
- Created middleware (`src/middleware.ts`) for session refresh using cookie shuttle pattern
  - Uses `getUser()` (not `getSession()`) to validate with auth server
  - Clears stale `sb-*` cookies when refresh token is invalid
- Created auth callback route (`src/app/auth/callback/route.ts`) to exchange magic link code for session
- Created sign-out route (`src/app/auth/signout/route.ts`) — POST handler, redirects with 303
- Created `AuthProvider` context (`src/components/AuthProvider.tsx`) with `useAuth()` hook providing `{ user, loading }`
  - Subscribes to `onAuthStateChange` for real-time auth state updates
- Wrapped app layout with `<AuthProvider>` in `src/app/layout.tsx`
- Created sign-in page (`src/app/auth/signin/page.tsx`) with:
  - Email input form for magic link OTP
  - Success state ("Check your email" confirmation)
  - Error handling for rate limiting and callback failures
  - `useSearchParams` wrapped in `<Suspense>` (required by Next.js App Router)
- Added sign-in/user UI to dashboard (`src/app/page.tsx`):
  - Signed out: "Sign in" text link
  - Signed in: user email as sign-out button
  - Loading: nothing shown (no flash)
- Added 4 new e2e tests (`e2e/auth-signin.spec.ts`)

**Setup note:** Had to drop a stale `on_auth_user_created` trigger on `auth.users` that was calling a nonexistent `handle_new_user()` function, causing "Database error saving new user" on sign-up.

**Verified:**
- [x] `npm run build` passes
- [x] All 91 Playwright tests pass (87 existing + 4 new)
- [x] Magic link email sent and received
- [x] Clicking magic link signs user in, redirects to dashboard
- [x] Sign-out works from dashboard
- [x] App works exactly as before for signed-out users

---

## Milestone 3: Data Access Layer with Server Actions and RLS ~ COMPLETE

**What:** Create server-side data access layer that reads and writes meal plans, recipes, and shopping list state to the database. These are not wired to the UI yet.

**Commit:** `e7f981d` — Add data access layer with server actions and RLS (M3)

**What was done:**
- Created data access layer (`src/lib/supabase/queries.ts`) with functions for:
  - Create/read/update meal plans (`getUserMealPlan`, `upsertMealPlan`)
  - Add/remove/swap meals (`insertMeal`, `deleteMeal`, `updateMealRecipe`)
  - Read/update shopping list checked items (`getCheckedItems`, `upsertCheckedItem`, `deleteCheckedItem`, `clearCheckedItems`)
  - Custom shopping items (`getCustomItems`, `insertCustomItem`, `deleteCustomItem`)
  - Save/list/delete user recipes (`getUserRecipes`, `insertRecipe`, `deleteRecipe`)
- Created bidirectional mappers (`src/lib/supabase/mappers.ts`) for DB ↔ app type conversion
- Created server actions in `src/app/actions/` (mealPlan.ts, recipes.ts, shoppingList.ts)
- Enabled Row Level Security (RLS) on all 5 tables with `auth.uid()` policies
- Created migration `00002_enable_rls.sql`
- Added 17 mapper unit tests + 17 RLS integration tests

**Verified:**
- [x] `npm run build` passes
- [x] All 91 Playwright tests pass
- [x] 34 unit/integration tests pass (mappers + RLS)
- [x] RLS prevents cross-user data access
- [x] App works exactly as before with localStorage

---

## Milestone 4: Store Sync with Write-Through ~ COMPLETE

**What:** When a user is signed in, store mutations optimistically update locally then fire-and-forget server action calls. When signed out, localStorage continues to work as before. No visual UI changes.

**Commit:** `9236366` — Add store sync with write-through to Supabase for authenticated users (M4)

**What was done:**
- Added `_userId`, `_setUserId`, `_isSyncing`, `_setIsSyncing` sync fields to Zustand store (excluded from localStorage by `partialize`)
- Added write-through to all 10 store mutations: local `set()` first, then `if (get()._userId)` fires server action with `.catch(console.error)`
- Created `StoreSync` component (`src/components/StoreSync.tsx`):
  - Watches auth transitions via `useRef` tracking of previous user ID
  - On sign-in: sets `_userId` immediately, loads server data (server wins if present; if server empty, uploads local data)
  - On sign-out: clears `_userId` and resets store state
  - Renders `null` (no UI)
- Wired `<StoreSync />` into root layout after `<StoreHydration />` inside `<AuthProvider>`

**Verified:**
- [x] `npm run build` passes
- [x] All 91 Playwright tests pass (anonymous users unaffected — `_userId` defaults to `null`)
- [x] 34 unit/integration tests pass
- [x] Sign in loads server data into store
- [x] Store mutations sync to Supabase for authenticated users
- [x] Sign out clears store

---

## Milestone 5: Share a Plan via Link

**What:** A signed-in user can generate a share link for their current plan. Another user who opens the link gets a read-only view initially.

**Tasks:**
- `share_code` column already exists on `meal_plans` (added in M1, nullable, unique)
- Add API route `POST /api/plans/[id]/share` to generate a share code
- Add API route `GET /api/shared/[code]` to retrieve a plan by share code
- Add a "Share" button on the plan view page that generates and copies the share link
- Create a `/shared/[code]` page that displays the shared plan (read-only view of the meal calendar and shopping list)
- Use existing UI components (Card, BottomNav) for the shared view

**Verify:**
- User A creates a plan and clicks "Share" - a link is copied to clipboard
- Opening the link in an incognito browser shows the plan (read-only)
- The shared view looks correct (meals displayed by day, shopping list visible)
- Invalid share codes show an appropriate error/empty state
- Share button only appears for signed-in users with a saved plan

---

## Milestone 6: Accept a Shared Plan (Collaborative Membership)

**What:** A signed-in user who opens a share link can "join" the plan, making it their active plan too. Both users now share the same underlying plan data.

**Tasks:**
- Add a `plan_members` table via migration: `user_id`, `plan_id`, `role` (owner/member)
- When the plan creator generates a plan, they become the owner in `plan_members`
- On the `/shared/[code]` page, show a "Use This Plan" button for signed-in users
- Accepting the plan creates a `plan_members` row and sets it as the user's current plan
- Update the plan query to work for both owners and members
- Update API auth checks: members can read the plan, only owners can modify meals (for now)

**Verify:**
- User A shares a plan link
- User B (signed in) opens the link and clicks "Use This Plan"
- User B now sees the plan on their dashboard as their current plan
- User B can view the meal calendar and shopping list
- User A still sees and controls the same plan
- User B cannot add/remove/swap meals (read-only for members at this stage)

---

## Milestone 7: Shared Shopping List with Real-Time Check-Off

**What:** Both the plan owner and members can check off shopping list items, and changes appear in real time for everyone.

**Tasks:**
- `checked_items` table already exists with `meal_plan_id`, `item_id`, `checked_by` (created in M1)
- Update the shopping list to read/write from this shared table
- Add real-time updates using **Supabase Realtime** (subscribe to `checked_items` changes for the active plan)
- Update the shopping list UI to show who checked each item (small avatar or initials)
- Both owner and members can check/uncheck items

**Verify:**
- User A and User B both open the shopping list for the same plan
- User A checks "Milk" - User B sees "Milk" become checked within a few seconds
- User B checks "Eggs" - User A sees "Eggs" become checked
- Unchecking works the same way
- Refresh the page: checked state is preserved
- Check who-checked-what is visible (initials or name next to checked items)

---

## Milestone 8: Full Collaborative Editing

**What:** Members can also add/remove/swap meals and add custom shopping items. All changes sync to everyone on the plan.

**Tasks:**
- Update API auth: members can now modify meals (not just read)
- Apply the same real-time mechanism from Milestone 7 to meal plan changes
- When a meal is added/removed/swapped, all users see the updated calendar
- Custom shopping items are shared (any member can add/remove)
- Add a simple activity indicator ("Plan updated" toast) when changes come from another user

**Verify:**
- User B adds a meal to Wednesday dinner - User A sees it appear
- User A swaps a meal - User B sees the swap
- User B adds a custom shopping item - it appears on User A's shopping list
- Changes feel responsive for the person making them (optimistic updates)
- No data conflicts when both users edit at the same time

---

## Milestone 9: Polish and Edge Cases

**What:** Handle the rough edges that come from multi-user collaboration.

**Tasks:**
- Handle plan deletion by owner: notify members, clear their current plan gracefully
- Handle member leaving a shared plan
- Show plan members on the plan view (avatars/names)
- Handle the "Clear checked items" action for shared lists (confirm dialog, affects everyone)
- Add a way to revoke/regenerate the share link
- Handle offline mode: queue changes and sync when back online
- Update onboarding empty state to mention sharing capability

**Verify:**
- Owner deletes plan: member's dashboard updates cleanly (no stale data)
- Member leaves: they return to "no plan" state, owner's plan is unaffected
- Member list displays correctly
- Share link can be revoked and regenerated
- App degrades gracefully when offline (shows last known state, syncs on reconnect)

---

## Out of Scope (Future Considerations)

These are deliberately excluded from this plan to keep scope manageable:

- **Per-person shopping assignments** (splitting the list between shoppers)
- **Chat or comments** on the plan
- **Plan history / versioning**
- **Multiple simultaneous plans** (only one active plan per user)
- **Push notifications** when the plan changes
- **Dietary preference filtering** per household member
- ~~**Migrating existing localStorage data** to the database on first sign-in~~ (done in M4 — StoreSync uploads local data if server is empty)

---

## Dependency Summary

```
M1 (Supabase DB) ✅ ──> M2 (Auth) ✅ ──> M3 (API/RLS) ✅ ──> M4 (Store Sync) ✅
                                                                │
                                                                v
                                                          M5 (Share Link)
                                                                │
                                                                v
                                                          M6 (Join Plan)
                                                                │
                                                                v
                                                          M7 (Shared Shopping)
                                                                │
                                                                v
                                                          M8 (Full Collab)
                                                                │
                                                                v
                                                          M9 (Polish)
```

Each milestone is a stable stopping point. The app works correctly after each one.

## Key Files Added/Modified in M4

| File | Purpose |
|------|---------|
| `src/store/store.ts` | Added sync fields + write-through server action calls |
| `src/components/StoreSync.tsx` | Auth-aware component: loads server data on sign-in, clears on sign-out |
| `src/app/layout.tsx` | Renders `<StoreSync />` after `<StoreHydration />` |

## Key Files Added in M3

| File | Purpose |
|------|---------|
| `src/lib/supabase/queries.ts` | Low-level database query functions |
| `src/lib/supabase/mappers.ts` | Bidirectional DB ↔ app type mappers |
| `src/app/actions/mealPlan.ts` | Server actions for meal plan CRUD |
| `src/app/actions/recipes.ts` | Server actions for user recipes |
| `src/app/actions/shoppingList.ts` | Server actions for checked items + custom items |
| `supabase/migrations/00002_enable_rls.sql` | RLS policies for all tables |
| `src/lib/supabase/__tests__/mappers.test.ts` | 17 mapper unit tests |
| `src/lib/supabase/__tests__/rls.integration.test.ts` | 17 RLS integration tests |

## Key Files Added in M2

| File | Purpose |
|------|---------|
| `src/middleware.ts` | Session refresh middleware (cookie shuttle pattern) |
| `src/components/AuthProvider.tsx` | React context with `useAuth()` hook |
| `src/app/auth/signin/page.tsx` | Magic link sign-in page |
| `src/app/auth/callback/route.ts` | Exchange magic link code for session |
| `src/app/auth/signout/route.ts` | Sign-out POST handler |
| `e2e/auth-signin.spec.ts` | Auth UI e2e tests |

## Key Files Added in M1

| File | Purpose |
|------|---------|
| `supabase/config.toml` | Supabase CLI project config |
| `supabase/migrations/00001_initial_schema.sql` | Schema: 4 enums, 5 tables, triggers |
| `supabase/seed.ts` | Seeds 25 built-in recipes |
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/supabase/server.ts` | Server Supabase client (cookie auth) |
| `src/types/supabase.ts` | Auto-generated DB types |
| `.env.local.example` | Required env vars template |
