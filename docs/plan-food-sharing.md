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
- No user accounts or authentication
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

## Milestone 2: Authentication with Supabase Auth

**What:** Add user accounts so data can be associated with a specific person. Keep it simple - email magic link or OAuth (Google).

**Tasks:**
- Configure Supabase Auth provider (Google OAuth recommended for lowest friction)
- Create sign-in / sign-out UI (minimal - a button in a header or settings area)
- Add middleware for session refresh (`src/middleware.ts`)
- Protect no routes yet - auth is optional at this stage

**Verify:**
- Can sign in with Google (or chosen provider) and see session info
- Can sign out
- User record is created in `auth.users` on first sign-in
- Existing app still works identically for signed-out users (localStorage path unchanged)

---

## Milestone 3: API Routes for CRUD Operations

**What:** Create server-side API routes (or direct Supabase client calls) that read and write meal plans, recipes, and shopping list state to the database. These routes are not wired to the UI yet.

**Tasks:**
- Create a data access layer (`src/lib/supabase/queries.ts`) for:
  - Create/read/update meal plans
  - Add/remove/swap meals within a plan
  - Read/update shopping list checked items
  - Save/list/delete user recipes
- Enable Row Level Security (RLS) policies on all tables
- Add auth checks — users can only access their own data

**Verify:**
- Each operation works correctly when tested
- RLS prevents cross-user data access
- Data persists in the database across requests
- Existing app still works with localStorage (UI not yet connected)

---

## Milestone 4: Migrate Zustand Store to Use API

**What:** When a user is signed in, the store reads/writes to the database via API routes instead of localStorage. When signed out, localStorage continues to work as before.

**Tasks:**
- Create an abstraction layer (e.g., `src/lib/storage.ts`) that switches between localStorage and API calls based on auth state
- Update Zustand store actions to call the storage layer
- Handle loading states (data now comes from network, not synchronous localStorage)
- Add optimistic updates - update local state immediately, sync to server in background
- Handle errors (show Alert component if sync fails, allow retry)

**Verify:**
- Sign in: data loads from database, changes persist to database
- Sign out: data loads from localStorage, changes persist to localStorage
- Creating a plan, swapping meals, checking shopping items all work identically to before
- Refresh the page while signed in: data reloads from database correctly
- Slow network: optimistic UI feels responsive, errors surface gracefully
- Run existing Playwright tests: all pass

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
- **Migrating existing localStorage data** to the database on first sign-in (could be a follow-up)

---

## Dependency Summary

```
M1 (Supabase DB) ✅ ──> M2 (Auth) ──> M3 (API/RLS) ──> M4 (Store Migration)
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
