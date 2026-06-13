import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MOCK_OFFERS, Offer } from '../../../core/mock-data';

@Component({
  selector: 'app-offer-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container" style="max-width:900px;padding:2rem 1rem 4rem" role="main">
      <button class="btn btn-ghost btn-sm" style="margin-bottom:1.5rem;margin-left:-0.5rem" (click)="router.navigate(['/supplier/offers'])">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Offers
      </button>

      <div class="card" style="padding:2rem">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;padding-bottom:1.5rem;border-bottom:1px solid var(--border);flex-wrap:wrap;gap:1rem">
          <div>
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem">
              <span class="badge badge-brand-light" style="color:var(--brand);text-transform:uppercase;letter-spacing:0.05em;font-size:0.7rem">Live Batch</span>
              <span style="font-size:0.8125rem;color:var(--text-secondary)">Batch #{{ offer().current_batch_id || 'N/A' }}</span>
            </div>
            <h1 style="font-size:1.5rem;font-weight:800">{{ offer().title }}</h1>
          </div>
          <div style="text-align:right">
            <div style="font-size:0.8125rem;color:var(--text-secondary);margin-bottom:0.25rem">Time Remaining</div>
            <div style="font-family:monospace;font-weight:600;display:flex;align-items:center;gap:0.5rem;justify-content:flex-end">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              23:45:12
            </div>
          </div>
        </div>

        <div style="margin-bottom:2rem">
          <div style="display:flex;justify-content:space-between;font-size:0.875rem;font-weight:500;margin-bottom:0.5rem">
            <span style="color:var(--brand)">{{ offer().committed_units }} of {{ offer().hub_target_quantity }} units committed</span>
            <span style="color:var(--text-secondary)">{{ progress() }}%</span>
          </div>
          <div class="progress-track" style="height:16px">
            <div class="progress-fill" [style.width.%]="progress()"></div>
          </div>
        </div>

        <div style="background:#F9FAFB;border-radius:12px;padding:1.5rem;display:flex;flex-direction:column;gap:1rem">

          <div>
            <h4 style="font-weight:700;margin-bottom:0.375rem">Batch Status</h4>
            <p style="font-size:0.9375rem;color:var(--text-secondary)">This batch is currently open. Once the target is met or time expires, it will automatically close.</p>
          </div>
          <div style="display:flex;gap:0.75rem;flex-shrink:0">
            <button class="btn btn-outline">Deactivate Offer</button>
            <button class="btn btn-primary" (click)="router.navigate(['/manage/offers', offer().id])">Manage Details</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @media (min-width: 640px) {
      .card > div:last-child { flex-direction: row; align-items: center; justify-content: space-between; }
    }
  `],
})
export class OfferDetailComponent {
  protected router = inject(Router);
  protected offer = signal<Offer>(MOCK_OFFERS[0]);

  protected progress() {
    const o = this.offer();
    return o.hub_target_quantity > 0 ? Math.round((o.committed_units / o.hub_target_quantity) * 100) : 0;
  }
}
