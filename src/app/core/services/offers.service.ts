import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OfferDto, MyOfferDto, GetAllOffersPagedResponse, MyOffersPagedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class OffersService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5174/api/offers';

  getAllOffers(params?: {
    search?: string;
    categoryId?: string;
    status?: string;
    sortBy?: string;
    descending?: boolean;
    pageNumber?: number;
    pageSize?: number;
  }): Observable<GetAllOffersPagedResponse> {
    let httpParams: any = {};
    if (params) {
      Object.keys(params).forEach(key => {
        const val = (params as any)[key];
        if (val !== undefined && val !== null) {
          httpParams[key] = val.toString();
        }
      });
    }
    return this.http.get<GetAllOffersPagedResponse>(this.baseUrl, {
      params: httpParams,
      withCredentials: true
    });
  }

  getOfferById(id: string): Observable<OfferDto> {
    return this.http.get<OfferDto>(`${this.baseUrl}/${id}`, {
      withCredentials: true
    });
  }

  getMyOffers(): Observable<MyOffersPagedResponse> {
    return this.http.get<MyOffersPagedResponse>(`${this.baseUrl}/my-offers`, {
      withCredentials: true
    });
  }

  createOffer(formData: FormData): Observable<any> {
    return this.http.post<any>(this.baseUrl, formData, {
      withCredentials: true
    });
  }

  updateOffer(id: string, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, formData, {
      withCredentials: true
    });
  }

  deleteOffer(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`, {
      withCredentials: true
    });
  }
}
