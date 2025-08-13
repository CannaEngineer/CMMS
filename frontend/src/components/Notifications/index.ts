// Core notification components
export { NotificationCenter } from './NotificationCenter';
export { NotificationToast, CriticalNotificationToast } from './NotificationToast';
export { NotificationPreferencesDialog } from './NotificationPreferences';
export { NotificationBell, FloatingNotificationBell } from './NotificationBell';

// Provider components
export { NotificationProvider, AdvancedNotificationProvider, useNotificationContext } from './NotificationProvider';

// Animation utilities
export { default as NotificationAnimations } from './NotificationAnimations';
export * from './NotificationAnimations';

// Type definitions (re-exported from services)
export type { Notification, NotificationPreference, NotificationResponse } from '../../services/notification.service';

// Hooks (re-exported for convenience)
export { useNotifications, useNotificationSocket, useNotificationPreferences, useNotificationToast } from '../../hooks/useNotifications';