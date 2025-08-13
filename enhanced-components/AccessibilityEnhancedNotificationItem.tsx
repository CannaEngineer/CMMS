import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  IconButton,
  Chip,
  Avatar,
  useTheme,
  alpha,
  styled,
  keyframes,
  Tooltip,
  Fade,
  Grow,
  useMediaQuery,
  VisuallyHidden,
} from '@mui/material';
import {
  MarkEmailRead as MarkReadIcon,
  Archive as ArchiveIcon,
  TouchApp as TouchIcon,
  Keyboard as KeyboardIcon,
  AccessibilityNew as AccessibilityIcon,
  VolumeUp as AudioIcon,
  VolumeOff as AudioOffIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '../../services/notification.service';

// Enhanced animations that respect accessibility preferences
const accessibleSlideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const subtleHighlight = keyframes`
  0% {
    background-color: transparent;
  }
  50% {
    background-color: rgba(25, 118, 210, 0.08);
  }
  100% {
    background-color: transparent;
  }
`;

const focusRing = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.3);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.5);
  }
`;

// Enhanced list item with comprehensive accessibility features
const AccessibilityEnhancedListItem = styled(ListItem)(({ theme }) => ({
  borderRadius: 12,
  margin: '6px 8px',
  padding: '16px 20px', // Increased padding for better touch targets
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  cursor: 'pointer',
  minHeight: 80, // Ensure consistent height for screen readers
  
  // Enhanced touch targets for industrial use
  minTouchTarget: '44px',
  
  // Focus management for keyboard navigation
  '&:focus': {
    outline: 'none',
    boxShadow: `0 0 0 3px ${theme.palette.primary.main}`,
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    animation: `${focusRing} 2s infinite`,
    zIndex: 1,
  },
  
  // High contrast support
  '@media (prefers-contrast: high)': {
    border: `2px solid ${theme.palette.divider}`,
    '&:focus': {
      border: `3px solid ${theme.palette.primary.main}`,
      backgroundColor: theme.palette.background.paper,
    },
    '&:hover': {
      border: `2px solid ${theme.palette.primary.main}`,
    },
  },
  
  // Reduced motion support
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
    transition: 'none',
    '&:focus': {
      animation: 'none',
    },
  },
  
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`,
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    
    '& .notification-actions': {
      opacity: 1,
      transform: 'translateX(0)',
    },
  },
  
  // Touch feedback for mobile devices
  '&:active': {
    transform: 'scale(0.98)',
  },
  
  // Swipe gesture support indicators
  '&.swipe-right': {
    backgroundColor: alpha(theme.palette.success.main, 0.1),
    borderLeft: `4px solid ${theme.palette.success.main}`,
  },
  
  '&.swipe-left': {
    backgroundColor: alpha(theme.palette.warning.main, 0.1),
    borderLeft: `4px solid ${theme.palette.warning.main}`,
  },
}));

const PriorityIndicator = styled(Box)<{ priority: string }>(({ theme, priority }) => {
  const colors = {
    URGENT: { bg: theme.palette.error.main, text: theme.palette.error.contrastText },
    HIGH: { bg: theme.palette.warning.main, text: theme.palette.warning.contrastText },
    MEDIUM: { bg: theme.palette.info.main, text: theme.palette.info.contrastText },
    LOW: { bg: theme.palette.success.main, text: theme.palette.success.contrastText },
  };
  
  const colorScheme = colors[priority as keyof typeof colors] || colors.LOW;
  
  return {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: colorScheme.bg,
    borderRadius: '12px 0 0 12px',
    
    // Enhanced for high contrast
    '@media (prefers-contrast: high)': {
      width: 8,
      backgroundColor: colorScheme.bg,
      '&::after': {
        content: '""',
        position: 'absolute',
        top: '50%',
        right: -2,
        transform: 'translateY(-50%)',
        width: 0,
        height: 0,
        borderLeft: `4px solid ${colorScheme.bg}`,
        borderTop: '4px solid transparent',
        borderBottom: '4px solid transparent',
      },
    },
  };
});

const AccessibilityControls = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  position: 'absolute',
  top: 8,
  right: 8,
  zIndex: 2,
  
  '& .accessibility-control': {
    width: 20,
    height: 20,
    minWidth: 20,
    padding: 0,
    color: theme.palette.text.secondary,
    
    '&:hover': {
      color: theme.palette.primary.main,
      backgroundColor: alpha(theme.palette.primary.main, 0.1),
    },
    
    '&:focus': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
    },
  },
}));

