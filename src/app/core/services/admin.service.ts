import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FlaggedOfferDto, FlaggedGroupRequestDto, PagedResult } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  /** GET /api/admin/flagged-offers */
  getFlaggedOffers(page: number = 1, pageSize: number = 10): Observable<PagedResult<FlaggedOfferDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PagedResult<FlaggedOfferDto>>(`${this.baseUrl}/flagged-offers`, {
      params,
      withCredentials: true
    });
  }

  /** GET /api/admin/flagged-group-requests */
  getFlaggedGroupRequests(page: number = 1, pageSize: number = 10): Observable<PagedResult<FlaggedGroupRequestDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PagedResult<FlaggedGroupRequestDto>>(`${this.baseUrl}/flagged-group-requests`, {
      params,
      withCredentials: true
    });
  }

  /** PUT /api/admin/offers/{id}/approve */
  approveOffer(id: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/offers/${id}/approve`, {}, {
      withCredentials: true
    });
  }

  /** PUT /api/admin/offers/{id}/reject */
  rejectOffer(id: string, reason: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/offers/${id}/reject`, { reason }, {
      withCredentials: true
    });
  }

  /** PUT /api/admin/group-requests/{id}/approve */
  approveGroupRequest(id: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/group-requests/${id}/approve`, {}, {
      withCredentials: true
    });
  }

  /** PUT /api/admin/group-requests/{id}/reject */
  rejectGroupRequest(id: string, reason: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/group-requests/${id}/reject`, { reason }, {
      withCredentials: true
    });
  }
}
