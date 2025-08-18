import React, { useState } from 'react';
import {
  Button,
  ButtonProps,
  Box,
  useTheme,
  alpha,
} from '@mui/material';
import { LoadingButtonProps } from './types';
import LoadingSpinner from './LoadingSpinner';

/**
 * LoadingButton - Button component with integrated loading state
 * 
 * Design Decisions:
 * - Maintains button size during loading to prevent layout shift
 * - Provides flexible loading indicator positioning
 * - Supports async onClick handlers with automatic loading state
 * - Follows Material Design loading button patterns
 */
const LoadingButton: React.FC<LoadingButtonProps & Omit<ButtonProps, 'loading'>> = ({
  loading: externalLoading = false,
  disabled = false,
  loadingPosition = 'center',
  loadingIndicator,
  children,
  onClick,
  variant = 'contained',
  size = 'medium',
  fullWidth = false,
  className,
  ...buttonProps
}) => {
  const theme = useTheme();
  const [internalLoading, setInternalLoading] = useState(false);
  
  // Determine loading state (external prop takes precedence)
  const isLoading = externalLoading || internalLoading;
  const isDisabled = disabled || isLoading;

  // Handle async onClick
  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!onClick || isLoading) return;

    // If onClick returns a Promise, manage loading state automatically
    const result = onClick();
    if (result instanceof Promise) {
      setInternalLoading(true);
      try {
        await result;
      } catch (error) {
        console.error('LoadingButton: onClick promise rejected:', error);
      } finally {
        setInternalLoading(false);
      }
    }
  };

  // Default loading indicator
  const defaultLoadingIndicator = (
    <LoadingSpinner
      size={size === 'large' ? 'medium' : 'small'}
      variant={variant === 'contained' ? 'neutral' : 'primary'}
      aria-label="Button loading"
    />
  );

  const spinner = loadingIndicator || defaultLoadingIndicator;

  // Get button content based on loading state and position
  const getButtonContent = () => {
    if (!isLoading) {
      return children;
    }

    switch (loadingPosition) {
      case 'start':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {spinner}
            <Box 
              sx={{ 
                opacity: isLoading ? 0.7 : 1,
                transition: theme.transitions.create('opacity'),
              }}
            >
              {children}
            </Box>
          </Box>
        );
      
      case 'end':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box 
              sx={{ 
                opacity: isLoading ? 0.7 : 1,
                transition: theme.transitions.create('opacity'),
              }}
            >
              {children}
            </Box>
            {spinner}
          </Box>
        );
      
      case 'center':
      default:
        return (
          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Original content (hidden during loading) */}
            <Box
              sx={{
                opacity: isLoading ? 0 : 1,
                transition: theme.transitions.create('opacity', {
                  duration: theme.transitions.duration.short,
                }),
              }}
            >
              {children}
            </Box>
            
            {/* Loading spinner (centered overlay) */}
            {isLoading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {spinner}
              </Box>
            )}
          </Box>
        );
    }
  };

  return (
    <Button
      {...buttonProps}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={isDisabled}
      onClick={handleClick}
      className={className}
      sx={{
        // Prevent layout shift during loading
        minWidth: isLoading && loadingPosition === 'center' ? undefined : 'auto',
        // Enhanced loading state styling
        ...(isLoading && {
          pointerEvents: 'none',
          cursor: 'default',
        }),
        // Loading state visual feedback
        ...(isLoading && variant === 'contained' && {
          backgroundColor: alpha(theme.palette.primary.main, 0.8),
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.8),
          },
        }),
        // Smooth transitions
        transition: theme.transitions.create([
          'background-color',
          'box-shadow',
          'border-color',
          'color',
          'opacity',
        ]),
        ...buttonProps.sx,
      }}
      aria-busy={isLoading}
      aria-disabled={isDisabled}
    >
      {getButtonContent()}
    </Button>
  );
};

export default LoadingButton;