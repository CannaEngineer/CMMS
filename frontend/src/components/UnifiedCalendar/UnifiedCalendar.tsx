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
  Fade,
  Grow,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  ListItemButton,
  Skeleton,
} from '@mui/material';
import { LoadingSpinner, LoadingBar } from '../Loading';
import {
  ChevronLeft,
  ChevronRight,
  Today as TodayIcon,
  Schedule as PMIcon,
  Assignment as WorkOrderIcon,
  Close as CloseIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
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
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [dayDetailDialog, setDayDetailDialog] = useState<{
    open: boolean;
    date: Dayjs | null;
    items: CalendarItem[];
  }>({
    open: false,
    date: null,
    items: [],
  });

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

  // Handler for opening day detail dialog when "+X more" is clicked
  const handleShowMoreClick = useCallback((date: Dayjs, items: CalendarItem[], e: React.MouseEvent) => {
    e.stopPropagation();
    setDayDetailDialog({
      open: true,
      date,
      items,
    });
  }, []);

  // Handler for closing day detail dialog
  const handleCloseDayDetail = useCallback(() => {
    setDayDetailDialog({
      open: false,
      date: null,
      items: [],
    });
  }, []);

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
    <Grow in timeout={800}>
      <Paper 
        elevation={3} 
        sx={{ 
          height: isMobile ? 'fit-content' : height,
          minHeight: isMobile ? 500 : height,
          maxHeight: isMobile ? '80vh' : height,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: isMobile ? 2 : 3,
          background: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          // Mobile-first improvements
          ...(isMobile && {
            mx: -1, // Extend to screen edges on mobile
            borderRadius: 0,
            border: 'none',
            boxShadow: 'none',
          }),
        }}
      >
        {/* Calendar Header - Matching PM Calendar Style */}
        <Box sx={{ 
          p: { xs: 2, sm: 3 }, 
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}10 100%)`,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0,
        }}>
          <Typography 
            variant={isSmallMobile ? "h6" : isMobile ? "h5" : "h4"} 
            sx={{ 
              fontWeight: 700,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: isMobile ? 'center' : 'left',
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
            }}
          >
            {currentDate.format(isSmallMobile ? 'MMM YY' : isMobile ? 'MMM YYYY' : 'MMMM YYYY')}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              onClick={handleToday}
              aria-label="Go to today"
              sx={{
                borderRadius: 2,
                background: theme.palette.background.paper,
                minWidth: { xs: 44, sm: 48 },
                minHeight: { xs: 44, sm: 48 },
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
                minWidth: { xs: 44, sm: 48 },
                minHeight: { xs: 44, sm: 48 },
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
                minWidth: { xs: 44, sm: 48 },
                minHeight: { xs: 44, sm: 48 },
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
      </Box>

      {/* Calendar Body */}
      <Box sx={{ 
        flex: 1, 
        p: { xs: 1, sm: 2 }, 
        overflow: 'hidden',
        // Better mobile scrolling
        ...(isMobile && {
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }),
      }}>
        {isLoading_combined ? (
          <Box sx={{ p: 3 }}>
            <LoadingBar progress={undefined} sx={{ mb: 2 }} />
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
          </Box>
        ) : (
          <>
            {/* Week Day Headers - Matching PM Calendar Style */}
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

            {/* Calendar Grid */}
            <Box sx={{ 
              flex: 1, 
              overflow: 'auto',
              // Ensure proper height calculation on mobile
              ...(isMobile && {
                minHeight: 400,
                height: 'auto',
              }),
            }}>
              {calendarGrid.map((week, weekIndex) => (
                <Grid 
                  container 
                  spacing={isMobile ? 0.5 : 1}
                  key={weekIndex} 
                  sx={{ 
                    mb: { xs: 0.5, sm: 1 }, 
                    height: isMobile ? 'auto' : `${100 / calendarGrid.length}%`,
                    minHeight: { xs: isSmallMobile ? 80 : 100, sm: 100, md: 120 },
                    // Ensure consistent row heights on mobile
                    ...(isMobile && {
                      flex: '1 0 auto',
                    }),
                  }}
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
                            minHeight: { 
                              xs: isSmallMobile ? 80 : 100, 
                              sm: 100, 
                              md: 120 
                            },
                            p: { xs: 0.5, sm: 1 },
                            bgcolor: isCurrentMonth 
                              ? (isToday ? 'primary.light' : 'background.paper')
                              : 'grey.50',
                            border: isToday ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                            borderColor: isToday ? 'primary.main' : 'divider',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out',
                            // Enhanced touch targets for mobile
                            WebkitTapHighlightColor: 'transparent',
                            touchAction: 'manipulation',
                            // Better mobile interactions
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            '&:hover': {
                              bgcolor: isCurrentMonth ? 'action.hover' : 'grey.100',
                              transform: isMobile ? 'scale(1.02)' : 'translateY(-1px)',
                              boxShadow: 2,
                            },
                            '&:active': {
                              transform: 'scale(0.98)',
                            },
                            display: 'flex',
                            flexDirection: 'column',
                            opacity: isCurrentMonth ? 1 : 0.6,
                            // Improved mobile borders
                            ...(isMobile && {
                              borderRadius: 1,
                              border: isToday ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                              borderColor: isToday ? 'primary.main' : 'divider',
                            }),
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
                                fontSize: { 
                                  xs: isSmallMobile ? '0.7rem' : '0.75rem', 
                                  sm: '0.875rem' 
                                },
                                lineHeight: 1.2,
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
                            {dayItems.slice(0, isSmallMobile ? 1 : isMobile ? 2 : 3).map((item, idx) => (
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
                                      minHeight: { xs: 20, sm: 24 },
                                      mb: 0.25,
                                      fontSize: { 
                                        xs: isSmallMobile ? '0.5rem' : '0.55rem', 
                                        sm: '0.65rem' 
                                      },
                                      bgcolor: getItemColor(item),
                                      color: 'white',
                                      borderRadius: isMobile ? 1 : 2,
                                      '& .MuiChip-label': {
                                        display: 'block',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '100%',
                                        px: { xs: 0.25, sm: 0.5 },
                                        py: { xs: 0.1, sm: 0.25 },
                                      },
                                      '& .MuiChip-icon': {
                                        color: 'white',
                                        fontSize: { xs: '0.6rem', sm: '0.75rem' },
                                        ml: { xs: 0.25, sm: 0.5 },
                                      },
                                      '&:hover': {
                                        transform: 'scale(1.02)',
                                        boxShadow: 2,
                                      },
                                      transition: 'all 0.2s ease-in-out',
                                      // Better mobile touch targets
                                      WebkitTapHighlightColor: 'transparent',
                                    }}
                                  />
                                </Tooltip>
                              </Fade>
                            ))}
                            
                            {dayItems.length > (isSmallMobile ? 1 : isMobile ? 2 : 3) && (
                              <Button
                                size="small"
                                variant="text"
                                sx={{ 
                                  color: 'primary.main', 
                                  fontSize: { 
                                    xs: isSmallMobile ? '0.5rem' : '0.55rem', 
                                    sm: '0.65rem' 
                                  },
                                  fontWeight: 600,
                                  minHeight: { xs: 20, sm: 24 },
                                  padding: { xs: '1px 2px', sm: '2px 4px' },
                                  textTransform: 'none',
                                  width: '100%',
                                  mt: 0.25,
                                  borderRadius: isMobile ? 1 : 2,
                                  '&:hover': {
                                    backgroundColor: 'primary.light',
                                    transform: 'scale(1.05)',
                                  },
                                  transition: 'all 0.2s ease',
                                  // Better mobile touch targets
                                  WebkitTapHighlightColor: 'transparent',
                                }}
                                onClick={(e) => handleShowMoreClick(day, dayItems, e)}
                              >
                                +{dayItems.length - (isSmallMobile ? 1 : isMobile ? 2 : 3)} more
                              </Button>
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

      {/* Day Detail Dialog */}
      <Dialog
        open={dayDetailDialog.open}
        onClose={handleCloseDayDetail}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'white',
          borderRadius: '12px 12px 0 0',
        }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {dayDetailDialog.date?.format('MMMM D, YYYY')}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {dayDetailDialog.items.length} {dayDetailDialog.items.length === 1 ? 'item' : 'items'} scheduled
            </Typography>
          </Box>
          <IconButton 
            onClick={handleCloseDayDetail}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0, maxHeight: '60vh' }}>
          <List>
            {dayDetailDialog.items.map((item, index) => (
              <React.Fragment key={`${item.id}-${item.type}-${index}`}>
                <ListItemButton
                  onClick={() => {
                    handleCloseDayDetail();
                    onItemClick?.(item);
                  }}
                  sx={{
                    py: 2,
                    px: 3,
                    '&:hover': {
                      bgcolor: 'action.hover',
                      transform: 'translateX(4px)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ListItemIcon>
                    <Avatar
                      sx={{
                        bgcolor: getItemColor(item),
                        width: 40,
                        height: 40,
                      }}
                    >
                      {getItemIcon(item)}
                    </Avatar>
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="body1" fontWeight={600}>
                          {item.title}
                        </Typography>
                        {item.isOverdue && (
                          <Chip 
                            label="OVERDUE" 
                            size="small" 
                            color="error"
                            sx={{ 
                              height: 20,
                              fontSize: '0.6rem',
                              fontWeight: 600,
                            }}
                          />
                        )}
                        <Chip 
                          label={item.priority} 
                          size="small" 
                          variant="outlined"
                          sx={{ 
                            height: 20,
                            fontSize: '0.6rem',
                            borderColor: getItemColor(item),
                            color: getItemColor(item),
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {item.type === 'PM_SCHEDULE' ? 'Preventive Maintenance' : 'Work Order'} • {item.assetName || 'No asset'}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          {item.location && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocationIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {item.location}
                              </Typography>
                            </Box>
                          )}
                          
                          {item.assignedTo && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {item.assignedTo}
                              </Typography>
                            </Box>
                          )}
                          
                          {item.estimatedDuration && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {item.estimatedDuration} min
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    }
                  />
                </ListItemButton>
                
                {index < dayDetailDialog.items.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={handleCloseDayDetail}>
            Close
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              handleCloseDayDetail();
              if (dayDetailDialog.date) {
                onDateClick?.(dayDetailDialog.date.toDate());
              }
            }}
            sx={{ borderRadius: 2 }}
          >
            Add New Task
          </Button>
        </DialogActions>
      </Dialog>
      </Paper>
    </Grow>
  );
};

export default UnifiedCalendar;