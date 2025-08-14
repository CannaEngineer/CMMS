import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Stack,
  Avatar,
  useTheme,
  useMediaQuery,
  Fade,
  Grow,
  Slide,
  Tooltip,
  Button,
  Collapse,
  LinearProgress,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Notifications as NotificationIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Schedule as ScheduleIcon,
  Assignment as WorkOrderIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  PlayCircle as StartIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { CalendarItem } from '../../types/calendar';
import dayjs from 'dayjs';

interface UrgentItem {
  count: number;
  label: string;
  type: string;
  color: 'error' | 'warning' | 'success' | 'info';
  icon: React.ReactNode;
}

interface CategorizedItems {
  overdue: CalendarItem[];
  today: CalendarItem[];
  thisWeek: CalendarItem[];
  pmSchedules: CalendarItem[];
  workOrders: CalendarItem[];
  highPriority: CalendarItem[];
}

interface UrgentTasksHeroProps {
  urgentItems: UrgentItem[];
  totalUrgent: number;
  calendarItems: CategorizedItems;
  onUrgentClick: (type: string) => void;
}

const UrgentTasksHero: React.FC<UrgentTasksHeroProps> = ({
  urgentItems,
  totalUrgent,
  calendarItems,
  onUrgentClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expanded, setExpanded] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Create calendar-focused insights
  const calendarInsights = useMemo(() => {
    const insights = [];

    // Today's urgent tasks
    if (calendarItems.today.length > 0) {
      const todayUrgent = calendarItems.today.filter(item => 
        item.priority === 'HIGH' || item.priority === 'URGENT' || item.isOverdue
      );
      insights.push({
        title: 'Today\'s Priority Tasks',
        count: todayUrgent.length,
        total: calendarItems.today.length,
        items: todayUrgent.slice(0, 3),
        color: todayUrgent.length > 0 ? theme.palette.error.main : theme.palette.success.main,
        icon: <CalendarIcon />,
      });
    }

    // Overdue items requiring immediate attention
    if (calendarItems.overdue.length > 0) {
      insights.push({
        title: 'Overdue Tasks',
        count: calendarItems.overdue.length,
        total: calendarItems.overdue.length,
        items: calendarItems.overdue.slice(0, 3),
        color: theme.palette.error.main,
        icon: <WarningIcon />,
      });
    }

    // Weekly workload preview
    if (calendarItems.thisWeek.length > 0) {
      insights.push({
        title: 'This Week\'s Schedule',
        count: calendarItems.thisWeek.length,
        total: calendarItems.thisWeek.length,
        items: calendarItems.thisWeek.slice(0, 3),
        color: theme.palette.info.main,
        icon: <ScheduleIcon />,
      });
    }

    return insights;
  }, [calendarItems, theme]);

  const getStatusMessage = () => {
    if (totalUrgent === 0) {
      return {
        title: 'All Systems Operational',
        subtitle: 'Your maintenance schedule is on track',
        color: theme.palette.success.main,
        icon: <CheckCircleIcon />,
      };
    }

    if (calendarItems.overdue.length > 0) {
      return {
        title: `${calendarItems.overdue.length} Overdue ${calendarItems.overdue.length === 1 ? 'Task' : 'Tasks'}`,
        subtitle: 'Immediate attention required',
        color: theme.palette.error.main,
        icon: <WarningIcon />,
      };
    }

    return {
      title: `${totalUrgent} ${totalUrgent === 1 ? 'Item Needs' : 'Items Need'} Attention`,
      subtitle: 'Review priority tasks in your calendar',
      color: theme.palette.warning.main,
      icon: <WarningIcon />,
    };
  };

  const statusInfo = getStatusMessage();

  const QuickInsightCard = ({ insight, index }: { insight: any; index: number }) => (
    <Grow in timeout={600 + (index * 200)}>
      <Card
        sx={{
          cursor: 'pointer',
          borderLeft: `4px solid ${insight.color}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 25px ${insight.color}30`,
          },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <CardContent sx={{ p: isMobile ? 2 : 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                bgcolor: `${insight.color}20`,
                color: insight.color,
                width: isMobile ? 40 : 48,
                height: isMobile ? 40 : 48,
              }}
            >
              {insight.icon}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant={isMobile ? "body1" : "h6"}
                fontWeight={700}
                sx={{ mb: 0.5 }}
              >
                {insight.count}
                {insight.total !== insight.count && (
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    of {insight.total}
                  </Typography>
                )}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {insight.title}
              </Typography>
            </Box>
            {insight.count > 0 && (
              <IconButton
                size="small"
                sx={{
                  bgcolor: `${insight.color}10`,
                  color: insight.color,
                  '&:hover': {
                    bgcolor: `${insight.color}20`,
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>

          {/* Progress indicator for today's tasks */}
          {insight.title.includes('Today') && insight.total > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Progress
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {Math.round(((insight.total - insight.count) / insight.total) * 100)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={((insight.total - insight.count) / insight.total) * 100}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: `${insight.color}20`,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: insight.color,
                  },
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Grow>
  );

  return (
    <Box sx={{ mb: 3 }}>
      {/* Main Hero Card */}
      <Grow in timeout={400}>
        <Card
          sx={{
            background: totalUrgent > 0
              ? `linear-gradient(135deg, ${statusInfo.color}15 0%, ${statusInfo.color}05 100%)`
              : `linear-gradient(135deg, ${theme.palette.success.main}15 0%, ${theme.palette.primary.main}05 100%)`,
            border: `2px solid ${statusInfo.color}40`,
            position: 'relative',
            overflow: 'hidden',
            mb: 2,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: totalUrgent > 0
                ? `linear-gradient(90deg, ${statusInfo.color}, ${theme.palette.warning.main})`
                : `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.primary.main})`,
            },
          }}
        >
          <CardContent sx={{ p: isMobile ? 2.5 : 3 }}>
            <Stack
              direction={isMobile ? "column" : "row"}
              alignItems={isMobile ? "flex-start" : "center"}
              justifyContent="space-between"
              spacing={isMobile ? 2 : 3}
            >
              {/* Status Info */}
              <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1 }}>
                <Grow in timeout={600}>
                  <Avatar
                    sx={{
                      bgcolor: statusInfo.color,
                      width: isMobile ? 56 : 64,
                      height: isMobile ? 56 : 64,
                      boxShadow: `0 4px 20px ${statusInfo.color}40`,
                      animation: totalUrgent > 0 ? 'pulse 2s infinite' : 'none',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)', boxShadow: `0 0 0 0 ${statusInfo.color}40` },
                        '70%': { transform: 'scale(1.05)', boxShadow: `0 0 0 10px ${statusInfo.color}00` },
                        '100%': { transform: 'scale(1)', boxShadow: `0 0 0 0 ${statusInfo.color}00` },
                      },
                    }}
                  >
                    {statusInfo.icon}
                  </Avatar>
                </Grow>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Fade in timeout={800}>
                    <Typography
                      variant={isMobile ? "h6" : "h5"}
                      fontWeight={700}
                      sx={{
                        mb: 0.5,
                        fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
                        background: totalUrgent > 0
                          ? `linear-gradient(45deg, ${statusInfo.color}, ${theme.palette.error.dark})`
                          : `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.primary.main})`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {statusInfo.title}
                    </Typography>
                  </Fade>
                  <Fade in timeout={1000}>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      fontWeight={500}
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                    >
                      {statusInfo.subtitle}
                    </Typography>
                  </Fade>

                  {/* Quick stats for calendar context */}
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap">
                    <Fade in timeout={1200}>
                      <Chip
                        icon={<CalendarIcon fontSize="small" />}
                        label={`${calendarItems.today.length} today`}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: theme.palette.primary.main,
                          color: theme.palette.primary.main,
                        }}
                      />
                    </Fade>
                    <Fade in timeout={1300}>
                      <Chip
                        icon={<ScheduleIcon fontSize="small" />}
                        label={`${calendarItems.thisWeek.length} this week`}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: theme.palette.info.main,
                          color: theme.palette.info.main,
                        }}
                      />
                    </Fade>
                    {calendarItems.overdue.length > 0 && (
                      <Fade in timeout={1400}>
                        <Chip
                          icon={<WarningIcon fontSize="small" />}
                          label={`${calendarItems.overdue.length} overdue`}
                          size="small"
                          color="error"
                          variant="filled"
                          sx={{
                            animation: 'pulse 2s infinite',
                          }}
                        />
                      </Fade>
                    )}
                  </Stack>
                </Box>
              </Stack>

              {/* Action Button */}
              <Stack direction="row" spacing={1}>
                {totalUrgent > 0 && (
                  <Slide direction="left" in timeout={1000}>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<StartIcon />}
                      onClick={() => onUrgentClick('overdue')}
                      sx={{
                        minWidth: isMobile ? 120 : 140,
                        fontWeight: 700,
                        boxShadow: `0 4px 20px ${theme.palette.error.main}40`,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 30px ${theme.palette.error.main}50`,
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      Take Action
                    </Button>
                  </Slide>
                )}

                <Tooltip title="View Calendar" placement="top">
                  <IconButton
                    sx={{
                      bgcolor: theme.palette.background.paper,
                      boxShadow: theme.shadows[2],
                      '&:hover': {
                        bgcolor: theme.palette.primary.main,
                        color: 'white',
                        transform: 'scale(1.1)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grow>

      {/* Calendar Insights */}
      <Collapse in={expanded}>
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: isMobile 
            ? '1fr' 
            : 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 2,
          mt: 2,
        }}>
          {calendarInsights.map((insight, index) => (
            <QuickInsightCard
              key={insight.title}
              insight={insight}
              index={index}
            />
          ))}
        </Box>

        {/* Detailed breakdown for mobile */}
        {expanded && calendarItems.overdue.length > 0 && (
          <Fade in timeout={800}>
            <Card sx={{ mt: 2, borderLeft: `4px solid ${theme.palette.error.main}` }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Overdue Tasks Requiring Immediate Action
                </Typography>
                <Stack spacing={1}>
                  {calendarItems.overdue.slice(0, 3).map((item, index) => (
                    <Fade key={item.id} in timeout={300 + (index * 100)}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: `${theme.palette.error.main}08`,
                          border: `1px solid ${theme.palette.error.main}20`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: `${theme.palette.error.main}15`,
                            transform: 'translateX(4px)',
                          },
                        }}
                        onClick={() => console.log('Navigate to item:', item.id)}
                      >
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar
                            sx={{
                              bgcolor: theme.palette.error.main,
                              width: 32,
                              height: 32,
                            }}
                          >
                            {item.type === 'PM_SCHEDULE' ? <ScheduleIcon fontSize="small" /> : <WorkOrderIcon fontSize="small" />}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {item.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.assetName} • Due {dayjs(item.scheduledDate).format('MMM D')}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="error" fontWeight={600}>
                            {dayjs().diff(dayjs(item.scheduledDate), 'days')} days overdue
                          </Typography>
                        </Stack>
                      </Box>
                    </Fade>
                  ))}
                  
                  {calendarItems.overdue.length > 3 && (
                    <Button
                      variant="text"
                      color="error"
                      onClick={() => onUrgentClick('overdue')}
                      sx={{ mt: 1 }}
                    >
                      View All {calendarItems.overdue.length} Overdue Tasks
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Fade>
        )}
      </Collapse>
    </Box>
  );
};

export default UrgentTasksHero;