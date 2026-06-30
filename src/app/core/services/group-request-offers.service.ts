import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GroupRequestOffersService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/GroupRequestOffers`;

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
