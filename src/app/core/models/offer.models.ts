/** Matches backend OfferDto */
export interface OfferDto {
  id: string;
  title: string;
  description?: string;
  unitPrice: number;
  discountPercentage: number;
  categoryName: string;
  supplierName: string;
  images: string[];
  createdAt: string;
  expiresAt?: string;
  activeBatchId?: string;
  committedUnits: number;
  hubTargetQuantity: number;
  buyerCount: number;
  minFallbackQuantity?: number;
  batches?: OfferBatchDto[];
}

export interface OfferBatchDto {
  id: string;
  batchNumber: number;
  targetQuantity: number;
  currentQuantity: number;
  status: 'Open' | 'Completed' | 'Failed';
  createdAt: string;
  completedAt?: string;
}

/** Matches backend MyOfferDto */
export interface MyOfferDto {
  id: string;
  title: string;
  unitPrice: number;
  discountPercentage: number;
  status: 'PendingReview' | 'Active' | 'Inactive' | 'Expired';
  totalQuantityAvailable: number;
  committedUnits: number;
  batchTargetQuantity: number;
  activeBatchId?: string;
  activeBatchNumber?: number;
  createdAt: string;
  expiresAt?: string;
}

export interface GetAllOffersPagedResponse {
  items: OfferDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  activeOffersCount: number;
  expiredOffersCount: number;
  pendingModerationCount: number;
}

export interface MyOffersPagedResponse {
  items: MyOfferDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  activeOffersCount: number;
  expiredOffersCount: number;
  pendingModerationCount: number;
}

