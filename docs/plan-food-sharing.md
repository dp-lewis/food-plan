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

## Milestone 7: Shared Shopping List with Real-Time Check-Off ~ COMPLETE

**What:** Both the plan owner and members can check off shopping list items, and changes appear in real time for everyone.

**PR:** [#26 - Implement real-time shopping list updates and enhance shared plan functionality (M7)](https://github.com/dp-lewis/food-plan/pull/26)

**What was done:**
- Created `src/hooks/useRealtimeShoppingList.ts` — subscribes to Supabase Realtime on `checked_items` for the active plan; updates store when remote changes arrive
- Updated shopping list page (`src/app/shopping-list/page.tsx`) to use the new realtime hook
- Updated `checked_items` queries to store `checked_by` (user ID) and expose it to the UI
- Enabled Realtime on the `checked_items` table via migration `00006_enable_realtime_shopping.sql`
- Updated store (`src/store/store.ts`) to handle incoming remote check-off updates
- Updated `StoreSync` to pass plan ID for realtime subscription

**Verified:**
- [x] `npm run build` passes
- [x] All Playwright tests pass
- [x] User A checks "Milk" — User B sees it update in real time
- [x] Unchecking propagates in real time
- [x] Checked state persists across page refreshes
- [x] Custom shopping items are visible to all plan members

## Key Files Added/Modified in M7

| File | Purpose |
|------|---------|
| `src/hooks/useRealtimeShoppingList.ts` | Supabase Realtime listener for `checked_items` |
| `src/app/shopping-list/page.tsx` | Wired up realtime hook |
| `supabase/migrations/00006_enable_realtime_shopping.sql` | Enable Realtime on checked_items table |
| `src/store/store.ts` | Handle incoming remote check-off updates |
| `src/app/actions/shoppingList.ts` | Store `checked_by` on toggle |

---

## Milestone 8: Full Collaborative Editing ~ COMPLETE

**What:** Members can also add/remove/swap meals and add custom shopping items. All changes sync to everyone on the plan.

**PR:** [#31 - Collaborative meal editing (M8)](https://github.com/dp-lewis/food-plan/pull/31)

**What was done:**
- Updated API auth: members can now modify meals (not just read)
- Applied the same real-time mechanism from M7 to meal plan changes via `useRealtimeMealPlan` hook
- When a meal is added/removed/swapped, all users see the updated calendar in real time
- Custom shopping items are shared (any member can add/remove)
- Added a "Plan updated" toast activity indicator when changes arrive from another user

**Verified:**
- [x] `npm run build` passes
- [x] All Playwright tests pass
- [x] User B adds a meal — User A sees it appear in real time
- [x] User A swaps a meal — User B sees the swap
- [x] User B adds a custom shopping item — it appears on User A's shopping list
- [x] Changes feel responsive for the person making them (optimistic updates)
- [x] No data conflicts when both users edit at the same time

---

## Milestone 9: Polish and Edge Cases

**What:** Handle the rough edges that come from multi-user collaboration. Delivered in three PRs.

### PR 1 — Membership Actions

**Tasks:**

#### T1: Member can leave a shared plan
- New `leavePlanAction()` server action in `src/app/actions/share.ts` (DB query already exists in `queries.ts`)
- "Leave Plan" button in `src/app/plan/current/page.tsx`, only shown when `_planRole === 'member'`
- Opens a confirmation `Drawer` ("You'll return to an empty plan"), then resets store and redirects home

#### T2: Owner can delete a plan (notifies members in real time)
- New migration `00008_enable_realtime_plan.sql`: `REPLICA IDENTITY FULL` + add `meal_plans` to realtime publication
- New `deletePlanAction()` server action in `src/app/actions/mealPlan.ts` — cascade delete handles all child rows
- Extend `useRealtimeMealPlan.ts` to listen for DELETE events on `meal_plans` → call `_clearCurrentPlan()` store helper so members' views clear automatically
- New `_clearCurrentPlan()` helper in `src/store/store.ts`
- "Delete Plan" button in `src/app/plan/current/page.tsx`, owner only, red-accented Drawer

#### T3 (schema): Store member email for display
- New migration `00009_add_member_email.sql`: `ALTER TABLE plan_members ADD COLUMN user_email TEXT`
- Update `joinPlan()` in `queries.ts` and `joinSharedPlanAction()` in `share.ts` to pass and persist `user.email` on join
- Note: owner is not in `plan_members` by design — owner email will be fetched separately from `meal_plans` in PR 2

**Verify:**
- Member clicks "Leave Plan" → confirmation drawer → store clears → redirected to empty dashboard
- Owner clicks "Delete Plan" → plan deleted from DB → member's dashboard clears in real time (within ~2s)
- Existing members not in `plan_members` display correctly after schema migration
- Owner's plan is unaffected when a member leaves

---

### PR 2 — Plan UI Polish

**Tasks:**

#### T3 (UI): Show plan members
- New `getPlanMembersAction()` server action
- New `src/components/plan/PlanMembersRow.tsx` — avatar chips using email initials (same `getInitials()` pattern as shopping list)
- Rendered at the top of the plan view when there are 2+ people on the plan (owner + at least one member)

#### T4: "Clear checked items" confirmation for shared plans
- In `src/app/shopping-list/page.tsx`: when `_planRole` is set, clicking "Clear checked" opens a `Drawer` first ("This will uncheck all items for everyone on the plan")
- Solo users (no `_planRole`): no change, fires immediately — no regression

#### T5: Revoke / regenerate share link
- New `regenerateShareLinkAction()` server action in `share.ts` (revoke old code + generate new one)
- Refactor Share FAB in `src/app/plan/current/page.tsx` to open a `Drawer` with: current link + copy button, "Generate new link", "Revoke link"
- Revoking does NOT remove existing members — they retain access, just no new joins via the old link

#### T7: Update onboarding empty state copy
- Update description in `src/app/page.tsx`: "Plan your week, share with your household, and check off the shopping together."

**Verify:**
- Member avatars visible on plan view after a second user joins
- Solo: "Clear checked" still fires immediately
- Shared plan: "Clear checked" shows confirmation drawer, affects all members on confirm
- Owner can copy link, generate a new link (old link 404s), and revoke link
- Onboarding empty state mentions sharing

---

### PR 3 — Offline Mode

**Tasks:**

#### T6: Queue changes and sync on reconnect
- Add `_isOnline` / `_setIsOnline` to `src/store/store.ts` (not persisted)
- Add `_syncQueue` to `partialize` in `store.ts` so failed intents survive page reloads
  - Add `timestamp` to `SyncIntent` type so intents older than 24h are discarded on startup
  - Add max queue length guard (50 intents, FIFO eviction)
- Modify `src/store/syncSubscriber.ts`: skip draining when `_isOnline === false`
- New `src/hooks/useOnlineSync.ts`: listen for `window` `online`/`offline` events; drain queue on reconnect
- New `src/components/OfflineBanner.tsx`: sticky banner when offline ("You're offline — changes will sync when you reconnect")
- Mount `useOnlineSync` and `<OfflineBanner />` in root layout

**Note:** Full Service Worker Background Sync (SyncManager API) is out of scope — too complex and limited browser support. The persisted queue approach handles the common case.

**Verify:**
- DevTools → Network → Offline; check off a shopping item — local update works, banner appears
- Restore network — item syncs to Supabase, banner disappears
- Reload while offline — checked state persists (localStorage), banner re-appears
- Queue drains cleanly on reconnect, no duplicate writes

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
                                                          M5 (Share Link) ✅
                                                                │
                                                                v
                                                          M6 (Join Plan) ✅
                                                                │
                                                                v
                                                          M7 (Shared Shopping) ✅
                                                                │
                                                                v
                                                          M8 (Full Collab) ✅
                                                                │
                                                                v
                                                          M9 (Polish)  ← current
                                                            ├── PR1: Membership Actions
                                                            ├── PR2: UI Polish
                                                            └── PR3: Offline Mode
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
