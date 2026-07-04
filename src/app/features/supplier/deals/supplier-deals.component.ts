import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { BatchesService } from '../../../core/services/batches.service';
import { CompletedDealsResult, CompletedDealDto } from '../../../core/models';

@Component({
  selector: 'app-supplier-deals',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './supplier-deals.component.html',
  styleUrl: './supplier-deals.component.css'
})
export class SupplierDealsComponent implements OnInit {
  private batchesService = inject(BatchesService);

  protected result = signal<CompletedDealsResult | null>(null);
  protected isLoading = signal(true);
  protected expandedRow = signal<string | null>(null);

  protected totalRevenue = computed(() => this.result()?.totalRevenue ?? 0);
  protected totalUnits = computed(() => this.result()?.totalUnitsSold ?? 0);
  protected totalBuyers = computed(() => this.result()?.totalBuyerCommitments ?? 0);
  protected avgUnits = computed(() => this.result()?.avgUnitsPerBatch ?? 0);
  protected deals = computed(() => this.result()?.deals ?? []);

  ngOnInit(): void {
    this.loadCompletedDeals();
  }

  private loadCompletedDeals(): void {
    this.isLoading.set(true);
    this.batchesService.getCompletedDeals().subscribe({
      next: (res) => {
        this.result.set(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load completed deals', err);
        this.isLoading.set(false);
      }
    });
  }

  protected fmtDate(d: string | null) {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  }

  protected toggleRow(id: string) {
    this.expandedRow.update(r => r === id ? null : id);
  }
}
