import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationsService } from '../../services/notifications.service';

export default function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnreadCount();
    
    // Poll for unread count every 30 seconds
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const count = await notificationsService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load unread count:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link
      to="/notifications"
      className="relative px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors"
      title="Notifications"
    >
      <span className="text-2xl">🔔</span>
      {!loading && unreadCount > 0 && (
        <span className="absolute top-0 right-0 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

