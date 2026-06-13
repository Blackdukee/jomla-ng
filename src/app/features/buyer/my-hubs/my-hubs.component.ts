import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_BUYER_HUBS, BuyerHub } from '../../../core/mock-data';

@Component({
  selector: 'app-my-hubs',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container" style="max-width:900px;padding-top:2rem;padding-bottom:3rem" role="main">
      <div style="margin-bottom:2rem">
        <h1 style="font-size:2rem;font-weight:800;margin-bottom:0.25rem">My Hubs</h1>
        <p style="color:var(--text-secondary)">Track the group deals you've joined.</p>
      </div>

      <div class="seg-control" style="margin-bottom:1.5rem" role="tablist" aria-label="Hub status">
        <button role="tab" [class]="tab() === 'active' ? 'active' : ''" [attr.aria-selected]="tab() === 'active'" (click)="tab.set('active')" id="tab-active" aria-controls="panel-active">Active</button>
        <button role="tab" [class]="tab() === 'fulfilled' ? 'active' : ''" [attr.aria-selected]="tab() === 'fulfilled'" (click)="tab.set('fulfilled')" id="tab-fulfilled" aria-controls="panel-fulfilled">Fulfilled</button>
      </div>

      <div [id]="'panel-' + tab()" role="tabpanel" [attr.aria-labelledby]="'tab-' + tab()">
        @if (hubs().length === 0) {
          <div style="padding:5rem 2rem;text-align:center;background:#F9FAFB;border:1px dashed var(--border);border-radius:16px;color:var(--text-secondary)" aria-live="polite">
            {{ tab() === 'active' ? "You haven't joined any active hubs." : "No fulfilled hubs yet." }}
          </div>
        } @else {
          <div style="display:flex;flex-direction:column;gap:1rem">
            @for (hub of hubs(); track hub.id) {
              <a [routerLink]="hubLink(hub)" class="card card-hover hub-row">
                <div style="flex:1;min-width:0">
                  <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;flex-wrap:wrap">
                    <span class="badge" [class]="hub.type === 'supplier_offer' ? 'badge-brand-light' : 'badge-muted'"
                      style="color: var(--brand)">
                      {{ hub.type === 'supplier_offer' ? 'Supplier Offer' : 'Group Request' }}
                    </span>
                    <span class="badge" [class]="hub.status === 'open' || hub.status === 'active' ? 'badge-success' : 'badge-muted'">{{ hub.status }}</span>
                  </div>
                  <h3 style="font-size:1.0625rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:0.25rem">{{ hub.title }}</h3>
                  <p style="font-size:0.875rem;color:var(--text-secondary)">
                    Your commitment: <span style="font-weight:600;color:var(--text-primary)">{{ hub.committed_units }} units</span>
                  </p>
                </div>

                @if (hub.type === 'supplier_offer' && hub.fill_target) {
                  <div style="width:180px;flex-shrink:0" class="hide-mobile">
                    <div style="display:flex;justify-content:space-between;font-size:0.75rem;margin-bottom:0.375rem">
                      <span style="font-weight:500">Total fill</span>
                      <span style="color:var(--text-secondary)">{{ fillPct(hub) }}%</span>
                    </div>
                    <div class="progress-track" style="height:6px">
                      <div class="progress-fill" [style.width.%]="fillPct(hub)"></div>
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
    </div>
  `,
  styles: [`
    .hub-row { display:flex; align-items:center; gap:1.25rem; padding:1.25rem; text-decoration:none; color:inherit; cursor:pointer; }
  `],
})
export class MyHubsComponent {
  protected tab = signal<'active' | 'fulfilled'>('active');
  protected hubs = computed(() => this.tab() === 'active' ? MOCK_BUYER_HUBS.active : MOCK_BUYER_HUBS.fulfilled);

  protected hubLink(hub: BuyerHub) {
    return hub.type === 'supplier_offer' ? ['/hubs/supplier', hub.batch_id] : ['/hubs/request', hub.request_id];
  }

  protected fillPct(hub: BuyerHub) {
    if (!hub.fill_target || !hub.fill_progress) return 0;
    return Math.round((hub.fill_progress / hub.fill_target) * 100);
  }
}
