import React, { useState, useEffect } from 'react';
import {
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Backdrop,
  useTheme,
  useMediaQuery,
  Zoom,
  Tooltip,
  Box,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Assignment as WorkOrderIcon,
  Schedule as ScheduleIcon,
  QrCodeScanner as QrIcon,
  TouchApp as TouchIcon,
  Build as AssetIcon,
  Engineering as MaintenanceIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  action: () => void;
}

interface QuickActionsFabProps {
  actions: QuickAction[];
  selectedDate?: Dayjs | null;
  onActionComplete?: () => void;
}

const QuickActionsFab: React.FC<QuickActionsFabProps> = ({
  actions,
  selectedDate,
  onActionComplete,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  // Show FAB with delay for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1200);
    
    return () => clearTimeout(timer);
  }, []);

  const handleOpen = () => {
    setOpen(true);
    // Haptic feedback for mobile
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAction = (action: QuickAction) => {
    action.action();
    setOpen(false);
    
    // Haptic feedback
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate([50, 50, 100]);
    }
    
    onActionComplete?.();
  };

  // Enhanced actions with calendar context
  const contextualActions = [
    ...actions,
    ...(selectedDate ? [
      {
        label: `Schedule for ${selectedDate.format('MMM D')}`,
        icon: <ScheduleIcon />,
        color: 'info' as const,
        action: () => {
          console.log('Schedule for date:', selectedDate.format('YYYY-MM-DD'));
        },
      },
    ] : []),
    {
      label: 'Quick Asset Check',
      icon: <AssetIcon />,
      color: 'secondary' as const,
      action: () => {
        console.log('Quick asset check');
      },
    },
    {
      label: 'Emergency Maintenance',
      icon: <MaintenanceIcon />,
      color: 'error' as const,
      action: () => {
        console.log('Emergency maintenance');
      },
    },
  ];

  if (isMobile) {
    // Mobile: Use SpeedDial for better touch experience
    return (
      <>
        <Zoom in={visible} timeout={400}>
          <SpeedDial
            ariaLabel="Quick Actions"
            icon={<SpeedDialIcon icon={<AddIcon />} openIcon={<CloseIcon />} />}
            onClose={handleClose}
            onOpen={handleOpen}
            open={open}
            direction="up"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: theme.zIndex.speedDial,
              '& .MuiFab-primary': {
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                boxShadow: `0 8px 32px ${theme.palette.primary.main}40`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                  transform: 'scale(1.1)',
                },
              },
            }}
          >
            {contextualActions.map((action, index) => (
              <SpeedDialAction
                key={action.label}
                icon={action.icon}
                tooltipTitle={action.label}
                onClick={() => handleAction(action)}
                sx={{
                  bgcolor: theme.palette[action.color].main,
                  color: 'white',
                  '&:hover': {
                    bgcolor: theme.palette[action.color].dark,
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  // Staggered entrance animation
                  animation: open ? `fab-entrance 0.3s ease-out ${index * 50}ms both` : 'none',
                  '@keyframes fab-entrance': {
                    '0%': {
                      opacity: 0,
                      transform: 'scale(0) rotate(-90deg)',
                    },
                    '100%': {
                      opacity: 1,
                      transform: 'scale(1) rotate(0deg)',
                    },
                  },
                }}
                FabProps={{
                  size: 'medium',
                }}
              />
            ))}
          </SpeedDial>
        </Zoom>

        {/* Custom backdrop for better mobile experience */}
        <Backdrop
          open={open}
          sx={{
            zIndex: theme.zIndex.speedDial - 1,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={handleClose}
        />
      </>
    );
  }

  // Desktop: Multiple FABs with hover effects
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: theme.zIndex.fab,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {/* Secondary actions - show on hover */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        {contextualActions.slice(1).map((action, index) => (
          <Zoom 
            key={action.label} 
            in={open} 
            timeout={200 + (index * 100)}
            style={{ transitionDelay: open ? `${index * 50}ms` : '0ms' }}
          >
            <Tooltip title={action.label} placement="left" arrow>
              <Fab
                color={action.color}
                size="medium"
                onClick={() => handleAction(action)}
                sx={{
                  boxShadow: `0 4px 20px ${theme.palette[action.color].main}40`,
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: `0 8px 30px ${theme.palette[action.color].main}50`,
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {action.icon}
              </Fab>
            </Tooltip>
          </Zoom>
        ))}
      </Box>

      {/* Main FAB */}
      <Zoom in={visible} timeout={600}>
        <Fab
          color="primary"
          size="large"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onClick={() => handleAction(contextualActions[0])}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            boxShadow: `0 8px 32px ${theme.palette.primary.main}40`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
              transform: 'scale(1.15) rotate(45deg)',
              boxShadow: `0 12px 40px ${theme.palette.primary.main}50`,
            },
            '&:active': {
              transform: 'scale(1.05) rotate(45deg)',
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            // Subtle pulse animation when closed
            ...(!open && {
              animation: 'fab-pulse 3s ease-in-out infinite',
              '@keyframes fab-pulse': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.05)' },
                '100%': { transform: 'scale(1)' },
              },
            }),
          }}
        >
          {open ? <CloseIcon /> : <AddIcon />}
        </Fab>
      </Zoom>
    </Box>
  );
};

export default QuickActionsFab;