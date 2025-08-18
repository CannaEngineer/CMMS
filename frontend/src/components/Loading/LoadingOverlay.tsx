import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  useTheme,
  alpha,
  Backdrop,
  Portal,
} from '@mui/material';
import { LoadingOverlayProps } from './types';
import LoadingSpinner from './LoadingSpinner';
import LoadingBar from './LoadingBar';

/**
 * LoadingOverlay - Full-screen or section loading overlay
 * 
 * Design Decisions:
 * - Provides both modal and backdrop loading states
 * - Context-aware styling for different use cases
 * - Supports both determinate and indeterminate progress
 * - Maintains accessibility with proper focus management
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  open,
  message = 'Loading...',
  progress,
  backdrop = true,
  disableEscapeKeyDown = true,
  context = 'page',
  onClose,
}) => {
  const theme = useTheme();

  // Context-specific styling
  const getContextStyles = () => {
    switch (context) {
      case 'form':
        return {
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          borderRadius: theme.shape.borderRadius,
          padding: theme.spacing(4),
          minWidth: 300,
          maxWidth: 400,
        };
      case 'section':
        return {
          backgroundColor: alpha(theme.palette.background.default, 0.9),
          borderRadius: theme.shape.borderRadius * 2,
          padding: theme.spacing(3),
          minWidth: 280,
          maxWidth: 350,
        };
      case 'data':
        return {
          backgroundColor: alpha(theme.palette.background.paper, 0.98),
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: theme.shape.borderRadius,
          padding: theme.spacing(3),
          minWidth: 320,
          maxWidth: 400,
        };
      case 'page':
      default:
        return {
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          borderRadius: theme.shape.borderRadius * 2,
          padding: theme.spacing(4),
          minWidth: 320,
          maxWidth: 450,
        };
    }
  };

  const contextStyles = getContextStyles();
  const isDeterminate = progress !== undefined;

  const LoadingContent = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        ...contextStyles,
        // Enhanced visual design
        backdropFilter: 'blur(8px)',
        boxShadow: theme.shadows[8],
      }}
      role="dialog"
      aria-busy="true"
      aria-live="polite"
      aria-label={message}
    >
      {/* Loading indicator */}
      <Box sx={{ mb: 2 }}>
        {isDeterminate ? (
          <Box sx={{ width: 200 }}>
            <LoadingBar 
              progress={progress} 
              showLabel 
              variant="primary" 
              size="medium"
            />
          </Box>
        ) : (
          <LoadingSpinner size="large" variant="primary" />
        )}
      </Box>

      {/* Loading message */}
      <Typography
        variant="body1"
        color="text.primary"
        sx={{ 
          fontWeight: 500,
          mb: isDeterminate && progress !== undefined ? 1 : 0,
        }}
      >
        {message}
      </Typography>

      {/* Progress percentage for determinate loading */}
      {isDeterminate && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ 
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          }}
        >
          {Math.round(progress!)}% complete
        </Typography>
      )}
    </Box>
  );

  // For backdrop overlay (full-screen)
  if (backdrop) {
    return (
      <Portal>
        <Backdrop
          open={open}
          sx={{
            zIndex: theme.zIndex.modal + 1,
            backgroundColor: alpha(theme.palette.common.black, 0.5),
            backdropFilter: 'blur(4px)',
            // Respect reduced motion preferences
            '@media (prefers-reduced-motion: reduce)': {
              backdropFilter: 'none',
            },
          }}
          onClick={onClose}
        >
          <LoadingContent />
        </Backdrop>
      </Portal>
    );
  }

  // For modal overlay
  return (
    <Dialog
      open={open}
      onClose={onClose}
      disableEscapeKeyDown={disableEscapeKeyDown}
      maxWidth={false}
      PaperProps={{
        sx: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
          overflow: 'visible',
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: alpha(theme.palette.common.black, 0.4),
          backdropFilter: 'blur(2px)',
          // Respect reduced motion preferences
          '@media (prefers-reduced-motion: reduce)': {
            backdropFilter: 'none',
          },
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <LoadingContent />
      </DialogContent>
    </Dialog>
  );
};

export default LoadingOverlay;