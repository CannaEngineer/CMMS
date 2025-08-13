import React, { useState, useEffect, useRef } from 'react';
import {
  IconButton,
  Badge,
  Box,
  Tooltip,
  useTheme,
  alpha,
  styled,
  keyframes,
  Zoom,
  Grow,
  useMediaQuery,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  AccessibilityNew as AccessibilityIcon,
} from '@mui/icons-material';
import { NotificationCenter } from './EnhancedNotificationCenter';
import { useNotificationSocket } from '../../hooks/useNotifications';

// Enhanced animations for industrial environments
const industrialBellShake = keyframes`
  0%, 100% { transform: rotate(0deg) scale(1); }
  10%, 30%, 50%, 70%, 90% { transform: rotate(-12deg) scale(1.05); }
  20%, 40%, 60%, 80% { transform: rotate(12deg) scale(1.05); }
`;

const urgentPulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.7);
  }
  70% {
    transform: scale(1.1);
    box-shadow: 0 0 0 15px rgba(211, 47, 47, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(211, 47, 47, 0);
  }
`;

const accessibilityGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 5px rgba(25, 118, 210, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(25, 118, 210, 0.8);
  }
`;

// Enhanced touch-friendly button for industrial use
const IndustrialNotificationButton = styled(IconButton)(({ theme }) => ({
  position: 'relative',
  minWidth: 56, // Increased from 44px for better touch target
  minHeight: 56,
  padding: 16, // Larger touch area
  borderRadius: '50%',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  // High contrast background for industrial environments
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.15),
    transform: 'scale(1.08)',
    borderColor: theme.palette.primary.main,
    '& .notification-icon': {
      color: theme.palette.primary.main,
    },
  },
  
  '&:active': {
    transform: 'scale(0.95)',
  },

  // Focus indicator for keyboard navigation
  '&:focus': {
    outline: `3px solid ${theme.palette.primary.main}`,
    outlineOffset: '3px',
    animation: `${accessibilityGlow} 2s infinite`,
  },

  // Enhanced touch area (invisible expanded clickable area)
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    borderRadius: '50%',
    // This creates a larger touch target without visible expansion
  },
}));

