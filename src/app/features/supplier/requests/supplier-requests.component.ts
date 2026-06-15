import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOCK_REQUESTS, MOCK_CATEGORIES } from '../../../core/mock-data';

@Component({
  selector: 'app-supplier-requests',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './supplier-requests.component.html',
  styleUrl: './supplier-requests.component.css'
})
export class SupplierRequestsComponent {
  protected catFilter = signal('all');
  protected sort = signal('newest');
  protected categories = MOCK_CATEGORIES;
  protected requests = MOCK_REQUESTS;

  protected onCatChange(e: Event) {
    this.catFilter.set((e.target as HTMLSelectElement).value);
  }

  protected onSortChange(e: Event) {
    this.sort.set((e.target as HTMLSelectElement).value);
  }
}
