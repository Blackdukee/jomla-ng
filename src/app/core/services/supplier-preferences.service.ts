import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SupplierCategoryPreferenceDto, SavePreferenceRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class SupplierPreferencesService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5174/api/supplier-category-preferences';

  getPreferences(): Observable<SupplierCategoryPreferenceDto[]> {
    return this.http.get<SupplierCategoryPreferenceDto[]>(this.baseUrl, {
      withCredentials: true
    });
  }

  savePreference(categoryId: string, minQuantity: number): Observable<boolean> {
    const body: SavePreferenceRequest = { categoryId, minQuantity };
    return this.http.put<boolean>(this.baseUrl, body, {
      withCredentials: true
    });
  }

  removePreference(categoryId: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.baseUrl}/${categoryId}`, {
      withCredentials: true
    });
  }
}
