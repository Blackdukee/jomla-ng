import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BatchesService } from '../../../core/services/batches.service';
import { BuyerHubDto } from '../../../core/models';

@Component({
  selector: 'app-my-hubs',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-hubs.component.html',
  styleUrl: './my-hubs.component.css'
})
export class MyHubsComponent implements OnInit {
  private batchesService = inject(BatchesService);

  protected tab = signal<'active' | 'fulfilled'>('active');
  protected allHubs = signal<BuyerHubDto[]>([]);

  protected hubs = computed<BuyerHubDto[]>(() => {
    const isFulfilled = this.tab() === 'fulfilled';
    return this.allHubs().filter(h => {
      const status = h.status.toLowerCase();
      const isDone = status === 'completed' || status === 'fulfilled' || status === 'closed' || status === 'failed';
      return isFulfilled ? isDone : !isDone;
    });
  });

  ngOnInit(): void {
    this.batchesService.getMyHubs().subscribe({
      next: (data) => this.allHubs.set(data),
      error: (err) => console.error('Failed to load my hubs', err)
    });
  }

  protected hubLink(hub: BuyerHubDto) {
    return hub.type === 'supplier_offer' ? ['/hubs/supplier', hub.batchId] : ['/hubs/request', hub.requestId];
  }

  protected fillPct(hub: BuyerHubDto) {
    if (!hub.fillTarget || !hub.fillProgress) return 0;
    return Math.round((hub.fillProgress / hub.fillTarget) * 100);
  }
}
