import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Typography,
  IconButton,
  Avatar,
  Divider,
  Paper,
  Chip,
  Alert,
  useTheme,
  useMediaQuery,
  alpha,
  Slide,
} from '@mui/material';
import {
  Home as HomeIcon,
  Assignment as WorkOrderIcon,
  Build as AssetIcon,
  Schedule as ScheduleIcon,
  Person as ProfileIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Notifications as NotificationsIcon,
  WifiOff as OfflineIcon,
  Wifi as OnlineIcon,
  CloudQueue as SyncIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOffline } from '../../hooks/useOffline';
import { NetworkStatus } from './NetworkStatus';

// Mobile Bottom Navigation
interface MobileBottomNavProps {
  onMenuOpen?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onMenuOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isOffline, queueSize } = useOffline();

  const [value, setValue] = useState(() => {
    // Determine initial tab based on current route
    const path = location.pathname;
    if (path.includes('/work-orders')) return 1;
    if (path.includes('/assets')) return 2;
    if (path.includes('/maintenance')) return 3;
    return 0; // Dashboard
  });

  const navigationItems = [
    {
      label: 'Dashboard',
      icon: <HomeIcon />,
      path: '/dashboard',
      value: 0,
    },
    {
      label: 'Work Orders',
      icon: <WorkOrderIcon />,
      path: '/work-orders',
      value: 1,
      badge: queueSize > 0 ? queueSize : undefined,
    },
    {
      label: 'Assets',
      icon: <AssetIcon />,
      path: '/assets',
      value: 2,
    },
    {
      label: 'Schedule',
      icon: <ScheduleIcon />,
      path: '/maintenance',
      value: 3,
    },
    {
      label: 'More',
      icon: <MenuIcon />,
      value: 4,
      onClick: onMenuOpen,
    },
  ];

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    const item = navigationItems.find(item => item.value === newValue);
    
    if (item?.onClick) {
      item.onClick();
    } else if (item?.path) {
      navigate(item.path);
    }
  };

  // Update value when route changes
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/work-orders')) setValue(1);
    else if (path.includes('/assets')) setValue(2);
    else if (path.includes('/maintenance')) setValue(3);
    else if (path === '/dashboard' || path === '/') setValue(0);
  }, [location.pathname]);

  if (!isMobile) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
      }}
    >
      {/* Offline Banner */}
      <Slide direction="up" in={isOffline}>
        <Alert
          severity="warning"
          icon={<OfflineIcon />}
          sx={{
            borderRadius: 0,
            justifyContent: 'center',
            '& .MuiAlert-message': {
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            },
          }}
        >
          <Typography variant="body2">
            Working offline
          </Typography>
          {queueSize > 0 && (
            <Chip
              label={`${queueSize} pending`}
              size="small"
              color="warning"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
        </Alert>
      </Slide>

      <Paper
        elevation={8}
        sx={{
          borderRadius: 0,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <BottomNavigation
          value={value}
          onChange={handleChange}
          showLabels
          sx={{
            height: 64,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0,
              px: 0.5,
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.7rem',
                lineHeight: 1.2,
                '&.Mui-selected': {
                  fontSize: '0.7rem',
                },
              },
            },
          }}
        >
          {navigationItems.map((item) => (
            <BottomNavigationAction
              key={item.value}
              label={item.label}
              icon={
                item.badge ? (
                  <Badge badgeContent={item.badge} color="error" max={99}>
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )
              }
              sx={{
                color: value === item.value ? theme.palette.primary.main : theme.palette.text.secondary,
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                },
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

// Mobile Side Menu/Drawer
interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  user?: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ open, onClose, user }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isOffline, lastSyncTime, pendingUploads } = useOffline();

  const menuItems = [
    {
      label: 'Dashboard',
      icon: <HomeIcon />,
      path: '/dashboard',
    },
    {
      label: 'Work Orders',
      icon: <WorkOrderIcon />,
      path: '/work-orders',
    },
    {
      label: 'Assets',
      icon: <AssetIcon />,
      path: '/assets',
    },
    {
      label: 'Maintenance Schedule',
      icon: <ScheduleIcon />,
      path: '/maintenance',
    },
    { divider: true },
    {
      label: 'Profile',
      icon: <ProfileIcon />,
      path: '/profile',
    },
    {
      label: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
    },
    {
      label: 'Notifications',
      icon: <NotificationsIcon />,
      path: '/notifications',
    },
  ];

  const handleItemClick = (path?: string) => {
    if (path) {
      navigate(path);
    }
    onClose();
  };

  const handleLogout = () => {
    // Implement logout logic
    localStorage.removeItem('token');
    navigate('/login');
    onClose();
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 280,
          maxWidth: '80vw',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', height: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            p: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)} 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.common.white, 0.1),
            }}
          />
          
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <IconButton onClick={onClose} sx={{ color: 'white' }}>
                <CloseIcon />
              </IconButton>
            </Box>
            
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={user.avatar}
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: alpha(theme.palette.common.white, 0.2),
                    fontSize: '1.5rem',
                  }}
                >
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                    {user.name}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                    {user.role}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    {user.email}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* Network Status */}
        <Box sx={{ p: 2 }}>
          <Alert
            severity={isOffline ? "warning" : "success"}
            icon={isOffline ? <OfflineIcon /> : <OnlineIcon />}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {isOffline ? 'Working Offline' : 'Connected'}
              </Typography>
              {!isOffline && lastSyncTime && (
                <Typography variant="caption" color="text.secondary">
                  Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
                </Typography>
              )}
              {pendingUploads > 0 && (
                <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
                  {pendingUploads} items pending upload
                </Typography>
              )}
            </Box>
          </Alert>

          <NetworkStatus />
        </Box>

        {/* Menu Items */}
        <List sx={{ px: 1 }}>
          {menuItems.map((item, index) => {
            if ('divider' in item) {
              return <Divider key={index} sx={{ my: 1 }} />;
            }

            return (
              <ListItemButton
                key={item.path}
                onClick={() => handleItemClick(item.path)}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  mb: 0.5,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                  },
                  '&:active': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: theme.palette.text.secondary,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.95rem',
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>

        {/* Logout */}
        <Box sx={{ mt: 'auto', p: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              color: theme.palette.error.main,
              '&:hover': {
                bgcolor: alpha(theme.palette.error.main, 0.04),
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: theme.palette.error.main }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Sign Out"
              primaryTypographyProps={{
                fontSize: '0.95rem',
                fontWeight: 500,
              }}
            />
          </ListItemButton>
        </Box>
      </Box>
    </Drawer>
  );
};

// Mobile Navigation Container
interface MobileNavigationProps {
  user?: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ user }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMenuOpen = useCallback(() => {
    setMenuOpen(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuOpen(false);
  }, []);

  if (!isMobile) return null;

  return (
    <>
      <MobileBottomNav onMenuOpen={handleMenuOpen} />
      <MobileMenu open={menuOpen} onClose={handleMenuClose} user={user} />
    </>
  );
};

// Mobile Safe Area Component (for devices with notches/home indicators)
export const MobileSafeArea: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!isMobile) return <>{children}</>;

  return (
    <Box
      sx={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 64px)', // 64px for bottom nav
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        minHeight: '100vh',
        minHeight: '100dvh', // Dynamic viewport height for better mobile support
      }}
    >
      {children}
    </Box>
  );
};