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
