import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { GroupRequestsService } from '../../../core/services/group-requests.service';
import { GroupRequestDetailDto } from '../../../core/models';
import { ToastService } from '../../../core/toast.service';

@Component({
  selector: 'app-manage-request',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './manage-request.component.html',
  styleUrl: './manage-request.component.css'
})
export class ManageRequestComponent implements OnInit {
  protected router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private groupRequestsService = inject(GroupRequestsService);

  protected request = signal<GroupRequestDetailDto | null>(null);
  protected myOffer = signal<any | null>(null);
  protected loading = signal(false);

  ngOnInit(): void {
    const requestId = this.route.snapshot.paramMap.get('requestId');
    if (!requestId) {
      this.toast.error('Error', 'No request ID provided.');
      this.router.navigate(['/supplier/requests']);
      return;
    }

    this.loading.set(true);
    this.groupRequestsService.getGroupRequest(requestId).subscribe({
      next: (req) => {
        this.request.set(req);
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.detail || 'Failed to load request details.');
        this.router.navigate(['/supplier/requests']);
        this.loading.set(false);
      }
    });
  }
}
