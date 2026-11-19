import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  OfferDto,
  GetAllOffersPagedResponse,
  MyOffersPagedResponse,
  OfferQueryParams,
  CreateOfferResponse
} from '../models';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OffersService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/offers`;

  private buildQueryParams(params?: OfferQueryParams): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;

    if (params.search !== undefined && params.search !== null) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.categoryId !== undefined && params.categoryId !== null) {
      httpParams = httpParams.set('categoryId', params.categoryId);
    }
    if (params.status !== undefined && params.status !== null) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.sortBy !== undefined && params.sortBy !== null) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    if (params.descending !== undefined && params.descending !== null) {
      httpParams = httpParams.set('descending', params.descending.toString());
    }
    if (params.pageNumber !== undefined && params.pageNumber !== null) {
      httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    }
    if (params.pageSize !== undefined && params.pageSize !== null) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    return httpParams;
  }

  getAllOffers(params?: OfferQueryParams): Observable<GetAllOffersPagedResponse> {
    return this.http.get<GetAllOffersPagedResponse>(this.baseUrl, {
      params: this.buildQueryParams(params),
      withCredentials: true
    });
  }

  getOfferById(id: string): Observable<OfferDto> {
    return this.http.get<OfferDto>(`${this.baseUrl}/${id}`, {
      withCredentials: true
    });
  }

  getMyOffers(params?: OfferQueryParams): Observable<MyOffersPagedResponse> {
    return this.http.get<MyOffersPagedResponse>(`${this.baseUrl}/my-offers`, {
      params: this.buildQueryParams(params),
      withCredentials: true
    });
  }

  createOffer(formData: FormData): Observable<CreateOfferResponse> {
    return this.http.post<CreateOfferResponse>(this.baseUrl, formData, {
      withCredentials: true
    });
  }

  updateOffer(id: string, formData: FormData): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, formData, {
      withCredentials: true
    });
  }

  deleteOffer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      withCredentials: true
    });
  }

  deactivateOffer(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/deactivate`, {}, {
      withCredentials: true
    });
  }

  activateOffer(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/activate`, {}, {
      withCredentials: true
    });
  }
}
