import React from 'react';
import {
  LinearProgress,
  Box,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import { LoadingBarProps } from './types';

/**
 * LoadingBar - Linear progress indicator for processes with deterministic progress
 * 
 * Design Decisions:
 * - Shows both determinate and indeterminate states
 * - Optional progress labeling for user clarity
 * - Buffer support for data streaming scenarios
 * - Accessibility-first design with proper ARIA attributes
 */
const LoadingBar: React.FC<LoadingBarProps> = ({
  size = 'medium',
  variant = 'primary',
  progress,
  buffer,
  showLabel = false,
  label,
  className,
  'aria-label': ariaLabel = 'Loading progress',
}) => {
  const theme = useTheme();

  // Height configurations for different contexts
  const sizeMap = {
    small: 4,
    medium: 6,
    large: 8,
  };

  // Color variants for different use cases
  const getProgressColor = () => {
    switch (variant) {
      case 'primary':
        return theme.palette.primary.main;
      case 'secondary':
        return theme.palette.secondary.main;
      case 'neutral':
      default:
        return theme.palette.text.secondary;
    }
  };

  const progressHeight = sizeMap[size];
  const isDeterminate = progress !== undefined;
  const displayLabel = label || (showLabel && isDeterminate ? `${Math.round(progress)}%` : undefined);

  return (
    <Box
      className={className}
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      {displayLabel && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ 
            fontWeight: 500,
            alignSelf: 'flex-end',
            fontFamily: 'monospace', // Better for numeric display
          }}
        >
          {displayLabel}
        </Typography>
      )}
      
      <LinearProgress
        variant={isDeterminate ? 'determinate' : 'indeterminate'}
        value={progress}
        valueBuffer={buffer}
        sx={{
          height: progressHeight,
          borderRadius: progressHeight / 2,
          backgroundColor: alpha(theme.palette.divider, 0.3),
          // Enhanced visual design
          boxShadow: `inset 0 1px 2px ${alpha(theme.palette.common.black, 0.1)}`,
          '& .MuiLinearProgress-bar': {
            borderRadius: progressHeight / 2,
            backgroundColor: getProgressColor(),
            // Smooth transitions for progress updates
            transition: theme.transitions.create('transform', {
              duration: theme.transitions.duration.shorter,
            }),
          },
          '& .MuiLinearProgress-bar2Indeterminate': {
            backgroundColor: alpha(getProgressColor(), 0.7),
          },
          // Respect reduced motion preferences
          '@media (prefers-reduced-motion: reduce)': {
            '& .MuiLinearProgress-bar1Indeterminate, & .MuiLinearProgress-bar2Indeterminate': {
              animation: 'none',
              transform: 'translateX(0) scaleX(1)',
            },
          },
        }}
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuenow={isDeterminate ? progress : undefined}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </Box>
  );
};

export default LoadingBar;