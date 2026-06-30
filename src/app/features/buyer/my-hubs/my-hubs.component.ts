import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BatchesService } from '../../../core/services/batches.service';
import { BuyerHubDto } from '../../../core/models';

import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-my-hubs',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('hubsEntrance', [
      transition(':enter', [
        query('.header-block, .tabs-block', [
          style({ opacity: 0, transform: 'translateY(12px)' }),
          stagger('120ms', [
            animate('2000ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true }),
        query('.hub-row', [
          style({ opacity: 0, transform: 'translateY(16px)' }),
          stagger('150ms', [
            animate('2200ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ],
  templateUrl: './my-hubs.component.html',
  styleUrl: './my-hubs.component.css'
})
export class MyHubsComponent implements OnInit {
  private batchesService = inject(BatchesService);

  protected tab = signal<'active' | 'fulfilled'>('active');
  protected allHubs = signal<BuyerHubDto[]>([]);

  protected searchQuery = signal('');
  protected typeFilter = signal<'all' | 'supplier_offer' | 'group_request'>('all');
  protected page = signal(1);
  protected pageSize = 5;

  protected filteredHubs = computed(() => {
    const queryStr = this.searchQuery().toLowerCase().trim();
    const type = this.typeFilter();
    
    const isFulfilled = this.tab() === 'fulfilled';
    const tabFiltered = this.allHubs().filter(h => {
      const status = h.status.toLowerCase();
      const isDone = status === 'completed' || status === 'fulfilled' || status === 'closed' || status === 'failed';
      return isFulfilled ? isDone : !isDone;
    });

    return tabFiltered.filter(h => {
      const matchesSearch = !queryStr || h.title.toLowerCase().includes(queryStr);
      const matchesType = type === 'all' || h.type === type;
      return matchesSearch && matchesType;
    });
  });

  protected totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredHubs().length / this.pageSize));
  });

  protected paginatedHubs = computed(() => {
    const startIndex = (this.page() - 1) * this.pageSize;
    return this.filteredHubs().slice(startIndex, startIndex + this.pageSize);
  });

  protected setTab(t: 'active' | 'fulfilled') {
    this.tab.set(t);
    this.page.set(1);
  }

  protected onSearchChange(e: Event) {
    this.searchQuery.set((e.target as HTMLInputElement).value);
    this.page.set(1);
  }

  protected onTypeChange(e: Event) {
    this.typeFilter.set((e.target as HTMLSelectElement).value as any);
    this.page.set(1);
  }

  protected showingFrom = computed(() => {
    if (this.filteredHubs().length === 0) return 0;
    return (this.page() - 1) * this.pageSize + 1;
  });

  protected showingTo = computed(() => {
    return Math.min(this.page() * this.pageSize, this.filteredHubs().length);
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
