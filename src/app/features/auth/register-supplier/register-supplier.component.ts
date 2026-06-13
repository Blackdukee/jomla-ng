import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { ToastService } from '../../../core/toast.service';
import { MOCK_CATEGORIES, Category } from '../../../core/mock-data';

@Component({
  selector: 'app-register-supplier',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-page" role="main">
      <div class="auth-card card">
        <!-- Progress bar -->
        <div class="progress-bar-steps" aria-label="Registration step {{ step() }} of 2">
          <div class="step-bar" [class.active]="step() >= 1"></div>
          <div class="step-bar" [class.active]="step() >= 2"></div>
        </div>
        <div class="step-indicator">Step {{ step() }} of 2 — {{ step() === 1 ? 'Your account' : 'Your categories' }}</div>

        <div class="auth-logo">
          <div class="logo-icon-lg" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              <polyline points="2 17 12 22 22 17"/>
              <polyline points="2 12 12 17 22 12"/>
            </svg>
          </div>
          <h1 class="auth-heading">{{ step() === 1 ? 'Join as a supplier' : 'Select your categories' }}</h1>
          @if (step() === 1) {
            <p class="auth-sub">Already have an account? <a routerLink="/login" class="link">Log in</a></p>
          } @else {
            <p class="auth-sub">You'll be notified about group requests in these categories.</p>
          }
        </div>

        @if (step() === 1) {
          <form [formGroup]="accountForm" (ngSubmit)="nextStep()" novalidate class="auth-form">
            <div class="form-group">
              <label class="form-label" for="company">Company Name</label>
              <input id="company" type="text" class="form-input" formControlName="full_name" autocomplete="organization" placeholder="Acme Corp"
                [class.error]="step1Submitted() && accountForm.controls['full_name'].invalid">
              @if (step1Submitted() && accountForm.controls['full_name'].invalid) {
                <span class="form-error" role="alert">Company name is required.</span>
              }
            </div>
            <div class="form-group">
              <label class="form-label" for="email">Email address</label>
              <input id="email" type="email" class="form-input" formControlName="email" autocomplete="email" placeholder="sales@acmecorp.com"
                [class.error]="step1Submitted() && accountForm.controls['email'].invalid">
              @if (step1Submitted() && accountForm.controls['email'].invalid) {
                <span class="form-error" role="alert">Valid email required.</span>
              }
            </div>
            <div class="form-group">
              <label class="form-label" for="password">Password</label>
              <input id="password" type="password" class="form-input" formControlName="password" autocomplete="new-password" placeholder="••••••••"
                [class.error]="step1Submitted() && accountForm.controls['password'].invalid">
              @if (step1Submitted() && accountForm.controls['password'].invalid) {
                <span class="form-error" role="alert">Password must be at least 8 characters.</span>
              }
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;height:3rem;font-size:1rem">Continue →</button>
          </form>
        } @else {
          <div class="cat-scroll">
            @for (cat of categories; track cat.id) {
              <div class="cat-row">
                <div style="display:flex;align-items:center;gap:0.625rem">
                  <input type="checkbox" [id]="'cat-' + cat.id" class="checkbox"
                    [checked]="isSelected(cat.id)"
                    (change)="toggleCat(cat.id)"
                    [attr.aria-label]="cat.name">
                  <label [for]="'cat-' + cat.id" class="cat-label">{{ cat.name }}</label>
                </div>
                @if (isSelected(cat.id)) {
                  <div class="qty-row">
                    <label [for]="'qty-' + cat.id" style="font-size:0.8125rem;color:var(--text-secondary);white-space:nowrap">Notify me when quantity reaches</label>
                    <input [id]="'qty-' + cat.id" type="number" min="1" class="form-input qty-input"
                      [value]="getMinQty(cat.id)"
                      (input)="setMinQty(cat.id, +$any($event.target).value)">
                  </div>
                }
                @if (cat.children) {
                  @for (sub of cat.children; track sub.id) {
                    <div class="sub-row">
                      <div style="display:flex;align-items:center;gap:0.625rem">
                        <input type="checkbox" [id]="'cat-' + sub.id" class="checkbox"
                          [checked]="isSelected(sub.id)"
                          (change)="toggleCat(sub.id)"
                          [attr.aria-label]="sub.name">
                        <label [for]="'cat-' + sub.id" class="cat-label" style="font-weight:400">{{ sub.name }}</label>
                      </div>
                      @if (isSelected(sub.id)) {
                        <div class="qty-row">
                          <label [for]="'qty-' + sub.id" style="font-size:0.8125rem;color:var(--text-secondary);white-space:nowrap">Notify me when quantity reaches</label>
                          <input [id]="'qty-' + sub.id" type="number" min="1" class="form-input qty-input"
                            [value]="getMinQty(sub.id)"
                            (input)="setMinQty(sub.id, +$any($event.target).value)">
                        </div>
                      }
                    </div>
                  }
                }
              </div>
            }
          </div>

          @if (catError()) {
            <div class="form-error" role="alert" style="margin-bottom:0.5rem">{{ catError() }}</div>
          }

          <div style="display:flex;gap:0.75rem;margin-top:1rem">
            <button type="button" class="btn btn-outline" style="height:3rem;padding:0 1.5rem" (click)="step.set(1)">Back</button>
            <button type="button" class="btn btn-primary" style="flex:1;height:3rem;font-size:1rem"
              [disabled]="loading()" (click)="finish()">
              {{ loading() ? 'Creating account…' : 'Create account' }}
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height:calc(100vh - 64px); display:flex; align-items:center; justify-content:center; padding:2rem 1rem; background:#F9FAFB; }
    .auth-card { width:100%; max-width:520px; padding:2.5rem; }
    .progress-bar-steps { display:flex; gap:0.375rem; margin-bottom:0.375rem; }
    .step-bar { flex:1; height:4px; border-radius:9999px; background:var(--border); transition:background 0.3s; }
    .step-bar.active { background:var(--brand); }
    .step-indicator { font-size:0.8125rem; color:var(--text-secondary); margin-bottom:1.5rem; font-weight:500; }
    .auth-logo { display:flex; flex-direction:column; align-items:center; text-align:center; margin-bottom:2rem; }
    .logo-icon-lg { background:var(--brand); color:#fff; padding:0.875rem; border-radius:14px; display:flex; align-items:center; justify-content:center; margin-bottom:1.25rem; }
    .auth-heading { font-size:1.75rem; font-weight:800; margin-bottom:0.5rem; }
    .auth-sub { font-size:0.9375rem; color:var(--text-secondary); }
    .link { color:var(--brand); text-decoration:none; font-weight:500; }
    .auth-form { display:flex; flex-direction:column; gap:1.25rem; }
    .cat-scroll { max-height:55vh; overflow-y:auto; padding-right:0.25rem; display:flex; flex-direction:column; gap:1rem; margin-bottom:1rem; }
    .cat-row { display:flex; flex-direction:column; gap:0.5rem; }
    .cat-label { font-size:1rem; font-weight:600; cursor:pointer; }
    .sub-row { margin-left:1.5rem; display:flex; flex-direction:column; gap:0.375rem; }
    .qty-row { margin-left:1.75rem; display:flex; align-items:center; gap:0.75rem; margin-top:0.25rem; }
    .qty-input { width:100px; border-radius:9999px; height:2rem; padding:0 0.75rem; }
    .checkbox { width:1rem; height:1rem; accent-color:var(--brand); cursor:pointer; flex-shrink:0; }
  `],
})
export class RegisterSupplierComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  protected step = signal<1 | 2>(1);
  protected step1Submitted = signal(false);
  protected loading = signal(false);
  protected catError = signal('');

  protected categories = MOCK_CATEGORIES;

  protected accountForm = this.fb.group({
    full_name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  private selectedCats = new Map<number, number>(); // categoryId -> minQty

  protected isSelected(id: number) { return this.selectedCats.has(id); }
  protected getMinQty(id: number) { return this.selectedCats.get(id) ?? 1; }

  protected toggleCat(id: number) {
    if (this.selectedCats.has(id)) this.selectedCats.delete(id);
    else this.selectedCats.set(id, 1);
  }

  protected setMinQty(id: number, qty: number) {
    if (this.selectedCats.has(id)) this.selectedCats.set(id, Math.max(1, qty || 1));
  }

  protected nextStep() {
    this.step1Submitted.set(true);
    if (this.accountForm.invalid) return;
    this.step.set(2);
  }

  protected finish() {
    if (this.selectedCats.size === 0) {
      this.catError.set('Please select at least one category.');
      return;
    }
    this.catError.set('');
    this.loading.set(true);
    setTimeout(() => {
      const val = this.accountForm.value as { full_name: string; email: string; password: string };
      this.auth.registerSupplier(val);
      this.loading.set(false);
      this.toast.success('Welcome to Jomla!', 'Your supplier account is ready.');
      this.router.navigate(['/supplier/requests']);
    }, 700);
  }
}
