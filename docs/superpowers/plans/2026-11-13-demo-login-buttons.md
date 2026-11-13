# Demo Login Buttons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one-click "Login as Demo Buyer", "Login as Demo Seller", and "Login as Demo Admin" buttons to `LoginComponent` using the specified demo accounts across all environments.

**Architecture:** Store the three demo credentials in a readonly map inside `LoginComponent`, track which submission control is active (`'form' | 'buyer' | 'seller' | 'admin' | null`), patch the existing reactive form and reuse the shared `AuthService.loginWithData` login pipeline, and render the buttons in a clean responsive 2+1 grid below the form using existing `.demo-shortcuts` and `.btn-outline` design tokens.

**Tech Stack:** Angular 21 standalone component (`@angular/core` signals, `@angular/forms` reactive forms), SCSS/CSS design tokens (`src/styles.scss`), `AuthService`, `ToastService`, Angular CLI (`ng build`).

## Global Constraints

- Accounts (keep hidden behind button clicks; do not render raw email or password text in the UI):
  - Buyer: `buyer1@jomla.test` / `Password123!` (`Login as Demo Buyer`)
  - Seller: `seller1@jomla.test` / `Password123!` (`Login as Demo Seller`)
  - Admin: `admin@jomla.test` / `Admin123!` (`Login as Demo Admin`)
- Always visible in both development and production builds (no `!environment.production` gating).
- One-click login: populate the form and immediately submit via `AuthService.loginWithData`, disabling all four sign-in buttons during flight and displaying `"Signing in…"` only on the clicked button.
- Visual compliance with `DESIGN.md`: `>= 4.5:1` contrast (`--text-secondary` / `--brand-dark`), pill-rounded `.btn` controls, flat rest states, no uppercase tracked eyebrows.

---

### Task 1: Component State and Demo Login Handler

**Files:**
- Modify: `src/app/features/auth/login/login.component.ts:1-57`

**Interfaces:**
- Consumes: `AuthService.loginWithData({ email, password })`, `ToastService.success/error`, `Router.navigate`
- Produces: `protected activeSubmit: Signal<'form' | 'buyer' | 'seller' | 'admin' | null>`, `protected loginAsDemo(role: 'buyer' | 'seller' | 'admin'): void`, `protected submit(): void`

- [ ] **Step 1: Define `DemoRole`, `demoAccounts`, `activeSubmit`, and shared `performLogin` flow in `src/app/features/auth/login/login.component.ts`**

Replace the contents of `src/app/features/auth/login/login.component.ts` with:

```ts
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { ToastService } from '../../../core/toast.service';

type DemoRole = 'buyer' | 'seller' | 'admin';
type LoginSource = 'form' | DemoRole;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  private readonly demoAccounts: Record<DemoRole, { email: string; password: string }> = {
    buyer: { email: 'buyer1@jomla.test', password: 'Password123!' },
    seller: { email: 'seller1@jomla.test', password: 'Password123!' },
    admin: { email: 'admin@jomla.test', password: 'Admin123!' },
  };

  protected form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected submitted = signal(false);
  protected loading = signal(false);
  protected activeSubmit = signal<LoginSource | null>(null);
  protected errorMsg = signal('');
  protected showPassword = signal(false);

  protected submit() {
    this.submitted.set(true);
    if (this.loading() || this.form.invalid) return;
    this.performLogin('form');
  }

  protected loginAsDemo(role: DemoRole) {
    if (this.loading()) return;
    this.submitted.set(false);
    this.errorMsg.set('');
    this.form.setValue(this.demoAccounts[role]);
    this.performLogin(role);
  }

  private performLogin(source: LoginSource) {
    this.loading.set(true);
    this.activeSubmit.set(source);
    this.errorMsg.set('');

    const { email, password } = this.form.getRawValue();
    this.auth.loginWithData({
      email: (email ?? '').trim(),
      password: password ?? '',
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.activeSubmit.set(null);
        this.toast.success('Welcome back!', 'You have been signed in.');
        if (this.auth.isAdmin()) {
          this.router.navigate(['/admin']);
        } else if (this.auth.isBuyer()) {
          this.router.navigate(['/discover']);
        } else {
          this.router.navigate(['/supplier/requests']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.activeSubmit.set(null);
        this.errorMsg.set(err?.error?.detail || err?.error?.title || 'Invalid credentials');
        this.toast.error('Sign in failed', this.errorMsg());
      }
    });
  }
}
```

- [ ] **Step 2: Type-check the component TypeScript**

Run: `npx tsc -p tsconfig.app.json --noEmit` (or `npm run build` once template is updated in Task 2).

