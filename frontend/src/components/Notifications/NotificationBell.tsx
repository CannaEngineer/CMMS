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
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
} from '@mui/icons-material';
import NotificationCenter from './NotificationCenter';
import { useNotificationSocket } from '../../hooks/useNotifications';

// Animation keyframes
const bellShake = keyframes`
  0%, 100% { transform: rotate(0deg); }
  10%, 30%, 50%, 70%, 90% { transform: rotate(-10deg); }
  20%, 40%, 60%, 80% { transform: rotate(10deg); }
`;

const pulseRing = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(2.4);
    opacity: 0;
  }
`;

const bounceIn = keyframes`
  0% {
    transform: scale(0.3);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const glow = keyframes`
  0%, 100% {
    box-shadow: 0 0 5px rgba(25, 118, 210, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(25, 118, 210, 0.8), 0 0 30px rgba(25, 118, 210, 0.4);
  }
`;

// Styled components
const NotificationButton = styled(IconButton)(({ theme }) => ({
  position: 'relative',
  padding: 12,
  borderRadius: '50%',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    transform: 'scale(1.05)',
    '& .notification-icon': {
      color: theme.palette.primary.main,
    },
  },
  '&:active': {
    transform: 'scale(0.95)',
  },
}));

const AnimatedBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    background: `linear-gradient(45deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
    color: theme.palette.error.contrastText,
    fontWeight: 700,
    fontSize: '0.7rem',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    border: `2px solid ${theme.palette.background.paper}`,
    boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.3)}`,
    animation: `${bounceIn} 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)`,
    '&::after': {
      content: '""',
      position: 'absolute',
      top: -2,
      left: -2,
      right: -2,
      bottom: -2,
      borderRadius: '50%',
      background: alpha(theme.palette.error.main, 0.3),
      animation: `${pulseRing} 1.5s infinite`,
      zIndex: -1,
    },
  },
}));

const PulseContainer = styled(Box)(({ theme, hasUnread }: { hasUnread: boolean }) => ({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: alpha(theme.palette.primary.main, 0.1),
    opacity: hasUnread ? 1 : 0,
    animation: hasUnread ? `${pulseRing} 2s infinite` : 'none',
    zIndex: -1,
  },
}));

const ActiveIndicator = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 8,
  right: 8,
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: theme.palette.success.main,
  border: `2px solid ${theme.palette.background.paper}`,
  animation: `${glow} 2s infinite`,
  zIndex: 1,
}));

interface NotificationBellProps {
  onSettingsClick?: () => void;
  showActiveIndicator?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onSettingsClick,
  showActiveIndicator = true,
}) => {
  const theme = useTheme();
  const { unreadCount, isConnected, latestNotification } = useNotificationSocket();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const prevUnreadCount = useRef(unreadCount);
  const bellRef = useRef<HTMLDivElement>(null);

  // Shake animation when new notifications arrive
  useEffect(() => {
    if (unreadCount > prevUnreadCount.current && unreadCount > 0) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 1000);
      return () => clearTimeout(timer);
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount]);

  // Auto-shake on urgent notifications
  useEffect(() => {
    if (latestNotification?.priority === 'URGENT') {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [latestNotification]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setShowNotificationCenter(true);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setShowNotificationCenter(false);
  };

  const getBellIcon = () => {
    if (unreadCount > 0 || isShaking) {
      return (
        <NotificationsActiveIcon 
          className="notification-icon"
          sx={{
            fontSize: 28,
            color: unreadCount > 0 ? 'primary.main' : 'text.secondary',
            animation: isShaking ? `${bellShake} 0.8s ease-in-out` : 'none',
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
          fontSize: 28,
          color: 'text.secondary',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    );
  };

  const getTooltipTitle = () => {
    if (unreadCount === 0) return 'No new notifications';
    if (unreadCount === 1) return '1 new notification';
    return `${unreadCount} new notifications`;
  };

  return (
    <>
      <Tooltip 
        title={getTooltipTitle()} 
        arrow
        placement="bottom"
        TransitionComponent={Zoom}
      >
        <Box ref={bellRef} sx={{ position: 'relative' }}>
          <PulseContainer hasUnread={unreadCount > 0}>
            <NotificationButton
              onClick={handleClick}
              sx={{
                position: 'relative',
                '&:hover': {
                  animation: unreadCount > 0 ? `${bellShake} 0.3s ease-in-out` : 'none',
                },
              }}
            >
              <AnimatedBadge
                badgeContent={unreadCount > 99 ? '99+' : unreadCount}
                color="error"
                invisible={unreadCount === 0}
                overlap="circular"
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                {getBellIcon()}
              </AnimatedBadge>
              
              {/* Connection indicator */}
              {showActiveIndicator && isConnected && (
                <Grow in={isConnected} timeout={300}>
                  <ActiveIndicator />
                </Grow>
              )}
            </NotificationButton>
          </PulseContainer>
        </Box>
      </Tooltip>

      <NotificationCenter
        anchorEl={anchorEl}
        open={showNotificationCenter}
        onClose={handleClose}
        onSettingsClick={onSettingsClick}
      />
    </>
  );
};

// Floating notification bell with enhanced animations
export const FloatingNotificationBell: React.FC<NotificationBellProps> = ({
  onSettingsClick,
}) => {
  const theme = useTheme();
  const { unreadCount, isConnected } = useNotificationSocket();
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const FloatingContainer = styled(Box)(({ theme }) => ({
    position: 'fixed',
    bottom: 24,
    right: 24,
    zIndex: 1300,
    animation: `${float} 3s ease-in-out infinite`,
    '&:hover': {
      animation: 'none',
      transform: 'translateY(-4px)',
    },
  }));

  const float = keyframes`
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  `;

  const FloatingButton = styled(Box)(({ theme }) => ({
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      transform: 'scale(1.1)',
      boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`,
    },
    '&:active': {
      transform: 'scale(1.05)',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.common.white, 0.2)}, transparent)`,
      transition: 'left 0.6s ease-in-out',
    },
    '&:hover::before': {
      left: '100%',
    },
  }));

  if (!isVisible) return null;

  return (
    <FloatingContainer>
      <Tooltip title="Notifications" arrow placement="left">
        <FloatingButton
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <NotificationBell 
            onSettingsClick={onSettingsClick}
            showActiveIndicator={false}
          />
        </FloatingButton>
      </Tooltip>
    </FloatingContainer>
  );
};

export default NotificationBell;