import React from 'react';
import {
  Popper,
  Paper,
  Typography,
  Box,
  Chip,
  Divider,
  useTheme,
  Fade,
  alpha,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Build as BuildIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { PMScheduleItem } from '../../types/pmCalendar';

interface PMTooltipProps {
  pmItem: PMScheduleItem | null;
  anchorEl: HTMLElement | null;
  open: boolean;
}

const getPriorityConfig = (priority: string, theme: any) => {
  switch (priority) {
    case 'URGENT':
      return {
        color: theme.palette.error.main,
        backgroundColor: alpha(theme.palette.error.main, 0.1),
        icon: <ErrorIcon sx={{ fontSize: 16 }} />,
      };
    case 'HIGH':
      return {
        color: theme.palette.warning.main,
        backgroundColor: alpha(theme.palette.warning.main, 0.1),
        icon: <WarningIcon sx={{ fontSize: 16 }} />,
      };
    case 'MEDIUM':
      return {
        color: theme.palette.info.main,
        backgroundColor: alpha(theme.palette.info.main, 0.1),
        icon: <InfoIcon sx={{ fontSize: 16 }} />,
      };
    case 'LOW':
      return {
        color: theme.palette.success.main,
        backgroundColor: alpha(theme.palette.success.main, 0.1),
        icon: <CheckIcon sx={{ fontSize: 16 }} />,
      };
    default:
      return {
        color: theme.palette.grey[500],
        backgroundColor: alpha(theme.palette.grey[500], 0.1),
        icon: <InfoIcon sx={{ fontSize: 16 }} />,
      };
  }
};

const getTaskTypeLabel = (taskType: string) => {
  switch (taskType) {
    case 'INSPECTION':
      return 'Inspection';
    case 'CLEANING':
      return 'Cleaning';
    case 'LUBRICATION':
      return 'Lubrication';
    case 'REPLACEMENT':
      return 'Replacement';
    case 'CALIBRATION':
      return 'Calibration';
    case 'TESTING':
      return 'Testing';
    default:
      return taskType;
  }
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

const PMTooltip: React.FC<PMTooltipProps> = ({ pmItem, anchorEl, open }) => {
  const theme = useTheme();

  if (!pmItem) return null;

  const priorityConfig = getPriorityConfig(pmItem.priority, theme);
  const isOverdue = pmItem.isOverdue;

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="top"
      transition
      modifiers={[
        {
          name: 'offset',
          options: {
            offset: [0, 8],
          },
        },
        {
          name: 'preventOverflow',
          options: {
            boundary: 'viewport',
            padding: 8,
          },
        },
      ]}
      sx={{ zIndex: 1500 }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={200}>
          <Paper
            elevation={8}
            sx={{
              p: 2,
              maxWidth: 320,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
              border: `1px solid ${theme.palette.divider}`,
              backdropFilter: 'blur(10px)',
              boxShadow: theme.shadows[8],
            }}
          >
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  flex: 1,
                  mr: 1,
                }}
              >
                {pmItem.title}
              </Typography>
              <Chip
                size="small"
                icon={priorityConfig.icon}
                label={pmItem.priority}
                sx={{
                  backgroundColor: priorityConfig.backgroundColor,
                  color: priorityConfig.color,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 24,
                  '& .MuiChip-icon': {
                    color: priorityConfig.color,
                  },
                }}
              />
            </Box>

            {/* Overdue Warning */}
            {isOverdue && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  mb: 1.5,
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                }}
              >
                <ErrorIcon sx={{ fontSize: 16, color: theme.palette.error.main }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.error.main,
                  }}
                >
                  OVERDUE
                </Typography>
              </Box>
            )}

            {/* Asset Information */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <BuildIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {pmItem.assetName}
              </Typography>
            </Box>

            {/* Schedule Information */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ScheduleIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
              <Typography variant="body2" color="text.secondary">
                {dayjs(pmItem.scheduledDate).format('MMM DD, YYYY [at] h:mm A')}
              </Typography>
            </Box>

            {/* Duration */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.6rem',
                  }}
                >
                  T
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Est. Duration: {formatDuration(pmItem.estimatedDuration)}
              </Typography>
            </Box>

            {/* Location */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <LocationIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
              <Typography variant="body2" color="text.secondary">
                {pmItem.location}
              </Typography>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            {/* Task Type and Technician */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Chip
                size="small"
                label={getTaskTypeLabel(pmItem.taskType)}
                sx={{
                  backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                  color: theme.palette.secondary.main,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              />
              {pmItem.assignedTechnician && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PersonIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                  <Typography variant="caption" color="text.secondary">
                    {pmItem.assignedTechnician}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Description */}
            {pmItem.description && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  fontStyle: 'italic',
                  lineHeight: 1.4,
                }}
              >
                {pmItem.description}
              </Typography>
            )}

            {/* Criticality */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  backgroundColor: alpha(theme.palette.warning.main, 0.1),
                  color: theme.palette.warning.main,
                  fontWeight: 600,
                  fontSize: '0.65rem',
                }}
              >
                {pmItem.criticality} CRITICALITY
              </Typography>
            </Box>
          </Paper>
        </Fade>
      )}
    </Popper>
  );
};

export default PMTooltip;