import React from 'react';
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge,
  useTheme
} from '@mui/material';
import {
  Assignment as WorkOrdersIcon,
  Build as AssetsIcon,
  Schedule as MaintenanceIcon,
  Dashboard as DashboardIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

// Simple offline status hook replacement
const useSimpleOffline = () => ({
  isOnline: navigator.onLine,
  pendingOperations: 0
});

// Mobile Bottom Navigation
interface MobileBottomNavProps {
  onMenuClick?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOnline, pendingOperations } = useSimpleOffline();

  const getValue = () => {
    if (location.pathname.includes('/work-orders')) return 0;
    if (location.pathname.includes('/assets')) return 1;
    if (location.pathname.includes('/maintenance')) return 2;
    if (location.pathname === '/') return 3;
    return -1;
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        borderTop: 1,
        borderColor: 'divider'
      }}
      elevation={3}
    >
      <BottomNavigation
        value={getValue()}
        onChange={(event, newValue) => {
          switch (newValue) {
            case 0:
              navigate('/work-orders');
              break;
            case 1:
              navigate('/assets');
              break;
            case 2:
              navigate('/maintenance');
              break;
            case 3:
              navigate('/');
              break;
            case 4:
              onMenuClick?.();
              break;
          }
        }}
        sx={{
          height: 64,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 0,
            px: 1
          }
        }}
      >
        <BottomNavigationAction
          label="Work Orders"
          icon={
            <Badge badgeContent={pendingOperations} color="error">
              <WorkOrdersIcon />
            </Badge>
          }
        />
        <BottomNavigationAction
          label="Assets"
          icon={<AssetsIcon />}
        />
        <BottomNavigationAction
          label="Maintenance"
          icon={<MaintenanceIcon />}
        />
        <BottomNavigationAction
          label="Dashboard"
          icon={<DashboardIcon />}
        />
        <BottomNavigationAction
          label="Menu"
          icon={
            <Badge variant="dot" color="warning" invisible={isOnline}>
              <MenuIcon />
            </Badge>
          }
        />
      </BottomNavigation>
    </Paper>
  );
};

// Mobile Safe Area wrapper
interface MobileSafeAreaProps {
  children: React.ReactNode;
}

export const MobileSafeArea: React.FC<MobileSafeAreaProps> = ({ children }) => {
  return (
    <Box
      sx={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 64px)', // 64px for bottom nav
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        minHeight: '100dvh', // Dynamic viewport height for better mobile support
      }}
    >
      {children}
    </Box>
  );
};

// Simple mobile menu placeholder
export const MobileMenu: React.FC = () => {
  return (
    <Box>
      {/* Simple menu placeholder - can be expanded later */}
    </Box>
  );
};

// Simple network status placeholder
export const NetworkStatus: React.FC = () => {
  return null; // Simple placeholder
};