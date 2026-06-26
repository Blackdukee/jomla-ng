import { Component, ChangeDetectionStrategy, inject, signal, OnInit, HostListener } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { OffersService } from '../../../core/services/offers.service';
import { OfferDto } from '../../../core/models';
import { format } from 'date-fns';
import { ToastService } from '../../../core/toast.service';

@Component({
  selector: 'app-manage-offer',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './manage-offer.component.html',
  styleUrl: './manage-offer.component.css'
})
export class ManageOfferComponent implements OnInit {
  protected router = inject(Router);
  private route = inject(ActivatedRoute);
  private offersService = inject(OffersService);
  private toast = inject(ToastService);

  protected offer = signal<OfferDto | null>(null);
  protected showLiveBanner = signal(false);
  protected showValidationWarning = signal(false);
  protected totalAvailable = signal<number | null>(null);
  protected targetQuantity = signal<number | null>(null);

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
      this.offersService.getOfferById(offerIdStr).subscribe({
        next: (off) => {
          this.offer.set(off);
        },
        error: () => {
          this.router.navigate(['/supplier/offers']);
        }
      });

      this.offersService.getMyOffers().subscribe({
        next: (myOffers) => {
          const matched = myOffers.find(o => o.id.toLowerCase() === offerIdStr.toLowerCase());
          if (matched) {
            this.totalAvailable.set(matched.totalQuantityAvailable);
            this.targetQuantity.set(matched.batchTargetQuantity);
          }
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

  private triggerWarning() {
    this.showValidationWarning.set(true);
    setTimeout(() => {
      this.showValidationWarning.set(false);
    }, 5000);
  }

  protected onEditClick() {
    if (this.offer()?.activeBatchId) {
      this.triggerWarning();
    } else {
      this.router.navigate(['/manage/offers', this.offer()?.id]);
    }
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

  protected fmtDate(d: string | undefined): string {
    if (!d) return '';
    try {
      return format(new Date(d), 'MMM d, yyyy');
    } catch {
      return '';
    }
  }

  protected fmtExpiryLong(d: string | undefined): string {
    if (!d) return '';
    try {
      return format(new Date(d), 'MMM d, yyyy h:mm a');
    } catch {
      return '';
    }
  }
}
