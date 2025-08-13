import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  LinearProgress,
  Fade,
  Grow,
  Zoom,
  useTheme,
  alpha,
  styled,
  keyframes,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Wifi as ConnectedIcon,
  WifiOff as DisconnectedIcon,
  Build as TechnicianIcon,
  Assessment as ManagerIcon,
  AdminPanelSettings as AdminIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
} from '@mui/icons-material';

// Enhanced animations for empty states
const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
`;

const slideInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

// Enhanced empty state container
const EmptyStateContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(6, 3),
  textAlign: 'center',
  minHeight: 400,
  background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.main, 0.02)})`,
  borderRadius: 20,
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  position: 'relative',
  overflow: 'hidden',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    opacity: 0.6,
  },
  
  '@media (prefers-reduced-motion: reduce)': {
    '& .floating-icon': {
      animation: 'none',
    },
  },
}));

const IconContainer = styled(Box)(({ theme }) => ({
  width: 120,
  height: 120,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(3),
  background: `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  position: 'relative',
  overflow: 'hidden',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.common.white, 0.2)}, transparent)`,
    animation: `${shimmer} 3s infinite`,
  },
  
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
  },
  
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: theme.spacing(1.5, 3),
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
  },
  
  '&:active': {
    transform: 'translateY(0)',
  },
}));

const LoadingState = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(4),
}));

// Empty state types and configurations
type EmptyStateType = 
  | 'noNotifications' 
  | 'filteredNoResults' 
  | 'connectionError' 
  | 'loadingNotifications'
  | 'allRead'
  | 'roleSpecific';

interface EmptyStateConfig {
  icon: React.ReactElement;
  title: string;
  subtitle: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'contained' | 'outlined' | 'text';
    icon?: React.ReactElement;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactElement;
  };
  showProgress?: boolean;
  animationType?: 'float' | 'pulse' | 'none';
}

interface EnhancedEmptyStatesProps {
  type: EmptyStateType;
  userRole?: 'ADMIN' | 'MANAGER' | 'TECHNICIAN';
  isConnected?: boolean;
  onRefresh?: () => void;
  onClearFilters?: () => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
  customConfig?: Partial<EmptyStateConfig>;
  showOnboarding?: boolean;
}

const getRoleIcon = (role?: string) => {
  switch (role) {
    case 'TECHNICIAN': return <TechnicianIcon sx={{ fontSize: 60, color: 'primary.main' }} />;
    case 'MANAGER': return <ManagerIcon sx={{ fontSize: 60, color: 'primary.main' }} />;
    case 'ADMIN': return <AdminIcon sx={{ fontSize: 60, color: 'primary.main' }} />;
    default: return <NotificationsIcon sx={{ fontSize: 60, color: 'primary.main' }} />;
  }
};

