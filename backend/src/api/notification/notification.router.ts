import express from 'express';
import { NotificationController } from './notification.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = express.Router();
const notificationController = new NotificationController();

// All notification routes require authentication
router.use(authenticate);

// Get user notifications with filtering and pagination
router.get('/', notificationController.getNotifications.bind(notificationController));

// Get notification statistics
router.get('/stats', notificationController.getNotificationStats.bind(notificationController));

// Get user notification preferences
router.get('/preferences', notificationController.getPreferences.bind(notificationController));

// Update user notification preferences
router.put('/preferences', notificationController.updatePreferences.bind(notificationController));

// Get specific notification by ID
router.get('/:id', notificationController.getNotificationById.bind(notificationController));

// Mark notification as read
router.put('/:id/read', notificationController.markAsRead.bind(notificationController));

// Archive notification
router.put('/:id/archive', notificationController.archiveNotification.bind(notificationController));

// Delete notification
router.delete('/:id', notificationController.deleteNotification.bind(notificationController));

// Clear (delete) notification
router.delete('/:id/clear', notificationController.clearNotification.bind(notificationController));

// Acknowledge notification (mark as read and optionally archive)
router.put('/:id/acknowledge', notificationController.acknowledgeNotification.bind(notificationController));

// Mark multiple notifications as read
router.put('/bulk/read', notificationController.markMultipleAsRead.bind(notificationController));

// Mark all notifications as read
router.put('/all/read', notificationController.markAllAsRead.bind(notificationController));

// Clear all notifications
router.delete('/all/clear', notificationController.clearAllNotifications.bind(notificationController));

// Email endpoint
router.post('/email', notificationController.sendEmail.bind(notificationController));

// Admin endpoints
router.post('/test', notificationController.sendTestNotification.bind(notificationController));
router.delete('/cleanup', notificationController.cleanupOldNotifications.bind(notificationController));

export { router as notificationRouter };