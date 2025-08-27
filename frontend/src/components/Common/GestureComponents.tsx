import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Card,
  IconButton,
  Typography,
  useTheme,
  alpha,
  Slide,
  Fade,
  Grow,
  Zoom,
  Collapse,
  Backdrop,
} from '@mui/material';
import {
  SwipeableDrawer,
  SwipeableDrawerProps,
} from '@mui/material';
import {
  KeyboardArrowUp as UpIcon,
  KeyboardArrowDown as DownIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

// Enhanced Swipeable Card with multiple actions
interface SwipeAction {
  key: string;
  label: string;
  icon: React.ReactElement;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  backgroundColor?: string;
  onAction: () => void | Promise<void>;
  confirmMessage?: string;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipe?: (direction: 'left' | 'right', action?: SwipeAction) => void;
  disabled?: boolean;
  className?: string;
  maxSwipeDistance?: number;
  swipeThreshold?: number;
  onTap?: () => void;
  enableHaptics?: boolean;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  onSwipe,
  disabled = false,
  className,
  maxSwipeDistance = 120,
  swipeThreshold = 60,
  onTap,
  enableHaptics = true,
}) => {
  const [swipeX, setSwipeX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  const triggerHaptics = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enableHaptics || !('vibrate' in navigator)) return;
    
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate([10, 10, 10]);
        break;
    }
  }, [enableHaptics]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setStartTime(Date.now());
    setIsDragging(true);
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const clampedX = Math.max(-maxSwipeDistance, Math.min(maxSwipeDistance, deltaX));
    
    // Only update if there's significant movement
    if (Math.abs(deltaX) > 5) {
      setSwipeX(clampedX);
      e.preventDefault();
      
      // Haptic feedback when reaching threshold
      if (Math.abs(clampedX) >= swipeThreshold && Math.abs(swipeX) < swipeThreshold) {
        triggerHaptics('light');
      }
    }
  }, [isDragging, disabled, startX, maxSwipeDistance, swipeThreshold, swipeX, triggerHaptics]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || disabled) return;
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    const velocity = Math.abs(swipeX) / duration;
    const shouldTriggerAction = Math.abs(swipeX) >= swipeThreshold || velocity > 0.5;
    
    if (shouldTriggerAction) {
      const direction = swipeX > 0 ? 'left' : 'right';
      const actions = direction === 'left' ? leftActions : rightActions;
      
      if (actions.length > 0) {
        const action = actions[0]; // For now, trigger the first action
        triggerHaptics('medium');
        onSwipe?.(direction, action);
        action.onAction();
      }
    } else if (Math.abs(swipeX) < 10 && duration < 200 && onTap) {
      // Tap gesture
      triggerHaptics('light');
      onTap();
    }
    
    // Reset state
    setSwipeX(0);
    setIsDragging(false);
    setStartX(0);
    setStartTime(0);
  }, [isDragging, disabled, swipeX, swipeThreshold, startTime, leftActions, rightActions, onSwipe, onTap, triggerHaptics]);

  const getBackgroundColor = () => {
    if (swipeX === 0) return 'transparent';
    
    const actions = swipeX > 0 ? leftActions : rightActions;
    if (actions.length === 0) return 'transparent';
    
    const action = actions[0];
    return action.backgroundColor || `${action.color}.light`;
  };

  const getActionIcon = () => {
    if (Math.abs(swipeX) < swipeThreshold) return null;
    
    const actions = swipeX > 0 ? leftActions : rightActions;
    if (actions.length === 0) return null;
    
    return actions[0].icon;
  };

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
      }}
      className={className}
    >
      {/* Background Actions */}
      {swipeX !== 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: swipeX > 0 ? 'flex-start' : 'flex-end',
            px: 3,
            bgcolor: getBackgroundColor(),
            zIndex: 0,
          }}
        >
          <Zoom in={Math.abs(swipeX) >= swipeThreshold}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'white' }}>
              {getActionIcon()}
              <Typography variant="body2" fontWeight={600}>
                {Math.abs(swipeX) >= swipeThreshold 
                  ? (swipeX > 0 ? leftActions[0]?.label : rightActions[0]?.label)
                  : ''
                }
              </Typography>
            </Box>
          </Zoom>
        </Box>
      )}
      
      {/* Swipeable Content */}
      <Card
        ref={cardRef}
        sx={{
          position: 'relative',
          zIndex: 1,
          transform: `translateX(${swipeX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: onTap ? 'pointer' : 'default',
          touchAction: 'pan-y', // Allow vertical scrolling
          WebkitTapHighlightColor: 'transparent',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </Card>
    </Box>
  );
};

// Bottom Sheet Component
interface BottomSheetProps extends Omit<SwipeableDrawerProps, 'anchor'> {
  title?: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string | number;
  showHandle?: boolean;
  closeOnBackdropClick?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  title,
  subtitle,
  onClose,
  children,
  maxHeight = '80vh',
  showHandle = true,
  closeOnBackdropClick = true,
  open,
  ...props
}) => {
  const theme = useTheme();

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      ModalProps={{
        keepMounted: false,
        BackdropProps: {
          onClick: closeOnBackdropClick ? onClose : undefined,
        },
      }}
      PaperProps={{
        sx: {
          maxHeight,
          borderRadius: '16px 16px 0 0',
          overflow: 'visible',
        },
      }}
      {...props}
    >
      <Box sx={{ p: 0 }}>
        {/* Handle */}
        {showHandle && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              py: 1.5,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 4,
                borderRadius: 2,
                bgcolor: theme.palette.grey[300],
              }}
            />
          </Box>
        )}
        
        {/* Header */}
        {(title || subtitle) && (
          <Box sx={{ px: 3, pb: 2 }}>
            {title && (
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        )}
        
        {/* Content */}
        <Box sx={{ px: 3, pb: 3 }}>
          {children}
        </Box>
      </Box>
    </SwipeableDrawer>
  );
};

// Expandable Section with smooth animations
interface ExpandableSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  icon?: React.ReactElement;
  onExpandChange?: (expanded: boolean) => void;
  disabled?: boolean;
  variant?: 'card' | 'list';
}

export const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  subtitle,
  children,
  defaultExpanded = false,
  icon,
  onExpandChange,
  disabled = false,
  variant = 'card',
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const theme = useTheme();

  const handleToggle = useCallback(() => {
    if (disabled) return;
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    onExpandChange?.(newExpanded);
  }, [disabled, expanded, onExpandChange]);

  const content = (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          py: 2,
          px: variant === 'card' ? 3 : 0,
          cursor: disabled ? 'default' : 'pointer',
          borderRadius: variant === 'card' ? 'inherit' : 0,
          transition: 'background-color 0.2s ease',
          '&:hover': disabled ? {} : {
            bgcolor: alpha(theme.palette.primary.main, 0.02),
          },
          '&:active': disabled ? {} : {
            bgcolor: alpha(theme.palette.primary.main, 0.04),
          },
        }}
        onClick={handleToggle}
      >
        {icon && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
            }}
          >
            {icon}
          </Box>
        )}
        
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.25,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        
        <IconButton
          size="small"
          disabled={disabled}
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <DownIcon />
        </IconButton>
      </Box>
      
      <Collapse 
        in={expanded} 
        timeout="auto" 
        unmountOnExit
        sx={{
          '& .MuiCollapse-wrapper': {
            overflow: 'visible',
          },
        }}
      >
        <Box sx={{ px: variant === 'card' ? 3 : 0, pb: variant === 'card' ? 3 : 2 }}>
          {children}
        </Box>
      </Collapse>
    </>
  );

  if (variant === 'card') {
    return (
      <Card
        sx={{
          mb: 2,
          overflow: 'visible',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': disabled ? {} : {
            transform: 'translateY(-1px)',
            boxShadow: theme.shadows[4],
          },
        }}
      >
        {content}
      </Card>
    );
  }

  return <Box>{content}</Box>;
};

// Long Press Component
interface LongPressProps {
  onLongPress: () => void;
  onPress?: () => void;
  children: React.ReactNode;
  delay?: number;
  disabled?: boolean;
  enableHaptics?: boolean;
}

export const LongPress: React.FC<LongPressProps> = ({
  onLongPress,
  onPress,
  children,
  delay = 500,
  disabled = false,
  enableHaptics = true,
}) => {
  const [pressing, setPressing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>();

  const triggerHaptics = useCallback(() => {
    if (enableHaptics && 'vibrate' in navigator) {
      navigator.vibrate(20);
    }
  }, [enableHaptics]);

  const handleStart = useCallback(() => {
    if (disabled) return;
    
    setPressing(true);
    startTimeRef.current = Date.now();
    
    timeoutRef.current = setTimeout(() => {
      triggerHaptics();
      onLongPress();
      setPressing(false);
    }, delay);
  }, [disabled, delay, onLongPress, triggerHaptics]);

  const handleEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (pressing && onPress) {
      const duration = Date.now() - (startTimeRef.current || 0);
      if (duration < delay) {
        onPress();
      }
    }
    
    setPressing(false);
  }, [pressing, onPress, delay]);

  const handleCancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setPressing(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Box
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchCancel={handleCancel}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleCancel}
      sx={{
        transform: pressing ? 'scale(0.98)' : 'scale(1)',
        transition: 'transform 0.1s ease',
        cursor: disabled ? 'default' : 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}
    </Box>
  );
};

// Parallax Scroll Component
interface ParallaxScrollProps {
  children: React.ReactNode;
  backgroundImage?: string;
  backgroundColor?: string;
  height?: string | number;
  speed?: number;
  blur?: boolean;
}

export const ParallaxScroll: React.FC<ParallaxScrollProps> = ({
  children,
  backgroundImage,
  backgroundColor,
  height = '40vh',
  speed = 0.5,
  blur = false,
}) => {
  const [scrollY, setScrollY] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        const scrolled = window.scrollY;
        const rate = scrolled * -speed;
        
        if (rect.top <= window.innerHeight && rect.bottom >= 0) {
          setScrollY(rate);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <Box
      ref={elementRef}
      sx={{
        position: 'relative',
        height,
        overflow: 'hidden',
      }}
    >
      {/* Background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: `translateY(${scrollY}px)`,
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundColor: backgroundColor,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: blur ? 'blur(2px)' : 'none',
          scale: '1.1', // Slightly larger to prevent gaps
        }}
      />
      
      {/* Content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

// Animated Counter Component
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatter?: (value: number) => string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  formatter = (val) => Math.round(val).toString(),
  className,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const startValueRef = useRef<number>(0);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValueRef.current + (value - startValueRef.current) * easeOut;
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    startValueRef.current = displayValue;
    startTimeRef.current = undefined;
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, displayValue]);

  return (
    <span className={className}>
      {formatter(displayValue)}
    </span>
  );
};