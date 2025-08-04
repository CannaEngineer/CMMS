import React, { useState } from 'react';
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
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { statusColors } from '../theme/theme';
import { dashboardService } from '../services/api';

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  onClick: () => void;
}

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardService.getStats,
  });

  const { data: workOrderTrends = [], isLoading: trendsLoading } = useQuery({
    queryKey: ['dashboard', 'work-order-trends'],
    queryFn: () => dashboardService.getWorkOrderTrends('month'),
  });

  const { data: recentWorkOrders = [], isLoading: workOrdersLoading } = useQuery({
    queryKey: ['dashboard', 'recent-work-orders'],
    queryFn: () => dashboardService.getRecentWorkOrders(5),
  });

  const { data: maintenanceSchedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ['dashboard', 'maintenance-schedule'],
    queryFn: dashboardService.getMaintenanceSchedule,
  });

  // Quick actions for mobile
  const quickActions: QuickAction[] = [
    {
      label: 'New Work Order',
      icon: <AddIcon />,
      color: 'primary',
      onClick: () => window.location.href = '/work-orders',
    },
    {
      label: 'Asset Inspection',
      icon: <AssetIcon />,
      color: 'secondary',
      onClick: () => window.location.href = '/assets',
    },
    {
      label: 'Reports',
      icon: <TrendingUpIcon />,
      color: 'success',
      onClick: () => window.location.href = '/reports',
    },
  ];

  // Calculate urgent items
  const urgentItems = [
    { 
      count: stats?.workOrders?.overdue || 0, 
      label: 'Overdue Tasks', 
      color: 'error' as const,
      icon: <WarningIcon />
    },
    { 
      count: (stats?.assets?.byStatus?.OFFLINE || 0), 
      label: 'Assets Offline', 
      color: 'error' as const,
      icon: <ErrorIcon />
    },
    { 
      count: stats?.inventory?.outOfStock || 0, 
      label: 'Out of Stock', 
      color: 'warning' as const,
      icon: <InventoryIcon />
    },
  ].filter(item => item.count > 0);

  const totalUrgent = urgentItems.reduce((sum, item) => sum + item.count, 0);

  // Loading state
  if (statsLoading) {
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
  if (statsError) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load dashboard data. Please try again later.
        </Alert>
      </Box>
    );
  }

  const StatusHeroSection = () => (
    <Card 
      sx={{ 
        mb: 3,
        background: totalUrgent > 0 
          ? `linear-gradient(135deg, ${theme.palette.error.main}15 0%, ${theme.palette.error.main}05 100%)`
          : `linear-gradient(135deg, ${theme.palette.success.main}15 0%, ${theme.palette.success.main}05 100%)`,
        border: totalUrgent > 0 ? `1px solid ${theme.palette.error.main}20` : `1px solid ${theme.palette.success.main}20`,
      }}
    >
      <CardContent sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {totalUrgent > 0 ? (
              <Box sx={{ 
                p: 1, 
                borderRadius: '50%', 
                bgcolor: theme.palette.error.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <WarningIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
            ) : (
              <Box sx={{ 
                p: 1, 
                borderRadius: '50%', 
                bgcolor: theme.palette.success.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircleIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
            )}
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {totalUrgent > 0 ? `${totalUrgent} Items Need Attention` : 'All Systems Operational'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {totalUrgent > 0 ? 'Immediate action required' : 'Everything looks good'}
              </Typography>
            </Box>
          </Box>
          {totalUrgent > 0 && (
            <IconButton 
              size="large" 
              sx={{ 
                bgcolor: theme.palette.error.main,
                color: 'white',
                '&:hover': { bgcolor: theme.palette.error.dark }
              }}
            >
              <NotificationIcon />
            </IconButton>
          )}
        </Box>

        {totalUrgent > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {urgentItems.map((item, index) => (
              <Chip
                key={index}
                icon={item.icon}
                label={`${item.count} ${item.label}`}
                color={item.color}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const QuickActionsSection = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={action.icon}
                onClick={action.onClick}
                color={action.color}
                size="large"
                sx={{ 
                  py: 1.5,
                  justifyContent: 'flex-start',
                  textAlign: 'left'
                }}
              >
                {action.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  const KeyMetricsSection = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={6} sm={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <WorkOrderIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h4" fontWeight={700} color="primary">
              {stats?.workOrders?.total || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Work Orders
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <ScheduleIcon color="warning" sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h4" fontWeight={700} color="warning.main">
              {((stats?.workOrders?.byStatus?.OPEN || 0) + (stats?.workOrders?.byStatus?.IN_PROGRESS || 0))}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Tasks
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <AssetIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h4" fontWeight={700} color="success.main">
              {Math.round(((stats?.assets?.byStatus?.ONLINE || 0) / (stats?.assets?.total || 1)) * 100)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Assets Online
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <MaintenanceIcon color="info" sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h4" fontWeight={700} color="info.main">
              {scheduleLoading ? '...' : (maintenanceSchedule?.today || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Due Today
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const RecentActivitySection = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Recent Work Orders
          </Typography>
          <Button 
            size="small" 
            endIcon={<ChevronRightIcon />}
            onClick={() => window.location.href = '/work-orders'}
          >
            View All
          </Button>
        </Box>
        
        {workOrdersLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={32} />
          </Box>
        ) : recentWorkOrders.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No recent work orders
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {recentWorkOrders.map((workOrder: any, index: number) => (
              <React.Fragment key={workOrder.id}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        bgcolor: statusColors[workOrder.priority] || theme.palette.grey[400],
                        width: 40,
                        height: 40
                      }}
                    >
                      <WorkOrderIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography component="span" variant="body1" fontWeight={600} noWrap>
                        {workOrder.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography component="span" variant="body2" color="text.secondary" noWrap>
                          {workOrder.asset?.name || 'No asset assigned'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={workOrder.status.replace('_', ' ')}
                            size="small"
                            color={
                              workOrder.status === 'COMPLETED' ? 'success' :
                              workOrder.status === 'IN_PROGRESS' ? 'info' :
                              workOrder.status === 'OPEN' ? 'warning' : 'default'
                            }
                          />
                          <Chip
                            label={workOrder.priority}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      size="small"
                      onClick={() => window.location.href = `/work-orders/${workOrder.id}`}
                    >
                      <PlayIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < recentWorkOrders.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
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
        ) : (
          <Box sx={{ height: isMobile ? 250 : 300, mt: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={workOrderTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  stroke={theme.palette.text.secondary}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke={theme.palette.text.secondary}
                />
                <Tooltip 
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
              <Tooltip />
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
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Mobile: Single column layout */}
      {isMobile ? (
        <>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
            Dashboard
          </Typography>
          <StatusHeroSection />
          <QuickActionsSection />
          <KeyMetricsSection />
          <RecentActivitySection />
          <TrendsChartSection />
        </>
      ) : (
        /* Desktop: Two column layout */
        <>
          <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
            Maintenance Dashboard
          </Typography>
          <StatusHeroSection />
          
          <Grid container spacing={3}>
            {/* Left Column */}
            <Grid item xs={12} md={8}>
              <QuickActionsSection />
              <KeyMetricsSection />
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={selectedTab} onChange={handleTabChange} aria-label="dashboard metrics tabs">
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
                        {scheduleLoading ? '...' : (maintenanceSchedule?.today || 0)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        This Week
                      </Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {scheduleLoading ? '...' : (maintenanceSchedule?.thisWeek || 0)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}