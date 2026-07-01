import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastService } from '../../../core/toast.service';
import { AuthService } from '../../../core/auth.service';
import { GroupRequestsService } from '../../../core/services/group-requests.service';
import { GroupRequestOffersService } from '../../../core/services/group-request-offers.service';
import { GroupRequestDetailDto, GroupRequestOfferDto } from '../../../core/models';
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
  protected authService = inject(AuthService);
  private groupRequestsService = inject(GroupRequestsService);
  private groupRequestOffersService = inject(GroupRequestOffersService);

  protected request = signal<GroupRequestDetailDto | null>(null);
  protected offers = signal<GroupRequestOfferDto[]>([]);
  protected joinQuantity = signal<number>(1);
  protected showJoinModal = signal<boolean>(false);
  private requestId = '';

  protected isJoined = computed(() => {
    const req = this.request();
    const user = this.authService.user();
    if (!req || !user) return false;
    return req.participantIds?.includes(user.id) || false;
  });

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
        this.offers.set(req.offers || []);
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.detail || 'Failed to load request details.');
        this.router.navigate(['/my-hubs']);
      }
    });
  }

  protected fmtExpiry(d: string) {
    try {
      return format(new Date(d), 'MMM d, ha');
    } catch {
      return '';
    }
  }

  protected accept(offer: GroupRequestOfferDto) {
    this.groupRequestOffersService.acceptOffer(offer.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('Offer accepted!', 'You have successfully accepted this supplier offer.');
          this.loadRequest();
        } else {
          this.toast.error('Error', res.error || 'Failed to accept offer');
        }
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.detail || err?.error?.error || 'Failed to accept offer');
      }
    });
  }

  protected cancelAccept(offer: GroupRequestOfferDto) {
    this.groupRequestOffersService.leaveOffer(offer.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('Left offer', 'You have successfully left this supplier offer.');
          this.loadRequest();
        } else {
          this.toast.error('Error', res.error || 'Failed to leave offer');
        }
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.detail || err?.error?.error || 'Failed to leave offer');
      }
    });
  }

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

  protected onQtyChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.joinQuantity.set(parseInt(val, 10) || 1);
  }

  protected joinRequest() {
    const qty = this.joinQuantity();
    if (qty <= 0) {
      this.toast.error('Invalid Quantity', 'Please enter a quantity of 1 or more.');
      return;
    }

    this.groupRequestsService.joinGroupRequest(this.requestId, qty).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('Joined Hub!', 'You have successfully joined this group request.');
          this.showJoinModal.set(false);
          this.loadRequest();
        } else {
          this.toast.error('Error', res.error || 'Failed to join group request.');
        }
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.detail || 'Failed to join group request.');
      }
    });
  }
}
