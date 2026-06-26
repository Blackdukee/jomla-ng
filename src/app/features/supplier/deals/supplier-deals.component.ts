import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

@Component({
  selector: 'app-supplier-deals',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './supplier-deals.component.html',
  styleUrl: './supplier-deals.component.css'
})
export class SupplierDealsComponent {
  protected deals: any[] = [];
  protected expandedRow = signal<number | null>(null);

  protected totalRevenue() { return 0; }
  protected totalUnits()   { return 0; }
  protected totalBuyers()  { return 0; }
  protected avgUnits()     { return 0; }

  protected fmtDate(d: string) { return ''; }

  protected toggleRow(id: number) {
    this.expandedRow.update(r => r === id ? null : id);
  }
}
