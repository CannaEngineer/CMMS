import io, { Socket } from 'socket.io-client';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'ALERT' | 'WARNING' | 'INFO' | 'SUCCESS';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: 'WORK_ORDER' | 'ASSET' | 'MAINTENANCE' | 'INVENTORY' | 'USER' | 'SYSTEM' | 'PORTAL';
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  createdBy?: {
    id: number;
    name: string;
    email: string;
  };
}

interface NotificationStats {
  total: number;
  unread: number;
  urgent: number;
  byCategory: Record<string, number>;
}

interface NotificationPreference {
  id?: number;
  category: string;
  channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
  enabled: boolean;
  frequency: 'IMMEDIATE' | 'DIGEST' | 'DISABLED';
  minimumPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  quietHoursStart?: string;
  quietHoursEnd?: string;
  weekdaysOnly?: boolean;
}

class NotificationService {
  private socket: Socket | null = null;
  private baseUrl = import.meta.env.PROD 
    ? (import.meta.env.VITE_API_URL || '') 
    : 'http://localhost:5000';
  private listeners: Map<string, Function[]> = new Map();

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Initialize WebSocket connection
  initializeWebSocket() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No auth token found, skipping WebSocket initialization');
      return;
    }

    // Skip WebSocket in production/serverless environments
    const isVercel = window.location.hostname.includes('vercel.app') || 
                     import.meta.env.PROD || 
                     this.baseUrl.includes('vercel.app');
    
    if (isVercel) {
      console.warn('WebSocket disabled in serverless environment');
      return;
    }

    try {
      this.socket = io(this.baseUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 10000
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected for notifications');
        this.emit('connection_status', { connected: true });
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        this.emit('connection_status', { connected: false });
      });

      this.socket.on('new_notification', (data) => {
        console.log('New notification received:', data);
        this.emit('new_notification', data.data);
      });

      this.socket.on('notification_stats_updated', (data) => {
        console.log('Notification stats updated:', data);
        this.emit('stats_updated', data.data);
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.emit('connection_error', error);
      });
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
    }
  }

  // Clean up WebSocket connection
  cleanup() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // API Methods
  async getNotifications(params: {
    page?: number;
    limit?: number;
    category?: string;
    type?: string;
    priority?: string;
    isRead?: boolean;
    isArchived?: boolean;
  } = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}/api/notifications?${queryParams}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async getNotificationStats(): Promise<NotificationStats> {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/stats`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notification stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markMultipleAsRead(notificationIds: string[]) {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/bulk/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify({ notificationIds })
      });

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  async markAllAsRead(category?: string) {
    try {
      const url = category 
        ? `${this.baseUrl}/api/notifications/all/read?category=${category}`
        : `${this.baseUrl}/api/notifications/all/read`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async archiveNotification(notificationId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/${notificationId}/archive`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to archive notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error archiving notification:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  async getPreferences(): Promise<NotificationPreference[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/preferences`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notification preferences');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }
  }

  async updatePreferences(preferences: NotificationPreference[]) {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify({ preferences })
      });

      if (!response.ok) {
        throw new Error('Failed to update notification preferences');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  async sendTestNotification(data: Partial<NotificationData>) {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }

  // Helper methods
  getNotificationColor(type: string): string {
    const colorMap = {
      ALERT: '#f44336',
      WARNING: '#ff9800',
      INFO: '#2196f3',
      SUCCESS: '#4caf50'
    };
    return colorMap[type as keyof typeof colorMap] || '#757575';
  }

  getPriorityIcon(priority: string): string {
    const iconMap = {
      LOW: '●',
      MEDIUM: '●●',
      HIGH: '●●●',
      URGENT: '🔥'
    };
    return iconMap[priority as keyof typeof iconMap] || '●';
  }

  formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export type { NotificationData, NotificationStats, NotificationPreference };