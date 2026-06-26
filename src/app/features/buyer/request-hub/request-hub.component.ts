import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastService } from '../../../core/toast.service';
import { GroupRequestsService } from '../../../core/services/group-requests.service';
import { GroupRequestDetailDto } from '../../../core/models';
import { format } from 'date-fns';

@Component({
  selector: 'app-request-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './request-hub.component.html',
  styleUrl: './request-hub.component.css'
})
export class RequestHubComponent implements OnInit {
  protected router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private groupRequestsService = inject(GroupRequestsService);

  protected request = signal<GroupRequestDetailDto | null>(null);
  protected offers = signal<any[]>([]);
  private requestId = '';

  ngOnInit(): void {
    this.requestId = this.route.snapshot.paramMap.get('requestId') ?? '';
    if (!this.requestId) {
      this.toast.error('Error', 'No request ID provided.');
      this.router.navigate(['/my-hubs']);
      return;
    }
    this.loadRequest();
  }

  private loadRequest() {
    this.groupRequestsService.getGroupRequest(this.requestId).subscribe({
      next: (req) => {
        this.request.set(req);
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.detail || 'Failed to load request details.');
        this.router.navigate(['/my-hubs']);
      }
    });
  }

  protected sortedOffers(): any[] {
    return [];
  }

  protected fmtExpiry(d: string) { return format(new Date(d), 'MMM d, ha'); }

  protected accept(offer: any) {}
  protected cancelAccept(offer: any) {}
  protected reject(offer: any) {}
  protected proceed(responseId: any) {}

  protected leaveRequest() {
    this.groupRequestsService.leaveGroupRequest(this.requestId).subscribe({
      next: () => {
        this.toast.success('Left hub', 'You have left this request.');
        this.router.navigate(['/my-hubs']);
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.detail || 'Failed to leave group request.');
      }
    });
  }
}
