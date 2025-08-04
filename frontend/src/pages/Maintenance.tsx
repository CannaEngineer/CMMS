import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  useTheme,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Build as BuildIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  NotificationsActive as AlertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import StatCard from '../components/Common/StatCard';
import MaintenanceScheduleForm from '../components/Forms/MaintenanceScheduleForm';
import { PMCalendar } from '../components/PMCalendar';
import { statusColors } from '../theme/theme';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pmScheduleService, dashboardService } from '../services/api';
import dayjs from 'dayjs';

export default function Maintenance() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Fetch PM Schedules
  const { data: pmSchedules, isLoading: pmSchedulesLoading, error: pmSchedulesError } = useQuery({
    queryKey: ['pmSchedules'],
    queryFn: pmScheduleService.getAll,
  });

  // Fetch Dashboard Stats for KPI cards
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardService.getStats,
  });

  const { data: maintenanceScheduleStats, isLoading: maintenanceScheduleStatsLoading } = useQuery({
    queryKey: ['dashboard', 'maintenance-schedule'],
    queryFn: dashboardService.getMaintenanceSchedule,
  });

  // Mutations for PM Schedules
  const createMutation = useMutation({
    mutationFn: pmScheduleService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pmSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'maintenance-schedule'] });
      setOpenScheduleDialog(false);
    },
    onError: (error) => {
      console.error("Error creating PM schedule:", error);
      alert("Failed to create PM schedule.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => pmScheduleService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pmSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'maintenance-schedule'] });
      setOpenScheduleDialog(false);
    },
    onError: (error) => {
      console.error("Error updating PM schedule:", error);
      alert("Failed to update PM schedule.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: pmScheduleService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pmSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'maintenance-schedule'] });
      handleCloseMenu();
    },
    onError: (error) => {
      console.error("Error deleting PM schedule:", error);
      alert("Failed to delete PM schedule.");
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleScheduleMaintenance = () => {
    setSelectedSchedule(null);
    setFormMode('create');
    setOpenScheduleDialog(true);
  };

  const handleSubmitSchedule = (data: any) => {
    if (formMode === 'create') {
      createMutation.mutate(data);
    } else if (formMode === 'edit' && selectedSchedule) {
      updateMutation.mutate({ id: selectedSchedule.id, data });
    }
  };

  const handleEditClick = (schedule: any) => {
    setSelectedSchedule(schedule);
    setFormMode('edit');
    setOpenScheduleDialog(true);
    handleCloseMenu();
  };

  const handleDeleteClick = (scheduleId: string) => {
    if (window.confirm("Are you sure you want to delete this PM schedule?")) {
      deleteMutation.mutate(scheduleId);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, schedule: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedSchedule(schedule);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedSchedule(null);
  };

  // Filter PM schedules based on tab
  const filteredPMSchedules = pmSchedules?.filter((schedule: any) => {
    const nextDueDate = dayjs(schedule.nextDue);
    const now = dayjs();

    if (tabValue === 0) { // Upcoming
      return nextDueDate.isAfter(now) || nextDueDate.isSame(now, 'day');
    } else if (tabValue === 1) { // In Progress (no direct status for PMs, so we'll approximate)
      // For now, we'll consider PMs that have generated a WO that is in progress
      // This would require linking PMs to WOs, which is not yet fully implemented in backend
      return false; // Placeholder
    } else if (tabValue === 2) { // Completed (no direct status for PMs)
      return false; // Placeholder
    }
    return true;
  }) || [];

  // Mock data (will be replaced by real data as more backend APIs are implemented)
  const maintenanceByType = [
    { type: 'Preventive', count: stats?.workOrders?.byStatus?.COMPLETED || 0, color: statusColors.ONLINE }, // Using completed WOs as a proxy
    { type: 'Corrective', count: stats?.workOrders?.total - (stats?.workOrders?.byStatus?.COMPLETED || 0) || 0, color: statusColors.URGENT }, // Using total - completed as proxy
  ];

  const monthlyTrend = [
    { month: 'Jan', scheduled: 40, completed: 35 },
    { month: 'Feb', scheduled: 45, completed: 42 },
    { month: 'Mar', scheduled: 42, completed: 40 },
    { month: 'Apr', scheduled: 48, completed: 45 },
    { month: 'May', scheduled: 50, completed: 47 },
    { month: 'Jun', scheduled: 45, completed: 43 },
  ];

  const criticalAssets = [
    { name: 'Production Line 1', nextMaintenance: '2024-08-10', health: 65 },
    { name: 'Cooling Tower #2', nextMaintenance: '2024-08-12', health: 72 },
    { name: 'Air Compressor #4', nextMaintenance: '2024-08-15', health: 58 },
  ];

  if (pmSchedulesLoading || statsLoading || maintenanceScheduleStatsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Maintenance Data...</Typography>
      </Box>
    );
  }

  if (pmSchedulesError || statsError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load maintenance data: {pmSchedulesError?.message || statsError?.message}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Maintenance Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleScheduleMaintenance}
        >
          Schedule Maintenance
        </Button>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Scheduled This Month"
            value={maintenanceScheduleStats?.thisMonth || 0}
            subtitle={`${maintenanceScheduleStats?.thisWeek || 0} due this week`}
            icon={<ScheduleIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Work Orders"
            value={stats?.workOrders?.byStatus?.COMPLETED || 0}
            subtitle={`${stats?.workOrders?.completionRate || 0}% completion rate`}
            change={5} // Placeholder
            changeLabel="vs last month" // Placeholder
            icon={<CheckIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Overdue Work Orders"
            value={stats?.workOrders?.overdue || 0}
            subtitle="Requires immediate attention"
            icon={<WarningIcon />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Assets"
            value={stats?.assets?.total || 0}
            subtitle="Managed assets"
            change={0} // Placeholder
            changeLabel="" // Placeholder
            icon={<BuildIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Maintenance Schedule */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Maintenance Schedule
              </Typography>
              <Box>
                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab label="Upcoming" />
                  <Tab label="In Progress" />
                  <Tab label="Completed" />
                  <Tab label="Calendar View" />
                </Tabs>
              </Box>
            </Box>

            {tabValue === 3 ? (
              // Calendar View
              <Box sx={{ mt: 2 }}>
                <PMCalendar
                  pmSchedules={pmSchedules?.map((schedule: any) => ({
                    id: schedule.id,
                    title: schedule.title,
                    assetName: schedule.asset?.name || 'Unknown Asset',
                    assetId: schedule.assetId || 0,
                    scheduledDate: new Date(schedule.nextDue),
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
                    const originalSchedule = pmSchedules?.find((s: any) => s.id === pm.id);
                    if (originalSchedule) {
                      setSelectedSchedule(originalSchedule);
                      setFormMode('view');
                      setOpenScheduleDialog(true);
                    }
                  }}
                  onDateClick={(date) => {
                    console.log('Date clicked:', date);
                  }}
                  loading={pmSchedulesLoading}
                />
              </Box>
            ) : (
              // List View
              <List>
                {filteredPMSchedules.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No PM schedules found for this category.
                  </Typography>
                ) : (
                  filteredPMSchedules.map((item: any) => (
                    <ListItem
                      key={item.id}
                      sx={{
                        mb: 1,
                        backgroundColor: theme.palette.background.default,
                        borderRadius: 2,
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: theme.palette.primary.light }}>
                          <ScheduleIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" fontWeight={600}>
                              {item.title}
                            </Typography>
                            <Chip
                              label={item.frequency}
                              size="small"
                              sx={{
                                backgroundColor: theme.palette.info.light + '20',
                                color: theme.palette.info.main,
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Asset: {item.asset?.name || 'N/A'} • Due: {dayjs(item.nextDue).format('YYYY-MM-DD')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.description}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={(event) => handleMenuOpen(event, item)}>
                          <MoreVertIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))
                )}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Maintenance Types & Critical Assets */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={3}>
            {/* Maintenance by Type */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Maintenance by Type
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={maintenanceByType}>
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count">
                      {maintenanceByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Critical Assets Alert */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <AlertIcon color="warning" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Critical Assets
                    </Typography>
                  </Box>
                  <List dense>
                    {criticalAssets.map((asset, index) => (
                      <ListItem key={index} disablePadding sx={{ mb: 2 }}>
                        <ListItemText
                          primary={asset.name}
                          secondary={
                            <Box>
                              <Typography variant="caption">
                                Next maintenance: {asset.nextMaintenance}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={asset.health}
                                sx={{
                                  mt: 1,
                                  height: 6,
                                  borderRadius: 3,
                                  backgroundColor: theme.palette.grey[200],
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: 
                                      asset.health > 70 ? theme.palette.success.main :
                                      asset.health > 50 ? theme.palette.warning.main :
                                      theme.palette.error.main,
                                  },
                                }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Monthly Trend */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Maintenance Completion Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="scheduled"
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                  name="Scheduled"
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke={theme.palette.success.main}
                  strokeWidth={2}
                  name="Completed"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Context Menu for List Items */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => handleEditClick(selectedSchedule)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => handleDeleteClick(selectedSchedule.id)}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Maintenance Schedule Form Dialog */}
      <MaintenanceScheduleForm
        open={openScheduleDialog}
        onClose={() => setOpenScheduleDialog(false)}
        onSubmit={handleSubmitSchedule}
        initialData={selectedSchedule || {}}
        mode={formMode}
      />
    </Box>
  );
}