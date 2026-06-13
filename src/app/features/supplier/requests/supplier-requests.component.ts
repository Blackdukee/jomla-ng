import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_REQUESTS, MOCK_CATEGORIES } from '../../../core/mock-data';

@Component({
  selector: 'app-supplier-requests',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container" style="max-width:1000px;padding:2rem 1rem 3rem" role="main">
      <div style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:2rem">

        <div>
          <h1 style="font-size:2rem;font-weight:800;margin-bottom:0.25rem">Group Requests</h1>
          <p style="color:var(--text-secondary)">Browse active buyer demand and place your offers.</p>
        </div>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-top:1rem">
          <select class="filter-select" aria-label="Filter by category" [value]="catFilter()" (change)="onCatChange($event)">
            <option value="all">All Categories</option>
            @for (c of categories; track c.id) {
              <option [value]="c.id">{{ c.name }}</option>
            }
          </select>
          <select class="filter-select" aria-label="Sort by" [value]="sort()" (change)="onSortChange($event)">
            <option value="newest">Newest First</option>
            <option value="most_buyers">Most Buyers</option>
            <option value="most_units">Highest Volume</option>
          </select>
        </div>
      </div>

      @if (requests.length === 0) {
        <div style="padding:5rem 2rem;text-align:center;background:#F9FAFB;border:1px dashed var(--border);border-radius:16px;color:var(--text-secondary)">
          No active group requests found matching your criteria.
        </div>
      } @else {
        <div style="display:flex;flex-direction:column;gap:1rem">
          @for (req of requests; track req.id) {
            <a [routerLink]="['/manage/requests', req.id]" class="card card-hover req-row">
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;flex-wrap:wrap">
                  <span class="badge badge-muted">{{ req.category_name || 'Uncategorized' }}</span>
                  <span class="badge badge-brand-light" style="color:var(--brand)">Active</span>
                </div>
                <h3 style="font-size:1.0625rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:0.5rem">{{ req.description }}</h3>
                <div style="display:flex;align-items:center;gap:1.25rem;font-size:0.875rem;color:var(--text-secondary)">
                  <span style="font-weight:600;color:var(--text-primary);display:flex;align-items:center;gap:0.375rem">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                    {{ req.quantity }} units demanded
                  </span>
                  <span style="display:flex;align-items:center;gap:0.375rem">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    {{ req.buyer_count }} buyers
                  </span>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:0.375rem;color:var(--text-secondary);flex-shrink:0">
                <span class="hide-mobile" style="font-size:0.875rem;font-weight:500">Place offer</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .filter-select { border:1px solid var(--border); border-radius:9999px; padding:0.5rem 1rem; font-size:0.875rem; background:var(--bg-surface); color:var(--text-primary); cursor:pointer; font-family:inherit; }
    .req-row { display:flex; align-items:center; gap:1rem; padding:1.25rem; text-decoration:none; color:inherit; cursor:pointer; }
    @media (min-width: 768px) {
      .container > div:first-child { flex-direction: row; align-items: center; justify-content: space-between; }
    }
  `],
})
export class SupplierRequestsComponent {
  protected catFilter = signal('all');
  protected sort = signal('newest');
  protected categories = MOCK_CATEGORIES;
  protected requests = MOCK_REQUESTS;

  protected onCatChange(e: Event) {
    this.catFilter.set((e.target as HTMLSelectElement).value);
  }

  protected onSortChange(e: Event) {
    this.sort.set((e.target as HTMLSelectElement).value);
  }
}
