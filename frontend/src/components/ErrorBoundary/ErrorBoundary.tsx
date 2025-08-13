import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  Alert,
  Collapse,
  IconButton
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  BugReport as BugReportIcon
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'component' | 'critical';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error for monitoring
    this.logError(error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      level: this.props.level || 'component'
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', errorDetails);
    }

    // In production, you might want to send this to a logging service
    // Example: sendErrorToLoggingService(errorDetails);
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        showDetails: false,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      // Max retries reached, reload the page
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  private getErrorTitle = (): string => {
    const { level } = this.props;
    switch (level) {
      case 'critical':
        return 'Critical System Error';
      case 'page':
        return 'Page Error';
      case 'component':
      default:
        return 'Something went wrong';
    }
  };

  private getErrorDescription = (): string => {
    const { level } = this.props;
    switch (level) {
      case 'critical':
        return 'A critical error has occurred that affects the entire application.';
      case 'page':
        return 'This page encountered an error and cannot be displayed properly.';
      case 'component':
      default:
        return 'A component on this page encountered an error.';
    }
  };

  private renderErrorContent = () => {
    const { hasError, error, errorInfo, showDetails, retryCount } = this.state;
    
    if (!hasError) {
      return this.props.children;
    }

    // Use custom fallback if provided
    if (this.props.fallback) {
      return this.props.fallback;
    }

    const canRetry = retryCount < this.maxRetries;
    const isComponentLevel = this.props.level === 'component';

    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card elevation={3}>
          <CardContent>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <BugReportIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom color="error">
                {this.getErrorTitle()}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {this.getErrorDescription()}
              </Typography>
            </Box>

            <Alert severity="error" sx={{ mb: 2 }}>
              {error?.message || 'An unexpected error occurred'}
            </Alert>

            <Box sx={{ textAlign: 'center', mb: 2 }}>
              {canRetry ? (
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                  sx={{ mr: 2 }}
                >
                  Try Again ({this.maxRetries - retryCount} attempts left)
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReload}
                  sx={{ mr: 2 }}
                >
                  Reload Page
                </Button>
              )}
              
              {!isComponentLevel && (
                <Button
                  variant="outlined"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Go to Dashboard
                </Button>
              )}
            </Box>

            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  onClick={this.toggleDetails}
                  startIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  size="small"
                >
                  {showDetails ? 'Hide' : 'Show'} Error Details
                </Button>
                
                <Collapse in={showDetails}>
                  <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Error Details (Development Only):
                    </Typography>
                    <Typography variant="body2" component="pre" sx={{ 
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace'
                    }}>
                      {error?.stack}
                    </Typography>
                    {errorInfo && (
                      <>
                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                          Component Stack:
                        </Typography>
                        <Typography variant="body2" component="pre" sx={{ 
                          whiteSpace: 'pre-wrap',
                          fontSize: '0.8rem',
                          fontFamily: 'monospace'
                        }}>
                          {errorInfo.componentStack}
                        </Typography>
                      </>
                    )}
                  </Alert>
                </Collapse>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    );
  };

  render() {
    return this.renderErrorContent();
  }
}

// Higher-order component for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Specialized error boundaries for different use cases
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="page">
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="component">
    {children}
  </ErrorBoundary>
);

export const CriticalErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="critical">
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;