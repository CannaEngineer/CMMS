import React, { useState } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Typography,
  Tooltip,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Badge,
  Avatar,
} from '@mui/material';
import {
  CheckCircle as CompleteIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Schedule as ScheduledIcon,
  RadioButtonUnchecked as DefaultIcon,
  Priority as PriorityIcon,
} from '@mui/icons-material';

type StatusType = 
  | 'OPEN' 
  | 'IN_PROGRESS' 
  | 'ON_HOLD' 
  | 'COMPLETED' 
  | 'CANCELED'
  | 'ONLINE'
  | 'OFFLINE'
  | 'SCHEDULED'
  | 'OVERDUE';

type PriorityType = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL';

type VariantType = 'chip' | 'icon' | 'badge' | 'timeline';

type AnimationType = 'none' | 'pulse' | 'spin' | 'bounce';

interface StatusIndicatorProps {
  status: StatusType;
  priority?: PriorityType;
  variant?: VariantType;
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  showAnimation?: boolean;
  animationType?: AnimationType;
  loading?: boolean;
  onClick?: (status: StatusType) => void;
  onStatusChange?: (newStatus: StatusType) => void;
  label?: string;
  showTooltip?: boolean;
  disabled?: boolean;
}

export default function StatusIndicator({
  status,
  priority,
  variant = 'chip',
  size = 'medium',
  interactive = false,
  showAnimation = false,
  animationType = 'none',
  loading = false,
  onClick,
  onStatusChange,
  label,
  showTooltip = true,
  disabled = false,
}: StatusIndicatorProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isChanging, setIsChanging] = useState(false);

  const statusConfig = getStatusConfig(status, priority);
  const sizeConfig = getSizeConfig(size, isMobile);

  const handleClick = async () => {
    if (disabled || loading || !interactive) return;

    if (onClick) {
      onClick(status);
      return;
    }

    if (onStatusChange) {
      setIsChanging(true);
      try {
        const nextStatus = getNextStatus(status);
        await onStatusChange(nextStatus);
      } finally {
        setIsChanging(false);
      }
    }
  };

  const renderIcon = () => {
    if (loading || isChanging) {
      return (
        <CircularProgress 
          size={sizeConfig.iconSize} 
          color={statusConfig.color as any}
          thickness={4}
        />
      );
    }

    const IconComponent = statusConfig.icon;
    return (
      <IconComponent 
        sx={{ 
          fontSize: sizeConfig.iconSize,
          color: statusConfig.color === 'default' ? 'text.secondary' : `${statusConfig.color}.main`,
          animation: getAnimation(animationType, showAnimation),
        }} 
      />
    );
  };

  const renderChip = () => {
    const chipElement = (
      <Chip
        icon={renderIcon()}
        label={label || statusConfig.label}
        color={statusConfig.color as any}
        variant={priority ? 'filled' : 'outlined'}
        size={size === 'large' ? 'medium' : 'small'}
        clickable={interactive && !disabled}
        onClick={handleClick}
        disabled={disabled}
        sx={{
          minHeight: sizeConfig.minHeight,
          fontWeight: priority ? 700 : 500,
          fontSize: sizeConfig.fontSize,
          cursor: interactive && !disabled ? 'pointer' : 'default',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: priority === 'URGENT' || priority === 'CRITICAL' ? 2 : 0,
          border: priority === 'HIGH' ? 2 : 1,
          '&:hover': interactive && !disabled ? {
            transform: 'translateY(-1px)',
            boxShadow: 4,
          } : {},
          '&:active': interactive && !disabled ? {
            transform: 'scale(0.98)',
          } : {},
          WebkitTapHighlightColor: 'transparent',
          ...(priority === 'URGENT' && {
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }),
        }}
      />
    );

    if (showTooltip && statusConfig.tooltip) {
      return (
        <Tooltip title={statusConfig.tooltip} arrow>
          {chipElement}
        </Tooltip>
      );
    }

    return chipElement;
  };

  const renderIconButton = () => {
    const iconElement = (
      <IconButton
        onClick={handleClick}
        disabled={disabled || loading}
        size={size}
        sx={{
          color: statusConfig.color === 'default' ? 'text.secondary' : `${statusConfig.color}.main`,
          minWidth: sizeConfig.minHeight,
          minHeight: sizeConfig.minHeight,
          cursor: interactive && !disabled ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          '&:hover': interactive && !disabled ? {
            bgcolor: `${statusConfig.color}.light`,
            transform: 'scale(1.1)',
          } : {},
          '&:active': interactive && !disabled ? {
            transform: 'scale(0.9)',
          } : {},
          animation: getAnimation(animationType, showAnimation),
        }}
      >
        {renderIcon()}
      </IconButton>
    );

    if (showTooltip && statusConfig.tooltip) {
      return (
        <Tooltip title={statusConfig.tooltip} arrow>
          {iconElement}
        </Tooltip>
      );
    }

    return iconElement;
  };

  const renderBadge = () => {
    const badgeElement = (
      <Badge
        badgeContent={priority && getPriorityLevel(priority)}
        color={getPriorityColor(priority)}
        variant={priority === 'URGENT' || priority === 'CRITICAL' ? 'standard' : 'dot'}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          cursor: interactive && !disabled ? 'pointer' : 'default',
          '& .MuiBadge-badge': {
            fontSize: sizeConfig.fontSize * 0.75,
            minWidth: sizeConfig.iconSize * 0.6,
            height: sizeConfig.iconSize * 0.6,
            animation: priority === 'URGENT' ? 'pulse 2s infinite' : 'none',
          },
        }}
        onClick={handleClick}
      >
        <Avatar
          sx={{
            bgcolor: `${statusConfig.color}.main`,
            width: sizeConfig.iconSize * 1.5,
            height: sizeConfig.iconSize * 1.5,
            fontSize: sizeConfig.iconSize * 0.6,
            transition: 'all 0.3s ease',
            '&:hover': interactive && !disabled ? {
              transform: 'scale(1.1)',
              boxShadow: 4,
            } : {},
          }}
        >
          {renderIcon()}
        </Avatar>
      </Badge>
    );

    if (showTooltip && statusConfig.tooltip) {
      return (
        <Tooltip title={statusConfig.tooltip} arrow>
          {badgeElement}
        </Tooltip>
      );
    }

    return badgeElement;
  };

  const renderTimeline = () => {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          cursor: interactive && !disabled ? 'pointer' : 'default',
          p: 1,
          borderRadius: 1,
          transition: 'all 0.2s ease',
          '&:hover': interactive && !disabled ? {
            bgcolor: 'action.hover',
            transform: 'translateX(4px)',
          } : {},
        }}
        onClick={handleClick}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: sizeConfig.iconSize * 1.2,
            height: sizeConfig.iconSize * 1.2,
            borderRadius: '50%',
            bgcolor: `${statusConfig.color}.light`,
            border: `2px solid ${theme.palette[statusConfig.color]?.main || statusConfig.color}`,
            animation: getAnimation(animationType, showAnimation),
          }}
        >
          {renderIcon()}
        </Box>
        
        <Box sx={{ flex: 1 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 600,
              fontSize: sizeConfig.fontSize,
              color: 'text.primary',
            }}
          >
            {label || statusConfig.label}
          </Typography>
          
          {priority && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: getPriorityColor(priority) + '.main',
                fontWeight: 500,
                fontSize: sizeConfig.fontSize * 0.85,
              }}
            >
              {priority} Priority
            </Typography>
          )}
        </Box>

        {priority && (
          <PriorityIcon 
            sx={{ 
              color: getPriorityColor(priority) + '.main',
              fontSize: sizeConfig.iconSize * 0.8,
            }} 
          />
        )}
      </Box>
    );
  };

  switch (variant) {
    case 'icon':
      return renderIconButton();
    case 'badge':
      return renderBadge();
    case 'timeline':
      return renderTimeline();
    default:
      return renderChip();
  }
}

