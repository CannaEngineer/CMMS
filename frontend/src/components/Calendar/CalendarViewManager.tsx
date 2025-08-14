import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  useTheme,
  Fade,
  Grow,
  Zoom,
  Collapse,
  Avatar,
  Stack,
  Tooltip,
  Badge,
  LinearProgress,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Schedule as ScheduleIcon,
  Assignment as WorkOrderIcon,
  Warning as WarningIcon,
  CheckCircle as CompletedIcon,
  PlayCircle as InProgressIcon,
  PauseCircle as PausedIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarItem, CalendarFilters } from '../../types/calendar';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CalendarViewManagerProps {
  items: CalendarItem[];
  viewType: 'day' | 'week' | 'month';
  currentDate: Dayjs;
  onDateChange: (date: Dayjs) => void;
  onItemClick: (item: CalendarItem) => void;
  onDateClick: (date: Dayjs) => void;
  onItemReschedule: (itemId: number, newDate: Date) => void;
  filters: CalendarFilters;
  loading?: boolean;
  mobile?: boolean;
}

interface CalendarDayData {
  date: Dayjs;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  items: CalendarItem[];
}

const CalendarViewManager: React.FC<CalendarViewManagerProps> = ({
  items,
  viewType,
  currentDate,
  onDateChange,
  onItemClick,
  onDateClick,
  onItemReschedule,
  filters,
  loading = false,
  mobile = false,
}) => {
  const theme = useTheme();
  const dragCounterRef = useRef(0);
  const [draggedItem, setDraggedItem] = useState<CalendarItem | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Dayjs | null>(null);
  const [animatingItems, setAnimatingItems] = useState<Set<number>>(new Set());

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Generate calendar data based on view type
  const calendarData = useMemo(() => {
    const data: CalendarDayData[] = [];
    let startDate: Dayjs;
    let endDate: Dayjs;
    
    switch (viewType) {
      case 'day':
        startDate = currentDate.startOf('day');
        endDate = currentDate.endOf('day');
        data.push({
          date: currentDate,
          isCurrentMonth: true,
          isToday: currentDate.isSame(dayjs(), 'day'),
          isWeekend: [0, 6].includes(currentDate.day()),
          items: items.filter(item => dayjs(item.scheduledDate).isSame(currentDate, 'day')),
        });
        break;
        
      case 'week':
        startDate = currentDate.startOf('week');
        endDate = currentDate.endOf('week');
        for (let i = 0; i < 7; i++) {
          const date = startDate.add(i, 'day');
          data.push({
            date,
            isCurrentMonth: date.month() === currentDate.month(),
            isToday: date.isSame(dayjs(), 'day'),
            isWeekend: [0, 6].includes(date.day()),
            items: items.filter(item => dayjs(item.scheduledDate).isSame(date, 'day')),
          });
        }
        break;
        
      case 'month':
      default:
        startDate = currentDate.startOf('month').startOf('week');
        endDate = currentDate.endOf('month').endOf('week');
        let current = startDate;
        
        while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
          data.push({
            date: current,
            isCurrentMonth: current.month() === currentDate.month(),
            isToday: current.isSame(dayjs(), 'day'),
            isWeekend: [0, 6].includes(current.day()),
            items: items.filter(item => dayjs(item.scheduledDate).isSame(current, 'day')),
          });
          current = current.add(1, 'day');
        }
        break;
    }
    
    return data;
  }, [items, viewType, currentDate]);

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    const unit = viewType === 'day' ? 'day' : viewType === 'week' ? 'week' : 'month';
    onDateChange(currentDate.subtract(1, unit));
  }, [currentDate, viewType, onDateChange]);

  const handleNext = useCallback(() => {
    const unit = viewType === 'day' ? 'day' : viewType === 'week' ? 'week' : 'month';
    onDateChange(currentDate.add(1, unit));
  }, [currentDate, viewType, onDateChange]);

  // Drag and drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const itemId = parseInt(event.active.id as string);
    const item = items.find(i => i.id === itemId);
    if (item) {
      setDraggedItem(item);
    }
  }, [items]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setDraggedItem(null);
    setDragOverDate(null);

    const { active, over } = event;
    if (!over) return;

    const itemId = parseInt(active.id as string);
    const newDateStr = over.id as string;
    const newDate = dayjs(newDateStr);

    if (newDate.isValid()) {
      // Add animation effect
      setAnimatingItems(prev => new Set([...prev, itemId]));
      
      // Call reschedule handler
      onItemReschedule(itemId, newDate.toDate());
      
      // Remove animation after delay
      setTimeout(() => {
        setAnimatingItems(prev => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }, 1000);
    }
  }, [onItemReschedule]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      const dateStr = over.id as string;
      const date = dayjs(dateStr);
      if (date.isValid()) {
        setDragOverDate(date);
      }
    } else {
      setDragOverDate(null);
    }
  }, []);

  // Sortable item component
  const SortableItemComponent = ({ item, isDragEnabled = true }: { 
    item: CalendarItem; 
    isDragEnabled?: boolean;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.id.toString() });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div ref={setNodeRef} style={style}>
        <ItemComponent 
          item={item} 
          isDragEnabled={isDragEnabled && !mobile}
          isDragging={isDragging}
          dragHandleProps={{ ...attributes, ...listeners }}
        />
      </div>
    );
  };

  // Item component with enhanced animations
  const ItemComponent = React.memo(({ item, isDragEnabled = true, isDragging = false, dragHandleProps }: { 
    item: CalendarItem; 
    isDragEnabled?: boolean;
    isDragging?: boolean;
    dragHandleProps?: any;
  }) => {
    const isAnimating = animatingItems.has(item.id);
    const [hovered, setHovered] = useState(false);
    
    const getItemColor = () => {
      if (item.isOverdue) return theme.palette.error.main;
      switch (item.type) {
        case 'PM_SCHEDULE':
          return theme.palette.info.main;
        case 'WORK_ORDER':
          switch (item.status) {
            case 'COMPLETED': return theme.palette.success.main;
            case 'IN_PROGRESS': return theme.palette.warning.main;
            case 'ON_HOLD': return theme.palette.grey[500];
            default: return theme.palette.primary.main;
          }
        default:
          return theme.palette.primary.main;
      }
    };

    const getItemIcon = () => {
      switch (item.type) {
        case 'PM_SCHEDULE':
          return <ScheduleIcon fontSize="small" />;
        case 'WORK_ORDER':
          switch (item.status) {
            case 'COMPLETED': return <CompletedIcon fontSize="small" />;
            case 'IN_PROGRESS': return <InProgressIcon fontSize="small" />;
            case 'ON_HOLD': return <PausedIcon fontSize="small" />;
            default: return <WorkOrderIcon fontSize="small" />;
          }
        default:
          return <ScheduleIcon fontSize="small" />;
      }
    };

    const ItemCard = () => (
      <Card
        sx={{
          mb: 1,
          cursor: 'pointer',
          borderLeft: `4px solid ${getItemColor()}`,
          backgroundColor: isAnimating 
            ? `${getItemColor()}20` 
            : hovered 
              ? `${getItemColor()}10` 
              : 'background.paper',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: hovered 
            ? `0 4px 20px ${getItemColor()}30`
            : theme.shadows[1],
          '&:hover': {
            '& .drag-handle': {
              opacity: 1,
            },
          },
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onItemClick(item)}
      >
        <CardContent sx={{ 
          p: mobile ? 1.5 : 2, 
          '&:last-child': { pb: mobile ? 1.5 : 2 },
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}>
          {/* Icon */}
          <Avatar 
            sx={{ 
              bgcolor: `${getItemColor()}20`,
              color: getItemColor(),
              width: mobile ? 32 : 36,
              height: mobile ? 32 : 36,
            }}
          >
            {getItemIcon()}
          </Avatar>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant={mobile ? "body2" : "subtitle2"} 
              fontWeight={600}
              sx={{ 
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {item.title}
            </Typography>
            
            {!mobile && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                {item.assetName && (
                  <Typography variant="caption" color="text.secondary">
                    {item.assetName}
                  </Typography>
                )}
                {item.location && (
                  <Typography variant="caption" color="text.secondary">
                    • {item.location}
                  </Typography>
                )}
                {item.estimatedDuration && (
                  <Chip
                    label={`${item.estimatedDuration}min`}
                    size="small"
                    sx={{ height: 16, fontSize: '0.65rem' }}
                  />
                )}
              </Stack>
            )}
          </Box>

          {/* Drag Handle */}
          {isDragEnabled && !mobile && (
            <Box
              {...dragHandleProps}
              className="drag-handle"
              sx={{
                opacity: hovered || isDragging ? 1 : 0,
                transition: 'opacity 0.2s ease',
                cursor: isDragging ? 'grabbing' : 'grab',
                p: 0.5,
                borderRadius: 1,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <DragIcon color="action" />
            </Box>
          )}

          {/* Priority indicator */}
          {item.priority === 'HIGH' || item.priority === 'URGENT' || item.isOverdue ? (
            <Badge
              badgeContent=""
              color="error"
              variant="dot"
              sx={{
                '& .MuiBadge-badge': {
                  animation: item.isOverdue ? 'pulse 2s infinite' : 'none',
                },
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.3)' },
                  '100%': { transform: 'scale(1)' },
                },
              }}
            />
          ) : null}
        </CardContent>
      </Card>
    );

    return <ItemCard />;
  });

  // Day cell component with drop capabilities
  const DayCell = React.memo(({ dayData, cellIndex }: { 
    dayData: CalendarDayData; 
    cellIndex: number;
  }) => {
    const hasOverdue = dayData.items.some(item => item.isOverdue);
    const isHighlighted = dragOverDate?.isSame(dayData.date, 'day');
    
    const cellContent = (
      <Paper
        elevation={dayData.isCurrentMonth ? 1 : 0}
        sx={{
          minHeight: mobile 
            ? viewType === 'day' ? 400 : viewType === 'week' ? 200 : 120
            : viewType === 'day' ? 500 : viewType === 'week' ? 300 : 140,
          p: 1.5,
          cursor: 'pointer',
          border: dayData.isToday 
            ? `2px solid ${theme.palette.primary.main}` 
            : isHighlighted 
              ? `2px dashed ${theme.palette.primary.main}`
              : `1px solid ${theme.palette.divider}`,
          bgcolor: dayData.isCurrentMonth 
            ? isHighlighted
              ? `${theme.palette.primary.main}10`
              : 'background.paper'
            : theme.palette.grey[50],
          opacity: dayData.isCurrentMonth ? 1 : 0.7,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            bgcolor: dayData.isCurrentMonth 
              ? `${theme.palette.action.hover}`
              : theme.palette.grey[100],
            transform: 'translateY(-1px)',
            boxShadow: theme.shadows[2],
          },
        }}
        onClick={() => onDateClick(dayData.date)}
      >
        {/* Date header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 1,
        }}>
          <Typography
            variant={mobile ? "body2" : "subtitle2"}
            fontWeight={dayData.isToday ? 700 : 500}
            color={
              dayData.isToday 
                ? theme.palette.primary.main 
                : dayData.isCurrentMonth 
                  ? 'text.primary' 
                  : 'text.secondary'
            }
          >
            {dayData.date.date()}
          </Typography>
          
          {dayData.items.length > 0 && (
            <Badge
              badgeContent={dayData.items.length}
              color={hasOverdue ? 'error' : 'primary'}
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.65rem',
                  minWidth: 16,
                  height: 16,
                },
              }}
            />
          )}
        </Box>

        {/* Items list */}
        <Box 
          sx={{ 
            maxHeight: mobile 
              ? viewType === 'day' ? 350 : viewType === 'week' ? 150 : 80
              : viewType === 'day' ? 450 : viewType === 'week' ? 250 : 90,
            overflowY: 'auto',
            overflowX: 'hidden',
            '&::-webkit-scrollbar': {
              width: 4,
            },
            '&::-webkit-scrollbar-track': {
              background: theme.palette.grey[100],
              borderRadius: 2,
            },
            '&::-webkit-scrollbar-thumb': {
              background: theme.palette.grey[300],
              borderRadius: 2,
            },
          }}
          id={dayData.date.format('YYYY-MM-DD')}
        >
          {!mobile ? (
            <SortableContext items={dayData.items.map(item => item.id.toString())} strategy={verticalListSortingStrategy}>
              {dayData.items.map((item) => (
                <Fade key={item.id} in timeout={300}>
                  <div>
                    <SortableItemComponent 
                      item={item} 
                      isDragEnabled={true}
                    />
                  </div>
                </Fade>
              ))}
            </SortableContext>
          ) : (
            dayData.items.map((item) => (
              <Fade key={item.id} in timeout={300}>
                <div>
                  <ItemComponent 
                    item={item} 
                    isDragEnabled={false}
                  />
                </div>
              </Fade>
            ))
          )}
        </Box>
      </Paper>
    );

    return cellContent;
  });

  // Loading state
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Grid container spacing={1}>
          {Array.from({ length: viewType === 'day' ? 1 : viewType === 'week' ? 7 : 42 }).map((_, i) => (
            <Grid key={i} xs={viewType === 'month' ? 12/7 : viewType === 'week' ? true : 12}>
              <Paper 
                sx={{ 
                  height: mobile ? 100 : 140, 
                  bgcolor: 'grey.100',
                  borderRadius: 2,
                }} 
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const calendarContent = (
    <Box>
      {/* Navigation header */}
      {(viewType !== 'day' || mobile) && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}>
          <IconButton onClick={handlePrevious}>
            <ChevronLeft />
          </IconButton>
          
          <Typography variant={mobile ? "subtitle1" : "h6"} fontWeight={600}>
            {viewType === 'week' 
              ? `${calendarData[0]?.date.format('MMM D')} - ${calendarData[6]?.date.format('MMM D, YYYY')}`
              : currentDate.format(viewType === 'day' ? 'dddd, MMMM D, YYYY' : 'MMMM YYYY')
            }
          </Typography>
          
          <IconButton onClick={handleNext}>
            <ChevronRight />
          </IconButton>
        </Box>
      )}

      {/* Week headers for month view */}
      {viewType === 'month' && (
        <Grid container sx={{ 
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.default,
        }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Grid key={day} xs={12/7}>
              <Box sx={{ 
                p: mobile ? 1 : 2, 
                textAlign: 'center',
              }}>
                <Typography 
                  variant={mobile ? "caption" : "subtitle2"} 
                  fontWeight={600}
                  color="text.secondary"
                >
                  {day}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Calendar grid */}
      <Grid container spacing={viewType === 'month' ? 0 : 1} sx={{ p: viewType === 'month' ? 0 : 2 }}>
        {calendarData.map((dayData, index) => (
          <Grid 
            key={dayData.date.format('YYYY-MM-DD')} 
            xs={viewType === 'month' ? 12/7 : viewType === 'week' ? true : 12}
          >
            <Grow in timeout={300 + (index * 50)}>
              <div>
                <DayCell dayData={dayData} cellIndex={index} />
              </div>
            </Grow>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  // Wrap with drag and drop context for desktop
  return !mobile ? (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {calendarContent}
    </DndContext>
  ) : calendarContent;
};

export default CalendarViewManager;