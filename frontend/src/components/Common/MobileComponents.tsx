import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Fab,
  Paper,
  Collapse,
  useTheme,
  useMediaQuery,
  alpha,
  Stack,
  Avatar,
  CircularProgress,
  Slide,
  Fade,
  Button,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  MoreVert as MoreIcon,
  ExpandMore as ExpandIcon,
  Refresh as RefreshIcon,
  KeyboardArrowDown as PullIcon
} from '@mui/icons-material';

// Mobile Header with sticky navigation
interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: React.ReactNode[];
  sticky?: boolean;
  blur?: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  subtitle,
  onBack,
  actions = [],
  sticky = true,
  blur = true
}) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        position: sticky ? 'sticky' : 'relative',
        top: 0,
        zIndex: 1100,
        backgroundColor: blur 
          ? alpha(theme.palette.background.paper, 0.8) 
          : theme.palette.background.paper,
        backdropFilter: blur ? 'blur(8px)' : 'none',
        borderBottom: `1px solid ${theme.palette.divider}`,
        px: 2,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        minHeight: 56,
        gap: 1
      }}
    >
      {onBack && (
        <IconButton 
          onClick={onBack}
          sx={{ mr: 1 }}
          size="large"
        >
          <BackIcon />
        </IconButton>
      )}
      
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography 
          variant="h6" 
          noWrap
          sx={{ fontWeight: 600, lineHeight: 1.2 }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography 
            variant="body2" 
            color="text.secondary"
            noWrap
            sx={{ mt: -0.5 }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      
      <Stack direction="row" spacing={0.5}>
        {actions.map((action, index) => (
          <Box key={index}>{action}</Box>
        ))}
      </Stack>
    </Box>
  );
};

// Expandable card with progressive disclosure
interface ExpandableCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  expanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  disabled?: boolean;
  elevation?: number;
}

export const ExpandableCard: React.FC<ExpandableCardProps> = ({
  title,
  subtitle,
  icon,
  badge,
  children,
  expanded = false,
  onToggle,
  disabled = false,
  elevation = 1
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  
  const handleToggle = () => {
    if (disabled) return;
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  return (
    <Card 
      elevation={elevation}
      sx={{ 
        mb: 2,
        overflow: 'visible',
        transition: 'box-shadow 0.2s ease',
        '&:hover': disabled ? {} : {
          boxShadow: (theme) => theme.shadows[4]
        }
      }}
    >
      <CardContent
        onClick={handleToggle}
        sx={{ 
          p: 2,
          cursor: disabled ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          minHeight: 56,
          '&:last-child': { pb: isExpanded ? 1 : 2 }
        }}
      >
        {icon && (
          <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
            {icon}
          </Box>
        )}
        
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: subtitle ? 0.5 : 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
              {title}
            </Typography>
            {badge}
          </Box>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {subtitle}
            </Typography>
          )}
        </Box>
        
        {!disabled && (
          <IconButton 
            size="small"
            sx={{ 
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          >
            <ExpandIcon />
          </IconButton>
        )}
      </CardContent>
      
      <Collapse in={isExpanded} timeout="auto">
        <CardContent sx={{ pt: 0, pb: 2 }}>
          <Divider sx={{ mb: 2 }} />
          {children}
        </CardContent>
      </Collapse>
    </Card>
  );
};

// Floating Action Menu
interface FloatingAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  disabled?: boolean;
}

interface FloatingActionMenuProps {
  actions: FloatingAction[];
  open?: boolean;
  onToggle?: (open: boolean) => void;
}

export const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({
  actions,
  open = false,
  onToggle
}) => {
  const [isOpen, setIsOpen] = useState(open);
  
  const handleToggle = () => {
    const newOpen = !isOpen;
    setIsOpen(newOpen);
    onToggle?.(newOpen);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 2
      }}
    >
      {/* Action buttons */}
      <Stack spacing={2} sx={{ alignItems: 'flex-end' }}>
        {actions.map((action, index) => (
          <Slide
            key={index}
            direction="up"
            in={isOpen}
            timeout={200 + (index * 50)}
            mountOnEnter
            unmountOnExit
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Paper
                elevation={2}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  backgroundColor: 'background.paper',
                  borderRadius: 1
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {action.label}
                </Typography>
              </Paper>
              <Fab
                size="medium"
                color={action.color || 'primary'}
                onClick={action.onClick}
                disabled={action.disabled}
                sx={{ 
                  minHeight: 48,
                  minWidth: 48
                }}
              >
                {action.icon}
              </Fab>
            </Box>
          </Slide>
        ))}
      </Stack>

      {/* Main FAB */}
      <Fab
        color="primary"
        onClick={handleToggle}
        sx={{
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}
      >
        <MoreIcon />
      </Fab>
    </Box>
  );
};

