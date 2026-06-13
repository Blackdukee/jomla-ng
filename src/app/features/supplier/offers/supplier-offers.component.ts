import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_SUPPLIER_OFFERS, Offer } from '../../../core/mock-data';

@Component({
  selector: 'app-supplier-offers',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container" style="max-width:1000px;padding:2rem 1rem 3rem" role="main">
      <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:2rem">
        <div>
          <h1 style="font-size:2rem;font-weight:800;margin-bottom:0.25rem">My Offers</h1>
          <p style="color:var(--text-secondary)">Manage your posted deals.</p>
        </div>
        <a routerLink="/supplier/offers/new" class="btn btn-primary" style="display:flex;align-items:center;gap:0.5rem">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Offer
        </a>
      </div>

      <div class="seg-control" style="margin-bottom:1.5rem" role="tablist" aria-label="Offer status">
        <button role="tab" [class]="tab() === 'active' ? 'active' : ''" [attr.aria-selected]="tab() === 'active'" (click)="tab.set('active')">Active</button>
        <button role="tab" [class]="tab() === 'inactive' ? 'active' : ''" [attr.aria-selected]="tab() === 'inactive'" (click)="tab.set('inactive')">Inactive</button>
        <button role="tab" [class]="tab() === 'expired' ? 'active' : ''" [attr.aria-selected]="tab() === 'expired'" (click)="tab.set('expired')">Expired</button>
      </div>

      @if (filteredOffers().length === 0) {
        <div style="padding:5rem 2rem;text-align:center;background:#F9FAFB;border:1px dashed var(--border);border-radius:16px;color:var(--text-secondary)" aria-live="polite">
          No {{ tab() }} offers found.
        </div>
      } @else {
        <div style="display:flex;flex-direction:column;gap:1rem">
          @for (offer of filteredOffers(); track offer.id) {
            <a [routerLink]="['/supplier/offers', offer.id]" class="card card-hover offer-row">
              <!-- Image thumb -->
              <div class="offer-thumb" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:#D1D5DB">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>

              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.375rem">
                  <span class="badge badge-brand-light" style="color:var(--brand)">-{{ offer.discount_percent }}%</span>
                  @if (offer.current_batch_id) {
                    <span style="font-size:0.8125rem;color:var(--text-secondary);font-weight:500">Batch #{{ offer.current_batch_id }}</span>
                  }
                </div>
                <h3 style="font-size:1.0625rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:0.25rem">{{ offer.title }}</h3>
                <div style="font-size:0.875rem;color:var(--text-secondary)">{{ offer.total_quantity_available - offer.committed_units }} units remaining</div>
              </div>

              @if (tab() === 'active') {
                <div style="width:180px;flex-shrink:0" class="hide-mobile">
                  <div style="display:flex;justify-content:space-between;font-size:0.75rem;font-weight:500;margin-bottom:0.375rem">
                    <span style="color:var(--brand)">{{ offer.committed_units }} committed</span>
                    <span style="color:var(--text-secondary)">{{ progress(offer) }}%</span>
                  </div>
                  <div class="progress-track" style="height:6px">
                    <div class="progress-fill" [style.width.%]="progress(offer)"></div>
                  </div>
                </div>
              }

              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-muted);flex-shrink:0" class="hide-mobile" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .offer-row { display:flex; align-items:center; gap:1rem; padding:1.25rem; text-decoration:none; color:inherit; cursor:pointer; }
    .offer-thumb { width:4rem; height:4rem; border-radius:10px; background:#F3F4F6; border:1px solid var(--border); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  `],
})
export class SupplierOffersComponent {
  protected tab = signal<'active' | 'inactive' | 'expired'>('active');
  protected filteredOffers = computed(() => MOCK_SUPPLIER_OFFERS.filter(o => {
    if (this.tab() === 'active') return o.status === 'open';
    if (this.tab() === 'expired') return o.status === 'failed';
    return false;
  }));

  protected progress(o: Offer) {
    return o.hub_target_quantity > 0 ? Math.round((o.committed_units / o.hub_target_quantity) * 100) : 0;
  }
}
