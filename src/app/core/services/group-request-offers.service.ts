import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GroupRequestOffersService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/GroupRequestOffers`;

  acceptOffer(offerId: string, acceptedQuantity: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${offerId}/accept`, { acceptedQuantity }, {
      withCredentials: true
    });
  }

  confirmAcceptOffer(offerId: string, paymentIntentId: string, acceptedQuantity: number, shippingAddress?: string | null, phoneNumber?: string | null): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${offerId}/confirm-accept`, { paymentIntentId, acceptedQuantity, shippingAddress, phoneNumber }, {
      withCredentials: true
    });
  }

  rejectOffer(offerId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${offerId}/reject`, {}, {
      withCredentials: true
    });
  }

  leaveOffer(offerId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${offerId}/cancel`, {}, {
      withCredentials: true
    });
  }

  triggerNegotiation(offerId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${offerId}/trigger-negotiation`, {}, {
      withCredentials: true
    });
  }

  approveNegotiation(offerId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${offerId}/approve-negotiation`, {}, {
      withCredentials: true
    });
  }

  rejectNegotiation(offerId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${offerId}/reject-negotiation`, {}, {
      withCredentials: true
    });
  }
}
