export interface FlaggedOfferDto {
  id: string;
  title: string;
  description?: string;
  moderationReason: string;
  createdAt: string;
  supplierId: string;
}

export interface FlaggedGroupRequestDto {
  id: string;
  title: string;
  moderationReason: string;
  createdAt: string;
  initiatorId: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}
