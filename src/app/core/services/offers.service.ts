import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OfferDto, MyOfferDto } from '../models';

@Injectable({ providedIn: 'root' })
export class OffersService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5174/api/offers';

  getAllOffers(): Observable<OfferDto[]> {
    return this.http.get<OfferDto[]>(this.baseUrl, {
      withCredentials: true
    });
  }

  getOfferById(id: string): Observable<OfferDto> {
    return this.http.get<OfferDto>(`${this.baseUrl}/${id}`, {
      withCredentials: true
    });
  }

  getMyOffers(): Observable<MyOfferDto[]> {
    return this.http.get<MyOfferDto[]>(`${this.baseUrl}/my-offers`, {
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
