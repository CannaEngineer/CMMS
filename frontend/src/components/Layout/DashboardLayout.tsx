import React, { useState, useEffect } from 'react';
import NotificationCenter from '../Notifications/NotificationCenter';
import { notificationService } from '../../services/notificationService';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Build as BuildIcon,
  Assignment as AssignmentIcon,
  Inventory as InventoryIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Sync as SyncIcon,
  SyncDisabled as SyncDisabledIcon,
  FileDownload as ExportIcon,
  QrCode as PortalIcon,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 280;

interface NavItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Work Orders', icon: <AssignmentIcon />, path: '/work-orders', badge: 3 },
  { text: 'Assets', icon: <BuildIcon />, path: '/assets' },
  { text: 'Maintenance', icon: <SettingsIcon />, path: '/maintenance' },
  { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
  { text: 'Locations', icon: <LocationIcon />, path: '/locations' },
  { text: 'Portals', icon: <PortalIcon />, path: '/portals' },
  { text: 'Export Center', icon: <ExportIcon />, path: '/exports' },
  { text: 'Users', icon: <PeopleIcon />, path: '/users' },
];

export default function DashboardLayout() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notificationPreferencesOpen, setNotificationPreferencesOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize notification service and WebSocket
  useEffect(() => {
    notificationService.initializeWebSocket();
    
    // Load initial notification stats
    const loadStats = async () => {
      try {
        const stats = await notificationService.getNotificationStats();
        setUnreadCount(stats.unread);
      } catch (error) {
        console.error('Failed to load notification stats:', error);
      }
    };

    loadStats();

    // Set up event listeners
    const handleNewNotification = () => {
      loadStats(); // Reload stats when new notification arrives
    };

    const handleStatsUpdated = (stats: any) => {
      setUnreadCount(stats.unread);
    };

    const handleConnectionStatus = (status: any) => {
      setIsConnected(status.connected);
    };

    notificationService.on('new_notification', handleNewNotification);
    notificationService.on('stats_updated', handleStatsUpdated);
    notificationService.on('connection_status', handleConnectionStatus);

    return () => {
      notificationService.off('new_notification', handleNewNotification);
      notificationService.off('stats_updated', handleStatsUpdated);
      notificationService.off('connection_status', handleConnectionStatus);
      notificationService.cleanup();
    };
  }, []);
  
  // Get user data from localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userInitials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleNotificationSettingsClick = () => {
    console.log('Notification settings clicked - TODO: Implement preferences dialog');
    setNotificationAnchor(null);
  };

  const handleNotificationClick = (notification: any) => {
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const drawer = (
    <div>
      <Toolbar sx={{ px: 2, py: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <BuildIcon sx={{ fontSize: 32, color: theme.palette.primary.main, mr: 2 }} />
          <Box>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
              Compass CMMS
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Maintenance Management
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 2, py: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                borderRadius: 2,
                minHeight: { xs: 48, sm: 44 },
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.light + '20',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.light + '30',
                  },
                },
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: { xs: 44, sm: 40 } }}>
                {item.badge ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontWeight: location.pathname === item.path ? 600 : 400,
                  fontSize: { xs: '0.95rem', sm: '1rem' }
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              minWidth: 44,
              minHeight: 44
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              noWrap 
              component="div"
              sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
            >
              {navItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
            {/* Connection Status Indicators - Hidden on small mobile */}
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
              <Chip
                icon={isOnline ? <SyncIcon /> : <SyncDisabledIcon />}
                label={isOnline ? 'Online' : 'Offline'}
                color={isOnline ? 'success' : 'default'}
                size="small"
                variant="outlined"
                sx={{ 
                  '& .MuiChip-label': {
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' }
                  }
                }}
              />
              {isConnected && (
                <Chip
                  label="Live"
                  color="success"
                  size="small"
                  sx={{ 
                    '& .MuiChip-label': {
                      fontSize: { xs: '0.75rem', sm: '0.8125rem' }
                    }
                  }}
                />
              )}
            </Box>

            {/* Notifications */}
            <IconButton
              size={isMobile ? "medium" : "large"}
              aria-label="show notifications"
              color="inherit"
              onClick={handleNotificationOpen}
              sx={{ 
                minWidth: 44,
                minHeight: 44
              }}
            >
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* Profile */}
            <IconButton
              size={isMobile ? "medium" : "large"}
              edge="end"
              aria-label="account of current user"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
              sx={{ 
                minWidth: 44,
                minHeight: 44
              }}
            >
              <Avatar sx={{ 
                width: { xs: 28, sm: 32 }, 
                height: { xs: 28, sm: 32 }, 
                bgcolor: theme.palette.primary.main,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}>
                {userInitials}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }}>
          Logout
        </MenuItem>
      </Menu>

      {/* Notification Center */}
      <NotificationCenter
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        onSettingsClick={handleNotificationSettingsClick}
      />

      {/* TODO: Add notification preferences dialog and toast notifications */}

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 7, sm: 8 },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}