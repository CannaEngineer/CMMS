import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  useTheme,
  useMediaQuery,
  Avatar,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Fade,
  Grow,
  Skeleton,
  Container,
  Fab,
  Slide,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Assignment as WorkOrderIcon,
  Build as AssetIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Engineering as MaintenanceIcon,
  Inventory as InventoryIcon,
  Add as AddIcon,
  ChevronRight as ChevronRightIcon,
  Notifications as NotificationIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { statusColors } from '../theme/theme';
import PageLayout from '../components/Layout/PageLayout';
import StatCard from '../components/Common/StatCard';
import StatusIndicator from '../components/Common/StatusIndicator';
import { useNetworkStatus } from '../hooks/useData';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService, workOrdersService, assetsService, pmService } from '../services/api';
import WorkOrderForm from '../components/Forms/WorkOrderForm';
import AssetForm from '../components/Forms/AssetForm';
import MaintenanceScheduleForm from '../components/Forms/MaintenanceScheduleForm';
import { PMCalendar } from '../components/PMCalendar';
import dayjs from 'dayjs';

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  onClick: () => void;
}

export default function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedTab, setSelectedTab] = useState(0);
  const [showFab, setShowFab] = useState(false);
  
  // Form dialog states
  const [workOrderFormOpen, setWorkOrderFormOpen] = useState(false);
  const [assetFormOpen, setAssetFormOpen] = useState(false);
  const [maintenanceFormOpen, setMaintenanceFormOpen] = useState(false);
  
  // Detail modals state
  const [workOrdersModalOpen, setWorkOrdersModalOpen] = useState(false);
  const [assetsModalOpen, setAssetsModalOpen] = useState(false);
  const [maintenanceCalendarOpen, setMaintenanceCalendarOpen] = useState(false);
  
  // Network status for offline indicators
  const { isOnline, pendingChanges } = useNetworkStatus();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  // Staggered animation effect
  useEffect(() => {
    const timer = setTimeout(() => setShowFab(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch real dashboard data using React Query
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardService.getStats,
    retry: false, // Disable retries for debugging
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: workOrderTrends, isLoading: trendsLoading, refetch: refetchTrends } = useQuery({
    queryKey: ['dashboard', 'trends'],
    queryFn: () => dashboardService.getTrends(7),
    retry: false, // Disable retries for debugging
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: recentWorkOrders, isLoading: recentWOLoading, refetch: refetchRecentWO } = useQuery({
    queryKey: ['dashboard', 'recent-work-orders'],
    queryFn: () => dashboardService.getRecentWorkOrders(5),
    retry: false, // Disable retries for debugging
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: maintenanceScheduleData, isLoading: scheduleLoading, refetch: refetchSchedule } = useQuery({
    queryKey: ['dashboard', 'maintenance-stats'],
    queryFn: dashboardService.getMaintenanceStats,
    retry: false, // Disable retries for debugging
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Fetch PM schedules for calendar
  const { data: pmSchedules, isLoading: pmSchedulesLoading } = useQuery({
    queryKey: ['pmSchedules'],
    queryFn: pmService.getSchedules,
    enabled: maintenanceCalendarOpen, // Only fetch when calendar is opened
  });

  // Mutations for quick actions
  const createWorkOrderMutation = useMutation({
    mutationFn: workOrdersService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      setWorkOrderFormOpen(false);
    },
    onError: (error) => {
      console.error('Error creating work order:', error);
    },
  });

  const createAssetMutation = useMutation({
    mutationFn: assetsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setAssetFormOpen(false);
    },
    onError: (error) => {
      console.error('Error creating asset:', error);
    },
  });

  const createMaintenanceMutation = useMutation({
    mutationFn: pmService.createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pmSchedules'] });
      setMaintenanceFormOpen(false);
    },
    onError: (error) => {
      console.error('Error creating maintenance schedule:', error);
    },
  });

  // Refresh all dashboard data - memoized to prevent re-renders
  const refresh = useCallback(async () => {
    await Promise.all([
      refetchStats(),
      refetchTrends(),
      refetchRecentWO(),
      refetchSchedule()
    ]);
  }, [refetchStats, refetchTrends, refetchRecentWO, refetchSchedule]);

  // Transform maintenance schedule data to match expected format
  const maintenanceSchedule = useMemo(() => {
    return maintenanceScheduleData || { today: 0, thisWeek: 0 };
  }, [maintenanceScheduleData]);

  // Memoized PM schedules transformation to prevent infinite re-renders
  const transformedPMSchedules = useMemo(() => {
    if (!pmSchedules) return [];
    
    return pmSchedules.map((schedule: any) => ({
      id: schedule.id,
      title: schedule.title,
      assetName: schedule.asset?.name || 'Unknown Asset',
      assetId: schedule.assetId || 0,
      scheduledDate: dayjs(schedule.nextDue).toDate(),
      estimatedDuration: schedule.estimatedDuration || 60,
      priority: schedule.priority || 'MEDIUM',
      criticality: schedule.criticality || 'MEDIUM',
      taskType: schedule.taskType || 'INSPECTION',
      assignedTechnician: schedule.assignedTechnician,
      location: schedule.asset?.location?.name || 'Unknown Location',
      isOverdue: dayjs(schedule.nextDue).isBefore(dayjs(), 'day'),
      description: schedule.description,
      status: 'SCHEDULED',
    }));
  }, [pmSchedules]);

  // Combined loading and error states
  const isLoading = statsLoading || scheduleLoading;
  const error = statsError;

  // Memoized empty initial data to prevent re-renders
  const emptyInitialData = useMemo(() => ({}), []);

  // Quick action handlers - memoized to prevent re-renders
  const handleNewWorkOrder = useCallback(() => {
    setWorkOrderFormOpen(true);
  }, []);

  const handleNewAsset = useCallback(() => {
    setAssetFormOpen(true);
  }, []);

  const handleScheduleMaintenance = useCallback(() => {
    setMaintenanceFormOpen(true);
  }, []);

  // Stat card click handlers - memoized to prevent re-renders
  const handleTotalWorkOrdersClick = useCallback(() => {
    navigate('/work-orders');
  }, [navigate]);

  const handleActiveTasksClick = useCallback(() => {
    navigate('/work-orders?status=OPEN,IN_PROGRESS');
  }, [navigate]);

  const handleAssetsOnlineClick = useCallback(() => {
    navigate('/assets?status=ONLINE');
  }, [navigate]);

  const handleDueTodayClick = useCallback(() => {
    setMaintenanceCalendarOpen(true);
  }, []);

  // Quick actions for immediate task execution - no memoization needed for simple arrays
  const quickActions = [
    {
      label: 'New Work Order',
      icon: <AddIcon />,
      color: 'primary' as const,
      onClick: handleNewWorkOrder,
    },
    {
      label: 'Add Asset',
      icon: <AssetIcon />,
      color: 'secondary' as const,
      onClick: handleNewAsset,
    },
    {
      label: 'Schedule Maintenance',
      icon: <ScheduleIcon />,
      color: 'success' as const,
      onClick: handleScheduleMaintenance,
    },
  ];

  // Navigate to specific filtered views - memoized to prevent re-renders
  const handleOverdueTasksClick = useCallback(() => {
    // Navigate to work orders page with overdue filter
    navigate('/work-orders?filter=overdue');
  }, [navigate]);

  const handleOfflineAssetsClick = useCallback(() => {
    // Navigate to assets page with offline filter
    navigate('/assets?status=OFFLINE');  
  }, [navigate]);

  const handleOutOfStockClick = useCallback(() => {
    // Navigate to inventory/parts page with out of stock filter
    navigate('/inventory?status=out-of-stock');
  }, [navigate]);

  // Calculate urgent items with click handlers - no memoization needed
  const urgentItems = [
    { 
      count: stats?.workOrders?.overdue || 0, 
      label: 'Overdue Tasks', 
      color: 'error' as const,
      icon: <WarningIcon />,
      onClick: handleOverdueTasksClick,
      tooltip: 'View overdue work orders that need immediate attention'
    },
    { 
      count: (stats?.assets?.byStatus?.OFFLINE || 0), 
      label: 'Assets Offline', 
      color: 'error' as const,
      icon: <ErrorIcon />,
      onClick: handleOfflineAssetsClick,
      tooltip: 'View assets that are currently offline or not operational'
    },
    { 
      count: stats?.inventory?.outOfStock || 0, 
      label: 'Out of Stock', 
      color: 'warning' as const,
      icon: <InventoryIcon />,
      onClick: handleOutOfStockClick,
      tooltip: 'View inventory items that are out of stock'
    },
  ].filter(item => item.count > 0);

  const totalUrgent = urgentItems.reduce((sum, item) => sum + item.count, 0);

  // Loading state
  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load dashboard data. Please try again later.
        </Alert>
      </Box>
    );
  }

  const StatusHeroSection = () => (
    <Grow in timeout={600}>
      <Card 
        sx={{ 
          mb: 3,
          background: totalUrgent > 0 
            ? `linear-gradient(135deg, ${theme.palette.error.main}30 0%, ${theme.palette.error.main}15 100%)`
            : `linear-gradient(135deg, ${theme.palette.success.main}30 0%, ${theme.palette.success.main}15 100%)`,
          border: totalUrgent > 0 ? `3px solid ${theme.palette.error.main}60` : `3px solid ${theme.palette.success.main}60`,
          position: 'relative',
          overflow: 'hidden',
          // Enhanced contrast for outdoor viewing
          boxShadow: theme.shadows[6],
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: totalUrgent > 0 
              ? `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.warning.main})`
              : `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.primary.main})`,
          },
          transform: 'scale(1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.02)',
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <CardContent sx={{ pb: 2, pt: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: isMobile ? 'flex-start' : 'center', 
            justifyContent: 'space-between', 
            mb: 2,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 2 : 0,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Grow in timeout={800}>
                <Box sx={{ 
                  p: { xs: 1.5, sm: 2 }, 
                  borderRadius: '50%', 
                  bgcolor: totalUrgent > 0 ? theme.palette.error.main : theme.palette.success.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: { xs: 48, sm: 56 },
                  minHeight: { xs: 48, sm: 56 },
                  boxShadow: theme.shadows[4],
                  animation: totalUrgent > 0 ? 'pulse 2s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)', boxShadow: `0 0 0 0 ${theme.palette.error.main}40` },
                    '70%': { transform: 'scale(1.05)', boxShadow: `0 0 0 10px ${theme.palette.error.main}00` },
                    '100%': { transform: 'scale(1)', boxShadow: `0 0 0 0 ${theme.palette.error.main}00` },
                  },
                }}>
                  {totalUrgent > 0 ? (
                    <WarningIcon sx={{ color: 'white', fontSize: { xs: 24, sm: 32 } }} />
                  ) : (
                    <CheckCircleIcon sx={{ color: 'white', fontSize: { xs: 24, sm: 32 } }} />
                  )}
                </Box>
              </Grow>
              
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Fade in timeout={1000}>
                  <Typography 
                    variant={isMobile ? "h6" : "h5"} 
                    fontWeight={700}
                    sx={{
                      fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                      lineHeight: 1.2,
                      mb: 0.5,
                      // Enhanced contrast for outdoor viewing
                      color: theme.palette.text.primary,
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      fontWeight: 800,
                    }}
                  >
                    {totalUrgent > 0 ? `${totalUrgent} Items Need Attention` : 'All Systems Operational'}
                  </Typography>
                </Fade>
                <Fade in timeout={1200}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      // Enhanced contrast for outdoor viewing
                      color: theme.palette.text.primary,
                      opacity: 0.9,
                      textShadow: '0 1px 1px rgba(0,0,0,0.05)',
                      fontWeight: 600,
                    }}
                  >
                    {totalUrgent > 0 ? 'Immediate action required' : 'Everything looks good'}
                  </Typography>
                </Fade>
              </Box>
            </Box>
            
            {totalUrgent > 0 && (
              <Slide direction="left" in timeout={1000}>
                <IconButton 
                  size="large" 
                  sx={{ 
                    bgcolor: theme.palette.error.main,
                    color: 'white',
                    minWidth: 48,
                    minHeight: 48,
                    boxShadow: theme.shadows[4],
                    '&:hover': { 
                      bgcolor: theme.palette.error.dark,
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <NotificationIcon />
                </IconButton>
              </Slide>
            )}
          </Box>

          {totalUrgent > 0 && (
            <Fade in timeout={1400}>
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                flexWrap: 'wrap',
                mt: 2,
              }}>
                {urgentItems.map((item, index) => (
                  <Grow
                    key={index}
                    in
                    timeout={1600 + (index * 200)}
                  >
                    <Tooltip 
                      title={item.tooltip}
                      placement="top"
                      arrow
                    >
                      <Chip
                        icon={item.icon}
                        label={`${item.count} ${item.label}`}
                        color={item.color}
                        size={isMobile ? "small" : "medium"}
                        variant="outlined"
                        clickable
                        onClick={item.onClick}
                        sx={{
                          fontWeight: 600,
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: theme.shadows[2],
                            backgroundColor: `${theme.palette[item.color].main}10`,
                          },
                          '&:active': {
                            transform: 'scale(0.95)',
                          },
                          transition: 'all 0.2s ease',
                          // Touch optimizations for mobile
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      />
                    </Tooltip>
                  </Grow>
                ))}
              </Box>
            </Fade>
          )}
        </CardContent>
      </Card>
    </Grow>
  );

  const PriorityTasksSection = () => (
    <Fade in timeout={800}>
      <Card sx={{ 
        mb: 3,
        border: `3px solid ${theme.palette.error.main}50`,
        background: `linear-gradient(135deg, ${theme.palette.error.main}15 0%, ${theme.palette.warning.main}15 100%)`,
        // Enhanced contrast and outdoor visibility
        boxShadow: theme.shadows[8],
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.warning.main})`,
          borderRadius: '8px 8px 0 0',
        },
        position: 'relative',
        overflow: 'hidden',
      }}>
        <CardContent sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <WarningIcon sx={{ color: theme.palette.error.main, fontSize: 28 }} />
            <Typography variant="h6" fontWeight={700} sx={{ color: theme.palette.error.main }}>
              Priority Tasks
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {urgentItems.map((item, index) => (
              <Grow key={index} in timeout={1000 + (index * 200)}>
                <Card 
                  sx={{ 
                    bgcolor: 'white',
                    border: `1px solid ${theme.palette[item.color].main}40`,
                    borderLeft: `4px solid ${theme.palette[item.color].main}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                      bgcolor: `${theme.palette[item.color].main}05`,
                    },
                    '&:active': {
                      transform: 'scale(0.98)',
                    },
                    // Enhanced touch targets for field use
                    minHeight: 72,
                  }}
                  onClick={item.onClick}
                >
                  <CardContent sx={{ py: 2, px: 3, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ 
                          p: 1, 
                          borderRadius: '50%', 
                          bgcolor: `${theme.palette[item.color].main}20`,
                          display: 'flex',
                        }}>
                          {React.cloneElement(item.icon, { 
                            sx: { color: theme.palette[item.color].main, fontSize: 20 } 
                          })}
                        </Box>
                        <Box>
                          <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                            {item.count}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                            {item.label}
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        color={item.color}
                        sx={{
                          minWidth: 80,
                          minHeight: 36,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'none',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          item.onClick();
                        }}
                      >
                        View All
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grow>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );

  const QuickActionsSection = () => (
    <Fade in timeout={800}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={4} key={index}>
                <Grow in timeout={1000 + (index * 200)}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={action.icon}
                    onClick={action.onClick}
                    color={action.color}
                    size="large"
                    sx={{ 
                      py: { xs: 2.5, sm: 2 },
                      px: { xs: 3, sm: 3 },
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      // Enhanced touch targets for field use (minimum 48px height)
                      minHeight: { xs: 64, sm: 56 },
                      boxShadow: theme.shadows[4],
                      borderRadius: 3,
                      textTransform: 'none',
                      fontSize: { xs: '1.1rem', sm: '1rem' },
                      fontWeight: 700,
                      // Enhanced contrast gradient
                      background: `linear-gradient(135deg, ${theme.palette[action.color].main}, ${theme.palette[action.color].dark})`,
                      // Stronger border for outdoor visibility
                      border: `2px solid ${theme.palette[action.color].main}80`,
                      color: 'white',
                      textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                      '&:hover': {
                        transform: 'translateY(-3px) scale(1.02)',
                        boxShadow: `${theme.shadows[12]}, 0 0 20px ${theme.palette[action.color].main}30`,
                        background: `linear-gradient(135deg, ${theme.palette[action.color].dark}, ${theme.palette[action.color].main})`,
                        border: `2px solid ${theme.palette[action.color].light}`,
                      },
                      '&:active': {
                        transform: 'scale(0.96)',
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      // Enhanced touch optimizations for gloved hands
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', fontSize: { xs: 24, sm: 20 } }}>
                        {action.icon}
                      </Box>
                      <Box sx={{ flexGrow: 1, textAlign: 'left' }}>
                        <Typography variant="body1" fontWeight={600} color="inherit">
                          {action.label}
                        </Typography>
                      </Box>
                    </Box>
                  </Button>
                </Grow>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Fade>
  );

  const KeyMetricsSection = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={6} sm={3}>
        <Grow in timeout={1200}>
          <div>
            <StatCard
              title="Total Work Orders"
              value={stats?.workOrders?.total || 0}
              icon={<WorkOrderIcon />}
              color="primary"
              loading={statsLoading}
              onClick={handleTotalWorkOrdersClick}
            />
          </div>
        </Grow>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Grow in timeout={1400}>
          <div>
            <StatCard
              title="Active Tasks"
              value={((stats?.workOrders?.byStatus?.OPEN || 0) + (stats?.workOrders?.byStatus?.IN_PROGRESS || 0))}
              icon={<ScheduleIcon />}
              color="warning"
              loading={statsLoading}
              onClick={handleActiveTasksClick}
            />
          </div>
        </Grow>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Grow in timeout={1600}>
          <div>
            <StatCard
              title="Assets Online"
              value={`${Math.round(((stats?.assets?.byStatus?.ONLINE || 0) / (stats?.assets?.total || 1)) * 100)}%`}
              icon={<AssetIcon />}
              color="success"
              loading={statsLoading}
              onClick={handleAssetsOnlineClick}
            />
          </div>
        </Grow>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Grow in timeout={1800}>
          <div>
            <StatCard
              title="Due Today"
              value={statsLoading ? '...' : (maintenanceSchedule?.today || 0)}
              icon={<MaintenanceIcon />}
              color="info"
              loading={statsLoading}
              onClick={handleDueTodayClick}
            />
          </div>
        </Grow>
      </Grid>
    </Grid>
  );

  const RecentActivitySection = () => (
    <Fade in timeout={1000}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Recent Work Orders
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                size="small" 
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleNewWorkOrder}
                sx={{
                  minHeight: 36,
                  '&:hover': {
                    transform: 'translateY(-1px)',
                  },
                  transition: 'transform 0.2s ease',
                }}
              >
                New
              </Button>
              <Button 
                size="small" 
                endIcon={<ChevronRightIcon />}
                onClick={() => navigate('/work-orders')}
                sx={{
                  minHeight: 36,
                  '&:hover': {
                    transform: 'translateX(4px)',
                  },
                  transition: 'transform 0.2s ease',
                }}
              >
                View All
              </Button>
            </Box>
          </Box>
          
          {recentWOLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={32} />
            </Box>
          ) : !recentWorkOrders || recentWorkOrders.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No recent work orders
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {recentWorkOrders.map((workOrder: any, index: number) => [
                  <Fade key={workOrder.id || `workorder-${index}`} in timeout={1200 + (index * 100)}>
                    <ListItem 
                      sx={{ 
                        px: 0,
                        py: 1.5,
                        borderRadius: 1,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: theme.palette.action.hover,
                          transform: 'translateX(8px)',
                        },
                        // Touch optimizations
                        minHeight: 72,
                        WebkitTapHighlightColor: 'transparent',
                      }}
                      onClick={() => {
                        if (workOrder.id) {
                          navigate(`/work-orders/${workOrder.id}`);
                        } else {
                          console.warn('Work order ID is undefined:', workOrder);
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            bgcolor: statusColors[workOrder.priority] || theme.palette.grey[400],
                            width: { xs: 44, sm: 40 },
                            height: { xs: 44, sm: 40 },
                            boxShadow: theme.shadows[2],
                          }}
                        >
                          <WorkOrderIcon fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography 
                            component="span" 
                            variant="body1" 
                            fontWeight={600} 
                            sx={{ 
                              fontSize: { xs: '0.95rem', sm: '1rem' },
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {workOrder.title}
                          </Typography>
                        }
                        secondary={
                          <Box component="span" sx={{ display: 'block' }}>
                            <Typography 
                              component="span" 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                display: 'block',
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                mb: 0.5,
                                mt: 0.5,
                              }}
                            >
                              {workOrder.asset?.name || 'No asset assigned'}
                            </Typography>
                            <Box component="span" sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              <Chip
                                label={workOrder.status.replace('_', ' ')}
                                size="small"
                                color={
                                  workOrder.status === 'COMPLETED' ? 'success' :
                                  workOrder.status === 'IN_PROGRESS' ? 'info' :
                                  workOrder.status === 'OPEN' ? 'warning' : 'default'
                                }
                                sx={{ 
                                  height: { xs: 20, sm: 24 },
                                  fontSize: { xs: '0.625rem', sm: '0.75rem' },
                                }}
                              />
                              <Chip
                                label={workOrder.priority}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  height: { xs: 20, sm: 24 },
                                  fontSize: { xs: '0.625rem', sm: '0.75rem' },
                                }}
                              />
                            </Box>
                          </Box>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (workOrder.id) {
                              navigate(`/work-orders/${workOrder.id}`);
                            } else {
                              console.warn('Work order ID is undefined in secondary action:', workOrder);
                            }
                          }}
                          sx={{
                            minWidth: 36,
                            minHeight: 36,
                            '&:hover': {
                              bgcolor: theme.palette.primary.light + '20',
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <PlayIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </Fade>,
                  index < recentWorkOrders.length - 1 && (
                    <Divider key={`divider-${workOrder.id || index}`} sx={{ my: 0.5, opacity: 0.5 }} />
                  )
              ]).flat().filter(Boolean)}
            </List>
          )}
        </CardContent>
      </Card>
    </Fade>
  );

  const TrendsChartSection = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Work Order Trends
        </Typography>
        {trendsLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={32} />
          </Box>
        ) : !workOrderTrends || workOrderTrends.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <Typography variant="body2" color="text.secondary">
              No trend data available
            </Typography>
          </Box>
        ) : (
          <Box sx={{ height: isMobile ? 250 : 300, mt: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={workOrderTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke={theme.palette.text.secondary}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke={theme.palette.text.secondary}
                />
                <RechartsTooltip 
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="created" 
                  stroke={theme.palette.primary.main} 
                  strokeWidth={3}
                  dot={{ fill: theme.palette.primary.main, strokeWidth: 2, r: 4 }}
                  name="Created"
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke={theme.palette.success.main} 
                  strokeWidth={3}
                  dot={{ fill: theme.palette.success.main, strokeWidth: 2, r: 4 }}
                  name="Completed"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const WorkOrdersByStatusChart = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Work Orders by Status
        </Typography>
        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Open', value: stats?.workOrders?.byStatus?.OPEN || 0, color: theme.palette.warning.main },
                  { name: 'In Progress', value: stats?.workOrders?.byStatus?.IN_PROGRESS || 0, color: theme.palette.info.main },
                  { name: 'Completed', value: stats?.workOrders?.byStatus?.COMPLETED || 0, color: theme.palette.success.main },
                  { name: 'On Hold', value: stats?.workOrders?.byStatus?.ON_HOLD || 0, color: theme.palette.grey[500] },
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {[
                  { name: 'Open', value: stats?.workOrders?.byStatus?.OPEN || 0, color: theme.palette.warning.main },
                  { name: 'In Progress', value: stats?.workOrders?.byStatus?.IN_PROGRESS || 0, color: theme.palette.info.main },
                  { name: 'Completed', value: stats?.workOrders?.byStatus?.COMPLETED || 0, color: theme.palette.success.main },
                  { name: 'On Hold', value: stats?.workOrders?.byStatus?.ON_HOLD || 0, color: theme.palette.grey[500] },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );

  const AssetsByCriticalityChart = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Assets by Criticality
        </Typography>
        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Assets criticality chart coming soon
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  const InventoryStatusChart = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Inventory Status
        </Typography>
        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Inventory status chart coming soon
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <PageLayout
      title={isMobile ? "Dashboard" : "Maintenance Dashboard"}
      loading={statsLoading}
      error={statsError ? "Failed to load dashboard data. Please try again later." : null}
      onRefresh={refresh}
      maxWidth="xl"
    >
      <Box sx={{ position: 'relative' }}>
        {/* Mobile: Single column layout - Field Technician Focused */}
        {isMobile ? (
          <Container maxWidth="sm" disableGutters>
            <StatusHeroSection />
            {totalUrgent > 0 ? (
              // Priority-first view when there are urgent items
              <>
                <PriorityTasksSection />
                <QuickActionsSection />
                {selectedTab === 0 && <KeyMetricsSection />}
                {selectedTab === 1 && <RecentActivitySection />}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Tabs 
                    value={selectedTab} 
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                      '& .MuiTab-root': {
                        minHeight: 48,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      }
                    }}
                  >
                    <Tab label="Overview" />
                    <Tab label="Recent" />
                  </Tabs>
                </Box>
              </>
            ) : (
              // Normal view when all systems operational
              <>
                <QuickActionsSection />
                <KeyMetricsSection />
                <RecentActivitySection />
              </>
            )}
          </Container>
        ) : (
          /* Desktop: Two column layout */
          <>
            <StatusHeroSection />
            
            <Grid container spacing={3}>
              {/* Left Column */}
              <Grid item xs={12} md={8}>
                <QuickActionsSection />
                <KeyMetricsSection />
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs 
                    value={selectedTab} 
                    onChange={handleTabChange} 
                    aria-label="dashboard metrics tabs"
                    variant={isMobile ? "scrollable" : "standard"}
                    scrollButtons="auto"
                  >
                    <Tab label="Work Order Trends" />
                    <Tab label="Work Orders by Status" />
                    <Tab label="Assets by Criticality" />
                    <Tab label="Inventory Status" />
                  </Tabs>
                </Box>
                {selectedTab === 0 && <TrendsChartSection />}
                {selectedTab === 1 && <WorkOrdersByStatusChart />}
                {selectedTab === 2 && <AssetsByCriticalityChart />}
                {selectedTab === 3 && <InventoryStatusChart />}
              </Grid>
              
              {/* Right Column */}
              <Grid item xs={12} md={4}>
                <RecentActivitySection />
                
                {/* Additional side panel content for desktop */}
                <Fade in timeout={1400}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Today's Schedule
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Maintenance Tasks
                          </Typography>
                          <Typography variant="h5" fontWeight={700}>
                            {statsLoading ? '...' : (maintenanceSchedule?.today || 0)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            This Week
                          </Typography>
                          <Typography variant="h5" fontWeight={700}>
                            {statsLoading ? '...' : (maintenanceSchedule?.thisWeek || 0)}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            </Grid>
          </>
        )}

        {/* Floating Action Button - Mobile Only */}
        {isMobile && showFab && (
          <Slide direction="up" in={showFab} mountOnEnter unmountOnExit>
            <Fab
              color="primary"
              sx={{
                position: 'fixed',
                bottom: { xs: 24, sm: 32 },
                right: { xs: 24, sm: 32 },
                boxShadow: theme.shadows[8],
                '&:hover': {
                  transform: 'scale(1.1)',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: theme.zIndex.fab,
              }}
              onClick={handleNewWorkOrder}
            >
              <AddIcon />
            </Fab>
          </Slide>
        )}
      </Box>

      {/* Quick Action Forms */}
      <WorkOrderForm
        open={workOrderFormOpen}
        onClose={() => setWorkOrderFormOpen(false)}
        onSubmit={(data) => createWorkOrderMutation.mutate(data)}
        initialData={emptyInitialData}
        mode="create"
        loading={createWorkOrderMutation.isPending}
      />

      <AssetForm
        open={assetFormOpen}
        onClose={() => setAssetFormOpen(false)}
        onSubmit={(data) => createAssetMutation.mutate(data)}
        mode="create"
        loading={createAssetMutation.isPending}
      />

      <MaintenanceScheduleForm
        open={maintenanceFormOpen}
        onClose={() => setMaintenanceFormOpen(false)}
        onSubmit={(data) => createMaintenanceMutation.mutate(data)}
        mode="create"
        loading={createMaintenanceMutation.isPending}
      />

      {/* Maintenance Calendar Modal */}
      <Dialog
        open={maintenanceCalendarOpen}
        onClose={() => setMaintenanceCalendarOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '80vh',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={600}>
            Maintenance Calendar
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={handleScheduleMaintenance}
            startIcon={<AddIcon />}
          >
            Schedule New
          </Button>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {pmSchedulesLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
              <CircularProgress />
            </Box>
          ) : (
            <PMCalendar
              pmSchedules={transformedPMSchedules}
              onPMClick={(pm) => {
                console.log('PM clicked:', pm);
                // Could open maintenance details or edit form
              }}
              onDateClick={(date) => {
                console.log('Date clicked:', date);
                // Could open new maintenance schedule form for that date
              }}
              loading={pmSchedulesLoading}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMaintenanceCalendarOpen(false)}>
            Close
          </Button>
          <Button 
            variant="contained" 
            onClick={() => navigate('/maintenance')}
            startIcon={<ScheduleIcon />}
          >
            View Full Maintenance
          </Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  );
}