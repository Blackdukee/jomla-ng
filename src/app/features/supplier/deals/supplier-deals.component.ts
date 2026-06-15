import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { MOCK_DEALS, DealSummary } from '../../../core/mock-data';
import { format } from 'date-fns';

@Component({
  selector: 'app-supplier-deals',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './supplier-deals.component.html',
  styleUrl: './supplier-deals.component.css'
})
export class SupplierDealsComponent {
  protected deals = MOCK_DEALS;
  protected expandedRow = signal<number | null>(null);

  protected totalRevenue() { return this.deals.reduce((s, d) => s + d.total_value, 0); }
  protected totalUnits()   { return this.deals.reduce((s, d) => s + d.total_units, 0); }
  protected totalBuyers()  { return this.deals.reduce((s, d) => s + d.buyer_count, 0); }
  protected avgUnits()     { return this.deals.length > 0 ? Math.round(this.totalUnits() / this.deals.length) : 0; }

  protected fmtDate(d: string) { return format(new Date(d), 'MMM d, yyyy'); }

  protected toggleRow(id: number) {
    this.expandedRow.update(r => r === id ? null : id);
  }
}