// Pull to Refresh Component
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  maxPull?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  maxPull = 120
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, Math.min(maxPull, currentY - startY.current));
    setPullDistance(distance);
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  };

  const pullProgress = Math.min(1, pullDistance / threshold);
  const showRefreshIcon = pullDistance > 20;

  return (
    <Box
      ref={containerRef}
      sx={{ 
        position: 'relative',
        height: '100%',
        overflow: 'auto',
        transform: `translateY(${pullDistance}px)`,
        transition: isPulling ? 'none' : 'transform 0.3s ease'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {(showRefreshIcon || isRefreshing) && (
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            left: 0,
            right: 0,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1
          }}
        >
          {isRefreshing ? (
            <CircularProgress size={24} />
          ) : (
            <Box
              sx={{
                transform: `rotate(${pullProgress * 180}deg)`,
                transition: 'transform 0.1s ease',
                opacity: pullProgress
              }}
            >
              <PullIcon />
            </Box>
          )}
        </Box>
      )}

      {children}
    </Box>
  );
};

// Status Badge Component
interface StatusBadgeProps {
  status: string;
  variant?: 'filled' | 'outlined' | 'dot';
  size?: 'small' | 'medium' | 'large';
  colorMapping?: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'>;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'filled',
  size = 'medium',
  colorMapping = {
    ONLINE: 'success',
    OFFLINE: 'error',
    MAINTENANCE: 'warning',
    OPEN: 'info',
    IN_PROGRESS: 'warning',
    COMPLETED: 'success',
    CANCELLED: 'error',
    HIGH: 'error',
    MEDIUM: 'warning',
    LOW: 'success'
  }
}) => {
  const color = colorMapping[status] || 'default';

  if (variant === 'dot') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: `${color}.main`
          }}
        />
        <Typography 
          variant={size === 'small' ? 'caption' : 'body2'}
          sx={{ textTransform: 'capitalize' }}
        >
          {status.toLowerCase().replace('_', ' ')}
        </Typography>
      </Box>
    );
  }

  return (
    <Chip
      label={status.toLowerCase().replace('_', ' ')}
      color={color}
      variant={variant === 'outlined' ? 'outlined' : 'filled'}
      size={size === 'large' ? 'medium' : 'small'}
      sx={{
        textTransform: 'capitalize',
        fontWeight: 500
      }}
    />
  );
};

// Progress Card Component
interface ProgressCardProps {
  title: string;
  current: number;
  total: number;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  showPercentage?: boolean;
  icon?: React.ReactNode;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  current,
  total,
  color = 'primary',
  showPercentage = true,
  icon
}) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <Card elevation={1} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon && (
          <Avatar 
            sx={{ 
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              mr: 2,
              width: 40,
              height: 40
            }}
          >
            {icon}
          </Avatar>
        )}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {current} of {total}
            {showPercentage && ` (${percentage.toFixed(0)}%)`}
          </Typography>
        </Box>
      </Box>
      
      <LinearProgress
        variant="determinate"
        value={percentage}
        color={color}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: (theme) => alpha(theme.palette[color].main, 0.1)
        }}
      />
    </Card>
  );
};