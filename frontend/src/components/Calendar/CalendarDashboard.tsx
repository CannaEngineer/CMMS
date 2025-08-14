import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
  Fade,
  Grow,
  Slide,
  Zoom,
  Collapse,
  Backdrop,
  Alert,
  CircularProgress,
  Fab,
  Tooltip,
  Badge,
  Chip,
  Avatar,
  Divider,
  Stack,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  ViewDay as DayViewIcon,
  ViewWeek as WeekViewIcon,
  ViewModule as MonthViewIcon,
  FilterList as FilterIcon,
  Today as TodayIcon,
  Add as AddIcon,
  Schedule as ScheduleIcon,
  Assignment as WorkOrderIcon,
  Warning as WarningIcon,
  CheckCircle as CompletedIcon,
  PlayArrow as InProgressIcon,
  Notifications as NotificationIcon,
  SwipeLeft as SwipeIcon,
  TouchApp as TouchIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { calendarService, dashboardService } from '../../services/api';
import { CalendarItem, CalendarFilters } from '../../types/calendar';
import CalendarViewManager from './CalendarViewManager';
import ContextualPanel from './ContextualPanel';
import UrgentTasksHero from './UrgentTasksHero';
import CalendarSkeleton from './CalendarSkeleton';
import QuickActionsFab from './QuickActionsFab';
import dayjs from 'dayjs';

interface CalendarDashboardProps {
  // Optional props for customization
  defaultView?: 'day' | 'week' | 'month';
  showUrgentHero?: boolean;
  showQuickActions?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

const CalendarDashboard: React.FC<CalendarDashboardProps> = ({
  defaultView = 'month',
  showUrgentHero = true,
  showQuickActions = true,
  maxWidth = 'xl',
}) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>(defaultView);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [contextualPanelOpen, setContextualPanelOpen] = useState(false);
  const [filters, setFilters] = useState<CalendarFilters>({});
  
