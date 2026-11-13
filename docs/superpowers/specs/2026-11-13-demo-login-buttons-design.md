# Demo Login Buttons Design

**Date:** 2026-11-13
**Scope:** `src/app/features/auth/login`

## Goal

Add one-click **"Login as Demo Buyer"**, **"Login as Demo Seller"**, and **"Login as Demo Admin"** buttons to the sign-in page (`LoginComponent`) so reviewers and demo users can authenticate immediately into any role across both development and production builds while keeping the UI clean and uncluttered.

## Requirements & Constraints

- **Accounts:**
  - Demo Buyer: `buyer1@jomla.test` / `Password123!`
  - Demo Seller: `seller1@jomla.test` / `Password123!`
  - Demo Admin: `admin@jomla.test` / `Admin123!`
- **Clean UI:** Do not render raw demo email or password text in the UI; keep credentials internal to the button handlers.
- **Always Visible:** Render the demo shortcut buttons in all environments (both development and production builds).
- **One-Click Flow:** Clicking any demo button fills the form with that demo account's credentials and immediately authenticates via `AuthService.loginWithData`.

## UI & Visual Design

All UI choices follow [DESIGN.md](../../../DESIGN.md) and the `product` register guidelines:

1. **Placement & Hierarchy:**
   - Render `.demo-shortcuts` directly below the `<form>` inside `.form-side` in `login.component.html`, separated by the existing `1px solid var(--border)` top rule defined in `login.component.css`.
   - Keep **"Log in"** as the sole filled `.btn-primary` control so the primary action hierarchy remains unmistakable (respecting the 10% Accent Rule).
2. **Label & Contrast:**
   - Display a concise sentence-case caption (`"Quick demo access"`) above the demo buttons.
   - Use `var(--text-secondary)` (`#6B7280`) rather than `var(--text-muted)` (`#9CA3AF`) on `#FFFFFF` so caption text meets the `>= 4.5:1` contrast requirement.
3. **Button Styling & Responsiveness:**
   - Render three pill buttons (`class="btn btn-outline btn-sm demo-btn"`):
     - `Login as Demo Buyer` (`buyer1@jomla.test`)
     - `Login as Demo Seller` (`seller1@jomla.test`)
     - `Login as Demo Admin` (`admin@jomla.test`, spanning full row width below Buyer & Seller on desktop)
   - Use a responsive CSS grid container (`.demo-buttons`):
     - On default/desktop widths (`>= 440px`): `grid-template-columns: repeat(2, minmax(0, 1fr))` with `gap: 0.75rem`, placing Buyer and Seller side-by-side on row 1 and `.demo-btn-admin { grid-column: 1 / -1; }` on row 2.
     - On narrow mobile viewports (`< 440px`): collapse to `grid-template-columns: 1fr` so all three buttons stack full-width cleanly with zero overflow.
   - Rely on the global `.btn` / `.btn-outline` styles (`border-radius: 9999px`, flat at rest, `2px` `--brand` `:focus-visible` outline, disabled opacity `0.6`) and avoid adding decorative shadows at rest.

## Component Architecture & Data Flow

Keep demo login logic localized to `LoginComponent` (`src/app/features/auth/login/login.component.ts`) without modifying `AuthService`:

1. **Demo Account Map:**
   Define `type DemoRole = 'buyer' | 'seller' | 'admin';` at module scope and store the demo credentials inside `LoginComponent`:
   ```ts
   private readonly demoAccounts: Record<DemoRole, { email: string; password: string }> = {
     buyer: { email: 'buyer1@jomla.test', password: 'Password123!' },
     seller: { email: 'seller1@jomla.test', password: 'Password123!' },
     admin: { email: 'admin@jomla.test', password: 'Admin123!' },
   };
   ```
2. **Submission Source State:**
   - Add `protected activeSubmit = signal<'form' | DemoRole | null>(null);` alongside `loading()`.
   - When `loading()` is `true`, disable the primary `"Log in"` button and all three demo buttons (`[disabled]="loading()"`).
   - Display `"Signing in…"` only on the button matching `activeSubmit()` (`'form'`, `'buyer'`, `'seller'`, or `'admin'`), while the other buttons retain their resting labels.
3. **Shared Execution Path:**
   - `protected submit()`: sets `submitted.set(true)`, validates `this.form`, and if valid delegates to `private performLogin('form')`.
   - `protected loginAsDemo(role: DemoRole)`:
     - Returns immediately if `this.loading()` is `true`.
     - Resets `submitted.set(false)` and `errorMsg.set('')`.
     - Updates the form via `this.form.setValue(this.demoAccounts[role])`.
     - Calls `this.performLogin(role)`.
   - `private performLogin(source: 'form' | DemoRole)`:
     - Sets `this.loading.set(true)`, `this.activeSubmit.set(source)`, and `this.errorMsg.set('')`.
     - Calls `this.auth.loginWithData(...)` with the trimmed `email` and verbatim `password` from `this.form.getRawValue()`.
     - **On success:** clears `loading` and `activeSubmit`, shows `this.toast.success('Welcome back!', 'You have been signed in.')`, and routes using existing role logic (`/admin` for Admin, `/discover` for Buyer, `/supplier/requests` for Seller/Supplier).
     - **On error:** clears `loading` and `activeSubmit`, populates `errorMsg` (`err?.error?.detail || err?.error?.title || 'Invalid credentials'`), and shows `this.toast.error('Sign in failed', this.errorMsg())`.

## Verification Strategy

1. **Build Check:** Run `npm run build` (`ng build`) and confirm exit code `0` with zero TypeScript, template, or budget errors.
2. **Browser Inspection:** Start the dev server (`npm start` or `ng serve`) and verify `/login` in a live browser at desktop and mobile viewport widths:
   - Confirm all three buttons render cleanly beneath the divider with proper contrast, focus rings, and responsive 2+1 / 1-column layout without overflow.
   - Verify clicking each demo button (`Buyer`, `Seller`, `Admin`) populates credentials, transitions only the clicked button to `"Signing in…"`, disables all four sign-in buttons while in flight, and triggers `POST /api/auth/login` with the expected email and password.
