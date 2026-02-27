# Coder Agent Memory

## Environment Notes
- `node_modules` may not be installed; run `npm install` first (npm is in PATH)
- `npm run build` fails in sandbox due to TLS errors fetching Google Fonts — this is a sandbox networking limitation, not a code error
- Use `npx tsc --noEmit` to verify TypeScript correctness without needing network access

## Design Token Conventions
- Replace arbitrary Tailwind values with standard utilities: `rounded-[16px]` -> `rounded-2xl`, `text-[2rem]` -> `text-4xl`, `text-[10px]` -> `text-xs`
- Touch targets: `min-h-11 min-w-11 flex items-center justify-center` for icon-only/small buttons (44px via --space-11 token, NOT arbitrary `[44px]`)
- Display font for h1: `font-display font-normal` (NOT `font-semibold`)
- Confirmation drawers: Cancel button always FIRST, destructive action SECOND
- External links styled as buttons: `cn(buttonVariants({ variant: 'primary' }), 'additional-classes')`
- `SectionHeading` shared component: `src/components/dashboard/SectionHeading.tsx` (used in UpNextCard and ShoppingStatusCard)

## Store shape
- `currentPlan: MealPlan | null` — meals nested inside (no top-level `meals` field in AppState)
- `_planRole: PlanRole | null` — NOT persisted; set at hydration from server
- `checkedItems: Record<string, string>` — persisted
- `customShoppingItems: CustomShoppingListItem[]` — persisted
- `_syncQueue: SyncIntent[]` — persisted (as of M9 PR3); stale intents (>24h) discarded on rehydration
- `_isOnline: boolean` — NOT persisted; default true; managed by `useOnlineSync` hook
- Reset plan: `set({ currentPlan: null, checkedItems: {}, customShoppingItems: [], _planRole: null })`
- `_clearCurrentPlan()` exists in the store for this exact purpose

## SyncIntent / _pushSync pattern
- All `SyncIntent` union members have `timestamp: number`
- Call sites use `SyncIntentInput = DistributiveOmit<SyncIntent, 'timestamp'>` — timestamp stamped inside `_pushSync`
- NEVER use plain `Omit<UnionType, K>` — it collapses to `never`. Use distributive form:
  `type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never`

## Offline sync flow
- `useOnlineSync` hook (src/hooks/useOnlineSync.ts): sets initial state from `navigator.onLine`, listens for window online/offline events
- `syncSubscriber` skips drain when `_isOnline === false`; setting `_isOnline(true)` triggers subscriber automatically (it subscribes to ALL store changes)
- `onRehydrateStorage` callback in persist config filters out intents older than 86400000ms on page load

## Realtime patterns
- Channel per plan: `supabase.channel('meal-plan-${planId}')` subscribing to `postgres_changes`
- meal_plans DELETE events require `REPLICA IDENTITY FULL` + publication (done in migration 00008)
- Members receive plan deletion via realtime and call `_clearCurrentPlan()`

## UI Patterns
- Drawer: `isOpen`, `onClose`, `title`, `children` — children own the button layout (no built-in actions prop)
- Button destructive style: apply `className="bg-destructive text-destructive-foreground"` (no built-in destructive variant)
- `--color-destructive` and `--color-destructive-foreground` are mapped in `src/app/globals.css`

## Schema / DB notes
- `user_email` column in `plan_members` added in migration 00009 — NOT in generated supabase types yet
- Run `npm run db:gen-types` against a live DB to regenerate `src/types/supabase.ts`
- Extra fields in upsert are not type-checked strictly enough to block build
- Selecting `user_email` from `plan_members` causes a `SelectQueryError` type at build time; workaround: cast `supabase` as `any` and annotate the return type manually. Pattern used in `getPlanMembersAction`.

## Button Component Patterns
- `src/components/ui/Button.tsx` uses `forwardRef` with inline styles (no Tailwind classes on the element itself)
- To add a prop that affects `disabled`, compute `isDisabled` and pass `disabled={isDisabled}` AFTER `{...props}` spread to override
- Spinner uses `currentColor` so it automatically inherits variant text color
- `@keyframes spin` lives in `src/styles/tokens.css` (global styles file)

## Sign-In Page (`src/app/auth/signin/page.tsx`)
- OTP sign-in flow: email -> `submitted` state -> OTP entry -> verify
- State: `loading` (email submit), `verifying` (OTP verify), `submitted` (OTP form shown)
- `data-testid` values: `signin-page`, `email-input`, `send-magic-link-btn`, `otp-input`, `verify-btn`, `resend-btn`, `signin-success`, `signin-error`

## Storybook Patterns
- Stories file: `src/components/ui/Button.stories.tsx`
- Add new props to `argTypes` with appropriate control type
- Use `args` for single-story props, `render` for multi-variant showcase stories
- Story order convention: Primary, Secondary, Ghost, Small, Disabled, Loading, LoadingVariants, AllVariants
