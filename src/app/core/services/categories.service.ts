import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CategoryDto } from '../models';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5174/api/categories';

  getCategories(): Observable<CategoryDto[]> {
    return this.http.get<CategoryDto[]>(this.baseUrl, {
      withCredentials: true
    });
  }

  createCategory(name: string, description?: string): Observable<any> {
    return this.http.post<any>(this.baseUrl, { name, description }, { withCredentials: true });
  }

  getCategoryById(id: string): Observable<CategoryDto> {
    return this.http.get<CategoryDto>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }

  updateCategory(id: string, name: string, description?: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, { id, name, description }, { withCredentials: true });
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`, { withCredentials: true });
  }
}
