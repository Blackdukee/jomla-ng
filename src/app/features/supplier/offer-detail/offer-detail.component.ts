import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { OffersService } from '../../../core/services/offers.service';
import { OfferDto } from '../../../core/models';
import { format } from 'date-fns';

@Component({
  selector: 'app-offer-detail',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './offer-detail.component.html',
  styleUrl: './offer-detail.component.css'
})
export class OfferDetailComponent implements OnInit {
  protected router = inject(Router);
  private route = inject(ActivatedRoute);
  private offersService = inject(OffersService);

  protected offer = signal<OfferDto | null>(null);

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