---

### Task 2: Demo Buttons Template & Responsive Styling

**Files:**
- Modify: `src/app/features/auth/login/login.component.html:95-103`
- Modify: `src/app/features/auth/login/login.component.css:140-145`

**Interfaces:**
- Consumes: `activeSubmit()`, `loading()`, `loginAsDemo('buyer' | 'seller' | 'admin')` from `LoginComponent`

- [ ] **Step 1: Update primary button loading label and add `.demo-shortcuts` markup in `src/app/features/auth/login/login.component.html`**

Update lines 95-101 of `src/app/features/auth/login/login.component.html`:

```html
        <button type="submit" class="btn btn-primary" style="width:100%;height:3rem;font-size:1rem"
          [disabled]="loading()" [attr.aria-busy]="activeSubmit() === 'form'">
          {{ activeSubmit() === 'form' ? 'Signing in…' : 'Log in' }}
        </button>
      </form>

      <div class="demo-shortcuts">
        <p class="demo-shortcuts-label">Quick demo access</p>
        <div class="demo-buttons">
          <button type="button" class="btn btn-outline btn-sm demo-btn" (click)="loginAsDemo('buyer')"
            [disabled]="loading()" [attr.aria-busy]="activeSubmit() === 'buyer'">
            {{ activeSubmit() === 'buyer' ? 'Signing in…' : 'Login as Demo Buyer' }}
          </button>
          <button type="button" class="btn btn-outline btn-sm demo-btn" (click)="loginAsDemo('seller')"
            [disabled]="loading()" [attr.aria-busy]="activeSubmit() === 'seller'">
            {{ activeSubmit() === 'seller' ? 'Signing in…' : 'Login as Demo Seller' }}
          </button>
          <button type="button" class="btn btn-outline btn-sm demo-btn demo-btn-admin" (click)="loginAsDemo('admin')"
            [disabled]="loading()" [attr.aria-busy]="activeSubmit() === 'admin'">
            {{ activeSubmit() === 'admin' ? 'Signing in…' : 'Login as Demo Admin' }}
          </button>
        </div>
      </div>
    </div>
```

- [ ] **Step 2: Add `.demo-shortcuts-label`, `.demo-buttons`, `.demo-btn`, and responsive `@media` styles in `src/app/features/auth/login/login.component.css`**

Update lines 140-145 of `src/app/features/auth/login/login.component.css`:

```css
.demo-shortcuts {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}
.demo-shortcuts-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 0.75rem;
}
.demo-buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}
.demo-btn {
  width: 100%;
  min-width: 0;
  padding-inline: 0.875rem;
  white-space: normal;
  text-align: center;
  line-height: 1.3;
  color: var(--brand-dark);
  border-color: var(--brand);
}
.demo-btn:hover:not(:disabled) {
  background: var(--brand-dark);
  border-color: var(--brand-dark);
  color: #fff;
}
.demo-btn-admin {
  grid-column: 1 / -1;
}
@media (max-width: 439px) {
  .demo-buttons {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Run Angular production build and Impeccable design detector**

Run:
```bash
npm run build
node .agents/skills/impeccable/scripts/detect.mjs --json src/app/features/auth/login/login.component.html src/app/features/auth/login/login.component.css
```
Expected: `npm run build` exits `0` with no errors; `detect.mjs` reports zero blocking issues on the modified files.

---

### Task 3: Live Browser Verification & Cleanup

**Files:**
- Verify: `src/app/features/auth/login/login.component.html`, `src/app/features/auth/login/login.component.ts`, `src/app/features/auth/login/login.component.css`

- [ ] **Step 1: Start local dev server (`ng serve`) and verify `/login` in a live browser**

Verify:
1. All three demo buttons (`Login as Demo Buyer`, `Login as Demo Seller`, `Login as Demo Admin`) render cleanly with no exposed emails/passwords, crisp 2+1 layout on desktop (`1280x800`), and clean single-column stacking on mobile (`375x812`).
2. Clicking each demo button populates the form, fires `POST http://localhost:5174/api/auth/login` with the exact credentials (`buyer1@jomla.test` / `Password123!`, `seller1@jomla.test` / `Password123!`, `admin@jomla.test` / `Admin123!`), shows loading state only on the clicked button, and either logs in & redirects or handles error state cleanly.
3. Stop the temporary dev server after verification.

- [ ] **Step 2: Commit implementation**

```bash
git add src/app/features/auth/login/login.component.ts src/app/features/auth/login/login.component.html src/app/features/auth/login/login.component.css
git commit -m "feat(login): add one-click demo buyer, seller, and admin buttons"
```
