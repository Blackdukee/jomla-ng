import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GroupRequestsService } from '../../../core/services/group-requests.service';
import { formatDistanceToNow } from 'date-fns';

@Component({
  selector: 'app-supplier-alerts',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './supplier-alerts.component.html',
  styleUrl: './supplier-alerts.component.css'
})
export class SupplierAlertsComponent implements OnInit {
  private groupRequestsService = inject(GroupRequestsService);

  protected alerts = signal<any[]>([]);

  ngOnInit(): void {
    this.groupRequestsService.getMatchedGroupRequests().subscribe({
      next: (res) => {
        const mapped = (res.items || []).map(req => ({
          id: req.id,
          request_id: req.id,
          status: req.status === 'Active' || req.status === 'active' ? 'pending' : 'responded',
          category_name: req.categoryName || 'Uncategorized',
          item_title: req.title || req.description || 'Group Request',
          units_demanded: req.currentQuantity,
          notified_at: req.createdAt
        }));
        this.alerts.set(mapped);
      },
      error: (err) => console.error('Failed to load matched requests', err)
    });
  }

  protected relTime(d: string) {
    if (!d) return '';
    try {
      return formatDistanceToNow(new Date(d), { addSuffix: true });
    } catch {
      return '';
    }
  }
}
