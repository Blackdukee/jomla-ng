import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { inject } from '@angular/core';
import { MOCK_OFFERS, MOCK_REQUESTS, MOCK_CATEGORIES, Offer, GroupRequest } from '../../../core/mock-data';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './discover.component.html',
  styleUrl: './discover.component.css'
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
