import { PrismaClient, NotificationType, NotificationPriority, NotificationCategory, NotificationChannel, NotificationFrequency } from '@prisma/client';
import { WebSocketService } from '../../services/websocket.service';
import { emailService } from '../../services/email.service';

const prisma = new PrismaClient();

interface CreateNotificationData {
  userId: number;
  organizationId: number;
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  category: NotificationCategory;
  relatedEntityType?: string;
  relatedEntityId?: number;
  actionUrl?: string;
  actionLabel?: string;
  imageUrl?: string;
  data?: any;
  channels?: NotificationChannel[];
  expiresAt?: Date;
  createdById?: number;
}

interface NotificationFilters {
  category?: NotificationCategory;
  type?: NotificationType;
  priority?: NotificationPriority;
  isRead?: boolean;
  isArchived?: boolean;
}

export class NotificationService {
  private webSocketService: WebSocketService;

  constructor() {
    this.webSocketService = WebSocketService.getInstance();
  }

  async createNotification(data: CreateNotificationData) {
    try {
      // Check if user should receive this type of notification
      const userPreferences = await this.getUserPreferences(data.userId);
      const relevantPreference = userPreferences.find((pref: any) => 
        pref.category === data.category && 
        pref.channel === NotificationChannel.IN_APP
      );

      if (relevantPreference && !relevantPreference.enabled) {
        console.log(`Notification blocked by user preference: ${data.userId}, ${data.category}`);
        return null;
      }

      // Check priority filtering
      if (relevantPreference && this.comparePriority(data.priority || NotificationPriority.MEDIUM, relevantPreference.minimumPriority) < 0) {
        console.log(`Notification blocked by priority filter: ${data.priority} < ${relevantPreference.minimumPriority}`);
        return null;
      }

      // Check quiet hours
      if (relevantPreference && !this.isWithinActiveHours(relevantPreference)) {
        console.log(`Notification blocked by quiet hours for user ${data.userId}`);
        return null;
      }

      const notification = await prisma.notification.create({
        data: {
          title: data.title,
          message: data.message,
          type: data.type || NotificationType.INFO,
          priority: data.priority || NotificationPriority.MEDIUM,
          category: data.category,
          userId: data.userId,
          organizationId: data.organizationId,
          relatedEntityType: data.relatedEntityType,
          relatedEntityId: data.relatedEntityId,
          actionUrl: data.actionUrl,
          actionLabel: data.actionLabel,
          imageUrl: data.imageUrl,
          data: data.data,
          channels: data.channels || [NotificationChannel.IN_APP],
          expiresAt: data.expiresAt,
          createdById: data.createdById
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Send real-time notification via WebSocket
      this.webSocketService.sendNotificationToUser(data.userId, notification);

      // Send email notification if enabled for this user and category
      await this.sendEmailNotificationIfEnabled(data.userId, notification);

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  async getUserNotifications(
    userId: number, 
    page: number = 1, 
    limit: number = 50, 
    filters: NotificationFilters = {}
  ) {
    try {
      const offset = (page - 1) * limit;
      
      const where: any = {
        userId,
        isArchived: filters.isArchived || false,
        ...(filters.isRead !== undefined && { isRead: filters.isRead }),
        ...(filters.category && { category: filters.category }),
        ...(filters.type && { type: filters.type }),
        ...(filters.priority && { priority: filters.priority }),
        // Don't show expired notifications
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      };

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
          ],
          skip: offset,
          take: limit,
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          }
        }),
        prisma.notification.count({ where })
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  async getNotificationStats(userId: number) {
    try {
      const stats = await prisma.notification.aggregate({
        where: {
          userId,
          isArchived: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        _count: {
          id: true
        }
      });

      const unreadCount = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
          isArchived: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });

      const urgentCount = await prisma.notification.count({
        where: {
          userId,
          priority: NotificationPriority.URGENT,
          isRead: false,
          isArchived: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });

      const categoryStats = await prisma.notification.groupBy({
        by: ['category'],
        where: {
          userId,
          isArchived: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        _count: {
          id: true
        }
      });

      return {
        total: stats._count.id,
        unread: unreadCount,
        urgent: urgentCount,
        byCategory: categoryStats.reduce((acc, stat) => {
          acc[stat.category] = stat._count.id;
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw new Error('Failed to fetch notification stats');
    }
  }

  async markAsRead(notificationId: string, userId: number) {
    try {
      const notification = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      if (notification.count === 0) {
        throw new Error('Notification not found or access denied');
      }

      // Send updated stats via WebSocket
      const stats = await this.getNotificationStats(userId);
      this.webSocketService.sendNotificationStatsToUser(userId, stats);

      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markMultipleAsRead(notificationIds: string[], userId: number) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      // Send updated stats via WebSocket
      const stats = await this.getNotificationStats(userId);
      this.webSocketService.sendNotificationStatsToUser(userId, stats);

      return { updated: result.count };
    } catch (error) {
      console.error('Error marking multiple notifications as read:', error);
      throw new Error('Failed to mark notifications as read');
    }
  }

  async markAllAsRead(userId: number, category?: NotificationCategory) {
    try {
      const where: any = {
        userId,
        isRead: false,
        isArchived: false
      };

      if (category) {
        where.category = category;
      }

      const result = await prisma.notification.updateMany({
        where,
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      // Send updated stats via WebSocket
      const stats = await this.getNotificationStats(userId);
      this.webSocketService.sendNotificationStatsToUser(userId, stats);

      return { updated: result.count };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  async archiveNotification(notificationId: string, userId: number) {
    try {
      const notification = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId
        },
        data: {
          isArchived: true,
          archivedAt: new Date()
        }
      });

      if (notification.count === 0) {
        throw new Error('Notification not found or access denied');
      }

      return { success: true };
    } catch (error) {
      console.error('Error archiving notification:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string, userId: number) {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId
        }
      });

      if (result.count === 0) {
        throw new Error('Notification not found or access denied');
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  async getNotificationById(notificationId: string, userId: number) {
    try {
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      return notification;
    } catch (error) {
      console.error('Error fetching notification by ID:', error);
      throw new Error('Failed to fetch notification');
    }
  }

  async getUserPreferences(userId: number): Promise<any[]> {
    try {
      const preferences = await prisma.notificationPreference.findMany({
        where: { userId }
      });

      // If no preferences exist, create defaults
      if (preferences.length === 0) {
        return this.createDefaultPreferences(userId);
      }

      return preferences;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      throw new Error('Failed to fetch notification preferences');
    }
  }

  async updateUserPreferences(userId: number, preferences: any[]) {
    try {
      // Delete existing preferences
      await prisma.notificationPreference.deleteMany({
        where: { userId }
      });

      // Create new preferences
      const createdPreferences = await prisma.notificationPreference.createMany({
        data: preferences.map(pref => ({
          ...pref,
          userId
        }))
      });

      return this.getUserPreferences(userId);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw new Error('Failed to update notification preferences');
    }
  }

  async cleanupOldNotifications(organizationId: number, daysOld: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.notification.deleteMany({
        where: {
          organizationId,
          createdAt: { lt: cutoffDate },
          OR: [
            { isArchived: true },
            { isRead: true }
          ]
        }
      });

      return { deleted: result.count };
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw new Error('Failed to cleanup notifications');
    }
  }

  private async createDefaultPreferences(userId: number): Promise<any[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const defaultPreferences = [
      // Work Order notifications
      { category: NotificationCategory.WORK_ORDER, channel: NotificationChannel.IN_APP, enabled: true, frequency: NotificationFrequency.IMMEDIATE, minimumPriority: NotificationPriority.LOW },
      { category: NotificationCategory.WORK_ORDER, channel: NotificationChannel.EMAIL, enabled: true, frequency: NotificationFrequency.DIGEST, minimumPriority: NotificationPriority.MEDIUM },
      
      // Asset notifications
      { category: NotificationCategory.ASSET, channel: NotificationChannel.IN_APP, enabled: true, frequency: NotificationFrequency.IMMEDIATE, minimumPriority: NotificationPriority.MEDIUM },
      { category: NotificationCategory.ASSET, channel: NotificationChannel.EMAIL, enabled: false, frequency: NotificationFrequency.DIGEST, minimumPriority: NotificationPriority.HIGH },
      
      // Maintenance notifications
      { category: NotificationCategory.MAINTENANCE, channel: NotificationChannel.IN_APP, enabled: true, frequency: NotificationFrequency.IMMEDIATE, minimumPriority: NotificationPriority.LOW },
      { category: NotificationCategory.MAINTENANCE, channel: NotificationChannel.EMAIL, enabled: true, frequency: NotificationFrequency.DIGEST, minimumPriority: NotificationPriority.MEDIUM },
      
      // Inventory notifications
      { category: NotificationCategory.INVENTORY, channel: NotificationChannel.IN_APP, enabled: true, frequency: NotificationFrequency.IMMEDIATE, minimumPriority: NotificationPriority.MEDIUM },
      { category: NotificationCategory.INVENTORY, channel: NotificationChannel.EMAIL, enabled: false, frequency: NotificationFrequency.DIGEST, minimumPriority: NotificationPriority.HIGH },
      
      // User notifications
      { category: NotificationCategory.USER, channel: NotificationChannel.IN_APP, enabled: true, frequency: NotificationFrequency.IMMEDIATE, minimumPriority: NotificationPriority.LOW },
      { category: NotificationCategory.USER, channel: NotificationChannel.EMAIL, enabled: true, frequency: NotificationFrequency.IMMEDIATE, minimumPriority: NotificationPriority.MEDIUM },
      
      // System notifications
      { category: NotificationCategory.SYSTEM, channel: NotificationChannel.IN_APP, enabled: true, frequency: NotificationFrequency.IMMEDIATE, minimumPriority: NotificationPriority.MEDIUM },
      { category: NotificationCategory.SYSTEM, channel: NotificationChannel.EMAIL, enabled: false, frequency: NotificationFrequency.DIGEST, minimumPriority: NotificationPriority.HIGH },
      
      // Portal notifications
      { category: NotificationCategory.PORTAL, channel: NotificationChannel.IN_APP, enabled: true, frequency: NotificationFrequency.IMMEDIATE, minimumPriority: NotificationPriority.LOW },
      { category: NotificationCategory.PORTAL, channel: NotificationChannel.EMAIL, enabled: true, frequency: NotificationFrequency.DIGEST, minimumPriority: NotificationPriority.MEDIUM }
    ];

    await prisma.notificationPreference.createMany({
      data: defaultPreferences.map(pref => ({
        ...pref,
        userId,
        organizationId: user.organizationId
      }))
    });

    return this.getUserPreferences(userId);
  }

  private comparePriority(priority1: NotificationPriority, priority2: NotificationPriority): number {
    const priorities = {
      [NotificationPriority.LOW]: 1,
      [NotificationPriority.MEDIUM]: 2,
      [NotificationPriority.HIGH]: 3,
      [NotificationPriority.URGENT]: 4
    };

    return priorities[priority1] - priorities[priority2];
  }

  private isWithinActiveHours(preference: any): boolean {
    if (!preference.quietHoursStart || !preference.quietHoursEnd) {
      return true;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = preference.quietHoursStart.split(':').map(Number);
    const [endHour, endMinute] = preference.quietHoursEnd.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    // Check if we're in quiet hours
    let inQuietHours = false;
    if (startTime <= endTime) {
      // Normal case: quiet hours within same day
      inQuietHours = currentTime >= startTime && currentTime <= endTime;
    } else {
      // Edge case: quiet hours cross midnight
      inQuietHours = currentTime >= startTime || currentTime <= endTime;
    }

    // Check weekdays only preference
    if (preference.weekdaysOnly) {
      const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      if (isWeekend) {
        return false; // Don't send notifications on weekends if weekdaysOnly is true
      }
    }

    return !inQuietHours;
  }

  private async sendEmailNotificationIfEnabled(userId: number, notification: any): Promise<void> {
    try {
      // Check if email service is configured
      if (!emailService.isConfigured()) {
        console.log('Email service not configured, skipping email notification');
        return;
      }

      // Check if user has email notifications enabled for this category
      const userPreferences = await this.getUserPreferences(userId);
      const emailPreference = userPreferences.find((pref: any) => 
        pref.category === notification.category && 
        pref.channel === NotificationChannel.EMAIL
      );

      if (!emailPreference || !emailPreference.enabled) {
        console.log(`Email notifications disabled for user ${userId}, category ${notification.category}`);
        return;
      }

      // Check priority filtering for email
      if (this.comparePriority(notification.priority, emailPreference.minimumPriority) < 0) {
        console.log(`Email notification blocked by priority filter: ${notification.priority} < ${emailPreference.minimumPriority}`);
        return;
      }

      // Check quiet hours for email
      if (!this.isWithinActiveHours(emailPreference)) {
        console.log(`Email notification blocked by quiet hours for user ${userId}`);
        return;
      }

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          name: true, 
          email: true,
          organization: {
            select: { name: true }
          }
        }
      });

      if (!user || !user.email) {
        console.log(`No email found for user ${userId}`);
        return;
      }

      // Prepare email data
      const emailData = {
        user: {
          name: user.name,
          email: user.email,
        },
        notification: {
          title: notification.title,
          message: notification.message,
          category: notification.category,
          priority: notification.priority,
          actionUrl: notification.actionUrl,
          actionLabel: notification.actionLabel,
          createdAt: notification.createdAt,
          relatedEntityType: notification.relatedEntityType,
          relatedEntityId: notification.relatedEntityId,
        },
        organizationName: user.organization?.name || 'CMMS',
        unsubscribeUrl: `${process.env.FRONTEND_URL}/settings/notifications`,
      };

      // Handle frequency - for now, send immediately for IMMEDIATE, queue for DIGEST
      if (emailPreference.frequency === NotificationFrequency.IMMEDIATE) {
        // Use specialized work order email template if this is a work order notification
        if (notification.category === 'WORK_ORDER' && notification.relatedEntityType === 'WorkOrder') {
          await this.sendWorkOrderEmailNotification(user, notification);
        } else {
          await emailService.sendNotificationEmail(emailData);
        }
        console.log(`✅ Email notification sent to ${user.email} for ${notification.category}`);
      } else {
        // TODO: Implement digest queuing system
        console.log(`📧 Email notification queued for digest to ${user.email} for ${notification.category}`);
      }

    } catch (error) {
      console.error('Error sending email notification:', error);
      // Don't throw - email failure shouldn't break notification creation
    }
  }

  private async sendWorkOrderEmailNotification(user: any, notification: any): Promise<void> {
    console.log('🔄 sendWorkOrderEmailNotification called:', {
      userEmail: user.email,
      userName: user.name,
      notificationId: notification.id,
      workOrderId: notification.relatedEntityId
    });

    try {
      // Get detailed work order information
      const workOrder = await prisma.workOrder.findUnique({
        where: { id: notification.relatedEntityId },
        include: {
          asset: { select: { name: true } },
          assignedTo: { select: { name: true } },
        }
      });

      if (!workOrder) {
        console.error(`Work order ${notification.relatedEntityId} not found for email notification`);
        return;
      }

      // Prepare work order details for email template
      const workOrderDetails = {
        id: workOrder.id,
        title: workOrder.title,
        description: workOrder.description || undefined,
        priority: workOrder.priority,
        status: workOrder.status,
        assetName: workOrder.asset?.name || undefined,
        assignedToName: workOrder.assignedTo?.name || undefined,
        dueDate: workOrder.dueDate ? new Date(workOrder.dueDate) : undefined,
        workOrderUrl: `${process.env.FRONTEND_URL}/work-orders/${workOrder.id}`,
      };

      // Send specialized work order notification email
      await emailService.sendWorkOrderNotificationEmail(
        user.email,
        user.name,
        workOrderDetails
      );

      console.log(`📧 Work order notification email sent to ${user.email} for WO #${workOrder.id}`);
    } catch (error) {
      console.error('Error sending work order email notification:', error);
      // Fallback to generic notification email if work order email fails
      try {
        const emailData = {
          user: {
            name: user.name,
            email: user.email,
          },
          notification: {
            title: notification.title,
            message: notification.message,
            category: notification.category,
            priority: notification.priority,
            actionUrl: notification.actionUrl,
            actionLabel: notification.actionLabel,
            createdAt: notification.createdAt,
            relatedEntityType: notification.relatedEntityType,
            relatedEntityId: notification.relatedEntityId,
          },
          organizationName: user.organization?.name || 'CMMS',
          unsubscribeUrl: `${process.env.FRONTEND_URL}/settings/notifications`,
        };
        await emailService.sendNotificationEmail(emailData);
        console.log(`📧 Fallback notification email sent to ${user.email}`);
      } catch (fallbackError) {
        console.error('Error sending fallback email notification:', fallbackError);
      }
    }
  }
}