// High-visibility badge for industrial environments
const IndustrialBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    background: `linear-gradient(45deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
    color: theme.palette.error.contrastText,
    fontWeight: 800,
    fontSize: '0.8rem',
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    border: `3px solid ${theme.palette.background.paper}`,
    boxShadow: `0 3px 10px ${alpha(theme.palette.error.main, 0.4)}`,
    animation: `${urgentPulse} 2s infinite`,
    
    // Ensure minimum contrast ratio of 4.5:1
    '@media (prefers-contrast: high)': {
      border: `3px solid ${theme.palette.background.default}`,
      backgroundColor: theme.palette.error.main,
      color: theme.palette.error.contrastText,
    },
  },
  
  '& .MuiBadge-badge.urgent': {
    animation: `${urgentPulse} 1s infinite, ${industrialBellShake} 3s infinite`,
  },
}));

// Connection status indicator for industrial reliability
const ConnectionIndicator = styled(Box)(({ theme, connected }: { connected: boolean }) => ({
  position: 'absolute',
  top: 4,
  right: 4,
  width: 12,
  height: 12,
  borderRadius: '50%',
  backgroundColor: connected ? theme.palette.success.main : theme.palette.warning.main,
  border: `2px solid ${theme.palette.background.paper}`,
  boxShadow: `0 0 8px ${connected ? theme.palette.success.main : theme.palette.warning.main}`,
  animation: connected ? 'none' : `${urgentPulse} 2s infinite`,
  zIndex: 1,
}));

interface EnhancedNotificationBellProps {
  onSettingsClick?: () => void;
  showConnectionIndicator?: boolean;
  highContrastMode?: boolean;
  reduceMotion?: boolean;
}

export const EnhancedNotificationBell: React.FC<EnhancedNotificationBellProps> = ({
  onSettingsClick,
  showConnectionIndicator = true,
  highContrastMode = false,
  reduceMotion = false,
}) => {
  const theme = useTheme();
  const { unreadCount, isConnected, latestNotification } = useNotificationSocket();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [hasUrgent, setHasUrgent] = useState(false);
  
  const prevUnreadCount = useRef(unreadCount);
  const bellRef = useRef<HTMLDivElement>(null);
  
  // Detect user preferences for accessibility
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const prefersHighContrast = useMediaQuery('(prefers-contrast: high)');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const shouldReduceMotion = reduceMotion || prefersReducedMotion;
  const shouldUseHighContrast = highContrastMode || prefersHighContrast;

  // Enhanced shake animation for new notifications
  useEffect(() => {
    if (!shouldReduceMotion && unreadCount > prevUnreadCount.current && unreadCount > 0) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 1500);
      return () => clearTimeout(timer);
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount, shouldReduceMotion]);

  // Track urgent notifications
  useEffect(() => {
    const urgent = latestNotification?.priority === 'URGENT';
    setHasUrgent(urgent);
    
    if (urgent && !shouldReduceMotion) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [latestNotification, shouldReduceMotion]);

  // Keyboard navigation support
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(event as any);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setShowNotificationCenter(true);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setShowNotificationCenter(false);
  };

  const getBellIcon = () => {
    const iconColor = unreadCount > 0 ? 'primary.main' : 'text.secondary';
    const iconSize = isMobile ? 32 : 28;
    
    if (unreadCount > 0 || isShaking) {
      return (
        <NotificationsActiveIcon 
          className="notification-icon"
          sx={{
            fontSize: iconSize,
            color: iconColor,
            animation: !shouldReduceMotion && isShaking ? `${industrialBellShake} 0.8s ease-in-out` : 'none',
            filter: unreadCount > 0 ? 'drop-shadow(0 2px 4px rgba(25, 118, 210, 0.3))' : 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      );
    }

    return (
      <NotificationsIcon 
        className="notification-icon"
        sx={{
          fontSize: iconSize,
          color: iconColor,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    );
  };

  const getTooltipTitle = () => {
    if (!isConnected) return 'Notifications offline - Click to retry';
    if (hasUrgent) return `URGENT: ${unreadCount} notification${unreadCount !== 1 ? 's' : ''}`;
    if (unreadCount === 0) return 'No new notifications - Click to view all';
    if (unreadCount === 1) return '1 new notification';
    return `${unreadCount} new notifications`;
  };

  const getBadgeContent = () => {
    if (unreadCount > 999) return '999+';
    if (unreadCount > 99) return '99+';
    return unreadCount;
  };

  return (
    <>
      <Tooltip 
        title={getTooltipTitle()} 
        arrow
        placement="bottom"
        TransitionComponent={Zoom}
        enterDelay={500}
        leaveDelay={200}
      >
        <Box 
          ref={bellRef} 
          sx={{ 
            position: 'relative',
            display: 'inline-flex',
          }}
        >
          <IndustrialNotificationButton
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            aria-label={getTooltipTitle()}
            aria-expanded={showNotificationCenter}
            aria-haspopup="dialog"
            sx={{
              animation: !shouldReduceMotion && hasUrgent ? `${urgentPulse} 2s infinite` : 'none',
              ...(shouldUseHighContrast && {
                border: `3px solid ${theme.palette.primary.main}`,
                backgroundColor: theme.palette.background.paper,
              }),
            }}
          >
            <IndustrialBadge
              badgeContent={getBadgeContent()}
              color="error"
              invisible={unreadCount === 0}
              overlap="circular"
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              className={hasUrgent ? 'urgent' : ''}
            >
              {getBellIcon()}
            </IndustrialBadge>
            
            {/* Connection status indicator */}
            {showConnectionIndicator && (
              <Grow in={true} timeout={300}>
                <ConnectionIndicator connected={isConnected} />
              </Grow>
            )}
          </IndustrialNotificationButton>
        </Box>
      </Tooltip>

      {/* Enhanced notification center */}
      <NotificationCenter
        anchorEl={anchorEl}
        open={showNotificationCenter}
        onClose={handleClose}
        onSettingsClick={onSettingsClick}
        highContrastMode={shouldUseHighContrast}
        reduceMotion={shouldReduceMotion}
      />
    </>
  );
};

// Floating notification bell for mobile/tablet use in industrial settings
export const FloatingIndustrialBell: React.FC<EnhancedNotificationBellProps> = (props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  if (!isMobile) return null;

  const FloatingContainer = styled(Box)(({ theme }) => ({
    position: 'fixed',
    bottom: 80, // Above typical bottom navigation
    right: 20,
    zIndex: 1300,
    borderRadius: '50%',
    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.2)}`,
    backdropFilter: 'blur(10px)',
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.primary.main, 0.05)})`,
    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    
    '@media (prefers-contrast: high)': {
      background: theme.palette.background.paper,
      border: `3px solid ${theme.palette.primary.main}`,
    },
  }));

  return (
    <FloatingContainer>
      <EnhancedNotificationBell {...props} />
    </FloatingContainer>
  );
};

export default EnhancedNotificationBell;