// Helper functions

function getStatusConfig(status: StatusType, priority?: PriorityType) {
  const configs = {
    OPEN: {
      label: 'Open',
      icon: DefaultIcon,
      color: 'info',
      tooltip: 'Work order is open and ready to start',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      icon: StartIcon,
      color: 'warning',
      tooltip: 'Work is currently being performed',
    },
    ON_HOLD: {
      label: 'On Hold',
      icon: PauseIcon,
      color: 'default',
      tooltip: 'Work has been paused temporarily',
    },
    COMPLETED: {
      label: 'Completed',
      icon: CompleteIcon,
      color: 'success',
      tooltip: 'Work has been completed successfully',
    },
    CANCELED: {
      label: 'Canceled',
      icon: ErrorIcon,
      color: 'error',
      tooltip: 'Work order has been canceled',
    },
    ONLINE: {
      label: 'Online',
      icon: CompleteIcon,
      color: 'success',
      tooltip: 'Asset is online and operational',
    },
    OFFLINE: {
      label: 'Offline',
      icon: ErrorIcon,
      color: 'error',
      tooltip: 'Asset is offline or not operational',
    },
    SCHEDULED: {
      label: 'Scheduled',
      icon: ScheduledIcon,
      color: 'info',
      tooltip: 'Work is scheduled for future execution',
    },
    OVERDUE: {
      label: 'Overdue',
      icon: WarningIcon,
      color: 'error',
      tooltip: 'Work is overdue and requires immediate attention',
    },
  };

  const config = configs[status] || configs.OPEN;

  // Override color for high priority items
  if (priority === 'URGENT' || priority === 'CRITICAL') {
    return { ...config, color: 'error' };
  }

  return config;
}

