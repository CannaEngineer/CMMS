import React from 'react';
import {
  CircularProgress,
  Box,
  useTheme,
  alpha,
} from '@mui/material';
import { LoadingSpinnerProps } from './types';

/**
 * LoadingSpinner - Consistent circular progress indicator for CMMS application
 * 
 * Design Decisions:
 * - Uses theme colors to maintain brand consistency
 * - Respects reduced motion preferences
 * - Provides accessible labeling
 * - Optimized for industrial/professional contexts
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  variant = 'primary',
  thickness = 3.6,
  disableShrink = false,
  className,
  'aria-label': ariaLabel = 'Loading content',
}) => {
  const theme = useTheme();

  // Size configurations optimized for touch interfaces
  const sizeMap = {
    small: 20,
    medium: 40,
    large: 56,
  };

  // Color variants aligned with CMMS theme
  const getSpinnerColor = () => {
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

  const spinnerSize = sizeMap[size];

  return (
    <Box
      className={className}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Respect reduced motion preferences
        '@media (prefers-reduced-motion: reduce)': {
          '& .MuiCircularProgress-root': {
            animation: 'none',
          },
        },
      }}
      role="progressbar"
      aria-label={ariaLabel}
    >
      <CircularProgress
        size={spinnerSize}
        thickness={thickness}
        disableShrink={disableShrink}
        sx={{
          color: getSpinnerColor(),
          // Enhanced styling for professional appearance
          filter: `drop-shadow(0 1px 2px ${alpha(theme.palette.common.black, 0.1)})`,
          // Smooth animation with industrial feel
          animationDuration: '1.4s',
        }}
      />
    </Box>
  );
};

export default LoadingSpinner;