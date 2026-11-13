# Demo Login Buttons Design

**Date:** 2026-11-13
**Scope:** `src/app/features/auth/login`

## Goal

Add one-click **"Login as Demo Buyer"** and **"Login as Demo Seller"** buttons to the sign-in page (`LoginComponent`) so reviewers and demo users can authenticate immediately into either role across both development and production builds while keeping the UI clean and uncluttered.

## Requirements & Constraints

- **Accounts:**
  - Demo Buyer: `buyer1@jomla.test` / `Password123!`
  - Demo Seller: `seller1@jomla.test` / `Password123!`
- **Clean UI:** Do not render raw demo email or password text in the UI; keep credentials internal to the button handlers.
- **Always Visible:** Render the demo shortcut buttons in all environments (both development and production builds).
- **One-Click Flow:** Clicking either button fills the form with that demo account's credentials and immediately authenticates via `AuthService.loginWithData`.

## UI & Visual Design

All UI choices follow [DESIGN.md](../../../DESIGN.md) and the `product` register guidelines:

1. **Placement & Hierarchy:**
   - Render `.demo-shortcuts` directly below the `<form>` inside `.form-side` in `login.component.html`, separated by the existing `1px solid var(--border)` top rule defined in `login.component.css`.
   - Keep **"Log in"** as the sole filled `.btn-primary` control so the primary action hierarchy remains unmistakable (respecting the 10% Accent Rule).
2. **Label & Contrast:**
   - Display a concise sentence-case caption (`"Quick demo access"`) above the two buttons.
   - Use `var(--text-secondary)` (`#6B7280`) rather than `var(--text-muted)` (`#9CA3AF`) on `#FFFFFF` so caption text meets the `>= 4.5:1` contrast requirement.
3. **Button Styling & Responsiveness:**
   - Render two equal-width pill buttons (`class="btn btn-outline btn-sm demo-btn"`):
     - `Login as Demo Buyer`
     - `Login as Demo Seller`
   - Lay them out in a horizontal flex container (`display: flex; flex-wrap: wrap; gap: 0.75rem`) where each button has `flex: 1 1 11rem` so they sit side-by-side on desktop/tablet and stack cleanly without horizontal overflow on narrow mobile screens.
   - Rely on the global `.btn` / `.btn-outline` styles (`border-radius: 9999px`, flat at rest, `2px` `--brand` `:focus-visible` outline, disabled opacity `0.6`) and avoid adding decorative shadows at rest.

## Component Architecture & Data Flow

Keep demo login logic localized to `LoginComponent` (`src/app/features/auth/login/login.component.ts`) without modifying `AuthService`:

1. **Demo Account Map:**
   ```ts
   private readonly demoAccounts = {
     buyer: { email: 'buyer1@jomla.test', password: 'Password123!' },
     seller: { email: 'seller1@jomla.test', password: 'Password123!' },
   } as const;
   ```
2. **Submission Source State:**
   - Add `protected activeSubmit = signal<'form' | 'buyer' | 'seller' | null>(null);` alongside `loading()`.
   - When `loading()` is `true`, disable the primary `"Log in"` button and both demo buttons (`[disabled]="loading()"`).
   - Display `"Signing in…"` only on the button matching `activeSubmit()` (`'form'`, `'buyer'`, or `'seller'`), while the other buttons retain their resting labels.
3. **Shared Execution Path:**
   - `protected submit()`: sets `submitted.set(true)`, validates `this.form`, and if valid delegates to `private performLogin('form')`.
   - `protected loginAsDemo(role: 'buyer' | 'seller')`:
     - Returns immediately if `this.loading()` is `true`.
     - Resets `submitted.set(false)` and `errorMsg.set('')`.
     - Updates the form via `this.form.setValue(this.demoAccounts[role])`.
     - Calls `this.performLogin(role)`.
   - `private performLogin(source: 'form' | 'buyer' | 'seller')`:
     - Sets `this.loading.set(true)`, `this.activeSubmit.set(source)`, and `this.errorMsg.set('')`.
     - Calls `this.auth.loginWithData(...)` with the trimmed `email` and verbatim `password` from `this.form.getRawValue()`.
     - **On success:** clears `loading` and `activeSubmit`, shows `this.toast.success('Welcome back!', 'You have been signed in.')`, and routes using existing role logic (`/admin`, `/discover`, or `/supplier/requests`).
     - **On error:** clears `loading` and `activeSubmit`, populates `errorMsg` (`err?.error?.detail || err?.error?.title || 'Invalid credentials'`), and shows `this.toast.error('Sign in failed', this.errorMsg())`.

## Verification Strategy

1. **Build Check:** Run `npm run build` (`ng build`) and confirm exit code `0` with zero TypeScript, template, or budget errors.
2. **Browser Inspection:** Start the dev server (`npm start` or `ng serve`) and verify `/login` in a live browser at desktop and mobile viewport widths:
   - Confirm both buttons render cleanly beneath the divider with proper contrast, focus rings, and responsive wrapping.
   - Verify clicking each demo button populates credentials, transitions only the clicked button to `"Signing in…"`, disables all three sign-in buttons while in flight, and triggers `POST /api/auth/login` with the expected email and password.
