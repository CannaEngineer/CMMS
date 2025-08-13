import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Button,
  Box,
  Typography,
  IconButton,
  Chip,
  Grow,
  Slide,
  Fade,
  useTheme,
  alpha,
  styled,
  keyframes,
  LinearProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';
import { useNotificationToast } from '../../hooks/useNotifications';
import { Notification } from '../../services/notification.service';

// Animation keyframes
const slideInRight = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOutRight = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const pulseGlow = keyframes`
  0% {
    box-shadow: 0 0 20px rgba(244, 67, 54, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(244, 67, 54, 0.5), 0 0 40px rgba(244, 67, 54, 0.2);
  }
  100% {
    box-shadow: 0 0 20px rgba(244, 67, 54, 0.3);
  }
`;

const shimmer = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`;

// Enhanced Alert component
const EnhancedAlert = styled(Alert)(({ theme, severity }) => ({
  borderRadius: 12,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.common.white, 0.1)}, transparent)`,
    transition: 'transform 0.6s ease-in-out',
  },
  '&:hover::before': {
    transform: 'translateX(200%)',
  },
  boxShadow: severity === 'error' 
    ? `0 8px 32px ${alpha(theme.palette.error.main, 0.2)}`
    : `0 8px 32px ${alpha(theme.palette.info.main, 0.1)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: severity === 'error' 
      ? `0 12px 40px ${alpha(theme.palette.error.main, 0.3)}`
      : `0 12px 40px ${alpha(theme.palette.info.main, 0.15)}`,
  },
}));

const ProgressIndicator = styled(LinearProgress)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 3,
  borderRadius: '0 0 12px 12px',
  '& .MuiLinearProgress-bar': {
    background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.6)}, ${theme.palette.primary.main})`,
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.8rem',
  minWidth: 'auto',
  padding: '6px 12px',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.2)}`,
  },
}));

const PriorityChip = styled(Chip)(({ theme, color }) => ({
  height: 20,
  fontSize: '0.65rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(45deg, ${alpha(theme.palette[color as keyof typeof theme.palette]?.main || theme.palette.primary.main, 0.1)}, ${alpha(theme.palette[color as keyof typeof theme.palette]?.main || theme.palette.primary.main, 0.2)})`,
    borderRadius: 'inherit',
    zIndex: -1,
  },
}));

interface NotificationToastProps {
  onNotificationClick?: (notification: Notification) => void;
}

const getAlertSeverity = (type: string) => {
  switch (type) {
    case 'ALERT': return 'error';
    case 'WARNING': return 'warning';
    case 'SUCCESS': return 'success';
    case 'INFO':
    default: return 'info';
  }
};

const getPriorityColor = (priority: string): 'error' | 'warning' | 'info' | 'success' | 'default' => {
  switch (priority) {
    case 'URGENT': return 'error';
    case 'HIGH': return 'warning';
    case 'MEDIUM': return 'info';
    case 'LOW': return 'success';
    default: return 'default';
  }
};

