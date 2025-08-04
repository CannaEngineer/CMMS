import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Chip,
  Badge,
  useTheme,
  Fade,
  Grow,
  alpha,
  useMediaQuery,
} from '@mui/material';
import {
  Build as BuildIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { Dayjs } from 'dayjs';
import { PMScheduleItem } from '../../types/pmCalendar';
import PMTooltip from './PMTooltip';

interface CalendarDayProps {
  date: Dayjs;
  isCurrentMonth: boolean;
  isToday: boolean;
  pmItems: PMScheduleItem[];
  onPMClick: (pm: PMScheduleItem) => void;
  onDateClick: (date: Dayjs) => void;
  onPMReschedule?: (pmId: number, newDate: Date) => void;
}

const getPriorityColor = (priority: string, theme: any) => {
  switch (priority) {
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
};

const getTaskTypeIcon = (taskType: string) => {
  switch (taskType) {
    case 'INSPECTION':
    case 'TESTING':
      return <CheckIcon sx={{ fontSize: 12 }} />;
    case 'CLEANING':
    case 'LUBRICATION':
    case 'CALIBRATION':
      return <BuildIcon sx={{ fontSize: 12 }} />;
    case 'REPLACEMENT':
      return <WarningIcon sx={{ fontSize: 12 }} />;
    default:
      return <BuildIcon sx={{ fontSize: 12 }} />;
  }
};

const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  isCurrentMonth,
  isToday,
  pmItems,
  onPMClick,
  onDateClick,
  onPMReschedule,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isHovering, setIsHovering] = useState(false);
  const [tooltipPM, setTooltipPM] = useState<PMScheduleItem | null>(null);
  const dayRef = useRef<HTMLDivElement>(null);

  const overdueItems = pmItems.filter(pm => pm.isOverdue);
  const regularItems = pmItems.filter(pm => !pm.isOverdue);
  
  const hasOverdue = overdueItems.length > 0;
  const totalItems = pmItems.length;

  const handleDateClick = () => {
    onDateClick(date);
  };

  const handlePMItemClick = (e: React.MouseEvent, pm: PMScheduleItem) => {
    e.stopPropagation();
    onPMClick(pm);
  };

  const handlePMItemHover = (pm: PMScheduleItem) => {
    setTooltipPM(pm);
  };

  const handlePMItemLeave = () => {
    setTooltipPM(null);
  };

  const dayBackgroundColor = isToday 
    ? alpha(theme.palette.primary.main, 0.1)
    : isCurrentMonth 
      ? theme.palette.background.paper
      : theme.palette.background.default;

  const dayBorderColor = isToday 
    ? theme.palette.primary.main
    : 'transparent';

  return (
    <Box
      ref={dayRef}
      onClick={handleDateClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleDateClick();
        }
      }}
      tabIndex={0}
      role="gridcell"
      aria-label={`${date.format('MMMM DD, YYYY')}${totalItems > 0 ? `, ${totalItems} PM ${totalItems === 1 ? 'schedule' : 'schedules'}` : ', no PM schedules'}${hasOverdue ? ', has overdue items' : ''}`}
      aria-current={isToday ? 'date' : undefined}
      sx={{
        minHeight: isMobile ? 80 : 120,
        p: isMobile ? 0.5 : 1,
        cursor: 'pointer',
        borderRadius: 2,
        border: `2px solid ${dayBorderColor}`,
        backgroundColor: dayBackgroundColor,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&:hover, &:focus': {
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          transform: isMobile ? 'none' : 'translateY(-2px)',
          boxShadow: theme.shadows[4],
          outline: 'none',
        },
        '&:focus': {
          border: `2px solid ${theme.palette.primary.main}`,
        },
        '&:active': {
          transform: 'translateY(0px)',
        },
      }}
    >
      {/* Date Number */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: isToday ? 700 : isCurrentMonth ? 600 : 400,
            color: isToday 
              ? theme.palette.primary.main 
              : isCurrentMonth 
                ? theme.palette.text.primary 
                : theme.palette.text.disabled,
            fontSize: isToday ? '1.1rem' : '0.875rem',
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {date.date()}
        </Typography>

        {/* PM Count Badge */}
        {totalItems > 0 && (
          <Fade in timeout={300}>
            <Badge
              badgeContent={totalItems}
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: hasOverdue 
                    ? theme.palette.error.main 
                    : theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  minWidth: 18,
                  height: 18,
                  transform: isHovering ? 'scale(1.2)' : 'scale(1)',
                  transition: 'transform 0.2s ease-in-out',
                },
              }}
            >
              <Box sx={{ width: 8, height: 8 }} />
            </Badge>
          </Fade>
        )}
      </Box>

      {/* PM Items */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: isMobile ? 50 : 80, overflow: 'hidden' }}>
        {/* Show overdue items first */}
        {overdueItems.slice(0, isMobile ? 2 : 3).map((pm, index) => (
          <Grow
            key={`overdue-${pm.id}`}
            in
            timeout={300 + index * 100}
          >
            <Chip
              size="small"
              icon={!isMobile ? getTaskTypeIcon(pm.taskType) : undefined}
              label={isMobile ? pm.assetName.length > 8 ? `${pm.assetName.substring(0, 8)}...` : pm.assetName : pm.assetName}
              onClick={(e) => handlePMItemClick(e, pm)}
              onMouseEnter={() => handlePMItemHover(pm)}
              onMouseLeave={handlePMItemLeave}
              sx={{
                height: isMobile ? 18 : 20,
                fontSize: isMobile ? '0.6rem' : '0.7rem',
                fontWeight: 500,
                backgroundColor: alpha(theme.palette.error.main, 0.15),
                color: theme.palette.error.main,
                border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                '& .MuiChip-icon': {
                  color: theme.palette.error.main,
                },
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.25),
                  transform: isMobile ? 'none' : 'scale(1.02)',
                  boxShadow: theme.shadows[2],
                },
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
              }}
            />
          </Grow>
        ))}

        {/* Show regular items */}
        {regularItems.slice(0, Math.max(0, (isMobile ? 2 : 3) - overdueItems.length)).map((pm, index) => (
          <Grow
            key={`regular-${pm.id}`}
            in
            timeout={300 + (overdueItems.length + index) * 100}
          >
            <Chip
              size="small"
              icon={!isMobile ? getTaskTypeIcon(pm.taskType) : undefined}
              label={isMobile ? pm.assetName.length > 8 ? `${pm.assetName.substring(0, 8)}...` : pm.assetName : pm.assetName}
              onClick={(e) => handlePMItemClick(e, pm)}
              onMouseEnter={() => handlePMItemHover(pm)}
              onMouseLeave={handlePMItemLeave}
              sx={{
                height: isMobile ? 18 : 20,
                fontSize: isMobile ? '0.6rem' : '0.7rem',
                fontWeight: 500,
                backgroundColor: alpha(getPriorityColor(pm.priority, theme), 0.15),
                color: getPriorityColor(pm.priority, theme),
                border: `1px solid ${alpha(getPriorityColor(pm.priority, theme), 0.3)}`,
                '& .MuiChip-icon': {
                  color: getPriorityColor(pm.priority, theme),
                },
                '&:hover': {
                  backgroundColor: alpha(getPriorityColor(pm.priority, theme), 0.25),
                  transform: isMobile ? 'none' : 'scale(1.02)',
                  boxShadow: theme.shadows[2],
                },
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
              }}
            />
          </Grow>
        ))}

        {/* Show "more" indicator if there are additional items */}
        {totalItems > (isMobile ? 2 : 3) && (
          <Fade in timeout={600}>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                textAlign: 'center',
                fontWeight: 500,
                mt: 0.5,
                opacity: isHovering ? 1 : 0.7,
                transition: 'opacity 0.2s ease-in-out',
                fontSize: isMobile ? '0.6rem' : '0.75rem',
              }}
            >
              +{totalItems - (isMobile ? 2 : 3)} more
            </Typography>
          </Fade>
        )}
      </Box>

      {/* Today Indicator */}
      {isToday && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            borderRadius: '2px 2px 0 0',
          }}
        />
      )}

      {/* Tooltip */}
      <PMTooltip
        pmItem={tooltipPM}
        anchorEl={dayRef.current}
        open={Boolean(tooltipPM)}
      />
    </Box>
  );
};

export default CalendarDay;