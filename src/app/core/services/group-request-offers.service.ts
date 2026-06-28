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
}
