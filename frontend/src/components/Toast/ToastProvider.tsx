import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  Snackbar,
  Alert,
  type AlertColor,
  Slide,
  type SlideProps,
  IconButton,
  Box,
  Typography
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';

export interface Toast {
  id: string;
  message: string;
  type: AlertColor;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  details?: string;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  showSuccess: (message: string, options?: Partial<Toast>) => void;
  showError: (message: string, options?: Partial<Toast>) => void;
  showWarning: (message: string, options?: Partial<Toast>) => void;
  showInfo: (message: string, options?: Partial<Toast>) => void;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Slide transition component
function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  maxToasts = 3 
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const showToast = useCallback((toastData: Omit<Toast, 'id'>) => {
    const id = generateId();
    const toast: Toast = {
      id,
      duration: 6000, // Default 6 seconds
      ...toastData,
    };

    setToasts(prevToasts => {
      // Remove oldest toasts if we exceed maxToasts
      const newToasts = [...prevToasts, toast];
      if (newToasts.length > maxToasts) {
        return newToasts.slice(-maxToasts);
      }
      return newToasts;
    });

    // Auto-hide non-persistent toasts
    if (!toast.persistent && toast.duration && toast.duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, toast.duration);
    }
  }, [generateId, maxToasts]);

  const showSuccess = useCallback((message: string, options?: Partial<Toast>) => {
    showToast({
      message,
      type: 'success',
      ...options,
    });
  }, [showToast]);

  const showError = useCallback((message: string, options?: Partial<Toast>) => {
    showToast({
      message,
      type: 'error',
      persistent: true, // Errors are persistent by default
      ...options,
    });
  }, [showToast]);

  const showWarning = useCallback((message: string, options?: Partial<Toast>) => {
    showToast({
      message,
      type: 'warning',
      ...options,
    });
  }, [showToast]);

  const showInfo = useCallback((message: string, options?: Partial<Toast>) => {
    showToast({
      message,
      type: 'info',
      ...options,
    });
  }, [showToast]);

  const hideToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
    hideAllToasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Render toasts */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
        {toasts.map((toast, index) => (
          <ToastComponent
            key={toast.id}
            toast={toast}
            onClose={() => hideToast(toast.id)}
            style={{
              marginBottom: index > 0 ? 8 : 0,
            }}
          />
        ))}
      </Box>
    </ToastContext.Provider>
  );
};

// Individual toast component
interface ToastComponentProps {
  toast: Toast;
  onClose: () => void;
  style?: React.CSSProperties;
}

const ToastComponent: React.FC<ToastComponentProps> = ({ toast, onClose, style }) => {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 200); // Wait for slide animation
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <SuccessIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'info':
        return <InfoIcon />;
      default:
        return null;
    }
  };

  return (
    <Snackbar
      open={open}
      TransitionComponent={SlideTransition}
      sx={{ 
        position: 'static',
        transform: 'none',
        ...style
      }}
    >
      <Alert
        severity={toast.type}
        variant="filled"
        icon={getIcon()}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                {toast.action.label}
              </button>
            )}
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        }
        sx={{
          width: '100%',
          minWidth: 300,
          maxWidth: 500,
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        <Box>
          <Typography variant="body2" component="div">
            {toast.message}
          </Typography>
          {toast.details && (
            <Typography 
              variant="caption" 
              component="div" 
              sx={{ 
                mt: 0.5, 
                opacity: 0.9,
                fontSize: '0.75rem'
              }}
            >
              {toast.details}
            </Typography>
          )}
        </Box>
      </Alert>
    </Snackbar>
  );
};

// Hook for handling API errors with toast notifications
export const useApiError = () => {
  const { showError, showWarning } = useToast();

  const handleError = useCallback((error: any, defaultMessage?: string) => {
    let message = defaultMessage || 'An unexpected error occurred';
    let details: string | undefined;

    // Extract error message from different error formats
    if (error?.response?.data?.error?.message) {
      message = error.response.data.error.message;
      details = error.response.data.error.details;
    } else if (error?.response?.data?.message) {
      message = error.response.data.message;
    } else if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    // Show appropriate toast based on error type
    if (error?.status >= 400 && error?.status < 500) {
      showWarning(message, { details });
    } else {
      showError(message, { details });
    }
  }, [showError, showWarning]);

  return { handleError };
};

// Utility function for creating retry actions
export const createRetryAction = (onRetry: () => void) => ({
  label: 'Retry',
  onClick: onRetry,
});

export default ToastProvider;