export interface GroupRequestListItemDto {
  id: string;
  title: string;
  description: string | null;
  currentQuantity: number;
  status: string;
  categoryName: string;
  createdAt: string;
  participantsCount: number;
}

export interface GroupRequestOfferDto {
  id: string;
  supplierId: string;
  supplierName: string;
  unitPrice: number;
  minUnitPrice?: number;
  currentUnitPrice: number;
  quantityAvailable: number;
  minFallbackQuantity?: number;
  acceptedQuantity: number;
  status: string;
  createdAt: string;
  expiresAt: string;
  roundNumber: number;
}

export interface GroupRequestDetailDto {
  id: string;
  title: string;
  description: string | null;
  imageUrls: string | null;
  currentQuantity: number;
  status: string;
  moderationStatus: string;
  moderationReason: string | null;
  createdAt: string;
  initiatorId: string;
  categoryName: string;
  participantsCount: number;
  offers: GroupRequestOfferDto[];
}

export interface CreateGroupRequestRequest {
  title: string;
  quantity: number;
  description: string | null;
  imageUrls: string[] | null;
}

