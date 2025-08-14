import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Grid,
  useTheme,
  useMediaQuery,
  Chip,
  Tooltip,
  Button,
  CircularProgress,
  Fade,
  Grow,
  Alert,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today as TodayIcon,
  Schedule as PMIcon,
  Assignment as WorkOrderIcon,
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { calendarService } from '../../services/api';
import { CalendarItem, CalendarFilters, UnifiedCalendarProps } from '../../types/calendar';

const UnifiedCalendar: React.FC<UnifiedCalendarProps> = ({
  filters = {},
  onFiltersChange,
  onItemClick,
  onDateClick,
  onItemReschedule,
  loading: externalLoading = false,
  height = 600,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Fetch calendar data
  const { data: calendarItems = [], isLoading, error, refetch } = useQuery({
    queryKey: ['calendar-items', currentDate.format('YYYY-MM'), filters],
    queryFn: async () => {
      const startOfMonth = currentDate.startOf('month').startOf('week');
      const endOfMonth = currentDate.endOf('month').endOf('week');
      
      return calendarService.getCalendarItems({
        ...filters,
        startDate: startOfMonth.toDate(),
        endDate: endOfMonth.toDate(),
      });
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  });

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

  // Group calendar items by date
  const itemsByDate = useMemo(() => {
    const grouped: Record<string, CalendarItem[]> = {};
    
    calendarItems.forEach(item => {
      const dateKey = dayjs(item.scheduledDate).format('YYYY-MM-DD');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });

    // Sort items within each date by priority and overdue status
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => {
        // Overdue items first
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        
        // Then by priority
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    });

    return grouped;
  }, [calendarItems]);

  // Navigation handlers
  const handlePreviousMonth = useCallback(() => {
    setCurrentDate(prev => prev.subtract(1, 'month'));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(prev => prev.add(1, 'month'));
  }, []);

  const handleToday = useCallback(() => {
    setCurrentDate(dayjs());
  }, []);

  // Item interaction handlers
  const handleItemClick = useCallback((item: CalendarItem, e: React.MouseEvent) => {
    e.stopPropagation();
    onItemClick?.(item);
  }, [onItemClick]);

  const handleDateClick = useCallback((date: Dayjs) => {
    onDateClick?.(date.toDate());
  }, [onDateClick]);

  // Get items for a specific date
  const getItemsForDate = useCallback((date: Dayjs) => {
    const dateKey = date.format('YYYY-MM-DD');
    return itemsByDate[dateKey] || [];
  }, [itemsByDate]);

  // Get color for calendar item
  const getItemColor = useCallback((item: CalendarItem) => {
    if (item.isOverdue) return theme.palette.error.main;
    
    switch (item.priority) {
      case 'URGENT':
        return theme.palette.error.main;
      case 'HIGH':
        return theme.palette.warning.main;
      case 'MEDIUM':
        return theme.palette.info.main;
      case 'LOW':
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  }, [theme]);

  // Get icon for calendar item type
  const getItemIcon = useCallback((item: CalendarItem) => {
    return item.type === 'PM_SCHEDULE' ? <PMIcon /> : <WorkOrderIcon />;
  }, []);

  const isLoading_combined = isLoading || externalLoading;

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load calendar data. Please try again.
        </Alert>
        <Button onClick={() => refetch()} variant="contained">
          Retry
        </Button>
      </Paper>
    );
  }

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        height,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      {/* Calendar Header */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'primary.main',
        color: 'white',
        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0,
        }}>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            sx={{ 
              fontWeight: 700,
              textAlign: isMobile ? 'center' : 'left',
            }}
          >
            {currentDate.format(isMobile ? 'MMM YYYY' : 'MMMM YYYY')}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              onClick={handleToday}
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              }}
            >
              <TodayIcon />
            </IconButton>
            <IconButton 
              onClick={handlePreviousMonth}
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              }}
            >
              <ChevronLeft />
            </IconButton>
            <IconButton 
              onClick={handleNextMonth}
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              }}
            >
              <ChevronRight />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Calendar Body */}
      <Box sx={{ flex: 1, p: 2, overflow: 'hidden' }}>
        {isLoading_combined ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%' 
          }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Week Day Headers */}
            <Grid container sx={{ mb: 1 }}>
              {weekDays.map((day) => (
                <Grid xs={12/7} key={day}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    p: 1,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                  }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 600,
                        color: 'text.secondary',
                      }}
                    >
                      {day}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Calendar Grid */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {calendarGrid.map((week, weekIndex) => (
                <Grid 
                  container 
                  key={weekIndex} 
                  sx={{ mb: 1, height: `${100 / calendarGrid.length}%` }}
                >
                  {week.map((day) => {
                    const isCurrentMonth = day.month() === currentDate.month();
                    const isToday = day.isSame(dayjs(), 'day');
                    const dayItems = getItemsForDate(day);
                    const dateKey = day.format('YYYY-MM-DD');
                    const isHovered = hoveredDate === dateKey;

                    return (
                      <Grid xs={12/7} key={day.format('YYYY-MM-DD')}>
                        <Paper
                          elevation={isHovered ? 3 : 1}
                          sx={{
                            height: '100%',
                            minHeight: { xs: 80, sm: 100 },
                            p: { xs: 0.5, sm: 1 },
                            bgcolor: isCurrentMonth 
                              ? (isToday ? 'primary.light' : 'background.paper')
                              : 'grey.50',
                            border: isToday ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                            borderColor: isToday ? 'primary.main' : 'divider',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              bgcolor: isCurrentMonth ? 'action.hover' : 'grey.100',
                              transform: 'translateY(-1px)',
                              boxShadow: 2,
                            },
                            display: 'flex',
                            flexDirection: 'column',
                            opacity: isCurrentMonth ? 1 : 0.6,
                          }}
                          onClick={() => handleDateClick(day)}
                          onMouseEnter={() => setHoveredDate(dateKey)}
                          onMouseLeave={() => setHoveredDate(null)}
                        >
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            mb: 0.5,
                          }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: isToday ? 'bold' : 'normal',
                                color: isCurrentMonth 
                                  ? (isToday ? 'white' : 'text.primary') 
                                  : 'text.disabled',
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              }}
                            >
                              {day.format('D')}
                            </Typography>
                            {dayItems.length > 0 && (
                              <Chip
                                label={dayItems.length}
                                size="small"
                                sx={{
                                  height: 16,
                                  fontSize: '0.6rem',
                                  bgcolor: dayItems.some(item => item.isOverdue) 
                                    ? 'error.main' 
                                    : 'primary.light',
                                  color: 'white',
                                  minWidth: 16,
                                }}
                              />
                            )}
                          </Box>
                          
                          {/* Calendar Items */}
                          <Box sx={{ flex: 1, overflow: 'hidden' }}>
                            {dayItems.slice(0, isMobile ? 2 : 3).map((item, idx) => (
                              <Fade key={`${item.id}-${item.type}`} in timeout={300 + idx * 100}>
                                <Tooltip 
                                  title={`${item.title} (${item.type === 'PM_SCHEDULE' ? 'PM' : 'WO'})${item.isOverdue ? ' - OVERDUE' : ''}`}
                                  placement="top"
                                >
                                  <Chip
                                    icon={getItemIcon(item)}
                                    label={item.title}
                                    size="small"
                                    onClick={(e) => handleItemClick(item, e)}
                                    sx={{
                                      width: '100%',
                                      height: 'auto',
                                      mb: 0.25,
                                      fontSize: { xs: '0.55rem', sm: '0.65rem' },
                                      bgcolor: getItemColor(item),
                                      color: 'white',
                                      '& .MuiChip-label': {
                                        display: 'block',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '100%',
                                        px: 0.5,
                                      },
                                      '& .MuiChip-icon': {
                                        color: 'white',
                                        fontSize: '0.75rem',
                                      },
                                      '&:hover': {
                                        transform: 'scale(1.02)',
                                        boxShadow: 2,
                                      },
                                      transition: 'all 0.2s ease-in-out',
                                    }}
                                  />
                                </Tooltip>
                              </Fade>
                            ))}
                            
                            {dayItems.length > (isMobile ? 2 : 3) && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: 'text.secondary', 
                                  fontSize: { xs: '0.6rem', sm: '0.7rem' },
                                  display: 'block',
                                  textAlign: 'center',
                                  mt: 0.5,
                                }}
                              >
                                +{dayItems.length - (isMobile ? 2 : 3)} more
                              </Typography>
                            )}
                          </Box>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              ))}
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
};

export default UnifiedCalendar;