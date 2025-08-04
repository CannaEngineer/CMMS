import React, { useState, useEffect } from 'react';
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
  const [animationDelay, setAnimationDelay] = useState(0);
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
  });

  const { data: workOrderTrends, isLoading: trendsLoading, refetch: refetchTrends } = useQuery({
    queryKey: ['dashboard', 'trends'],
    queryFn: () => dashboardService.getTrends(7),
  });

  const { data: recentWorkOrders, isLoading: recentWOLoading, refetch: refetchRecentWO } = useQuery({
    queryKey: ['dashboard', 'recent-work-orders'],
    queryFn: () => dashboardService.getRecentWorkOrders(5),
  });

  const { data: maintenanceScheduleData, isLoading: scheduleLoading, refetch: refetchSchedule } = useQuery({
    queryKey: ['dashboard', 'maintenance-stats'],
    queryFn: dashboardService.getMaintenanceStats,
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

  // Refresh all dashboard data
  const refresh = async () => {
    await Promise.all([
      refetchStats(),
      refetchTrends(),
      refetchRecentWO(),
      refetchSchedule()
    ]);
  };

  // Transform maintenance schedule data to match expected format
  const maintenanceSchedule = maintenanceScheduleData || { today: 0, thisWeek: 0 };

  // Combined loading and error states
  const isLoading = statsLoading || scheduleLoading;
  const error = statsError;

  // Quick action handlers
  const handleNewWorkOrder = () => {
    setWorkOrderFormOpen(true);
  };

  const handleNewAsset = () => {
    setAssetFormOpen(true);
  };

  const handleScheduleMaintenance = () => {
    setMaintenanceFormOpen(true);
  };

  // Stat card click handlers
  const handleTotalWorkOrdersClick = () => {
    navigate('/work-orders');
  };

  const handleActiveTasksClick = () => {
    navigate('/work-orders?status=OPEN,IN_PROGRESS');
  };

  const handleAssetsOnlineClick = () => {
    navigate('/assets?status=ONLINE');
  };

  const handleDueTodayClick = () => {
    setMaintenanceCalendarOpen(true);
  };

  // Quick actions for immediate task execution
  const quickActions: QuickAction[] = [
    {
      label: 'New Work Order',
      icon: <AddIcon />,
      color: 'primary',
      onClick: handleNewWorkOrder,
    },
    {
      label: 'Add Asset',
      icon: <AssetIcon />,
      color: 'secondary',
      onClick: handleNewAsset,
    },
    {
      label: 'Schedule Maintenance',
      icon: <ScheduleIcon />,
      color: 'success',
      onClick: handleScheduleMaintenance,
    },
  ];

  // Navigate to specific filtered views
  const handleOverdueTasksClick = () => {
    // Navigate to work orders page with overdue filter
    navigate('/work-orders?filter=overdue');
  };

  const handleOfflineAssetsClick = () => {
    // Navigate to assets page with offline filter
    navigate('/assets?status=OFFLINE');  
  };

  const handleOutOfStockClick = () => {
    // Navigate to inventory/parts page with out of stock filter
    navigate('/inventory?status=out-of-stock');
  };

  // Calculate urgent items with click handlers
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
            ? `linear-gradient(135deg, ${theme.palette.error.main}20 0%, ${theme.palette.error.main}08 100%)`
            : `linear-gradient(135deg, ${theme.palette.success.main}20 0%, ${theme.palette.success.main}08 100%)`,
          border: totalUrgent > 0 ? `2px solid ${theme.palette.error.main}30` : `2px solid ${theme.palette.success.main}30`,
          position: 'relative',
          overflow: 'hidden',
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
                    }}
                  >
                    {totalUrgent > 0 ? `${totalUrgent} Items Need Attention` : 'All Systems Operational'}
                  </Typography>
                </Fade>
                <Fade in timeout={1200}>
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
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
                      py: { xs: 2, sm: 1.5 },
                      px: { xs: 2, sm: 3 },
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      minHeight: { xs: 56, sm: 48 },
                      boxShadow: theme.shadows[2],
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: { xs: '1rem', sm: '0.875rem' },
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${theme.palette[action.color].main}, ${theme.palette[action.color].dark})`,
                      '&:hover': {
                        transform: 'translateY(-2px) scale(1.02)',
                        boxShadow: theme.shadows[8],
                        background: `linear-gradient(135deg, ${theme.palette[action.color].dark}, ${theme.palette[action.color].main})`,
                      },
                      '&:active': {
                        transform: 'scale(0.98)',
                      },
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      // Touch optimizations
                      WebkitTapHighlightColor: 'transparent',
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
              {recentWorkOrders.map((workOrder: any, index: number) => (
                <React.Fragment key={workOrder.id}>
                  <Fade in timeout={1200 + (index * 100)}>
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
                      onClick={() => navigate(`/work-orders/${workOrder.id}`)}
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
                          <Box sx={{ mt: 0.5 }}>
                            <Typography 
                              component="span" 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                display: 'block',
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                mb: 0.5,
                              }}
                            >
                              {workOrder.asset?.name || 'No asset assigned'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
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
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/work-orders/${workOrder.id}`);
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
                  </Fade>
                  {index < recentWorkOrders.length - 1 && (
                    <Divider sx={{ my: 0.5, opacity: 0.5 }} />
                  )}
                </React.Fragment>
              ))}
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
        {/* Mobile: Single column layout */}
        {isMobile ? (
          <Container maxWidth="sm" disableGutters>
            <StatusHeroSection />
            <QuickActionsSection />
            <KeyMetricsSection />
            <RecentActivitySection />
            <TrendsChartSection />
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
              pmSchedules={pmSchedules?.map((schedule: any) => ({
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
              })) || []}
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