/**
 * Batch models matching backend DTOs.
 * Backend: Jomla.Application.Features.Batches.DTOs
 */

/** Matches backend BatchDetailDto */
export interface BatchDetailDto {
  id: string;
  offerId: string;
  offerTitle: string;
  batchNumber: number;
  targetQuantity: number;
  currentQuantity: number;
  remainingSlots: number;
  status: BatchStatus;
  unitPrice: number;
  discountPercentage: number;
  discountedPrice: number;
  supplierName: string;
  categoryName: string;
  createdAt: string;
  completedAt?: string;
  expiresAt?: string;
  participants: BatchParticipantDto[];
}

/** Matches backend BatchParticipantDto */
export interface BatchParticipantDto {
  buyerId: string;
  buyerName: string;
  quantity: number;
  status: 'Active' | 'Left';
  joinedAt: string;
}

/** Matches backend BatchUpdatedDto (SignalR payload) */
export interface BatchUpdatedDto {
  offerId: string;
  batchId: string;
  batchNumber: number;
  currentQuantity: number;
  targetQuantity: number;
  remainingSlots: number;
  status: BatchStatus;
  newBatch?: BatchUpdatedDto;
}

/** Matches backend JoinBatchResponse */
export interface JoinBatchResponse {
  success: boolean;
  batchId?: string;
  participantQuantity?: number;
  totalAmount?: number;
  paymentIntentId?: string;
  batchCurrentQuantity?: number;
  batchTargetQuantity?: number;
  error?: string;
  errorCode?: string;
  slotsAvailable?: number;
  statusCode?: number;
}

/** Matches backend LeaveBatchResponse */
export interface LeaveBatchResponse {
  success: boolean;
  batchId?: string;
  remainingQuantity?: number;
  error?: string;
}

/** Matches backend JoinBatchRequest (body sent to POST /api/batches/{id}/join) */
export interface JoinBatchRequest {
  quantity: number;
}

/**
 * Enum matching backend BatchStatus.
 * Backend uses JsonStringEnumConverter so these come as PascalCase strings.
 */
export type BatchStatus = 'Open' | 'Completed' | 'Failed';
