import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UploadsService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5174/api/uploads';

  /** POST /api/uploads/image — Standalone file upload utility */
  uploadImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<{ url: string }>(`${this.baseUrl}/image`, formData, {
      withCredentials: true
    });
  }
}
