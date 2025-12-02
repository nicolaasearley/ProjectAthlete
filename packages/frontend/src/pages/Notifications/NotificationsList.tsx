import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationsService, Notification, NotificationListResponse, NotificationType } from '../../services/notifications.service';
import { ApiError } from '../../lib/api';
import Navbar from '../../components/Layout/Navbar';

export default function NotificationsList() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0, unreadCount: 0 });
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const response: NotificationListResponse = await notificationsService.getAll({
        page: 1,
        limit: 20,
        isRead: filter === 'unread' ? false : undefined,
      });
      setNotifications(response.data);
      setMeta(response.meta);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      loadNotifications();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      loadNotifications();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to mark all as read');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      await notificationsService.delete(id);
      loadNotifications();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to delete notification');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Navigate to related entity if available
    if (notification.relatedEntityType === 'POST' && notification.relatedEntityId) {
      navigate(`/feed/${notification.relatedEntityId}`);
    } else if (notification.relatedEntityType === 'COMMENT' && notification.relatedEntityId) {
      // Find the post for this comment (would need additional API call)
      // For now, just navigate to feed
      navigate('/feed');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getNotificationIcon = (type: NotificationType) => {
    const icons: Record<NotificationType, string> = {
      COMMENT: '💬',
      REACTION: '👍',
      CHALLENGE_UPDATE: '🏆',
      COACH_ANNOUNCEMENT: '📢',
      WORKOUT_ASSIGNED: '💪',
    };
    return icons[type] || '🔔';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Notifications
          </h1>
          {meta.unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Mark All Read
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-gray-200/50 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Unread ({meta.unreadCount})
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-600">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-12 shadow-lg border border-gray-200/50 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-2xl font-bold mb-2">No notifications</h3>
            <p className="text-gray-600">
              {filter === 'unread'
                ? 'You have no unread notifications'
                : 'You have no notifications yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-lg border-2 transition-all cursor-pointer hover:shadow-xl ${
                  notification.isRead
                    ? 'border-gray-200/50'
                    : 'border-blue-300 bg-blue-50/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold">{notification.title}</h3>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{formatDate(notification.createdAt)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                        className="text-red-600 hover:text-red-700 text-sm"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