const getEmptyStateConfig = (
  type: EmptyStateType,
  userRole?: string,
  isConnected: boolean = true,
  handlers: {
    onRefresh?: () => void;
    onClearFilters?: () => void;
    onOpenSettings?: () => void;
    onOpenHelp?: () => void;
  } = {}
): EmptyStateConfig => {
  const configs: Record<EmptyStateType, EmptyStateConfig> = {
    noNotifications: {
      icon: <NotificationsIcon sx={{ fontSize: 60, color: 'primary.main', animation: `${float} 3s ease-in-out infinite` }} className="floating-icon" />,
      title: 'All caught up!',
      subtitle: 'No new notifications right now. Great job staying on top of everything!',
      action: handlers.onRefresh ? {
        label: 'Check Again',
        onClick: handlers.onRefresh,
        variant: 'outlined',
        icon: <RefreshIcon />,
      } : undefined,
      animationType: 'float',
    },
    
    filteredNoResults: {
      icon: <SearchIcon sx={{ fontSize: 60, color: 'warning.main', animation: `${pulse} 2s ease-in-out infinite` }} className="floating-icon" />,
      title: 'No matching notifications',
      subtitle: 'Try adjusting your filters or search terms to find what you\'re looking for.',
      action: handlers.onClearFilters ? {
        label: 'Clear Filters',
        onClick: handlers.onClearFilters,
        variant: 'contained',
        icon: <FilterIcon />,
      } : undefined,
      secondaryAction: handlers.onRefresh ? {
        label: 'Refresh',
        onClick: handlers.onRefresh,
        icon: <RefreshIcon />,
      } : undefined,
      animationType: 'pulse',
    },
    
    connectionError: {
      icon: <DisconnectedIcon sx={{ fontSize: 60, color: 'error.main', animation: `${pulse} 1.5s ease-in-out infinite` }} className="floating-icon" />,
      title: isConnected ? 'Connection restored!' : 'Connection lost',
      subtitle: isConnected 
        ? 'Loading latest notifications...'
        : 'Check your internet connection and try again.',
      action: handlers.onRefresh ? {
        label: isConnected ? 'Loading...' : 'Try Again',
        onClick: handlers.onRefresh,
        variant: 'contained',
        icon: <RefreshIcon />,
      } : undefined,
      showProgress: isConnected,
      animationType: 'pulse',
    },
    
    loadingNotifications: {
      icon: <CircularProgress size={60} thickness={3} sx={{ color: 'primary.main' }} />,
      title: 'Loading notifications...',
      subtitle: 'Getting your latest updates',
      showProgress: true,
      animationType: 'none',
    },
    
    allRead: {
      icon: <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', animation: `${pulse} 2s ease-in-out infinite` }} className="floating-icon" />,
      title: 'Everything\'s up to date!',
      subtitle: 'You\'ve read all your notifications. Nice work keeping organized!',
      action: handlers.onRefresh ? {
        label: 'Check for New',
        onClick: handlers.onRefresh,
        variant: 'outlined',
        icon: <RefreshIcon />,
      } : undefined,
      animationType: 'pulse',
    },
    
    roleSpecific: {
      icon: getRoleIcon(userRole),
      title: getRoleSpecificTitle(userRole),
      subtitle: getRoleSpecificSubtitle(userRole),
      action: handlers.onOpenHelp ? {
        label: 'Learn More',
        onClick: handlers.onOpenHelp,
        variant: 'outlined',
        icon: <HelpIcon />,
      } : undefined,
      secondaryAction: handlers.onOpenSettings ? {
        label: 'Customize',
        onClick: handlers.onOpenSettings,
        icon: <SettingsIcon />,
      } : undefined,
      animationType: 'float',
    },
  };
  
  return configs[type];
};

const getRoleSpecificTitle = (role?: string) => {
  switch (role) {
    case 'TECHNICIAN': return 'Ready for work!';
    case 'MANAGER': return 'Operations running smoothly';
    case 'ADMIN': return 'System status normal';
    default: return 'All systems ready';
  }
};

const getRoleSpecificSubtitle = (role?: string) => {
  switch (role) {
    case 'TECHNICIAN': return 'New work orders and maintenance tasks will appear here when assigned to you.';
    case 'MANAGER': return 'Team updates, escalations, and summary reports will be shown here.';
    case 'ADMIN': return 'System alerts, user notifications, and administrative updates will appear here.';
    default: return 'Notifications will appear here when they\'re available.';
  }
};

