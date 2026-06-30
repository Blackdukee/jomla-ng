import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  GroupRequestListItemDto,
  GroupRequestDetailDto,
  CreateGroupRequestRequest
} from '../models';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GroupRequestsService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/group-requests`;

  /** GET /api/group-requests — Get active, approved group requests */
  getGroupRequests(filters?: {
    categoryId?: string;
    titleSearch?: string;
    status?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    myRequestsOnly?: boolean;
  }): Observable<{ items: GroupRequestListItemDto[]; totalCount: number; page: number; pageSize: number }> {
    let params = new HttpParams();
    if (filters?.categoryId) params = params.set('categoryId', filters.categoryId);
    if (filters?.titleSearch) params = params.set('titleSearch', filters.titleSearch);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.page) params = params.set('page', filters.page.toString());
    if (filters?.pageSize) params = params.set('pageSize', filters.pageSize.toString());
    if (filters?.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters?.myRequestsOnly) params = params.set('myRequestsOnly', 'true');

    return this.http.get<{ items: GroupRequestListItemDto[]; totalCount: number; page: number; pageSize: number }>(
      this.baseUrl,
      { params, withCredentials: true }
    );
  }

  /** GET /api/group-requests/{id} — Get details of a group request */
  getGroupRequest(id: string): Observable<GroupRequestDetailDto> {
    return this.http.get<GroupRequestDetailDto>(`${this.baseUrl}/${id}`, {
      withCredentials: true
    });
  }

  /** POST /api/group-requests — Create a new group request */
  createGroupRequest(request: CreateGroupRequestRequest): Observable<any> {
    const formData = new FormData();
    formData.append('title', request.title);
    formData.append('quantity', request.quantity.toString());
    if (request.description) {
      formData.append('description', request.description);
    }
    if (request.images) {
      request.images.forEach(file => {
        formData.append('images', file, file.name);
      });
    }
    return this.http.post<any>(this.baseUrl, formData, {
      withCredentials: true
    });
  }

  /** POST /api/group-requests/{id}/join — Join a group request */
  joinGroupRequest(id: string, quantity: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${id}/join`, { quantity }, {
      withCredentials: true
    });
  }

  /** DELETE /api/group-requests/{id}/leave — Leave a group request */
  leaveGroupRequest(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}/leave`, {
      withCredentials: true
    });
  }

  /** GET /api/group-requests/matched — Get supplier's matched group requests */
  getMatchedGroupRequests(page = 1, pageSize = 10): Observable<{ items: any[]; totalCount: number; page: number; pageSize: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<{ items: any[]; totalCount: number; page: number; pageSize: number }>(
      `${this.baseUrl}/matched`,
      { params, withCredentials: true }
    );
  }
}
