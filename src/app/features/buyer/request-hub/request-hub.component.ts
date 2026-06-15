import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MOCK_REQUESTS, MOCK_OFFER_RESPONSES, GroupRequest, OfferResponse } from '../../../core/mock-data';
import { ToastService } from '../../../core/toast.service';
import { format } from 'date-fns';

@Component({
  selector: 'app-request-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './request-hub.component.html',
  styleUrl: './request-hub.component.css'
})
export class RequestHubComponent {
  protected router = inject(Router);
  private toast = inject(ToastService);

  protected request = signal<GroupRequest>({ ...MOCK_REQUESTS[0] });
  protected offers = signal<OfferResponse[]>([...MOCK_OFFER_RESPONSES]);

  protected sortedOffers() {
    return [...this.offers()].sort((a, b) => a.current_unit_price - b.current_unit_price);
  }

  protected fmtExpiry(d: string) { return format(new Date(d), 'MMM d, ha'); }

  protected accept(offer: OfferResponse) {
    this.offers.update(o => o.map(x => x.id === offer.id ? { ...x, current_user_accepted: true, accepted_count: x.accepted_count + 1 } : x));
    this.toast.success('Offer accepted');
  }

  protected cancelAccept(offer: OfferResponse) {
    this.offers.update(o => o.map(x => x.id === offer.id ? { ...x, current_user_accepted: false, accepted_count: Math.max(0, x.accepted_count - 1) } : x));
    this.toast.success('Acceptance cancelled');
  }

  protected reject(offer: OfferResponse) {
    this.offers.update(o => o.filter(x => x.id !== offer.id));
    this.toast.success('Offer rejected');
  }

  protected proceed(responseId: number) {
    this.router.navigate(['/payment', responseId]);
  }

  protected leaveRequest() {
    this.toast.success('Left hub', 'You have left this request.');
    this.router.navigate(['/my-hubs']);
  }
}
