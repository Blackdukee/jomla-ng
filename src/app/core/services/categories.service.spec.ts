import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CategoriesService } from './categories.service';
import { CategoryDto } from '../models';
import { environment } from '../../../environments/environment';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/categories`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CategoriesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('sorts categories hierarchically with alphabetical ordering, child indentation, and orphaned fallback', () => {
    const raw: CategoryDto[] = [
      { id: 'c2', name: 'Monitors', parentId: 'root-b' },
      { id: 'root-b', name: 'Electronics' },
      { id: 'root-a', name: 'Apparel' },
      { id: 'c1', name: 'Laptops', parentId: 'root-b' },
      { id: 'orphan', name: 'Orphaned', parentId: 'missing-parent' }
    ];

    const sorted = service.sortCategoriesHierarchically(raw);
    expect(sorted.map(c => c.id)).toEqual(['root-a', 'root-b', 'c1', 'c2', 'orphan']);
    expect(sorted[0].displayName).toBe('Apparel');
    expect(sorted[2].displayName).toBe('\u00A0\u00A0\u00A0\u00A0└─ Laptops');
    expect(sorted[4].displayName).toBe('Orphaned');
  });

  it('caches getCategories() with shareReplay so repeat subscriptions emit zero extra HTTP calls', () => {
    const firstResults: CategoryDto[][] = [];
    const secondResults: CategoryDto[][] = [];

    service.getCategories().subscribe(res => firstResults.push(res));
    service.getCategories().subscribe(res => secondResults.push(res));

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush([{ id: '1', name: 'Tools' }]);

    expect(firstResults).toHaveLength(1);
    expect(secondResults).toHaveLength(1);
    expect(firstResults[0][0].name).toBe('Tools');
    expect(secondResults[0][0].name).toBe('Tools');
  });

  it('clears cache on HTTP failure so subsequent calls retry the network request', () => {
    let errored = false;
    service.getCategories().subscribe({
      error: () => {
        errored = true;
      }
    });

    httpMock.expectOne(baseUrl).flush('Server error', { status: 500, statusText: 'Server Error' });
    expect(errored).toBe(true);

    let recovered: CategoryDto[] = [];
    service.getCategories().subscribe(res => {
      recovered = res;
    });

    const retryReq = httpMock.expectOne(baseUrl);
    retryReq.flush([{ id: '2', name: 'Office' }]);
    expect(recovered).toHaveLength(1);
    expect(recovered[0].name).toBe('Office');
  });

  it('invalidates the cache after createCategory, updateCategory, and deleteCategory', () => {
    service.getCategories().subscribe();
    httpMock.expectOne(baseUrl).flush([{ id: '1', name: 'Initial' }]);

    // createCategory invalidates cache
    service.createCategory('NewCat').subscribe();
    httpMock.expectOne(r => r.method === 'POST' && r.url === baseUrl).flush({ id: '2', name: 'NewCat' });

    service.getCategories().subscribe();
    httpMock.expectOne(baseUrl).flush([{ id: '1', name: 'Initial' }, { id: '2', name: 'NewCat' }]);

    // updateCategory invalidates cache
    service.updateCategory('2', 'RenamedCat').subscribe();
    httpMock.expectOne(r => r.method === 'PUT' && r.url === `${baseUrl}/2`).flush({ id: '2', name: 'RenamedCat' });

    service.getCategories().subscribe();
    httpMock.expectOne(baseUrl).flush([{ id: '2', name: 'RenamedCat' }]);

    // deleteCategory invalidates cache
    service.deleteCategory('2').subscribe();
    httpMock.expectOne(r => r.method === 'DELETE' && r.url === `${baseUrl}/2`).flush(null);

    service.getCategories().subscribe();
    httpMock.expectOne(baseUrl).flush([]);
  });
});
