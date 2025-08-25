import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { NotificationService } from './notification.service';
import { NotificationType, NotificationPriority, NotificationCategory } from '@prisma/client';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  // Get notifications for current user
  async getNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { 
        page = 1, 
        limit = 50, 
        category,
        type,
        priority,
        isRead,
        isArchived = false
      } = req.query;

      const filters = {
        category: category as NotificationCategory,
        type: type as NotificationType,
        priority: priority as NotificationPriority,
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
        isArchived: isArchived === 'true'
      };

      const result = await this.notificationService.getUserNotifications(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        filters
      );

      res.json(result);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }

  // Get notification statistics
  async getNotificationStats(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const stats = await this.notificationService.getNotificationStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      res.status(500).json({ error: 'Failed to fetch notification stats' });
    }
  }

  // Mark notification as read
  async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const notification = await this.notificationService.markAsRead(id, userId);
      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  }

  // Mark multiple notifications as read
  async markMultipleAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { notificationIds } = req.body;

      if (!Array.isArray(notificationIds)) {
        return res.status(400).json({ error: 'notificationIds must be an array' });
      }

      const result = await this.notificationService.markMultipleAsRead(notificationIds, userId);
      res.json(result);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
  }

  // Mark all notifications as read
  async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { category } = req.query;

      const result = await this.notificationService.markAllAsRead(
        userId, 
        category as NotificationCategory
      );
      res.json(result);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  }

  // Archive notification
  async archiveNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const notification = await this.notificationService.archiveNotification(id, userId);
      res.json(notification);
    } catch (error) {
      console.error('Error archiving notification:', error);
      res.status(500).json({ error: 'Failed to archive notification' });
    }
  }

  // Delete notification
  async deleteNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await this.notificationService.deleteNotification(id, userId);
      res.json({ success: true, message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  }

  // Clear (delete) single notification
  async clearNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await this.notificationService.deleteNotification(id, userId);
      res.json({ success: true, message: 'Notification cleared successfully' });
    } catch (error) {
      console.error('Error clearing notification:', error);
      res.status(500).json({ error: 'Failed to clear notification' });
    }
  }

  // Clear all notifications for user
  async clearAllNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { category } = req.query;

      const result = await this.notificationService.clearAllNotifications(
        userId,
        category as NotificationCategory
      );
      res.json(result);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      res.status(500).json({ error: 'Failed to clear all notifications' });
    }
  }

  // Acknowledge notification (mark as read and optionally archive)
  async acknowledgeNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { archive = false } = req.body;

      const notification = await this.notificationService.acknowledgeNotification(
        id, 
        userId,
        archive
      );
      res.json(notification);
    } catch (error) {
      console.error('Error acknowledging notification:', error);
      res.status(500).json({ error: 'Failed to acknowledge notification' });
    }
  }

  // Get user notification preferences
  async getPreferences(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const preferences = await this.notificationService.getUserPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      res.status(500).json({ error: 'Failed to fetch notification preferences' });
    }
  }

  // Update user notification preferences
  async updatePreferences(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { preferences } = req.body;

      if (!Array.isArray(preferences)) {
        return res.status(400).json({ error: 'preferences must be an array' });
      }

      const updatedPreferences = await this.notificationService.updateUserPreferences(
        userId, 
        preferences
      );
      res.json(updatedPreferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
      res.status(500).json({ error: 'Failed to update notification preferences' });
    }
  }

  // Test notification (admin only)
  async sendTestNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const currentUser = req.user!;
      
      if (currentUser.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const {
        userId,
        title,
        message,
        type = NotificationType.INFO,
        priority = NotificationPriority.MEDIUM,
        category = NotificationCategory.SYSTEM,
        actionUrl,
        actionLabel
      } = req.body;

      const notification = await this.notificationService.createNotification({
        userId: userId || currentUser.id,
        organizationId: currentUser.organizationId,
        title: title || 'Test Notification',
        message: message || 'This is a test notification from the CMMS system.',
        type,
        priority,
        category,
        actionUrl,
        actionLabel,
        createdById: currentUser.id,
        channels: ['IN_APP']
      });

      res.json(notification);
    } catch (error) {
      console.error('Error sending test notification:', error);
      res.status(500).json({ error: 'Failed to send test notification' });
    }
  }

  // Get notification by ID
  async getNotificationById(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const notification = await this.notificationService.getNotificationById(id, userId);
      
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json(notification);
    } catch (error) {
      console.error('Error fetching notification:', error);
      res.status(500).json({ error: 'Failed to fetch notification' });
    }
  }

  // Cleanup old notifications (admin endpoint)
  async cleanupOldNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const currentUser = req.user!;
      
      if (currentUser.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { daysOld = 30 } = req.query;
      const result = await this.notificationService.cleanupOldNotifications(
        currentUser.organizationId,
        parseInt(daysOld as string)
      );

      res.json(result);
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      res.status(500).json({ error: 'Failed to cleanup notifications' });
    }
  }
}