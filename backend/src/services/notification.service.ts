import { PrismaClient, NotificationType, NotificationPriority, NotificationCategory } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateNotificationData {
  userId: number;
  organizationId: number;
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  category?: NotificationCategory;
  relatedEntityType?: string;
  relatedEntityId?: number;
  actionUrl?: string;
  actionLabel?: string;
  data?: any;
  expiresAt?: Date;
  channels?: string[];
}

export class NotificationService {
  
  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          organizationId: data.organizationId,
          title: data.title,
          message: data.message,
          type: data.type || 'INFO',
          priority: data.priority || 'MEDIUM',
          category: data.category || 'SYSTEM',
          relatedEntityType: data.relatedEntityType,
          relatedEntityId: data.relatedEntityId,
          actionUrl: data.actionUrl,
          actionLabel: data.actionLabel,
          data: data.data,
          expiresAt: data.expiresAt,
          channels: data.channels
        }
      });

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Create bulk notifications for multiple users
   */
  async createBulkNotifications(users: number[], notificationData: Omit<CreateNotificationData, 'userId'>) {
    const notifications = users.map(userId => ({
      ...notificationData,
      userId
    }));

    const results = [];
    for (const notification of notifications) {
      try {
        const result = await this.createNotification(notification);
        results.push(result);
      } catch (error) {
        console.error(`Failed to create notification for user ${notification.userId}:`, error);
      }
    }

    return results;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: number) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: userId
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: number, organizationId: number) {
    return prisma.notification.findMany({
      where: {
        userId,
        organizationId,
        isRead: false,
        isArchived: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  /**
   * Archive old notifications
   */
  async archiveExpiredNotifications() {
    return prisma.notification.updateMany({
      where: {
        expiresAt: {
          lt: new Date()
        },
        isArchived: false
      },
      data: {
        isArchived: true,
        archivedAt: new Date()
      }
    });
  }
}