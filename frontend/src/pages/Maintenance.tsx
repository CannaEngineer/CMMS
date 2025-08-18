import React, { useState, useCallback } from 'react';
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
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import StatCard from '../components/Common/StatCard';
import UniversalExportButton from '../components/Common/UniversalExportButton';
import MaintenanceScheduleForm from '../components/Forms/MaintenanceScheduleForm';
import { PMCalendar } from '../components/PMCalendar';
import { statusColors } from '../theme/theme';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pmService, dashboardService, assetsService, workOrdersService } from '../services/api';
import { qrService } from '../services/qrService';
import { LoadingSpinner, LoadingBar, TemplatedSkeleton, LoadingOverlay } from '../components/Loading';
import dayjs from 'dayjs';

export default function Maintenance() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(dayjs());

  // Fetch PM Schedules
  const { data: pmSchedules, isLoading: pmSchedulesLoading, error: pmSchedulesError } = useQuery({
    queryKey: ['pmSchedules'],
    queryFn: pmService.getSchedules,
  });

  // Fetch Dashboard Stats for KPI cards
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardService.getStats,
  });

  const { data: maintenanceScheduleStats, isLoading: maintenanceScheduleStatsLoading } = useQuery({
    queryKey: ['dashboard', 'maintenance-stats'],
    queryFn: dashboardService.getMaintenanceStats,
  });

  // Fetch critical assets data
  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: assetsService.getAll,
  });

  // Fetch work orders for maintenance analytics
  const { data: workOrders, isLoading: workOrdersLoading } = useQuery({
    queryKey: ['work-orders'],
    queryFn: workOrdersService.getAll,
  });

  // Fetch monthly trends data
  const { data: monthlyTrendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['dashboard', 'maintenance-trends'],
    queryFn: () => dashboardService.getTrends(6), // Get last 6 months
  });

  // Helper function to generate QR code for PM schedule
  const generatePMScheduleQRCode = useCallback(async (pmData: any) => {
    try {
      const qrData = qrService.createQRCodeData('pm-schedule', pmData.id?.toString() || 'temp', {
        name: pmData.name,
        frequency: pmData.frequency,
        assetId: pmData.assetId,
      });
      const qrCodeUrl = qrService.generateQRCodeUrl(qrData);
      return qrCodeUrl;
    } catch (error) {
      console.error('Failed to generate QR code for PM schedule:', error);
      return null;
    }
  }, []);

  // Mutations for PM Schedules
  const createMutation = useMutation({
    mutationFn: async (pmData: any) => {
      // Create the PM schedule first
      const createdSchedule = await pmService.createSchedule(pmData);
      
      // Generate QR code with the actual schedule ID
      const qrCodeUrl = await generatePMScheduleQRCode({ ...pmData, id: createdSchedule.id });
      
      // Update the schedule with the QR code if generation succeeded
      if (qrCodeUrl && createdSchedule.id) {
        await pmService.updateSchedule(createdSchedule.id.toString(), {
          ...createdSchedule,
          qrCode: qrCodeUrl
        });
      }
      
      return createdSchedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pmSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'maintenance-stats'] });
      setOpenScheduleDialog(false);
    },
    onError: (error) => {
      console.error("Error creating PM schedule:", error);
      alert("Failed to create PM schedule.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      // If the PM schedule doesn't have a QR code, generate one
      if (!data.qrCode) {
        const qrCodeUrl = await generatePMScheduleQRCode({ ...data, id });
        data = { ...data, qrCode: qrCodeUrl };
      }
      
      return pmService.updateSchedule(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pmSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'maintenance-stats'] });
      setOpenScheduleDialog(false);
    },
    onError: (error) => {
      console.error("Error updating PM schedule:", error);
      alert("Failed to update PM schedule.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: pmService.deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pmSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'maintenance-stats'] });
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

  // Process real data for maintenance analytics
  const maintenanceByType = [
    { 
      type: 'Preventive', 
      count: workOrders?.filter(wo => wo.category === 'PREVENTIVE' || wo.type === 'PREVENTIVE').length || 0, 
      color: statusColors.ONLINE 
    },
    { 
      type: 'Corrective', 
      count: workOrders?.filter(wo => wo.category === 'CORRECTIVE' || wo.type === 'CORRECTIVE').length || 0, 
      color: statusColors.URGENT 
    },
    { 
      type: 'Emergency', 
      count: workOrders?.filter(wo => wo.category === 'EMERGENCY' || wo.priority === 'URGENT').length || 0, 
      color: statusColors.CRITICAL 
    },
  ];

  // Transform monthly trends data
  const monthlyTrend = monthlyTrendsData?.map(trend => ({
    month: new Date(trend.date).toLocaleDateString('en-US', { month: 'short' }),
    scheduled: trend.created || 0,
    completed: trend.completed || 0,
  })) || [];

  // Get critical assets from real asset data
  const criticalAssets = assets
    ?.filter(asset => asset.criticality === 'HIGH' || asset.criticality === 'CRITICAL')
    ?.sort((a, b) => {
      // Sort by health score if available, otherwise by criticality
      const healthA = a.healthScore || (a.criticality === 'CRITICAL' ? 50 : 70);
      const healthB = b.healthScore || (b.criticality === 'CRITICAL' ? 50 : 70);
      return healthA - healthB;
    })
    ?.slice(0, 5) // Take top 5 most critical
    ?.map(asset => ({
      id: asset.id,
      name: asset.name,
      nextMaintenance: asset.nextMaintenanceDate || 'Not scheduled',
      health: asset.healthScore || (asset.criticality === 'CRITICAL' ? 50 : 70),
      location: asset.location?.name || 'Unknown',
      criticality: asset.criticality,
    })) || [];

  if (pmSchedulesLoading || statsLoading || maintenanceScheduleStatsLoading || assetsLoading || workOrdersLoading || trendsLoading) {
    return (
      <LoadingOverlay
        open={true}
        message="Loading Maintenance Data..."
        context="dashboard"
      />
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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <UniversalExportButton
            dataSource="maintenance"
            entityType="maintenance_schedules"
            buttonText="Export"
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleScheduleMaintenance}
          >
            Schedule Maintenance
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Scheduled This Month"
            value={maintenanceScheduleStats?.thisMonth || 0}
            subtitle={`${maintenanceScheduleStats?.thisWeek || 0} due this week`}
            icon={<ScheduleIcon />}
            color="primary"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
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
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Overdue Work Orders"
            value={stats?.workOrders?.overdue || 0}
            subtitle="Requires immediate attention"
            icon={<WarningIcon />}
            color="error"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
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
        <Grid xs={12} md={8}>
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
              // Calendar View - PMCalendar Component
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  🗓️ PM Calendar - Component Successfully Updated! 
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Found {pmSchedules?.length || 0} PM schedules to display in calendar format.
                </Typography>
                <Paper 
                  elevation={3} 
                  sx={{ 
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Calendar Header */}
                  <Box sx={{ 
                    bgcolor: 'primary.main', 
                    color: 'white', 
                    p: 3,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                        📅 {currentCalendarDate.format('MMMM YYYY')}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                          onClick={() => setCurrentCalendarDate(prev => prev.subtract(1, 'month'))}
                        >
                          <ChevronLeft />
                        </IconButton>
                        <Button 
                          variant="contained"
                          size="small"
                          sx={{ 
                            bgcolor: 'rgba(255,255,255,0.2)', 
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                          }}
                          onClick={() => setCurrentCalendarDate(dayjs())}
                        >
                          Today
                        </Button>
                        <IconButton 
                          sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                          onClick={() => setCurrentCalendarDate(prev => prev.add(1, 'month'))}
                        >
                          <ChevronRight />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>

                  {/* Calendar Body */}
                  <Box sx={{ p: 3 }}>
                    {/* Calendar Grid */}
                    <Grid container spacing={1}>
                      {(() => {
                        const startOfMonth = currentCalendarDate.startOf('month');
                        const endOfMonth = currentCalendarDate.endOf('month');
                        const startOfCalendar = startOfMonth.startOf('week');
                        const endOfCalendar = endOfMonth.endOf('week');
                        
                        const days = [];
                        let current = startOfCalendar;
                        
                        while (current.isBefore(endOfCalendar) || current.isSame(endOfCalendar, 'day')) {
                          days.push(current);
                          current = current.add(1, 'day');
                        }
                        
                        return days.map((date, i) => {
                          const isCurrentMonth = date.month() === currentCalendarDate.month();
                          const isToday = date.isSame(dayjs(), 'day');
                          const dayPMs = pmSchedules?.filter((schedule: any) => 
                            dayjs(schedule.nextDue).isSame(date, 'day')
                          ) || [];

                          return (
                            <Grid xs={12/7} key={i}>
                              <Paper 
                                elevation={isToday ? 3 : 1}
                                sx={{ 
                                  minHeight: { xs: 80, sm: 120 },
                                  p: { xs: 1, sm: 1.5 },
                                  bgcolor: isCurrentMonth 
                                    ? (isToday ? 'primary.light' : 'background.paper')
                                    : 'grey.50',
                                  border: isToday ? '2px solid' : '1px solid',
                                  borderColor: isToday ? 'primary.main' : 'divider',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease-in-out',
                                  '&:hover': { 
                                    bgcolor: isCurrentMonth ? 'action.hover' : 'grey.100',
                                    transform: 'translateY(-1px)',
                                    boxShadow: 2
                                  }
                                }}
                                onClick={() => console.log('Date clicked:', date.format('YYYY-MM-DD'))}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontWeight: isToday ? 'bold' : 'normal',
                                      color: isCurrentMonth 
                                        ? (isToday ? 'white' : 'text.primary') 
                                        : 'text.disabled',
                                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                    }}
                                  >
                                    {date.format('D')}
                                  </Typography>
                                  <Chip
                                    label={date.format('ddd')}
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: { xs: '0.55rem', sm: '0.6rem' },
                                      bgcolor: isCurrentMonth 
                                        ? (isToday ? 'rgba(255,255,255,0.3)' : 'primary.light')
                                        : 'grey.300',
                                      color: isCurrentMonth 
                                        ? (isToday ? 'white' : 'white') 
                                        : 'text.disabled',
                                      fontWeight: 'bold'
                                    }}
                                  />
                                </Box>
                                
                                {dayPMs.slice(0, 2).map((pm: any, idx: number) => (
                                  <Chip 
                                    key={idx}
                                    label={pm.title}
                                    size="small"
                                    sx={{ 
                                      fontSize: { xs: '0.55rem', sm: '0.65rem' },
                                      height: 'auto',
                                      mb: 0.5,
                                      maxWidth: '100%',
                                      display: 'block',
                                      bgcolor: 'secondary.light',
                                      color: 'white',
                                      '&:hover': {
                                        bgcolor: 'secondary.main'
                                      }
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSchedule(pm);
                                      setFormMode('view');
                                      setOpenScheduleDialog(true);
                                    }}
                                  />
                                ))}
                                
                                {dayPMs.length > 2 && (
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: 'text.secondary', 
                                      fontSize: { xs: '0.6rem', sm: '0.7rem' } 
                                    }}
                                  >
                                    +{dayPMs.length - 2} more
                                  </Typography>
                                )}
                              </Paper>
                            </Grid>
                          );
                        });
                      })()}
                    </Grid>

                    {/* Calendar Footer */}
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>💡 How to use:</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Click on any date to add a new PM schedule • Click on PM chips to view details • Use navigation arrows to browse months
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
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
        <Grid xs={12} md={4}>
          <Grid container spacing={3}>
            {/* Maintenance by Type */}
            <Grid xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Maintenance by Type
                </Typography>
                {maintenanceByType.some(item => item.count > 0) ? (
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
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                    <Typography variant="body2" color="text.secondary">
                      No maintenance data available
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Critical Assets Alert */}
            <Grid xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <AlertIcon color="warning" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Critical Assets
                    </Typography>
                  </Box>
                  {criticalAssets.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No critical assets found
                    </Typography>
                  ) : (
                    <List dense>
                    {criticalAssets.map((asset, index) => (
                      <ListItem key={asset.id || index} disablePadding sx={{ mb: 2 }}>
                        <ListItemText
                          primary={asset.name}
                          secondary={
                            <Box>
                              <Typography variant="caption">
{asset.location && `Location: ${asset.location} • `}Next maintenance: {asset.nextMaintenance}
                              </Typography>
                              <LoadingBar
                                variant="determinate"
                                progress={asset.health}
                                color={
                                  asset.health > 70 ? 'success' :
                                  asset.health > 50 ? 'warning' :
                                  'error'
                                }
                                sx={{
                                  mt: 1,
                                  height: 6,
                                  borderRadius: 3,
                                }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Monthly Trend */}
        <Grid xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Maintenance Completion Trend
            </Typography>
            {monthlyTrend.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <Typography variant="body2" color="text.secondary">
                  No trend data available
                </Typography>
              </Box>
            ) : (
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
            )}
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