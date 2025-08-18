import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Grid,
  useTheme,
  Card,
  CardContent,
  Fade,
  Grow,
  Skeleton,
  useMediaQuery,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today as TodayIcon,
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import CalendarDay from './CalendarDay';
import CalendarFilters from './CalendarFilters';
import PMDetailsModal from './PMDetailsModal';
import { PMScheduleItem, CalendarFilters as FilterType, PMCalendarProps } from '../../types/pmCalendar';

const PMCalendar: React.FC<PMCalendarProps> = ({
  pmSchedules = [],
  onPMClick,
  onPMReschedule,
  onDateClick,
  filters: externalFilters,
  onFiltersChange,
  loading = false,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [selectedPM, setSelectedPM] = useState<PMScheduleItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [internalFilters, setInternalFilters] = useState<FilterType>({
    assetTypes: [],
    technicians: [],
    locations: [],
    taskTypes: [],
    priorities: [],
    showOverdueOnly: false,
  });

  const filters = externalFilters || internalFilters;

  const handleFiltersChange = useCallback((newFilters: FilterType) => {
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    } else {
      setInternalFilters(newFilters);
    }
  }, [onFiltersChange]);

  // Filter PM schedules based on current filters
  const filteredPMSchedules = useMemo(() => {
    return pmSchedules.filter(pm => {
      if (filters.assetTypes.length > 0 && !filters.assetTypes.includes(pm.assetName)) return false;
      if (filters.technicians.length > 0 && pm.assignedTechnician && !filters.technicians.includes(pm.assignedTechnician)) return false;
      if (filters.locations.length > 0 && !filters.locations.includes(pm.location)) return false;
      if (filters.taskTypes.length > 0 && !filters.taskTypes.includes(pm.taskType)) return false;
      if (filters.priorities.length > 0 && !filters.priorities.includes(pm.priority)) return false;
      if (filters.showOverdueOnly && !pm.isOverdue) return false;
      
      return true;
    });
  }, [pmSchedules, filters]);

  // Generate calendar grid
  const calendarGrid = useMemo(() => {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const startOfWeek = startOfMonth.startOf('week');
    const endOfWeek = endOfMonth.endOf('week');

    const days: Dayjs[] = [];
    let current = startOfWeek;

    while (current.isBefore(endOfWeek) || current.isSame(endOfWeek, 'day')) {
      days.push(current);
      current = current.add(1, 'day');
    }

    // Group days into weeks
    const weeks: Dayjs[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return weeks;
  }, [currentDate]);

  // Get PM items for a specific date
  const getPMsForDate = useCallback((date: Dayjs) => {
    return filteredPMSchedules.filter(pm => 
      dayjs(pm.scheduledDate).isSame(date, 'day')
    );
  }, [filteredPMSchedules]);

  const handlePreviousMonth = () => {
    setCurrentDate(prev => prev.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => prev.add(1, 'month'));
  };

  const handleToday = () => {
    setCurrentDate(dayjs());
  };

  const handlePMClick = (pm: PMScheduleItem) => {
    setSelectedPM(pm);
    setDetailModalOpen(true);
    onPMClick?.(pm);
  };

  const handleDateClick = (date: Dayjs) => {
    onDateClick?.(date.toDate());
  };

  const handlePMReschedule = (pmId: number, newDate: Date) => {
    onPMReschedule?.(pmId, newDate);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          borderRadius: 3,
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
        </Box>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
        </Box>
        <Grid container spacing={1}>
          {Array.from({ length: 42 }).map((_, index) => (
            <Grid xs={12/7} key={index}>
              <Skeleton 
                variant="rectangular" 
                height={120} 
                sx={{ borderRadius: 1 }} 
              />
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Calendar Header */}
      <Fade in timeout={600}>
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}10 100%)`,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 2,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 2 : 0,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography 
                variant={isMobile ? "h5" : "h4"} 
                sx={{ 
                  fontWeight: 700,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textAlign: isMobile ? 'center' : 'left',
                }}
              >
                {currentDate.format(isMobile ? 'MMM YYYY' : 'MMMM YYYY')}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton 
                onClick={handleToday}
                aria-label="Go to today"
                sx={{
                  borderRadius: 2,
                  background: theme.palette.background.paper,
                  '&:hover': {
                    background: theme.palette.action.hover,
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <TodayIcon />
              </IconButton>
              <IconButton 
                onClick={handlePreviousMonth}
                aria-label={`Go to ${currentDate.subtract(1, 'month').format('MMMM YYYY')}`}
                sx={{
                  borderRadius: 2,
                  background: theme.palette.background.paper,
                  '&:hover': {
                    background: theme.palette.action.hover,
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ChevronLeft />
              </IconButton>
              <IconButton 
                onClick={handleNextMonth}
                aria-label={`Go to ${currentDate.add(1, 'month').format('MMMM YYYY')}`}
                sx={{
                  borderRadius: 2,
                  background: theme.palette.background.paper,
                  '&:hover': {
                    background: theme.palette.action.hover,
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ChevronRight />
              </IconButton>
            </Box>
          </Box>

          {/* Filters */}
          <CalendarFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            pmSchedules={pmSchedules}
          />
        </Paper>
      </Fade>

      {/* Calendar Grid */}
      <Grow in timeout={800}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            borderRadius: 3,
            background: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
          }}
          role="grid"
          aria-label={`PM Calendar for ${currentDate.format('MMMM YYYY')}`}
        >
          {/* Week Day Headers */}
          <Grid container spacing={1} sx={{ mb: 1 }} role="row">
            {weekDays.map((day) => (
              <Grid xs={12/7} key={day}>
                <Box
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    backgroundColor: theme.palette.background.default,
                    borderRadius: 2,
                  }}
                  role="columnheader"
                  aria-label={day}
                >
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 600,
                      color: theme.palette.text.secondary,
                    }}
                  >
                    {day}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Calendar Days */}
          {calendarGrid.map((week, weekIndex) => (
            <Grid container spacing={1} key={weekIndex} sx={{ mb: 1 }}>
              {week.map((day, dayIndex) => (
                <Grid xs={12/7} key={day.format('YYYY-MM-DD')}>
                  <CalendarDay
                    date={day}
                    isCurrentMonth={day.month() === currentDate.month()}
                    isToday={day.isSame(dayjs(), 'day')}
                    pmItems={getPMsForDate(day)}
                    onPMClick={handlePMClick}
                    onDateClick={handleDateClick}
                    onPMReschedule={handlePMReschedule}
                  />
                </Grid>
              ))}
            </Grid>
          ))}
        </Paper>
      </Grow>

      {/* PM Detail Modal */}
      <PMDetailsModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        pm={selectedPM}
        onEdit={(pm) => {
          setDetailModalOpen(false);
          navigate(`/maintenance/schedules/${pm.id}/edit`);
        }}
        onComplete={(pmId) => {
          // TODO: Call API to mark PM as complete
          console.log('Complete PM:', pmId);
          setDetailModalOpen(false);
        }}
        onPostpone={(pmId, newDate) => {
          handlePMReschedule(pmId, newDate);
          setDetailModalOpen(false);
        }}
        onCancel={(pmId) => {
          // TODO: Call API to cancel PM
          console.log('Cancel PM:', pmId);
          setDetailModalOpen(false);
        }}
        onViewWorkOrder={(workOrderId) => {
          setDetailModalOpen(false);
          navigate(`/work-orders/${workOrderId}`);
        }}
        onCreateWorkOrder={(pmId) => {
          setDetailModalOpen(false);
          navigate(`/work-orders/new?pmId=${pmId}`);
        }}
        onViewAsset={(assetId) => {
          setDetailModalOpen(false);
          navigate(`/assets/${assetId}`);
        }}
      />
    </Box>
  );
};

export default PMCalendar;