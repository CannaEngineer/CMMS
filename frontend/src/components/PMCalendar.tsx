import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  IconButton,
  Grid,
  useTheme,
  useMediaQuery,
  Chip,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Fade,
} from '@mui/material';
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

export interface PMScheduleEvent {
  id: string;
  title: string;
  assetName: string;
  assetId: number;
  scheduledDate: Date;
  estimatedDuration: number;
  priority: string;
  criticality: string;
  taskType: string;
  assignedTechnician?: string;
  location: string;
  isOverdue: boolean;
  description?: string;
  status: string;
}

interface PMCalendarProps {
  pmSchedules: PMScheduleEvent[];
  onPMClick: (pm: PMScheduleEvent) => void;
  onDateClick: (date: Date) => void;
  loading?: boolean;
}

export function PMCalendar({
  pmSchedules,
  onPMClick,
  onDateClick,
  loading = false
}: PMCalendarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [dayDetailDialog, setDayDetailDialog] = useState<{
    open: boolean;
    date: Dayjs | null;
    items: PMScheduleEvent[];
  }>({
    open: false,
    date: null,
    items: [],
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

  // Group PM schedules by date
  const itemsByDate = useMemo(() => {
    const grouped: Record<string, PMScheduleEvent[]> = {};
    
    pmSchedules.forEach(item => {
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
        const priorityOrder: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    });

    return grouped;
  }, [pmSchedules]);

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
  const handleItemClick = useCallback((item: PMScheduleEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onPMClick(item);
  }, [onPMClick]);

  const handleDateClick = useCallback((date: Dayjs) => {
    onDateClick(date.toDate());
  }, [onDateClick]);

  // Handler for opening day detail dialog when "+X more" is clicked
  const handleShowMoreClick = useCallback((date: Dayjs, items: PMScheduleEvent[], e: React.MouseEvent) => {
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

  // Get color for PM schedule item
  const getItemColor = useCallback((item: PMScheduleEvent) => {
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

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        height: 600,
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
                        minHeight: { xs: isMobile ? 100 : 80, sm: 100, md: 120 },
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
                      
                      {/* PM Schedule Items */}
                      <Box sx={{ flex: 1, overflow: 'hidden' }}>
                        {dayItems.slice(0, isMobile ? 2 : 3).map((item, idx) => (
                          <Fade key={`${item.id}-${idx}`} in timeout={300 + idx * 100}>
                            <Tooltip 
                              title={`${item.title} - ${item.assetName}${item.isOverdue ? ' (OVERDUE)' : ''}`}
                              placement="top"
                            >
                              <Chip
                                icon={<PMIcon />}
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
                          <Button
                            size="small"
                            variant="text"
                            sx={{ 
                              color: 'primary.main', 
                              fontSize: { xs: '0.55rem', sm: '0.65rem' },
                              fontWeight: 600,
                              minHeight: 'auto',
                              padding: '2px 4px',
                              textTransform: 'none',
                              width: '100%',
                              mt: 0.25,
                              '&:hover': {
                                backgroundColor: 'primary.light',
                                transform: 'scale(1.05)',
                              },
                              transition: 'all 0.2s ease',
                            }}
                            onClick={(e) => handleShowMoreClick(day, dayItems, e)}
                          >
                            +{dayItems.length - (isMobile ? 2 : 3)} more
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
              {dayDetailDialog.items.length} PM schedule{dayDetailDialog.items.length === 1 ? '' : 's'}
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
              <React.Fragment key={`${item.id}-${index}`}>
                <ListItemButton
                  onClick={() => {
                    handleCloseDayDetail();
                    onPMClick(item);
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
                      <PMIcon />
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
                          Preventive Maintenance • {item.assetName}
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
                          
                          {item.assignedTechnician && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {item.assignedTechnician}
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
                onDateClick(dayDetailDialog.date.toDate());
              }
            }}
            sx={{ borderRadius: 2 }}
          >
            Schedule New PM
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}