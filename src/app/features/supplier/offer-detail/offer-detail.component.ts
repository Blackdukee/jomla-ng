import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CloudinaryPipe } from '../../../shared/pipes/cloudinary.pipe';
import { OffersService } from '../../../core/services/offers.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { OfferDto } from '../../../core/models';
import { format } from 'date-fns';
import { ToastService } from '../../../core/toast.service';

@Component({
  selector: 'app-offer-detail',
  standalone: true,
  imports: [RouterLink, CloudinaryPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './offer-detail.component.html',
  styleUrl: './offer-detail.component.css'
})
export class OfferDetailComponent implements OnInit, OnDestroy {
  protected router = inject(Router);
  private route = inject(ActivatedRoute);
  private offersService = inject(OffersService);
  private toast = inject(ToastService);
  private signalRService = inject(SignalRService);

  protected offer = signal<OfferDto | null>(null);
  protected offerStatus = signal<'PendingReview' | 'Active' | 'Inactive' | 'Expired' | null>(null);
  protected showLiveBanner = signal(false);
  protected showValidationWarning = signal(false);
  protected totalAvailable = signal<number | null>(null);
  protected targetQuantity = signal<number | null>(null);
  private unsubOfferStatusChange: (() => void) | null = null;
  private unsubBatchUpdate: (() => void) | null = null;
  private offerId = '';

  protected isLightboxOpen = signal(false);
  protected activeImageIndex = signal(0);

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (!this.isLightboxOpen()) return;
    if (event.key === 'ArrowLeft') {
      this.prevImage();
    } else if (event.key === 'ArrowRight') {
      this.nextImage();
    } else if (event.key === 'Escape') {
      this.closeLightbox();
    }
  }

  protected openLightbox(index: number) {
    this.activeImageIndex.set(index);
    this.isLightboxOpen.set(true);
  }

  protected closeLightbox() {
    this.isLightboxOpen.set(false);
  }

  protected prevImage(event?: Event) {
    if (event) event.stopPropagation();
    const imgs = this.offer()?.images;
    if (imgs && imgs.length > 0) {
      const current = this.activeImageIndex();
      const prev = (current - 1 + imgs.length) % imgs.length;
      this.activeImageIndex.set(prev);
    }
  }

  protected nextImage(event?: Event) {
    if (event) event.stopPropagation();
    const imgs = this.offer()?.images;
    if (imgs && imgs.length > 0) {
      const current = this.activeImageIndex();
      const next = (current + 1) % imgs.length;
      this.activeImageIndex.set(next);
    }
  }

  protected selectImage(index: number) {
    this.activeImageIndex.set(index);
  }

  ngOnInit(): void {
    const offerIdStr = this.route.snapshot.paramMap.get('offerId');
    if (offerIdStr) {
      this.offerId = offerIdStr;
      this.loadOfferDetails();

      this.signalRService.joinOfferGroup(this.offerId);

      this.unsubBatchUpdate = this.signalRService.onBatchUpdate((update) => {
        if (update.offerId === this.offerId) {
          this.loadOfferDetails();
        }
      });

      this.unsubOfferStatusChange = this.signalRService.onOfferStatusChange((updatedOffer) => {
        if (updatedOffer.id === this.offerId) {
          this.loadOfferDetails();
        }
      });
    }

    this.route.queryParams.subscribe(params => {
      if (params['created'] === 'true') {
        this.showLiveBanner.set(true);
        setTimeout(() => {
          this.showLiveBanner.set(false);
        }, 5000);
      }
    });
  }

  private loadOfferDetails(): void {
    if (!this.offerId) return;

    this.offersService.getOfferById(this.offerId).subscribe({
      next: (off) => {
        this.offer.set(off);
      },
      error: () => {
        this.router.navigate(['/supplier/offers']);
      }
    });

    this.offersService.getMyOffers().subscribe({
      next: (myOffers) => {
        const items = myOffers.items || [];
        const matched = items.find(o => o.id.toLowerCase() === this.offerId.toLowerCase());
        if (matched) {
          this.totalAvailable.set(matched.totalQuantityAvailable);
          this.targetQuantity.set(matched.batchTargetQuantity);
          this.offerStatus.set(matched.status);
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.offerId) {
      this.signalRService.leaveOfferGroup(this.offerId);
    }
    this.unsubOfferStatusChange?.();
    this.unsubBatchUpdate?.();
  }

  private triggerWarning() {
    this.showValidationWarning.set(true);
    setTimeout(() => {
      this.showValidationWarning.set(false);
    }, 5000);
  }

  protected onToggleActiveClick() {
    const id = this.offer()?.id;
    if (!id) return;

    if (this.offerStatus() === 'Active') {
      if (confirm('Are you sure you want to deactivate this offer? This will cancel the open batch and release all participant holds.')) {
        this.offersService.deactivateOffer(id).subscribe({
          next: () => {
            this.toast.success('Offer deactivated', 'The offer has been deactivated successfully.');
            this.loadOfferDetails();
          },
          error: (err) => {
            this.toast.errorApi('Deactivation failed', err);
          }
        });
      }
    } else if (this.offerStatus() === 'Inactive') {
      this.offersService.activateOffer(id).subscribe({
        next: () => {
          this.toast.success('Offer activated', 'The offer has been activated successfully.');
          this.loadOfferDetails();
        },
        error: (err) => {
          this.toast.errorApi('Activation failed', err);
        }
      });
    }
  }

  protected onEditClick() {
    this.router.navigate(['/manage/offers', this.offer()?.id]);
  }

  protected onDeleteClick() {
    if (this.offer()?.activeBatchId) {
      this.triggerWarning();
    } else {
      if (confirm('Are you sure you want to delete this offer?')) {
        const id = this.offer()?.id;
        if (id) {
          this.offersService.deleteOffer(id).subscribe({
            next: () => {
              this.toast.success('Offer deleted', 'The offer has been deleted successfully.');
              this.router.navigate(['/supplier/offers']);
            },
            error: (err) => {
              this.toast.error('Error', err?.error?.detail || 'Failed to delete offer.');
            }
          });
        }
      }
    }
  }

 private normalizeUtc(d: string): string {
  return d.includes('Z') || /[+-]\d{2}:\d{2}$/.test(d)
    ? d
    : d.replace(' ', 'T').replace(/(\.\d+)?$/, '') + 'Z';
}
protected fmtDate(d: string | undefined): string {
  if (!d) return '';
  try {
    const adjusted = new Date(new Date(this.normalizeUtc(d)).getTime() + 3 * 60 * 60 * 1000);
    return format(adjusted, 'MMM d, yyyy');
  } catch { return ''; }
}
protected fmtExpiryLong(d: string | undefined): string {
  if (!d) return '';
  try {
    const adjusted = new Date(new Date(this.normalizeUtc(d)).getTime() + 3 * 60 * 60 * 1000);
    return format(adjusted, "MMM d, yyyy h:mm a 'UTC'");
  } catch { return ''; }
}
}
