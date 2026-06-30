import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  BatchDetailDto,
  JoinBatchResponse,
  LeaveBatchResponse,
  JoinBatchRequest,
  BuyerHubDto
} from '../models';

/**
 * Service for batch-related API calls.
 * Maps to BatchesController endpoints:
 *   GET    /api/batches/{batchId}
 *   POST   /api/batches/{batchId}/join
 *   DELETE /api/batches/{batchId}/leave
 */
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BatchesService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/batches`;

  /** GET /api/batches/{batchId} — Fetch batch detail with participants */
  getBatch(batchId: string): Observable<BatchDetailDto> {
    return this.http.get<BatchDetailDto>(`${this.baseUrl}/${batchId}`, {
      withCredentials: true
    });
  }

  /** POST /api/batches/{batchId}/join — Join a batch with given quantity */
  joinBatch(batchId: string, quantity: number): Observable<JoinBatchResponse> {
    const body: JoinBatchRequest = { quantity };
    return this.http.post<JoinBatchResponse>(
      `${this.baseUrl}/${batchId}/join`,
      body,
      { withCredentials: true }
    );
  }

  /** POST /api/batches/{batchId}/leave — Leave a batch */
  leaveBatch(batchId: string): Observable<LeaveBatchResponse> {
    return this.http.post<LeaveBatchResponse>(
      `${this.baseUrl}/${batchId}/leave`,
      {},
      { withCredentials: true }
    );
  }

  /** POST /api/batches/{batchId}/confirm-join — Confirm joining a batch after successful payment */
  confirmJoinBatch(batchId: string, paymentIntentId: string, quantity: number): Observable<any> {
    const body = { paymentIntentId, quantity };
    return this.http.post<any>(
      `${this.baseUrl}/${batchId}/confirm-join`,
      body,
      { withCredentials: true }
    );
  }

  /** PUT /api/batches/{batchId}/quantity — Update participant quantity in batch, cycling Stripe hold */
  updateBatchParticipantQuantity(batchId: string, newQuantity: number): Observable<any> {
    const body = { newQuantity };
    return this.http.put<any>(
      `${this.baseUrl}/${batchId}/quantity`,
      body,
      { withCredentials: true }
    );
  }

  /** GET /api/batches/my-hubs — Retrieve active and completed hubs joined by the buyer */
  getMyHubs(): Observable<BuyerHubDto[]> {
    return this.http.get<BuyerHubDto[]>(`${this.baseUrl}/my-hubs`, {
      withCredentials: true
    });
  }
}