  // Animation states
  const [calendarLoaded, setCalendarLoaded] = useState(false);
  const [showViewToggle, setShowViewToggle] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch calendar data with caching and optimistic updates
  const { 
    data: calendarItems = [], 
    isLoading: calendarLoading, 
    error: calendarError,
    refetch: refetchCalendar 
  } = useQuery({
    queryKey: ['calendar-items', currentDate.format('YYYY-MM'), viewType, filters],
    queryFn: () => {
      const startDate = currentDate.startOf(viewType === 'day' ? 'day' : viewType === 'week' ? 'week' : 'month');
      const endDate = currentDate.endOf(viewType === 'day' ? 'day' : viewType === 'week' ? 'week' : 'month');
      
      return calendarService.getCalendarItems({
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        ...filters,
      });
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch dashboard stats for urgent tasks hero
  const { 
    data: dashboardStats,
    isLoading: statsLoading 
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
    enabled: showUrgentHero,
    staleTime: 30000,
  });

  // Staggered animation effects
  useEffect(() => {
    const timers = [
      setTimeout(() => setCalendarLoaded(true), 300),
      setTimeout(() => setShowViewToggle(true), 600),
      setTimeout(() => setShowFilters(true), 900),
    ];
    
    return () => timers.forEach(clearTimeout);
  }, []);

  // Calculate urgent items from dashboard stats
  const urgentItems = useMemo(() => {
    if (!dashboardStats) return [];
    
    return [
      {
        count: dashboardStats.workOrders?.overdue || 0,
        label: 'Overdue Tasks',
        type: 'overdue',
        color: 'error' as const,
        icon: <WarningIcon />,
      },
      {
        count: dashboardStats.assets?.byStatus?.OFFLINE || 0,
        label: 'Assets Offline',
        type: 'offline',
        color: 'error' as const,
        icon: <WarningIcon />,
      },
      {
        count: dashboardStats.inventory?.outOfStock || 0,
        label: 'Out of Stock',
        type: 'stock',
        color: 'warning' as const,
        icon: <WarningIcon />,
      },
    ].filter(item => item.count > 0);
  }, [dashboardStats]);

  const totalUrgent = urgentItems.reduce((sum, item) => sum + item.count, 0);

  // Enhanced item categorization for better visualization
  const categorizedItems = useMemo(() => {
    const categories = {
      overdue: calendarItems.filter(item => item.isOverdue),
      today: calendarItems.filter(item => dayjs(item.scheduledDate).isSame(dayjs(), 'day')),
      thisWeek: calendarItems.filter(item => dayjs(item.scheduledDate).isSame(dayjs(), 'week')),
      pmSchedules: calendarItems.filter(item => item.type === 'PM_SCHEDULE'),
      workOrders: calendarItems.filter(item => item.type === 'WORK_ORDER'),
      highPriority: calendarItems.filter(item => ['HIGH', 'URGENT'].includes(item.priority)),
    };
    
    return categories;
  }, [calendarItems]);

  // Event handlers with enhanced UX feedback
  const handleItemClick = useCallback((item: CalendarItem) => {
    setSelectedItem(item);
    setContextualPanelOpen(true);
    
    // Haptic feedback simulation for mobile
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, [isMobile]);

  const handleDateClick = useCallback((date: dayjs.Dayjs) => {
    setSelectedDate(date);
    setCurrentDate(date);
    
    // Show items for that date in contextual panel if any exist
    const dateItems = calendarItems.filter(item => 
      dayjs(item.scheduledDate).isSame(date, 'day')
    );
    
    if (dateItems.length > 0) {
      setSelectedItem(dateItems[0]); // Show first item
      setContextualPanelOpen(true);
    }
  }, [calendarItems]);

  const handleItemReschedule = useCallback(async (itemId: number, newDate: Date) => {
    try {
      // Optimistic update
      queryClient.setQueryData(
        ['calendar-items', currentDate.format('YYYY-MM'), viewType, filters],
        (oldData: CalendarItem[] = []) => {
          return oldData.map(item => 
            item.id === itemId 
              ? { ...item, scheduledDate: newDate }
              : item
          );
        }
      );
      
      // API call would go here
      await calendarService.rescheduleItem(itemId, newDate);
      
      // Haptic feedback
      if (isMobile && 'vibrate' in navigator) {
        navigator.vibrate([50, 50, 100]);
      }
      
    } catch (error) {
      // Revert optimistic update on error
      refetchCalendar();
      console.error('Failed to reschedule item:', error);
    }
  }, [queryClient, currentDate, viewType, filters, isMobile, refetchCalendar]);

  const handleViewChange = useCallback((newView: 'day' | 'week' | 'month') => {
    setViewType(newView);
    
    // Smooth transition effect
    setCalendarLoaded(false);
    setTimeout(() => setCalendarLoaded(true), 200);
  }, []);

  const handleFiltersChange = useCallback((newFilters: CalendarFilters) => {
    setFilters(newFilters);
  }, []);

  // Quick action handlers
  const quickActions = useMemo(() => [
    {
      label: 'New Work Order',
      icon: <WorkOrderIcon />,
      color: 'primary' as const,
      action: () => {
        // Would open work order form
        console.log('New work order');
      },
    },
    {
      label: 'Schedule PM',
      icon: <ScheduleIcon />,
      color: 'success' as const,
      action: () => {
        // Would open PM scheduling form
        console.log('Schedule PM');
      },
    },
    {
      label: 'Quick Scan',
      icon: <TouchIcon />,
      color: 'secondary' as const,
      action: () => {
        // Would open QR scanner
        console.log('QR scan');
      },
    },
  ], []);

  // Loading state with calendar-themed skeleton
  if (calendarLoading && !calendarItems.length) {
    return (
      <Container maxWidth={maxWidth || 'xl'} sx={{ py: { xs: 2, md: 3 } }}>
        <CalendarSkeleton viewType={viewType} />
      </Container>
    );
  }

  // Error state
  if (calendarError) {
    return (
      <Container maxWidth={maxWidth || 'xl'} sx={{ py: { xs: 2, md: 3 } }}>
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetchCalendar()}>
              Retry
            </Button>
          }
        >
          Failed to load calendar data. Please try again.
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      bgcolor: 'background.default', 
      minHeight: '100vh',
      position: 'relative',
    }}>
      <Container maxWidth={maxWidth || 'xl'} sx={{ py: { xs: 2, md: 3 } }}>
        {/* Urgent Tasks Hero Section - Enhanced for calendar context */}
        {showUrgentHero && (
          <UrgentTasksHero 
            urgentItems={urgentItems}
            totalUrgent={totalUrgent}
            calendarItems={categorizedItems}
            onUrgentClick={(type) => {
              // Filter calendar to show relevant items
              const newFilters: CalendarFilters = {};
              if (type === 'overdue') {
                newFilters.includeOverdue = true;
              }
              setFilters(newFilters);
            }}
          />
        )}

        {/* Desktop: Split View Layout */}
        {!isMobile ? (
          <Grid container spacing={3}>
            {/* Left Column: Calendar */}
            <Grid item xs={12} lg={contextualPanelOpen ? 8 : 12}>
              <Fade in={calendarLoaded} timeout={800}>
                <Paper 
                  elevation={2}
                  sx={{ 
                    borderRadius: 3,
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {/* Calendar Header with View Controls */}
                  <Box sx={{ 
                    p: 3, 
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}10 0%, ${theme.palette.secondary.main}05 100%)`,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  }}>
                    <Stack 
                      direction="row" 
                      justifyContent="space-between" 
                      alignItems="center"
                      spacing={2}
                    >
                      {/* Calendar Title and Navigation */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ 
                          bgcolor: theme.palette.primary.main,
                          width: 48,
                          height: 48,
                        }}>
                          <CalendarIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
                            {currentDate.format('MMMM YYYY')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {categorizedItems.today.length} due today • {categorizedItems.thisWeek.length} this week
                          </Typography>
                        </Box>
                      </Box>

                      {/* View Toggle and Actions */}
                      <Stack direction="row" spacing={1}>
                        <Grow in={showViewToggle} timeout={600}>
                          <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <Stack direction="row">
                              {[
                                { type: 'day' as const, icon: <DayViewIcon />, label: 'Day' },
                                { type: 'week' as const, icon: <WeekViewIcon />, label: 'Week' },
                                { type: 'month' as const, icon: <MonthViewIcon />, label: 'Month' },
                              ].map(({ type, icon, label }) => (
                                <Tooltip key={type} title={label} placement="top">
                                  <IconButton
                                    onClick={() => handleViewChange(type)}
                                    sx={{
                                      borderRadius: 0,
                                      bgcolor: viewType === type ? theme.palette.primary.main : 'transparent',
                                      color: viewType === type ? 'white' : 'text.primary',
                                      '&:hover': {
                                        bgcolor: viewType === type 
                                          ? theme.palette.primary.dark 
                                          : theme.palette.action.hover,
                                      },
                                      transition: 'all 0.2s ease',
                                    }}
                                  >
                                    {icon}
                                  </IconButton>
                                </Tooltip>
                              ))}
                            </Stack>
                          </Paper>
                        </Grow>

                        <Grow in={showFilters} timeout={800}>
                          <Tooltip title="Filters" placement="top">
                            <IconButton 
                              onClick={() => {/* Open filters dialog */}}
                              sx={{
                                bgcolor: Object.keys(filters).length > 0 
                                  ? theme.palette.secondary.main 
                                  : 'background.paper',
                                color: Object.keys(filters).length > 0 ? 'white' : 'text.primary',
                                '&:hover': {
                                  transform: 'scale(1.05)',
                                },
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <Badge 
                                badgeContent={Object.keys(filters).length} 
                                color="error"
                                invisible={Object.keys(filters).length === 0}
                              >
                                <FilterIcon />
                              </Badge>
                            </IconButton>
                          </Tooltip>
                        </Grow>

                        <Tooltip title="Today" placement="top">
                          <IconButton 
                            onClick={() => setCurrentDate(dayjs())}
                            sx={{
                              bgcolor: 'background.paper',
                              '&:hover': {
                                transform: 'scale(1.05)',
                                bgcolor: theme.palette.primary.main,
                                color: 'white',
                              },
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <TodayIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Box>

                  {/* Calendar Content */}
                  <CalendarViewManager
                    items={calendarItems}
                    viewType={viewType}
                    currentDate={currentDate}
                    onDateChange={setCurrentDate}
                    onItemClick={handleItemClick}
                    onDateClick={handleDateClick}
                    onItemReschedule={handleItemReschedule}
                    filters={filters}
                    loading={calendarLoading}
                  />
                </Paper>
              </Fade>
            </Grid>

            {/* Right Column: Contextual Panel */}
            <Slide 
              direction="left" 
              in={contextualPanelOpen} 
              timeout={400}
              mountOnEnter 
              unmountOnExit
            >
              <Grid item xs={12} lg={4}>
                <ContextualPanel
                  selectedItem={selectedItem}
                  selectedDate={selectedDate}
                  calendarItems={calendarItems}
                  onClose={() => setContextualPanelOpen(false)}
                  onItemUpdate={(updatedItem) => {
                    // Handle item updates
                    queryClient.invalidateQueries({ queryKey: ['calendar-items'] });
                  }}
                />
              </Grid>
            </Slide>
          </Grid>
        ) : (
          /* Mobile: Stack View Layout */
          <Stack spacing={2}>
            {/* Mobile Calendar Header */}
            <Fade in={calendarLoaded} timeout={600}>
              <Card>
                <CardContent sx={{ pb: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {currentDate.format('MMM YYYY')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {categorizedItems.today.length} due today
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <IconButton 
                        size="small"
                        onClick={() => setCurrentDate(dayjs())}
                      >
                        <TodayIcon />
                      </IconButton>
                      <IconButton 
                        size="small"
                        onClick={() => {/* Open filters */}}
                      >
                        <Badge badgeContent={Object.keys(filters).length} color="error">
                          <FilterIcon />
                        </Badge>
                      </IconButton>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Fade>

            {/* Mobile Calendar View */}
            <Grow in={calendarLoaded} timeout={800}>
              <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <CalendarViewManager
                  items={calendarItems}
                  viewType={viewType}
                  currentDate={currentDate}
                  onDateChange={setCurrentDate}
                  onItemClick={handleItemClick}
                  onDateClick={handleDateClick}
                  onItemReschedule={handleItemReschedule}
                  filters={filters}
                  loading={calendarLoading}
                  mobile={true}
                />
              </Paper>
            </Grow>

            {/* Mobile Contextual Panel as Bottom Sheet */}
            <Slide direction="up" in={contextualPanelOpen} timeout={400}>
              <Paper 
                elevation={8}
                sx={{ 
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: theme.zIndex.modal,
                  borderRadius: '16px 16px 0 0',
                  maxHeight: '70vh',
                  overflow: 'auto',
                }}
              >
                <ContextualPanel
                  selectedItem={selectedItem}
                  selectedDate={selectedDate}
                  calendarItems={calendarItems}
                  onClose={() => setContextualPanelOpen(false)}
                  onItemUpdate={(updatedItem) => {
                    queryClient.invalidateQueries({ queryKey: ['calendar-items'] });
                  }}
                  mobile={true}
                />
              </Paper>
            </Slide>

            {/* Mobile Backdrop */}
            <Backdrop
              open={contextualPanelOpen}
              onClick={() => setContextualPanelOpen(false)}
              sx={{ zIndex: theme.zIndex.modal - 1 }}
            />
          </Stack>
        )}

        {/* Quick Actions FAB */}
        {showQuickActions && (
          <QuickActionsFab 
            actions={quickActions}
            selectedDate={selectedDate}
            onActionComplete={() => {
              refetchCalendar();
            }}
          />
        )}
      </Container>

      {/* Loading overlay for data refresh */}
      <Backdrop
        open={calendarLoading && calendarItems.length > 0}
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
        }}
      >
        <CircularProgress color="primary" />
      </Backdrop>
    </Box>
  );
};

export default CalendarDashboard;