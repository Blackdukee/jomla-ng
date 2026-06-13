import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_ALERTS, SupplierAlert } from '../../../core/mock-data';
import { formatDistanceToNow } from 'date-fns';

@Component({
  selector: 'app-supplier-alerts',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container" style="max-width:900px;padding:2rem 1rem 3rem" role="main">
      <div style="margin-bottom:2rem">
        <h1 style="font-size:2rem;font-weight:800;margin-bottom:0.25rem">Wishlist Alerts</h1>
        <p style="color:var(--text-secondary)">Notifications for group requests matching your categories.</p>
      </div>

      @if (alerts.length === 0) {
        <div style="padding:6rem 2rem;text-align:center;background:#F9FAFB;border:1px dashed var(--border);border-radius:16px">
          <div class="icon-container" style="margin:0 auto 1.25rem;width:4rem;height:4rem" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <h2 style="font-size:1.25rem;font-weight:700;margin-bottom:0.5rem">No alerts yet</h2>
          <p style="color:var(--text-secondary);max-width:380px;margin:0 auto">We'll notify you when buyers post requests in categories you subscribe to.</p>
        </div>
      } @else {
        <div style="display:flex;flex-direction:column;gap:1rem" role="list">
          @for (alert of alerts; track alert.id) {
            <a [routerLink]="['/manage/requests', alert.request_id]" class="card card-hover alert-row" role="listitem"
              [style.border-left]="alert.status === 'pending' ? '4px solid var(--brand)' : ''"
              [attr.aria-label]="'Alert: ' + alert.item_title + ', status: ' + alert.status">
              <div class="icon-container" style="width:2.5rem;height:2.5rem" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>

              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.375rem;flex-wrap:wrap">
                  <span style="background:#F3F4F6;color:#374151;font-size:10px;font-weight:600;padding:0.125rem 0.5rem;border-radius:6px;text-transform:uppercase;letter-spacing:0.05em">
                    {{ alert.category_name }}
                  </span>
                  @if (alert.status === 'pending') {
                    <span style="width:8px;height:8px;border-radius:50%;background:var(--brand);display:inline-block" aria-hidden="true"></span>
                  }
                </div>
                <h3 style="font-size:1.0625rem;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                  Demand for {{ alert.units_demanded }} units of "{{ alert.item_title }}"
                </h3>
                <div style="display:flex;align-items:center;gap:0.375rem;margin-top:0.375rem;font-size:0.8125rem;color:var(--text-secondary)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {{ relTime(alert.notified_at) }}
                </div>
              </div>

              <div style="display:flex;align-items:center;gap:0.75rem;flex-shrink:0">
                <span class="badge" [class]="alert.status === 'responded' ? 'badge-success' : 'badge-warning'">{{ alert.status }}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="hide-mobile" style="color:var(--text-muted)" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`.alert-row { display:flex; align-items:center; gap:1rem; padding:1.25rem; text-decoration:none; color:inherit; cursor:pointer; }`],
})
export class SupplierAlertsComponent {
  protected alerts: SupplierAlert[] = MOCK_ALERTS;
  protected relTime(d: string) { return formatDistanceToNow(new Date(d), { addSuffix: true }); }
}
