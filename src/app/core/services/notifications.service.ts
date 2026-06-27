import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GetNotificationsResult } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5174/api/notifications';

  getNotifications(unreadOnly?: boolean, page = 1, pageSize = 20): Observable<GetNotificationsResult> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
      
    if (unreadOnly !== undefined) {
      params = params.set('unreadOnly', unreadOnly.toString());
    }

    return this.http.get<GetNotificationsResult>(this.baseUrl, {
      params,
      withCredentials: true
    });
  }

  markAsRead(notificationId: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${notificationId}/read`, {}, {
      withCredentials: true
    });
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/read-all`, {}, {
      withCredentials: true
    });
  }
}
