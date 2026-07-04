// core/services/user.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UpdateProfileResponse {
  firstName: string;
  lastName: string;
  email: string;
  imageUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  updateProfile(payload: { firstName: string; lastName: string; email: string }): Observable<UpdateProfileResponse> {
    return this.http.put<UpdateProfileResponse>(`${this.baseUrl}/profile`, payload, {
      withCredentials: true
    });
  }

  changePassword(payload: { currentPassword: string; newPassword: string; confirmNewPassword: string }): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/change-password`, payload, {
      withCredentials: true
    });
  }

  updateProfileImage(file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.put<{ imageUrl: string }>(`${this.baseUrl}/profile-image`, formData, {
      withCredentials: true
    });
  }
}