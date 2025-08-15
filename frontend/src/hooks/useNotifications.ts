import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService, type Notification, type NotificationResponse, type NotificationPreference } from '../services/notification.service';
import { useNavigate } from 'react-router-dom';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [isConnected, setIsConnected] = useState(false);

  const navigate = useNavigate();

  // Load notifications
  const loadNotifications = useCallback(async (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    category?: string;
    append?: boolean;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await notificationService.getNotifications(params);
      
      if (params?.append && params.page && params.page > 1) {
        setNotifications(prev => [...prev, ...response.notifications]);
      } else {
        setNotifications(response.notifications);
      }
      
      setPagination(response.pagination);
      setUnreadCount(response.unreadCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more notifications (for infinite scroll)
  const loadMore = useCallback(() => {
    if (pagination.hasNext && !loading) {
      loadNotifications({
        page: pagination.page + 1,
        limit: pagination.limit,
        append: true
      });
    }
  }, [pagination, loading, loadNotifications]);

  // Refresh notifications
  const refresh = useCallback(() => {
    loadNotifications({ page: 1 });
  }, [loadNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      await notificationService.markAsRead(notificationId);
    } catch (err) {
      console.error('Error marking notification as read:', err);
      // Revert optimistic update
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: false, readAt: undefined }
            : notification
        )
      );
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const currentUnread = notifications.filter(n => !n.isRead).length;
      
      // Optimistic update
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          isRead: true, 
          readAt: notification.readAt || new Date().toISOString() 
        }))
      );
      setUnreadCount(0);

      await notificationService.markAllAsRead();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      // Revert optimistic update
      refresh();
    }
  }, [notifications, refresh]);

  // Archive notification
  const archiveNotification = useCallback(async (notificationId: string) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      await notificationService.archiveNotification(notificationId);
    } catch (err) {
      console.error('Error archiving notification:', err);
      refresh();
    }
  }, [notifications, refresh]);

  // Handle notification click
  const handleNotificationClick = useCallback(async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate to action URL if provided
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  }, [markAsRead, navigate]);

  // Get unread count only
  const getUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.unreadCount);
    } catch (err) {
      console.error('Error getting unread count:', err);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    pagination,
    isConnected,
    loadNotifications,
    loadMore,
    refresh,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    handleNotificationClick,
    getUnreadCount
  };
};

export const useNotificationSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;
  const reconnectAttempts = useRef(0);

  // Connection management
  const connect = useCallback(() => {
    try {
      notificationService.connect();
    } catch (error) {
      console.error('Failed to connect to notification service:', error);
      scheduleReconnect();
    }
  }, []);

  const disconnect = useCallback(() => {
    notificationService.disconnect();
    setIsConnected(false);
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttempts.current++;
        connect();
      }, delay);
    }
  }, [connect]);

  // Event handlers
  useEffect(() => {
    const handleConnected = () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      scheduleReconnect();
    };

    const handleNewNotification = (data: { notification: Notification; unreadCount: number }) => {
      setLatestNotification(data.notification);
      setUnreadCount(data.unreadCount);
    };

    const handleUnreadCount = (data: { count: number }) => {
      setUnreadCount(data.count);
    };

    notificationService.on('connected', handleConnected);
    notificationService.on('disconnected', handleDisconnected);
    notificationService.on('notification:new', handleNewNotification);
    notificationService.on('notification:unread-count', handleUnreadCount);

    return () => {
      notificationService.off('connected', handleConnected);
      notificationService.off('disconnected', handleDisconnected);
      notificationService.off('notification:new', handleNewNotification);
      notificationService.off('notification:unread-count', handleUnreadCount);
    };
  }, [scheduleReconnect]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    unreadCount,
    latestNotification,
    connect,
    disconnect,
    subscribeToWorkOrder: notificationService.subscribeToWorkOrder.bind(notificationService),
    unsubscribeFromWorkOrder: notificationService.unsubscribeFromWorkOrder.bind(notificationService),
    subscribeToAsset: notificationService.subscribeToAsset.bind(notificationService),
    unsubscribeFromAsset: notificationService.unsubscribeFromAsset.bind(notificationService),
  };
};

export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const prefs = await notificationService.getPreferences();
      setPreferences(prefs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
      console.error('Error loading notification preferences:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreference>[]) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await notificationService.updatePreferences(newPreferences);
      setPreferences(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
      console.error('Error updating notification preferences:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    loading,
    error,
    loadPreferences,
    updatePreferences
  };
};

// Hook for in-app toast notifications
export const useNotificationToast = () => {
  const { latestNotification } = useNotificationSocket();
  const [toastNotification, setToastNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (latestNotification) {
      setToastNotification(latestNotification);
      
      // Auto-hide after 5 seconds for non-urgent notifications
      if (latestNotification.priority !== 'URGENT') {
        const timer = setTimeout(() => {
          setToastNotification(null);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [latestNotification]);

  const hideToast = useCallback(() => {
    setToastNotification(null);
  }, []);

  return {
    toastNotification,
    hideToast
  };
};