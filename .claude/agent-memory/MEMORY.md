# Coder Agent Memory

## Environment Notes
- `node_modules` is not installed in this environment - `npm run build` will fail with "next: not found"
- Use `tsc --noEmit` to check for TypeScript errors instead
- All `tsc` errors from `e2e/` and many from `src/` are pre-existing "Cannot find module" errors due to missing node_modules - not bugs in changed code
- The binary `tsc` is at `/opt/node22/bin/tsc`

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
