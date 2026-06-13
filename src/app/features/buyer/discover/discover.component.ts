import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { inject } from '@angular/core';
import { MOCK_OFFERS, MOCK_REQUESTS, MOCK_CATEGORIES, Offer, GroupRequest } from '../../../core/mock-data';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container" style="padding-top:2rem;padding-bottom:3rem" role="main">
      <!-- Page header -->
      <div style="margin-bottom:2rem">
        <h1 style="font-size:2rem;font-weight:800;margin-bottom:0.25rem">Discover</h1>
        <p style="color:var(--text-secondary)">Find active group deals or join buyer requests.</p>
      </div>

      <!-- Controls row -->
      <div class="controls-row">
        <!-- Segmented control -->
        <div class="seg-control" role="tablist" aria-label="Content type">
          <button role="tab" [class]="tab() === 'offers' ? 'active' : ''"
            [attr.aria-selected]="tab() === 'offers'"
            (click)="tab.set('offers')" id="tab-offers" aria-controls="panel-offers">
            Supplier Offers
          </button>
          <button role="tab" [class]="tab() === 'requests' ? 'active' : ''"
            [attr.aria-selected]="tab() === 'requests'"
            (click)="tab.set('requests')" id="tab-requests" aria-controls="panel-requests">
            Group Requests
          </button>
        </div>

        <!-- Filters -->
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
          <select class="filter-select" [value]="catFilter()" (change)="onCatChange($event)" aria-label="Filter by category">
            <option value="all">All Categories</option>
            @for (cat of categories; track cat.id) {
              <option [value]="cat.id">{{ cat.name }}</option>
            }
          </select>
          <select class="filter-select" [value]="sort()" (change)="onSortChange($event)" aria-label="Sort offers">
            <option value="newest">Newest First</option>
            <option value="most_buyers">Most Buyers</option>
            <option value="most_filled">Closest to Target</option>
          </select>
        </div>
      </div>

      <!-- Offers grid -->
      @if (tab() === 'offers') {
        <div id="panel-offers" role="tabpanel" aria-labelledby="tab-offers">
          @if (filteredOffers().length === 0) {
            <div class="empty-state" aria-live="polite">No active offers found. Check back later.</div>
          } @else {
            <div class="offers-grid">
              @for (offer of filteredOffers(); track offer.id) {
                <article class="card card-hover offer-card" (click)="goToHub(offer)" style="cursor:pointer" [attr.aria-label]="offer.title + ' group deal'">
                  <div class="offer-img-wrap">
                    <div class="offer-img-placeholder" aria-hidden="true">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:#D1D5DB">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                    <span class="badge badge-brand discount-badge">-{{ offer.discount_percent }}%</span>
                    <span class="badge badge-muted category-badge">{{ offer.category_name }}</span>
                  </div>
                  <div class="offer-body">
                    <div style="font-size:0.8125rem;color:var(--text-secondary);margin-bottom:0.25rem">{{ offer.supplier_name }}</div>
                    <h3 style="font-size:1.0625rem;font-weight:600;line-height:1.3;margin-bottom:0.75rem;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">{{ offer.title }}</h3>

                    <div class="offer-pricing">
                      <span class="offer-price">EGP {{ offer.discounted_price }}</span>
                      <span class="offer-price-orig">EGP {{ offer.unit_price }}</span>
                    </div>

                    <div style="display:flex;justify-content:space-between;margin-bottom:0.375rem">
                      <span style="font-size:0.8125rem;font-weight:600;color:var(--brand)">{{ offer.committed_units }} of {{ offer.hub_target_quantity }}</span>
                      <span style="font-size:0.8125rem;color:var(--text-secondary)">{{ progress(offer) }}%</span>
                    </div>
                    <div class="progress-track" style="height:6px;margin-bottom:0.625rem">
                      <div class="progress-fill" [style.width.%]="progress(offer)"></div>
                    </div>
                    <div style="display:flex;align-items:center;gap:0.375rem;font-size:0.8125rem;color:var(--text-secondary);margin-bottom:1rem">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      {{ offer.buyer_count }} buyers joined
                    </div>

                    <button class="btn btn-primary" style="width:100%"
                      (click)="$event.stopPropagation(); joinHub(offer)"
                      [disabled]="offer.hub_target_quantity - offer.committed_units <= 0">
                      {{ offer.hub_target_quantity - offer.committed_units <= 0 ? 'Hub full' : 'Join hub' }}
                    </button>
                  </div>
                </article>
              }
            </div>
          }
        </div>
      }

      <!-- Requests list -->
      @if (tab() === 'requests') {
        <div id="panel-requests" role="tabpanel" aria-labelledby="tab-requests">
          @if (requests.length === 0) {
            <div class="empty-state" aria-live="polite">No active group requests found.</div>
          } @else {
            <div style="display:flex;flex-direction:column;gap:1rem">
              @for (req of requests; track req.id) {
                <a [routerLink]="['/hubs/request', req.id]" class="card request-row card-hover" [attr.aria-label]="req.description + ', ' + req.quantity + ' units'">
                  <div style="flex:1;min-width:0">
                    <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;flex-wrap:wrap">
                      <span class="badge badge-muted">{{ req.category_name || 'Uncategorized' }}</span>
                      <span class="badge badge-brand-light">Active</span>
                    </div>
                    <h3 style="font-size:1.0625rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:0.375rem">{{ req.description }}</h3>
                    <div style="display:flex;align-items:center;gap:1rem;font-size:0.875rem;color:var(--text-secondary)">
                      <span style="font-weight:600;color:var(--text-primary)">{{ req.quantity }} units</span>
                      <span style="display:flex;align-items:center;gap:0.25rem">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        </svg>
                        {{ req.buyer_count }} buyers
                      </span>
                    </div>
                  </div>
                  <div style="display:flex;align-items:center;gap:0.5rem;color:var(--text-secondary);flex-shrink:0">
                    <span class="hide-mobile" style="font-size:0.875rem;font-weight:500">Join hub</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                </a>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .controls-row { display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap; margin-bottom:1.5rem; }
    .filter-select { border:1px solid var(--border); border-radius:9999px; padding:0.5rem 1rem; font-size:0.875rem; background:var(--bg-surface); color:var(--text-primary); cursor:pointer; font-family:inherit; }
    .filter-select:focus { outline:2px solid var(--brand); }
    .offers-grid { display:grid; grid-template-columns:1fr; gap:1.25rem; }
    @media (min-width:640px) { .offers-grid { grid-template-columns:repeat(2, 1fr); } }
    @media (min-width:1024px) { .offers-grid { grid-template-columns:repeat(3, 1fr); } }
    .offer-card { display:flex; flex-direction:column; overflow:hidden; }
    .offer-img-wrap { aspect-ratio:4/3; background:#F3F4F6; position:relative; display:flex; align-items:center; justify-content:center; border-radius:12px 12px 0 0; }
    .offer-img-placeholder { display:flex; align-items:center; justify-content:center; }
    .discount-badge { position:absolute; top:0.75rem; right:0.75rem; }
    .category-badge { position:absolute; top:0.75rem; left:0.75rem; }
    .offer-body { padding:1.25rem; display:flex; flex-direction:column; flex:1; }
    .offer-pricing { display:flex; align-items:baseline; gap:0.625rem; margin-bottom:0.75rem; }
    .offer-price { font-size:1.375rem; font-weight:800; }
    .offer-price-orig { font-size:0.875rem; color:var(--text-secondary); text-decoration:line-through; }
    .request-row { display:flex; align-items:center; gap:1rem; padding:1.25rem; text-decoration:none; color:inherit; cursor:pointer; }
    .empty-state { padding:5rem 2rem; text-align:center; color:var(--text-secondary); background:#F9FAFB; border:1px dashed var(--border); border-radius:16px; }
  `],
})
export class DiscoverComponent {
  protected tab = signal<'offers' | 'requests'>('offers');
  protected catFilter = signal('all');
  protected sort = signal('newest');

  protected categories = MOCK_CATEGORIES;
  protected requests = MOCK_REQUESTS;

  private router = inject(Router);

  protected filteredOffers = computed(() => {
    let list = [...MOCK_OFFERS];
    if (this.catFilter() !== 'all') {
      list = list.filter(o => o.category_id === Number(this.catFilter()));
    }
    if (this.sort() === 'most_buyers') list.sort((a,b) => b.buyer_count - a.buyer_count);
    else if (this.sort() === 'most_filled') list.sort((a,b) => (b.committed_units/b.hub_target_quantity) - (a.committed_units/a.hub_target_quantity));
    return list;
  });

  protected onCatChange(e: Event) { this.catFilter.set((e.target as HTMLSelectElement).value); }
  protected onSortChange(e: Event) { this.sort.set((e.target as HTMLSelectElement).value); }

  protected progress(o: Offer) {
    return o.hub_target_quantity > 0 ? Math.round((o.committed_units / o.hub_target_quantity) * 100) : 0;
  }

  protected goToHub(o: Offer) { this.router.navigate(['/hubs/supplier', o.current_batch_id]); }
  protected joinHub(o: Offer) { this.router.navigate(['/hubs/supplier', o.current_batch_id]); }
}
