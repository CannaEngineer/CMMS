import { io, Socket } from 'socket.io-client';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'ALERT' | 'WARNING' | 'INFO' | 'SUCCESS';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: 'WORK_ORDER' | 'ASSET' | 'MAINTENANCE' | 'INVENTORY' | 'USER' | 'SYSTEM' | 'PORTAL';
  isRead: boolean;
  readAt?: string;
  isArchived: boolean;
  archivedAt?: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  actionUrl?: string;
  actionLabel?: string;
  data?: any;
  imageUrl?: string;
  expiresAt?: string;
  channels: string[];
  createdBy?: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreference {
  id: number;
  category: 'WORK_ORDER' | 'ASSET' | 'MAINTENANCE' | 'INVENTORY' | 'USER' | 'SYSTEM' | 'PORTAL';
  channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
  frequency: 'IMMEDIATE' | 'DIGEST' | 'DISABLED';
  enabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  weekdaysOnly: boolean;
  minimumPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  unreadCount: number;
}

class NotificationService {
  private socket: Socket | null = null;
  private listeners = new Map<string, Function[]>();

  /**
   * Initialize WebSocket connection
   */
  connect() {
    const token = localStorage.getItem('token');
    if (!token || this.socket?.connected) return;

    this.socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to notification server');
      this.emit('connected', null);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from notification server');
      this.emit('disconnected', null);
    });

    this.socket.on('notification:new', (data: { notification: Notification; unreadCount: number }) => {
      console.log('New notification received:', data);
      this.emit('notification:new', data);
    });

    this.socket.on('notification:unread-count', (data: { count: number }) => {
      this.emit('notification:unread-count', data);
    });

    this.socket.on('workorder:updated', (data: any) => {
      this.emit('workorder:updated', data);
    });

    this.socket.on('asset:updated', (data: any) => {
      this.emit('asset:updated', data);
    });
  }

  /**
   * Subscribe to specific work order updates
   */
  subscribeToWorkOrder(workOrderId: number) {
    this.socket?.emit('workorder:subscribe', workOrderId);
  }

  /**
   * Unsubscribe from work order updates
   */
  unsubscribeFromWorkOrder(workOrderId: number) {
    this.socket?.emit('workorder:unsubscribe', workOrderId);
  }

  /**
   * Subscribe to asset updates
   */
  subscribeToAsset(assetId: number) {
    this.socket?.emit('asset:subscribe', assetId);
  }

  /**
   * Unsubscribe from asset updates
   */
  unsubscribeFromAsset(assetId: number) {
    this.socket?.emit('asset:unsubscribe', assetId);
  }

  /**
   * Mark notification as read via WebSocket
   */
  markAsReadViaSocket(notificationId: string) {
    this.socket?.emit('notification:mark-read', { notificationId });
  }

  /**
   * Get unread count via WebSocket
   */
  getUnreadCountViaSocket() {
    this.socket?.emit('notification:get-unread-count');
  }

  /**
   * Add event listener
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Fetch notifications from API
   */
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    category?: string;
  }): Promise<NotificationResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.unreadOnly) searchParams.set('unreadOnly', 'true');
    if (params?.category) searchParams.set('category', params.category);

    const response = await fetch(`/api/notifications?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }

    return response.json();
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const response = await fetch('/api/notifications/unread-count', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch unread count');
    }

    return response.json();
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }

    return response.json();
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds: string[]): Promise<{ updated: number }> {
    const response = await fetch('/api/notifications/read-multiple', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ notificationIds })
    });

    if (!response.ok) {
      throw new Error('Failed to mark notifications as read');
    }

    return response.json();
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ updated: number }> {
    const response = await fetch('/api/notifications/read-all', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }

    return response.json();
  }

  /**
   * Archive notification
   */
  async archiveNotification(notificationId: string): Promise<Notification> {
    const response = await fetch(`/api/notifications/${notificationId}/archive`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to archive notification');
    }

    return response.json();
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<{ success: boolean }> {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete notification');
    }

    return response.json();
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreference[]> {
    const response = await fetch('/api/notifications/preferences', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notification preferences');
    }

    return response.json();
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreference>[]): Promise<NotificationPreference[]> {
    const response = await fetch('/api/notifications/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ preferences })
    });

    if (!response.ok) {
      throw new Error('Failed to update notification preferences');
    }

    return response.json();
  }

  /**
   * Create a test notification (development only)
   */
  async createTestNotification(): Promise<{ success: boolean; notification: Notification }> {
    const response = await fetch('/api/notifications/test', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to create test notification');
    }

    return response.json();
  }
}

// Singleton instance
export const notificationService = new NotificationService();