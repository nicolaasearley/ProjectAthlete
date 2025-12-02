import { apiClient, ApiError } from '../lib/api';

export type NotificationType = 'COMMENT' | 'REACTION' | 'CHALLENGE_UPDATE' | 'COACH_ANNOUNCEMENT' | 'WORKOUT_ASSIGNED';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  data: Notification[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    unreadCount: number;
  };
}

export interface NotificationQuery {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

export class NotificationsService {
  async getAll(query?: NotificationQuery): Promise<NotificationListResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.isRead !== undefined) params.append('isRead', query.isRead.toString());

    const endpoint = `/notifications${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get<NotificationListResponse>(endpoint);
  }

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ unreadCount: number }>('/notifications/unread-count');
    return response.unreadCount || 0;
  }

  async markAsRead(id: string): Promise<Notification> {
    return apiClient.patch<Notification>(`/notifications/${id}/read`, {});
  }

  async markAllAsRead(): Promise<{ count: number }> {
    return apiClient.patch<{ count: number }>('/notifications/mark-all-read', {});
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/notifications/${id}`);
  }
}

export const notificationsService = new NotificationsService();