function getSizeConfig(size: 'small' | 'medium' | 'large', isMobile: boolean) {
  const baseSize = isMobile ? 0.9 : 1;
  
  const configs = {
    small: {
      iconSize: 16 * baseSize,
      fontSize: 12 * baseSize,
      minHeight: 32 * baseSize,
    },
    medium: {
      iconSize: 20 * baseSize,
      fontSize: 14 * baseSize,
      minHeight: 40 * baseSize,
    },
    large: {
      iconSize: 24 * baseSize,
      fontSize: 16 * baseSize,
      minHeight: 48 * baseSize,
    },
  };

  return configs[size];
}

function getAnimation(type: AnimationType, enabled: boolean): string {
  if (!enabled || type === 'none') return 'none';

  const animations = {
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    spin: 'spin 2s linear infinite',
    bounce: 'bounce 1s ease-in-out infinite',
  };

  return animations[type] || 'none';
}

function getNextStatus(currentStatus: StatusType): StatusType {
  const statusFlow = {
    OPEN: 'IN_PROGRESS',
    IN_PROGRESS: 'COMPLETED',
    ON_HOLD: 'IN_PROGRESS',
    COMPLETED: 'OPEN',
    CANCELED: 'OPEN',
    SCHEDULED: 'IN_PROGRESS',
    OVERDUE: 'IN_PROGRESS',
    OFFLINE: 'ONLINE',
    ONLINE: 'OFFLINE',
  };

  return statusFlow[currentStatus] || currentStatus;
}

function getPriorityLevel(priority: PriorityType): string {
  const levels = {
    LOW: '1',
    MEDIUM: '2', 
    HIGH: '3',
    URGENT: '!',
    CRITICAL: '!!',
  };

  return levels[priority];
}

function getPriorityColor(priority?: PriorityType): string {
  if (!priority) return 'default';

  const colors = {
    LOW: 'success',
    MEDIUM: 'info',
    HIGH: 'warning', 
    URGENT: 'error',
    CRITICAL: 'error',
  };

  return colors[priority];
}

// Export helper functions for use in other components
export {
  getStatusConfig,
  getNextStatus,
  getPriorityColor,
  getPriorityLevel,
};