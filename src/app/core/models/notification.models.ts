export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  body: string;
  entityId?: string;
  entityType?: string;
  isRead: boolean;
  createdAt: string;
}

export interface GetNotificationsResult {
  items: NotificationDto[];
  totalCount: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
