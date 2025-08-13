import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Box, Portal, useTheme, alpha } from '@mui/material';
import { NotificationToast, CriticalNotificationToast } from './NotificationToast';
import { NotificationPreferencesDialog } from './NotificationPreferences';
import { useNotificationSocket, useNotifications } from '../../hooks/useNotifications';
import { Notification } from '../../services/notification.service';

interface NotificationContextType {
  showPreferences: () => void;
  hidePreferences: () => void;
  handleNotificationClick: (notification: Notification) => void;
  isPreferencesOpen: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  enableFloatingToasts?: boolean;
  maxToasts?: number;
  toastPosition?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
  enableCriticalAlerts?: boolean;
  enableSoundEffects?: boolean;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  enableFloatingToasts = true,
  maxToasts = 3,
  toastPosition = 'top-right',
  enableCriticalAlerts = true,
  enableSoundEffects = false,
}) => {
  const theme = useTheme();
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [toastQueue, setToastQueue] = useState<Notification[]>([]);
  const [criticalNotification, setCriticalNotification] = useState<Notification | null>(null);
  
  const { latestNotification } = useNotificationSocket();
  const { handleNotificationClick: baseHandleNotificationClick } = useNotifications();

  // Sound effects (if enabled)
  const playNotificationSound = useCallback((type: 'info' | 'warning' | 'error' | 'success') => {
    if (!enableSoundEffects) return;
    
    // Create audio context for notification sounds
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for different notification types
    const frequencies = {
      info: 800,
      success: 1000,
      warning: 600,
      error: 400,
    };
    
    oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }, [enableSoundEffects]);

  // Handle new notifications
  useEffect(() => {
    if (latestNotification) {
      // Play sound effect
      playNotificationSound(latestNotification.type.toLowerCase() as 'info' | 'warning' | 'error' | 'success');
      
      // Handle critical notifications separately
      if (enableCriticalAlerts && latestNotification.priority === 'URGENT') {
        setCriticalNotification(latestNotification);
        return;
      }
      
      // Add to toast queue
      if (enableFloatingToasts) {
        setToastQueue(prev => {
          const updated = [...prev, latestNotification].slice(-maxToasts);
          return updated;
        });
      }
    }
  }, [latestNotification, enableFloatingToasts, enableCriticalAlerts, maxToasts, playNotificationSound]);

  // Remove toast from queue
  const removeToast = useCallback((notificationId: string) => {
    setToastQueue(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Show preferences dialog
  const showPreferences = useCallback(() => {
    setIsPreferencesOpen(true);
  }, []);

  // Hide preferences dialog
  const hidePreferences = useCallback(() => {
    setIsPreferencesOpen(false);
  }, []);

  // Handle notification click
  const handleNotificationClick = useCallback((notification: Notification) => {
    baseHandleNotificationClick(notification);
    removeToast(notification.id);
  }, [baseHandleNotificationClick, removeToast]);

  // Close critical notification
  const closeCriticalNotification = useCallback(() => {
    setCriticalNotification(null);
  }, []);

  // Get toast container styles based on position
  const getToastContainerStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 2,
      padding: 2,
      pointerEvents: 'none' as const,
    };

    switch (toastPosition) {
      case 'top-right':
        return {
          ...baseStyles,
          top: theme.spacing(10),
          right: theme.spacing(2),
          alignItems: 'flex-end',
        };
      case 'top-left':
        return {
          ...baseStyles,
          top: theme.spacing(10),
          left: theme.spacing(2),
          alignItems: 'flex-start',
        };
      case 'top-center':
        return {
          ...baseStyles,
          top: theme.spacing(10),
          left: '50%',
          transform: 'translateX(-50%)',
          alignItems: 'center',
        };
      case 'bottom-right':
        return {
          ...baseStyles,
          bottom: theme.spacing(2),
          right: theme.spacing(2),
          alignItems: 'flex-end',
          flexDirection: 'column-reverse',
        };
      case 'bottom-left':
        return {
          ...baseStyles,
          bottom: theme.spacing(2),
          left: theme.spacing(2),
          alignItems: 'flex-start',
          flexDirection: 'column-reverse',
        };
      case 'bottom-center':
        return {
          ...baseStyles,
          bottom: theme.spacing(2),
          left: '50%',
          transform: 'translateX(-50%)',
          alignItems: 'center',
          flexDirection: 'column-reverse',
        };
      default:
        return {
          ...baseStyles,
          top: theme.spacing(10),
          right: theme.spacing(2),
          alignItems: 'flex-end',
        };
    }
  };

  const contextValue: NotificationContextType = {
    showPreferences,
    hidePreferences,
    handleNotificationClick,
    isPreferencesOpen,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Toast Notifications */}
      {enableFloatingToasts && (
        <Portal>
          <Box sx={getToastContainerStyles()}>
            {toastQueue.map((notification) => (
              <Box
                key={notification.id}
                sx={{
                  pointerEvents: 'auto',
                  width: { xs: 'calc(100vw - 32px)', sm: 400 },
                  maxWidth: '100%',
                }}
              >
                <NotificationToast onNotificationClick={handleNotificationClick} />
              </Box>
            ))}
          </Box>
        </Portal>
      )}
      
      {/* Critical Alert */}
      {enableCriticalAlerts && criticalNotification && (
        <Portal>
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: alpha(theme.palette.common.black, 0.7),
              backdropFilter: 'blur(8px)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 2,
            }}
          >
            <CriticalNotificationToast
              notification={criticalNotification}
              onClose={closeCriticalNotification}
              onAction={() => {
                handleNotificationClick(criticalNotification);
                closeCriticalNotification();
              }}
            />
          </Box>
        </Portal>
      )}
      
      {/* Preferences Dialog */}
      <NotificationPreferencesDialog
        open={isPreferencesOpen}
        onClose={hidePreferences}
      />
    </NotificationContext.Provider>
  );
};

// Enhanced notification provider with advanced features
interface AdvancedNotificationProviderProps extends NotificationProviderProps {
  enableDesktopNotifications?: boolean;
  enableBrowserPush?: boolean;
  enableNotificationGroups?: boolean;
  enableAutoArchive?: boolean;
  autoArchiveAfter?: number; // hours
  enableNotificationHistory?: boolean;
  maxHistorySize?: number;
}

export const AdvancedNotificationProvider: React.FC<AdvancedNotificationProviderProps> = ({
  enableDesktopNotifications = false,
  enableBrowserPush = false,
  enableNotificationGroups = false,
  enableAutoArchive = true,
  autoArchiveAfter = 24,
  enableNotificationHistory = true,
  maxHistorySize = 100,
  ...props
}) => {
  // Request permission for desktop notifications
  useEffect(() => {
    if (enableDesktopNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [enableDesktopNotifications]);

  // Register service worker for push notifications
  useEffect(() => {
    if (enableBrowserPush && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, [enableBrowserPush]);

  return <NotificationProvider {...props} />;
};

export default NotificationProvider;