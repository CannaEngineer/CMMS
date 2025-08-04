import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Breadcrumbs,
  Link,
  IconButton,
  useTheme,
  useMediaQuery,
  Fade,
  Grow,
  Skeleton,
  Alert,
  AlertTitle,
  Button,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
  error?: string;
  showBack?: boolean;
  onBack?: () => void;
  onRefresh?: () => void;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disableGutters?: boolean;
}

export default function PageLayout({
  title,
  subtitle,
  breadcrumbs,
  actions,
  children,
  loading = false,
  error,
  showBack = false,
  onBack,
  onRefresh,
  maxWidth = 'lg',
  disableGutters = false,
}: PageLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [retryCount, setRetryCount] = useState(0);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  const handleRefresh = () => {
    setRetryCount(prev => prev + 1);
    onRefresh?.();
  };

  if (loading) {
    return <LoadingPage title={title} />;
  }

  if (error) {
    return (
      <ErrorPage 
        title={title}
        error={error}
        onRetry={onRefresh ? handleRefresh : undefined}
        retryCount={retryCount}
      />
    );
  }

  return (
    <Container 
      maxWidth={maxWidth} 
      disableGutters={disableGutters}
      sx={{ 
        py: { xs: 2, md: 3 },
        px: disableGutters ? 0 : { xs: 2, md: 3 },
        minHeight: '100vh',
      }}
    >
      <Fade in timeout={300}>
        <Box>
          <PageHeader
            title={title}
            subtitle={subtitle}
            breadcrumbs={breadcrumbs}
            actions={actions}
            showBack={showBack}
            onBack={handleBack}
            onRefresh={onRefresh ? handleRefresh : undefined}
            isMobile={isMobile}
          />
          
          <Grow in timeout={500}>
            <Box sx={{ mt: { xs: 2, md: 3 } }}>
              {children}
            </Box>
          </Grow>
        </Box>
      </Fade>
    </Container>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  onRefresh?: () => void;
  isMobile: boolean;
}

function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  showBack,
  onBack,
  onRefresh,
  isMobile,
}: PageHeaderProps) {
  const theme = useTheme();

  return (
    <Box>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ 
            mb: 2,
            '& .MuiBreadcrumbs-separator': {
              mx: 1,
            },
          }}
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            if (isLast || !crumb.path) {
              return (
                <Box 
                  key={index}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    color: isLast ? 'text.primary' : 'text.secondary',
                  }}
                >
                  {crumb.icon}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: isLast ? 600 : 400,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    }}
                  >
                    {crumb.label}
                  </Typography>
                </Box>
              );
            }
            
            return (
              <Link 
                key={index}
                href={crumb.path}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  textDecoration: 'none',
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    textDecoration: 'underline',
                  },
                  minHeight: 48, // Touch target
                  py: 1,
                }}
              >
                {crumb.icon}
                <Typography 
                  variant="body2"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  {crumb.label}
                </Typography>
              </Link>
            );
          })}
        </Breadcrumbs>
      )}

      {/* Header with title and actions */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: isMobile ? 'flex-start' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: { xs: 2, md: 3 },
        mb: { xs: 2, md: 3 },
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          flex: 1,
          width: isMobile ? '100%' : 'auto',
        }}>
          {showBack && (
            <IconButton
              onClick={onBack}
              sx={{
                p: 1.5,
                bgcolor: theme.palette.action.hover,
                '&:hover': {
                  bgcolor: theme.palette.action.selected,
                  transform: 'scale(1.05)',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
                transition: 'all 0.2s ease',
                minWidth: 48,
                minHeight: 48,
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}

          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                lineHeight: 1.2,
                mb: subtitle ? 0.5 : 0,
              }}
            >
              {title}
            </Typography>
            
            {subtitle && (
              <Typography 
                variant="body1"
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  lineHeight: 1.5,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Actions */}
        {(actions || onRefresh) && (
          <Box sx={{ 
            display: 'flex', 
            gap: 1.5,
            alignItems: 'center',
            width: isMobile ? '100%' : 'auto',
            justifyContent: isMobile ? 'space-between' : 'flex-end',
          }}>
            {onRefresh && (
              <IconButton
                onClick={onRefresh}
                sx={{
                  p: 1.5,
                  bgcolor: theme.palette.action.hover,
                  '&:hover': {
                    bgcolor: theme.palette.action.selected,
                    transform: 'rotate(180deg)',
                  },
                  transition: 'all 0.3s ease',
                  minWidth: 48,
                  minHeight: 48,
                }}
              >
                <RefreshIcon />
              </IconButton>
            )}
            
            {actions && (
              <Box sx={{ 
                display: 'flex', 
                gap: 1.5,
                flex: isMobile ? 1 : 'none',
                justifyContent: isMobile ? 'flex-end' : 'initial',
              }}>
                {actions}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

interface LoadingPageProps {
  title: string;
}

function LoadingPage({ title }: LoadingPageProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: { xs: 2, md: 3 } }}>
        <Skeleton 
          variant="text" 
          width="40%" 
          height={isMobile ? 40 : 56}
          sx={{ mb: 1 }}
        />
        <Skeleton 
          variant="text" 
          width="60%" 
          height={isMobile ? 20 : 24}
        />
      </Box>
      
      <Box sx={{ 
        display: 'grid', 
        gap: 3,
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
      }}>
        {[...Array(6)].map((_, index) => (
          <Skeleton
            key={index}
            variant="rectangular"
            height={isMobile ? 120 : 140}
            sx={{ 
              borderRadius: 2,
              animation: `pulse 1.5s ease-in-out ${index * 0.1}s infinite alternate`,
            }}
          />
        ))}
      </Box>
    </Container>
  );
}

interface ErrorPageProps {
  title: string;
  error: string;
  onRetry?: () => void;
  retryCount: number;
}

function ErrorPage({ title, error, onRetry, retryCount }: ErrorPageProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
      <Fade in>
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
              mb: 3,
            }}
          >
            {title}
          </Typography>
          
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              '& .MuiAlert-message': {
                width: '100%',
              },
            }}
          >
            <AlertTitle sx={{ fontWeight: 600 }}>
              Something went wrong
            </AlertTitle>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {error}
            </Typography>
            
            {onRetry && (
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center',
              }}>
                <Button
                  variant="contained"
                  onClick={onRetry}
                  startIcon={<RefreshIcon />}
                  sx={{ 
                    minHeight: 48,
                    minWidth: isMobile ? '100%' : 120,
                  }}
                >
                  {retryCount > 0 ? `Retry (${retryCount})` : 'Retry'}
                </Button>
                
                <Typography variant="caption" color="text.secondary">
                  If the problem persists, please contact support
                </Typography>
              </Box>
            )}
          </Alert>
        </Box>
      </Fade>
    </Container>
  );
}