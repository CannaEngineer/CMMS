import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Grid,
  Divider,
  IconButton,
  Card,
  CardContent,
  Avatar,
  useTheme,
  alpha,
  Fade,
  Slide,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  Build as BuildIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Priority as PriorityIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import dayjs from 'dayjs';
import { PMScheduleItem } from '../../types/pmCalendar';

interface PMDetailModalProps {
  open: boolean;
  onClose: () => void;
  pmItem: PMScheduleItem | null;
  onEdit?: (pmItem: PMScheduleItem) => void;
  onReschedule?: (pmItem: PMScheduleItem) => void;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const getPriorityConfig = (priority: string, theme: any) => {
  switch (priority) {
    case 'URGENT':
      return {
        color: theme.palette.error.main,
        backgroundColor: alpha(theme.palette.error.main, 0.1),
        icon: <ErrorIcon />,
        label: 'Urgent',
      };
    case 'HIGH':
      return {
        color: theme.palette.warning.main,
        backgroundColor: alpha(theme.palette.warning.main, 0.1),
        icon: <WarningIcon />,
        label: 'High',
      };
    case 'MEDIUM':
      return {
        color: theme.palette.info.main,
        backgroundColor: alpha(theme.palette.info.main, 0.1),
        icon: <InfoIcon />,
        label: 'Medium',
      };
    case 'LOW':
      return {
        color: theme.palette.success.main,
        backgroundColor: alpha(theme.palette.success.main, 0.1),
        icon: <CheckIcon />,
        label: 'Low',
      };
    default:
      return {
        color: theme.palette.grey[500],
        backgroundColor: alpha(theme.palette.grey[500], 0.1),
        icon: <InfoIcon />,
        label: priority,
      };
  }
};

const getTaskTypeLabel = (taskType: string) => {
  const labels: Record<string, string> = {
    INSPECTION: 'Inspection',
    CLEANING: 'Cleaning',
    LUBRICATION: 'Lubrication',
    REPLACEMENT: 'Replacement',
    CALIBRATION: 'Calibration',
    TESTING: 'Testing',
  };
  return labels[taskType] || taskType;
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
};

const PMDetailModal: React.FC<PMDetailModalProps> = ({
  open,
  onClose,
  pmItem,
  onEdit,
  onReschedule,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  if (!pmItem) return null;

  const priorityConfig = getPriorityConfig(pmItem.priority, theme);
  const isOverdue = pmItem.isOverdue;
  const scheduledDate = dayjs(pmItem.scheduledDate);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: fullScreen ? 0 : 3,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}10 100%)`,
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              {pmItem.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip
                icon={priorityConfig.icon}
                label={`${priorityConfig.label} Priority`}
                sx={{
                  backgroundColor: priorityConfig.backgroundColor,
                  color: priorityConfig.color,
                  fontWeight: 600,
                }}
              />
              <Chip
                label={getTaskTypeLabel(pmItem.taskType)}
                sx={{
                  backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                  color: theme.palette.secondary.main,
                  fontWeight: 600,
                }}
              />
              <Chip
                label={`${pmItem.criticality} Criticality`}
                sx={{
                  backgroundColor: alpha(theme.palette.warning.main, 0.1),
                  color: theme.palette.warning.main,
                  fontWeight: 600,
                }}
              />
              {isOverdue && (
                <Chip
                  icon={<ErrorIcon />}
                  label="OVERDUE"
                  sx={{
                    backgroundColor: alpha(theme.palette.error.main, 0.2),
                    color: theme.palette.error.main,
                    fontWeight: 700,
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': {
                        opacity: 1,
                      },
                      '50%': {
                        opacity: 0.7,
                      },
                      '100%': {
                        opacity: 1,
                      },
                    },
                  }}
                />
              )}
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ ml: 1 }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Asset Information Card */}
          <Grid xs={12} md={6}>
            <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      mr: 2,
                    }}
                  >
                    <BuildIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Asset Information
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {pmItem.assetId}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BuildIcon sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {pmItem.assetName}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                    <Typography variant="body2" color="text.secondary">
                      {pmItem.location}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Schedule Information Card */}
          <Grid xs={12} md={6}>
            <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      backgroundColor: theme.palette.secondary.main,
                      mr: 2,
                    }}
                  >
                    <ScheduleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Schedule Details
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Maintenance Schedule
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {scheduledDate.format('MMMM DD, YYYY')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {scheduledDate.format('dddd [at] h:mm A')}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimeIcon sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                    <Typography variant="body2" color="text.secondary">
                      Estimated Duration: {formatDuration(pmItem.estimatedDuration)}
                    </Typography>
                  </Box>
                  {pmItem.assignedTechnician && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                      <Typography variant="body2" color="text.secondary">
                        Assigned to: {pmItem.assignedTechnician}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Description Card */}
          {pmItem.description && (
            <Grid xs={12}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        backgroundColor: theme.palette.info.main,
                        mr: 2,
                      }}
                    >
                      <DescriptionIcon />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Description
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                    {pmItem.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Status Information */}
          <Grid xs={12}>
            <Card 
              elevation={2} 
              sx={{ 
                borderRadius: 2,
                background: isOverdue 
                  ? `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.05)} 0%, ${alpha(theme.palette.error.main, 0.02)} 100%)`
                  : 'inherit',
                border: isOverdue ? `1px solid ${alpha(theme.palette.error.main, 0.2)}` : 'inherit',
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Status Information
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Priority Level
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                        {priorityConfig.icon}
                        <Typography variant="h6" sx={{ fontWeight: 700, color: priorityConfig.color }}>
                          {priorityConfig.label}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Criticality
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                        {pmItem.criticality}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Days Until Due
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700, 
                          color: isOverdue 
                            ? theme.palette.error.main 
                            : scheduledDate.diff(dayjs(), 'day') <= 3
                              ? theme.palette.warning.main
                              : theme.palette.success.main
                        }}
                      >
                        {isOverdue 
                          ? `${Math.abs(scheduledDate.diff(dayjs(), 'day'))} days overdue`
                          : scheduledDate.diff(dayjs(), 'day') === 0
                            ? 'Due Today'
                            : `${scheduledDate.diff(dayjs(), 'day')} days`
                        }
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          Close
        </Button>
        {onReschedule && (
          <Button
            onClick={() => onReschedule(pmItem)}
            variant="outlined"
            startIcon={<CalendarIcon />}
            sx={{ borderRadius: 2 }}
          >
            Reschedule
          </Button>
        )}
        {onEdit && (
          <Button
            onClick={() => onEdit(pmItem)}
            variant="contained"
            startIcon={<EditIcon />}
            sx={{ borderRadius: 2 }}
          >
            Edit
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PMDetailModal;