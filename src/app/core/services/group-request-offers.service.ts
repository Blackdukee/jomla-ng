import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GroupRequestOffersService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5174/api/GroupRequestOffers';

  acceptOffer(offerId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${offerId}/accept`, {}, {
      withCredentials: true
    });
  }

  leaveOffer(offerId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${offerId}/leave`, {}, {
      withCredentials: true
    });
  }

  completeOffer(offerId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${offerId}/complete`, {}, {
      withCredentials: true
    });
  }

  cancelOffer(offerId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${offerId}/cancel`, {}, {
      withCredentials: true
    });
  }

  expireOffer(offerId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${offerId}/expire`, {}, {
      withCredentials: true
    });
  }
}
