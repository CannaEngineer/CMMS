import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Fab,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Assignment as WorkOrderIcon,
  Schedule as ScheduleIcon,
  Build as AssetIcon,
  Inventory as InventoryIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  QrCodeScanner as QrIcon,
  AccessTime as TimeIcon,
  Comment as CommentIcon,
  AccountCircle as AccountCircleIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

interface TechnicianLayoutProps {
  children?: React.ReactNode;
}

// Simplified navigation items for technicians
const techNavItems = [
  { text: 'My Work', icon: <WorkOrderIcon />, path: '/tech/dashboard', value: 'dashboard' },
  { text: 'Time Tracking', icon: <TimeIcon />, path: '/tech/time', value: 'time' },
  { text: 'Assets', icon: <AssetIcon />, path: '/tech/assets', value: 'assets' },
  { text: 'Inventory', icon: <InventoryIcon />, path: '/tech/inventory', value: 'inventory' },
];

export default function TechnicianLayout({ children }: TechnicianLayoutProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Get user data from localStorage
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userInitials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'T';

  // Get current page based on route
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.includes('/tech/time')) return 'time';
    if (path.includes('/tech/assets')) return 'assets';
    if (path.includes('/tech/inventory')) return 'inventory';
    return 'dashboard';
  };

  const currentValue = getCurrentPage();

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (event: React.SyntheticEvent, newValue: string) => {
    const navItem = techNavItems.find(item => item.value === newValue);
    if (navItem) {
      navigate(navItem.path);
    }
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top App Bar */}
      <AppBar
        position="fixed"
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {/* Menu button for drawer (only on larger screens) */}
          {!isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerToggle}
              edge="start"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <AssetIcon sx={{ mr: 1 }} />
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
              {isMobile ? 'Elevated' : 'Elevated Compliance'}
            </Typography>
          </Box>

          {/* Right side actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Notifications */}
            <IconButton color="inherit">
              <Badge badgeContent={2} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* Profile Menu */}
            <IconButton
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: 'primary.dark',
                fontSize: '0.875rem',
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
        <MenuItem onClick={() => { handleMenuClose(); navigate('/tech/profile'); }}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          My Profile
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

      {/* Side Drawer for Desktop */}
      {!isMobile && (
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          sx={{
            width: 240,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 240,
              boxSizing: 'border-box',
            },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              {techNavItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    selected={location.pathname === item.path}
                    onClick={() => {
                      navigate(item.path);
                      setDrawerOpen(false);
                    }}
                  >
                    <ListItemIcon>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          mt: { xs: 7, sm: 8 },
          mb: isMobile ? 8 : 0, // Space for bottom navigation on mobile
          overflow: 'auto',
        }}
      >
        {children || <Outlet />}
      </Box>

      {/* Bottom Navigation for Mobile */}
      {isMobile && (
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            zIndex: theme.zIndex.appBar,
          }} 
          elevation={3}
        >
          <BottomNavigation
            value={currentValue}
            onChange={handleNavigation}
            sx={{ height: 64 }}
          >
            {techNavItems.map((item) => (
              <BottomNavigationAction
                key={item.value}
                label={item.text}
                value={item.value}
                icon={item.icon}
                sx={{
                  minWidth: { xs: 60, sm: 80 },
                  '& .MuiBottomNavigationAction-label': {
                    fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                  },
                }}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}

      {/* Floating Action Button for QR Scanner */}
      <Fab
        color="secondary"
        aria-label="scan qr code"
        sx={{
          position: 'fixed',
          bottom: isMobile ? 80 : 16,
          right: 16,
          zIndex: theme.zIndex.speedDial,
        }}
        onClick={() => {
          // TODO: Implement QR scanner functionality
          console.log('QR Scanner clicked');
        }}
      >
        <QrIcon />
      </Fab>
    </Box>
  );
}