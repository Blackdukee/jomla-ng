import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CategoryDto } from '../models';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5174/api/categories';

  getCategories(): Observable<CategoryDto[]> {
    return this.http.get<CategoryDto[]>(this.baseUrl, {
      withCredentials: true
    }).pipe(
      map(cats => this.sortCategoriesHierarchically(cats))
    );
  }

  sortCategoriesHierarchically(cats: CategoryDto[]): CategoryDto[] {
    const rootCategories = cats.filter(c => !c.parentId).sort((a, b) => a.name.localeCompare(b.name));
    const subCategories = cats.filter(c => c.parentId);
    const result: CategoryDto[] = [];

    const process = (parent: CategoryDto, depth: number) => {
      const indent = '\u00A0'.repeat(depth * 4);
      const prefix = depth > 0 ? '└─ ' : '';
      result.push({
        ...parent,
        displayName: `${indent}${prefix}${parent.name}`
      });

      const children = subCategories
        .filter(c => c.parentId === parent.id)
        .sort((a, b) => a.name.localeCompare(b.name));

      for (const child of children) {
        process(child, depth + 1);
      }
    };

    for (const root of rootCategories) {
      process(root, 0);
    }

    const addedIds = new Set(result.map(r => r.id));
    const remaining = cats.filter(c => !addedIds.has(c.id)).sort((a, b) => a.name.localeCompare(b.name));
    for (const rem of remaining) {
      result.push({
        ...rem,
        displayName: rem.name
      });
    }

    return result;
  }

  detectCategory(title: string): Observable<CategoryDto> {
    return this.http.get<CategoryDto>(`${this.baseUrl}/detect`, {
      params: { title },
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
