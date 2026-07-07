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

  // Animated display values
  protected displayRevenue = signal<number>(0);
  protected displayUnits = signal<number>(0);
  protected displayBatches = signal<number>(0);
  protected displayBuyers = signal<number>(0);

  ngOnInit(): void {
    this.loadCompletedDeals();
  }

  private loadCompletedDeals(): void {
    this.isLoading.set(true);
    this.batchesService.getCompletedDeals().subscribe({
      next: (res) => {
        this.result.set(res);
        this.isLoading.set(false);
        this.animateNumbers();
      },
      error: (err) => {
        console.error('Failed to load completed deals', err);
        this.isLoading.set(false);
      }
    });
  }

  private animateNumbers(): void {
    const duration = 1200; // ms
    const startTime = performance.now();
    const targetRevenue = this.totalRevenue();
    const targetUnits = this.totalUnits();
    const targetBatches = this.deals().length;
    const targetBuyers = this.totalBuyers();

    // Reset displays
    this.displayRevenue.set(0);
    this.displayUnits.set(0);
    this.displayBatches.set(0);
    this.displayBuyers.set(0);

    // If reduced motion is preferred, set targets instantly
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.displayRevenue.set(targetRevenue);
      this.displayUnits.set(targetUnits);
      this.displayBatches.set(targetBatches);
      this.displayBuyers.set(targetBuyers);
      return;
    }

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out expo: 1 - Math.pow(2, -10 * progress)
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      this.displayRevenue.set(Math.floor(targetRevenue * ease));
      this.displayUnits.set(Math.floor(targetUnits * ease));
      this.displayBatches.set(Math.floor(targetBatches * ease));
      this.displayBuyers.set(Math.floor(targetBuyers * ease));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        // Ensure exact final values
        this.displayRevenue.set(targetRevenue);
        this.displayUnits.set(targetUnits);
        this.displayBatches.set(targetBatches);
        this.displayBuyers.set(targetBuyers);
      }
    };

    requestAnimationFrame(step);
  }

  protected fmtDate(d: string | null) {
    if (!d) return '';
    try {
      const adjusted = new Date(new Date(d).getTime() + 3 * 60 * 60 * 1000);
      return adjusted.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      });
    } catch {
      return '';
    }
  }

  protected toggleRow(id: string) {
    this.expandedRow.update(r => r === id ? null : id);
  }
}