export const EnhancedEmptyStates: React.FC<EnhancedEmptyStatesProps> = ({
  type,
  userRole = 'TECHNICIAN',
  isConnected = true,
  onRefresh,
  onClearFilters,
  onOpenSettings,
  onOpenHelp,
  customConfig,
  showOnboarding = false,
}) => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const handlers = {
    onRefresh,
    onClearFilters,
    onOpenSettings,
    onOpenHelp,
  };
  
  const config = {
    ...getEmptyStateConfig(type, userRole, isConnected, handlers),
    ...customConfig,
  };

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Progress animation for loading states
  useEffect(() => {
    if (config.showProgress && type === 'connectionError' && isConnected) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [config.showProgress, type, isConnected]);

  const getAnimationProps = () => {
    switch (config.animationType) {
      case 'float':
        return {
          in: isVisible,
          timeout: 600,
          style: { transitionDelay: '200ms' },
        };
      case 'pulse':
        return {
          in: isVisible,
          timeout: 400,
          style: { transitionDelay: '100ms' },
        };
      default:
        return {
          in: isVisible,
          timeout: 300,
        };
    }
  };

  return (
    <Fade {...getAnimationProps()}>
      <EmptyStateContainer>
        <Grow in={isVisible} timeout={500}>
          <IconContainer>
            {config.icon}
          </IconContainer>
        </Grow>
        
        <Fade in={isVisible} timeout={600} style={{ transitionDelay: '300ms' }}>
          <Box>
            <Typography
              variant="h5"
              fontWeight={700}
              color="text.primary"
              sx={{
                mb: 1,
                animation: `${slideInUp} 0.5s ease-out`,
                animationDelay: '400ms',
                animationFillMode: 'both',
              }}
            >
              {config.title}
            </Typography>
            
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                mb: 4,
                maxWidth: 400,
                lineHeight: 1.6,
                animation: `${slideInUp} 0.5s ease-out`,
                animationDelay: '500ms',
                animationFillMode: 'both',
              }}
            >
              {config.subtitle}
            </Typography>
          </Box>
        </Fade>
        
        {/* Progress indicator for loading states */}
        {config.showProgress && (
          <Fade in={isVisible} timeout={400} style={{ transitionDelay: '600ms' }}>
            <Box sx={{ width: '100%', maxWidth: 300, mb: 3 }}>
              <LinearProgress
                variant={type === 'loadingNotifications' ? 'indeterminate' : 'determinate'}
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  },
                }}
              />
              {type === 'connectionError' && isConnected && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Reconnecting... {progress}%
                </Typography>
              )}
            </Box>
          </Fade>
        )}
        
        {/* Action buttons */}
        <Fade in={isVisible} timeout={500} style={{ transitionDelay: '700ms' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            {config.action && (
              <ActionButton
                variant={config.action.variant || 'contained'}
                onClick={config.action.onClick}
                startIcon={config.action.icon}
                disabled={type === 'connectionError' && isConnected && progress < 100}
              >
                {config.action.label}
              </ActionButton>
            )}
            
            {config.secondaryAction && (
              <ActionButton
                variant="text"
                onClick={config.secondaryAction.onClick}
                startIcon={config.secondaryAction.icon}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                {config.secondaryAction.label}
              </ActionButton>
            )}
          </Box>
        </Fade>
        
        {/* Onboarding hint for new users */}
        {showOnboarding && (
          <Fade in={isVisible} timeout={600} style={{ transitionDelay: '900ms' }}>
            <Paper
              elevation={2}
              sx={{
                position: 'absolute',
                bottom: -20,
                right: 20,
                padding: 2,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                color: theme.palette.info.contrastText,
                maxWidth: 280,
              }}
            >
              <Typography variant="caption" fontWeight={600}>
                💡 Tip: Customize your notification preferences in settings to get alerts that matter to you!
              </Typography>
            </Paper>
          </Fade>
        )}
      </EmptyStateContainer>
    </Fade>
  );
};

// Specialized empty state components for different scenarios
export const NoNotificationsState: React.FC<Omit<EnhancedEmptyStatesProps, 'type'>> = (props) => (
  <EnhancedEmptyStates type="noNotifications" {...props} />
);

export const FilteredEmptyState: React.FC<Omit<EnhancedEmptyStatesProps, 'type'>> = (props) => (
  <EnhancedEmptyStates type="filteredNoResults" {...props} />
);

export const ConnectionErrorState: React.FC<Omit<EnhancedEmptyStatesProps, 'type'>> = (props) => (
  <EnhancedEmptyStates type="connectionError" {...props} />
);

export const LoadingState: React.FC<Omit<EnhancedEmptyStatesProps, 'type'>> = (props) => (
  <EnhancedEmptyStates type="loadingNotifications" {...props} />
);

export const AllReadState: React.FC<Omit<EnhancedEmptyStatesProps, 'type'>> = (props) => (
  <EnhancedEmptyStates type="allRead" {...props} />
);

export const RoleSpecificEmptyState: React.FC<Omit<EnhancedEmptyStatesProps, 'type'>> = (props) => (
  <EnhancedEmptyStates type="roleSpecific" {...props} />
);

export default EnhancedEmptyStates;