const SwipeIndicator = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: 24,
  height: 24,
  borderRadius: '50%',
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0,
  transition: 'opacity 0.2s ease-in-out',
  
  '&.left': {
    left: 8,
  },
  
  '&.right': {
    right: 8,
  },
  
  '&.visible': {
    opacity: 1,
  },
}));

interface AccessibilityEnhancedNotificationItemProps {
  notification: Notification;
  index: number;
  total: number;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
  onClick: (notification: Notification) => void;
  showAccessibilityControls?: boolean;
  enableSwipeGestures?: boolean;
  enableAudioFeedback?: boolean;
  highContrastMode?: boolean;
}

export const AccessibilityEnhancedNotificationItem: React.FC<AccessibilityEnhancedNotificationItemProps> = ({
  notification,
  index,
  total,
  onMarkRead,
  onArchive,
  onClick,
  showAccessibilityControls = true,
  enableSwipeGestures = true,
  enableAudioFeedback = false,
  highContrastMode = false,
}) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(enableAudioFeedback);
  const itemRef = useRef<HTMLLIElement>(null);
  
  // Accessibility preferences
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const prefersHighContrast = useMediaQuery('(prefers-contrast: high)');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const shouldUseHighContrast = highContrastMode || prefersHighContrast;

  // Audio feedback for screen readers and accessibility
  const playAudioFeedback = (action: string) => {
    if (!audioEnabled) return;
    
    // Create subtle audio cues for different actions
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const frequency = {
      'focus': 800,
      'click': 600,
      'markRead': 900,
      'archive': 400,
    }[action] || 600;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  // Enhanced keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleClick();
        playAudioFeedback('click');
        break;
      case 'r':
      case 'R':
        if (!notification.isRead) {
          event.preventDefault();
          handleMarkRead(event as any);
          playAudioFeedback('markRead');
        }
        break;
      case 'a':
      case 'A':
        event.preventDefault();
        handleArchive(event as any);
        playAudioFeedback('archive');
        break;
      case 'ArrowDown':
      case 'ArrowUp':
        // Allow natural navigation, announce current position
        event.stopPropagation();
        break;
    }
  };

  const handleClick = () => {
    onClick(notification);
  };

  const handleMarkRead = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onMarkRead(notification.id);
  };

  const handleArchive = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onArchive(notification.id);
  };

  const handleFocus = () => {
    playAudioFeedback('focus');
  };

  // Touch/swipe gesture support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enableSwipeGestures) return;
    
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setSwipeDirection(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!enableSwipeGestures || !touchStart) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = Math.abs(touch.clientY - touchStart.y);
    
    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > 50 && deltaY < 50) {
      const direction = deltaX > 0 ? 'right' : 'left';
      setSwipeDirection(direction);
    }
  };

  const handleTouchEnd = () => {
    if (!enableSwipeGestures || !swipeDirection) {
      setTouchStart(null);
      setSwipeDirection(null);
      return;
    }
    
    if (swipeDirection === 'right' && !notification.isRead) {
      handleMarkRead({} as any);
    } else if (swipeDirection === 'left') {
      handleArchive({} as any);
    }
    
    setTouchStart(null);
    setSwipeDirection(null);
  };

  const getAriaLabel = () => {
    const priority = notification.priority.toLowerCase();
    const status = notification.isRead ? 'read' : 'unread';
    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
    
    return `${priority} priority ${status} notification: ${notification.title}. ${notification.message}. ${timeAgo}. Item ${index + 1} of ${total}. Press Enter to view, R to mark as read, A to archive.`;
  };

  const getPriorityIcon = (priority: string) => {
    const icons = {
      URGENT: '🚨',
      HIGH: '⚠️',
      MEDIUM: 'ℹ️',
      LOW: '✅',
    };
    return icons[priority as keyof typeof icons] || 'ℹ️';
  };

  return (
    <Grow
      in={true}
      timeout={prefersReducedMotion ? 0 : 300 + index * 100}
      style={{ transformOrigin: '0 0 0' }}
    >
      <div>
        <AccessibilityEnhancedListItem
          ref={itemRef}
          role="listitem"
          tabIndex={0}
          aria-label={getAriaLabel()}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={swipeDirection ? `swipe-${swipeDirection}` : ''}
          sx={{
            bgcolor: notification.isRead ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
            animation: !prefersReducedMotion ? `${accessibleSlideIn} 0.3s ease-out` : 'none',
            ...(shouldUseHighContrast && {
              border: `2px solid ${notification.isRead ? theme.palette.divider : theme.palette.primary.main}`,
            }),
          }}
        >
          {/* Priority indicator */}
          <PriorityIndicator priority={notification.priority} />
          
          {/* Screen reader content */}
          <VisuallyHidden>
            {`Notification ${index + 1} of ${total}. Priority: ${notification.priority}. 
             Status: ${notification.isRead ? 'read' : 'unread'}. 
             Category: ${notification.category}. 
             Time: ${formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}.`}
          </VisuallyHidden>
          
          {/* Main content */}
          <ListItemIcon sx={{ minWidth: 56, alignSelf: 'flex-start', mt: 0.5 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: `${notification.type === 'ALERT' ? 'error' : 'primary'}.main`,
                fontSize: '1.2rem',
              }}
            >
              {getPriorityIcon(notification.priority)}
            </Avatar>
            {!notification.isRead && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  border: '2px solid',
                  borderColor: 'background.paper',
                }}
                aria-hidden="true"
              />
            )}
          </ListItemIcon>
          
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography
                  variant="body1"
                  fontWeight={notification.isRead ? 400 : 700}
                  sx={{
                    flexGrow: 1,
                    color: notification.isRead ? 'text.secondary' : 'text.primary',
                    fontSize: { xs: '0.95rem', sm: '1rem' },
                  }}
                >
                  {notification.title}
                </Typography>
                <Chip
                  label={notification.priority}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    bgcolor: `${notification.type === 'ALERT' ? 'error' : 'primary'}.light`,
                    color: `${notification.type === 'ALERT' ? 'error' : 'primary'}.contrastText`,
                  }}
                />
              </Box>
            }
            secondary={
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 0.5,
                    lineHeight: 1.4,
                    fontSize: { xs: '0.85rem', sm: '0.875rem' },
                  }}
                >
                  {notification.message}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    mt: 1,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}
                >
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </Typography>
              </Box>
            }
          />
          
          {/* Accessibility controls */}
          {showAccessibilityControls && (
            <AccessibilityControls>
              <Tooltip title={audioEnabled ? 'Disable audio feedback' : 'Enable audio feedback'} arrow>
                <IconButton
                  className="accessibility-control"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAudioEnabled(!audioEnabled);
                  }}
                  aria-label={audioEnabled ? 'Disable audio feedback' : 'Enable audio feedback'}
                >
                  {audioEnabled ? <AudioIcon fontSize="small" /> : <AudioOffIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </AccessibilityControls>
          )}
          
          {/* Action buttons */}
          <Box
            className="notification-actions"
            sx={{
              display: 'flex',
              gap: 0.5,
              opacity: isHovered || isMobile ? 1 : 0,
              transform: isHovered || isMobile ? 'translateX(0)' : 'translateX(10px)',
              transition: prefersReducedMotion ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              alignSelf: 'flex-start',
              mt: 1,
            }}
          >
            {!notification.isRead && (
              <Tooltip title="Mark as read (Press R)" arrow>
                <IconButton
                  size="medium"
                  onClick={handleMarkRead}
                  aria-label="Mark notification as read"
                  sx={{
                    minWidth: 40,
                    minHeight: 40,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      color: 'success.main',
                    },
                  }}
                >
                  <MarkReadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Archive (Press A)" arrow>
              <IconButton
                size="medium"
                onClick={handleArchive}
                aria-label="Archive notification"
                sx={{
                  minWidth: 40,
                  minHeight: 40,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: 'warning.main',
                  },
                }}
              >
                <ArchiveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          
          {/* Swipe indicators */}
          {enableSwipeGestures && isMobile && (
            <>
              <SwipeIndicator className={`left ${swipeDirection === 'left' ? 'visible' : ''}`}>
                <ArchiveIcon fontSize="small" />
              </SwipeIndicator>
              <SwipeIndicator className={`right ${swipeDirection === 'right' ? 'visible' : ''}`}>
                <MarkReadIcon fontSize="small" />
              </SwipeIndicator>
            </>
          )}
        </AccessibilityEnhancedListItem>
      </div>
    </Grow>
  );
};

export default AccessibilityEnhancedNotificationItem;