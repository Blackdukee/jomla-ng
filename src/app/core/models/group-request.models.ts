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
}

export interface CreateGroupRequestRequest {
  title: string;
  quantity: number;
  description: string | null;
  imageUrls: string[] | null;
}