export const NotificationToast: React.FC<NotificationToastProps> = ({
  onNotificationClick
}) => {
  const { toastNotification, hideToast } = useNotificationToast();
  const theme = useTheme();
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(false);

  const severity = toastNotification ? getAlertSeverity(toastNotification.type) : 'info';
  const autoHideDuration = toastNotification?.priority === 'URGENT' ? null : 5000;
  const isClickable = toastNotification?.actionUrl;

  // Progress bar animation
  useEffect(() => {
    if (toastNotification && autoHideDuration) {
      setProgress(100);
      setIsVisible(true);
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (autoHideDuration / 100));
          if (newProgress <= 0) {
            clearInterval(interval);
            hideToast();
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    } else if (toastNotification) {
      setIsVisible(true);
    }
  }, [toastNotification, autoHideDuration, hideToast]);

  const handleClose = (_?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway' && toastNotification?.priority === 'URGENT') {
      return;
    }
    setIsVisible(false);
    setTimeout(hideToast, 300);
  };

  const handleNotificationClick = () => {
    if (toastNotification && onNotificationClick) {
      onNotificationClick(toastNotification);
    }
    handleClose();
  };

  if (!toastNotification) {
    return null;
  }

  const SlideTransition = (props: any) => {
    return <Slide {...props} direction="left" />;
  };

  return (
    <Snackbar
      open={isVisible}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      TransitionComponent={SlideTransition}
      transitionDuration={{
        enter: 400,
        exit: 300,
      }}
      sx={{ 
        mt: { xs: 7, sm: 8 },
        mr: { xs: 1, sm: 2 },
        maxWidth: { xs: 'calc(100vw - 32px)', sm: 420 },
        zIndex: 9999,
      }}
    >
      <EnhancedAlert
        severity={severity}
        variant="filled"
        onClose={toastNotification.priority !== 'URGENT' ? handleClose : undefined}
        sx={{
          width: '100%',
          cursor: isClickable ? 'pointer' : 'default',
          animation: toastNotification.priority === 'URGENT' ? `${pulseGlow} 2s infinite` : 'none',
          position: 'relative',
        }}
        onClick={isClickable ? handleNotificationClick : undefined}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
            {isClickable && (
              <ActionButton 
                color="inherit" 
                size="small"
                onClick={handleNotificationClick}
                startIcon={<InfoIcon sx={{ fontSize: 14 }} />}
              >
                {toastNotification.actionLabel || 'View'}
              </ActionButton>
            )}
          </Box>
        }
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <AlertTitle 
              sx={{ 
                margin: 0, 
                fontSize: '0.95rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              {toastNotification.priority === 'URGENT' && '🚨'}
              {toastNotification.title}
            </AlertTitle>
            <PriorityChip
              label={toastNotification.priority}
              size="small"
              color={getPriorityColor(toastNotification.priority)}
            />
          </Box>
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '0.85rem',
              mt: 0.5,
              lineHeight: 1.4,
              opacity: 0.95
            }}
          >
            {toastNotification.message}
          </Typography>
          
          {/* Progress bar for auto-dismiss */}
          {autoHideDuration && (
            <ProgressIndicator
              variant="determinate"
              value={progress}
              sx={{
                mt: 1,
                opacity: progress > 0 ? 1 : 0,
                transition: 'opacity 0.3s ease-in-out',
              }}
            />
          )}
        </Box>
      </EnhancedAlert>
    </Snackbar>
  );
};

// Enhanced toast for critical alerts
export const CriticalNotificationToast: React.FC<{
  notification: Notification;
  onClose: () => void;
  onAction?: () => void;
}> = ({ notification, onClose, onAction }) => {
  const theme = useTheme();
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const shakeAnimation = keyframes`
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
    20%, 40%, 60%, 80% { transform: translateX(4px); }
  `;

  const CriticalAlert = styled(Alert)(({ theme }) => ({
    width: '100%',
    maxWidth: { xs: 'calc(100vw - 32px)', sm: 520 },
    border: `2px solid ${theme.palette.error.main}`,
    borderRadius: 16,
    background: `linear-gradient(135deg, ${theme.palette.error.dark}, ${theme.palette.error.main})`,
    boxShadow: `0 12px 40px ${alpha(theme.palette.error.main, 0.4)}, 0 0 60px ${alpha(theme.palette.error.main, 0.2)}`,
    animation: `${pulseGlow} 2s infinite, ${shake ? shakeAnimation : 'none'} 0.5s ease-in-out`,
    backdropFilter: 'blur(20px)',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `linear-gradient(45deg, transparent 40%, ${alpha(theme.palette.common.white, 0.1)} 50%, transparent 60%)`,
      animation: `${shimmer} 3s infinite`,
    },
  }));

  return (
    <Snackbar
      open={true}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      TransitionComponent={Grow}
      transitionDuration={600}
      sx={{ 
        mt: { xs: 7, sm: 8 },
        zIndex: 10000,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <CriticalAlert
        severity="error"
        variant="filled"
        icon={<ErrorIcon sx={{ fontSize: 36, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {onAction && (
              <ActionButton
                color="inherit"
                size="medium"
                variant="contained"
                onClick={onAction}
                sx={{ 
                  bgcolor: alpha(theme.palette.common.white, 0.15),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.common.white, 0.3)}`,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.25),
                    transform: 'scale(1.05) translateY(-1px)',
                  }
                }}
              >
                {notification.actionLabel || 'Take Action'}
              </ActionButton>
            )}
            <IconButton
              size="medium"
              onClick={onClose}
              color="inherit"
              sx={{
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.1),
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        }
      >
        <Box>
          <AlertTitle 
            sx={{ 
              fontSize: '1.1rem', 
              fontWeight: 800,
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            🚨 CRITICAL: {notification.title}
          </AlertTitle>
          <Typography 
            variant="body1" 
            sx={{ 
              fontSize: '0.9rem',
              lineHeight: 1.5,
              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }}
          >
            {notification.message}
          </Typography>
        </Box>
      </CriticalAlert>
    </Snackbar>
  );
};