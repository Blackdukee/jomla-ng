import { Component, ChangeDetectionStrategy, signal, computed, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { inject } from '@angular/core';
import { MOCK_REQUESTS, GroupRequest } from '../../../core/mock-data';
import { OffersService } from '../../../core/services/offers.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { OfferDto, CategoryDto } from '../../../core/models';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './discover.component.html',
  styleUrl: './discover.component.css'
})
export class DiscoverComponent implements OnInit {
  private offersService = inject(OffersService);
  private categoriesService = inject(CategoriesService);
  private router = inject(Router);

  protected tab = signal<'offers' | 'requests'>('offers');
  protected catFilter = signal('all');
  protected sort = signal('newest');

  protected categories = signal<CategoryDto[]>([]);
  protected offers = signal<OfferDto[]>([]);
  protected requests = MOCK_REQUESTS;

  ngOnInit(): void {
    this.categoriesService.getCategories().subscribe(cats => {
      this.categories.set(cats);
    });

    this.offersService.getAllOffers().subscribe(offs => {
      this.offers.set(offs);
    });
  }

  protected filteredOffers = computed(() => {
    let list = [...this.offers()];
    if (this.catFilter() !== 'all') {
      list = list.filter(o => o.categoryName === this.catFilter());
    }
    if (this.sort() === 'most_buyers') {
      list.sort((a, b) => b.buyerCount - a.buyerCount);
    } else if (this.sort() === 'most_filled') {
      list.sort((a, b) => {
        const progressA = a.hubTargetQuantity > 0 ? a.committedUnits / a.hubTargetQuantity : 0;
        const progressB = b.hubTargetQuantity > 0 ? b.committedUnits / b.hubTargetQuantity : 0;
        return progressB - progressA;
      });
    }
    return list;
  });

  protected onCatChange(e: Event) { this.catFilter.set((e.target as HTMLSelectElement).value); }
  protected onSortChange(e: Event) { this.sort.set((e.target as HTMLSelectElement).value); }

  protected progress(o: OfferDto) {
    return o.hubTargetQuantity > 0 ? Math.round((o.committedUnits / o.hubTargetQuantity) * 100) : 0;
  }

  protected goToHub(o: OfferDto) {
    if (o.activeBatchId) {
      this.router.navigate(['/hubs/supplier', o.activeBatchId]);
    }
  }

  protected joinHub(o: OfferDto) {
    if (o.activeBatchId) {
      this.router.navigate(['/hubs/supplier', o.activeBatchId]);
    }
  }
}
