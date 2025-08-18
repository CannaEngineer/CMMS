import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Grid,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Stack,
  Tooltip,
  Alert,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Assignment as WorkOrderIcon,
  Build as AssetIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  AccessTime as DurationIcon,
  Flag as PriorityIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  AttachFile as AttachmentIcon,
  CheckCircle as CompleteIcon,
  PlayArrow as StartIcon,
  Launch as ViewDetailsIcon,
  Edit as EditIcon,
  Update as UpdateIcon,
  Timer as TimerIcon,
  Engineering as TechnicianIcon,
  Category as CategoryIcon,
  Checklist as ChecklistIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { CalendarItem } from '../../types/calendar';
import { LoadingButton } from '../Loading';
import { statusColors } from '../../theme/theme';
import { useNavigate } from 'react-router-dom';

dayjs.extend(relativeTime);

interface WorkOrderPreviewModalProps {
  open: boolean;
  onClose: () => void;
  workOrder: CalendarItem | null;
  onStartWork?: (workOrderId: number) => void;
  onComplete?: (workOrderId: number) => void;
  onUpdate?: (workOrderId: number) => void;
}

const WorkOrderPreviewModal: React.FC<WorkOrderPreviewModalProps> = ({
  open,
  onClose,
  workOrder,
  onStartWork,
  onComplete,
  onUpdate,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isNavigating, setIsNavigating] = useState(false);

  if (!workOrder) return null;

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'URGENT': return theme.palette.error.main;
      case 'HIGH': return theme.palette.warning.main;
      case 'MEDIUM': return theme.palette.info.main;
      case 'LOW': return theme.palette.success.main;
      default: return theme.palette.grey[500];
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'COMPLETED': return theme.palette.success.main;
      case 'IN_PROGRESS': return theme.palette.info.main;
      case 'ON_HOLD': return theme.palette.warning.main;
      case 'OPEN': return theme.palette.warning.light;
      default: return theme.palette.grey[500];
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'REPAIR': return '🔧';
      case 'INSPECTION': return '🔍';
      case 'MAINTENANCE': return '🛠️';
      case 'INSTALLATION': return '📦';
      case 'EMERGENCY': return '🚨';
      default: return '⚙️';
    }
  };

  const handleViewFullDetails = () => {
    setIsNavigating(true);
    setTimeout(() => {
      navigate(`/work-orders/${workOrder.id}`);
      onClose();
    }, 300);
  };

  const handleEdit = () => {
    navigate(`/work-orders/${workOrder.id}/edit`);
    onClose();
  };

  const isOverdue = workOrder.dueDate && dayjs(workOrder.dueDate).isBefore(dayjs());
  const daysUntilDue = workOrder.dueDate ? dayjs(workOrder.dueDate).diff(dayjs(), 'day') : null;
  const hoursEstimate = workOrder.estimatedDuration ? Math.floor(workOrder.estimatedDuration / 60) : 0;
  const minutesEstimate = workOrder.estimatedDuration ? workOrder.estimatedDuration % 60 : 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={isMobile ? Fade : Zoom}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          maxHeight: isMobile ? '100%' : '85vh',
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
        }
      }}
    >
      <DialogTitle sx={{ 
        m: 0, 
        p: 2, 
        bgcolor: isOverdue ? theme.palette.error.light + '20' : 'background.default',
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Avatar sx={{ 
              bgcolor: getPriorityColor(workOrder.priority), 
              width: 48, 
              height: 48,
              fontSize: '1.5rem',
            }}>
              {getCategoryIcon(workOrder.category)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                {workOrder.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                <Chip
                  label={workOrder.status?.replace('_', ' ') || 'OPEN'}
                  size="small"
                  sx={{
                    bgcolor: getStatusColor(workOrder.status) + '20',
                    color: getStatusColor(workOrder.status),
                    fontWeight: 600,
                  }}
                />
                {isOverdue && (
                  <Chip
                    label="OVERDUE"
                    size="small"
                    color="error"
                    variant="filled"
                  />
                )}
                <Chip
                  icon={<WorkOrderIcon sx={{ fontSize: 16 }} />}
                  label={`WO #${workOrder.id}`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>
          </Box>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ color: theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {/* Quick Actions Bar */}
          <Paper elevation={0} sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: theme.palette.grey[50],
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
          }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {workOrder.status === 'OPEN' && (
                <Button
                  variant="contained"
                  startIcon={<StartIcon />}
                  onClick={() => onStartWork?.(workOrder.id)}
                  size="small"
                  color="primary"
                >
                  Start Work
                </Button>
              )}
              {workOrder.status === 'IN_PROGRESS' && (
                <>
                  <Button
                    variant="contained"
                    startIcon={<CompleteIcon />}
                    onClick={() => onComplete?.(workOrder.id)}
                    size="small"
                    color="success"
                  >
                    Mark Complete
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<UpdateIcon />}
                    onClick={() => onUpdate?.(workOrder.id)}
                    size="small"
                  >
                    Update Progress
                  </Button>
                </>
              )}
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                size="small"
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                startIcon={<TimerIcon />}
                size="small"
              >
                Log Time
              </Button>
            </Box>
          </Paper>

          {/* Main Information Grid */}
          <Grid container spacing={3}>
            {/* Left Column - Work Order Info */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Work Order Information
                  </Typography>
                  
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CalendarIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Scheduled Date"
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              {dayjs(workOrder.date).format('MMMM DD, YYYY')}
                            </Typography>
                            {workOrder.dueDate && (
                              <Typography variant="caption" color={isOverdue ? 'error' : 'text.secondary'}>
                                {isOverdue 
                                  ? `${Math.abs(daysUntilDue!)} days overdue`
                                  : daysUntilDue === 0 
                                  ? 'Due today'
                                  : `Due in ${daysUntilDue} days`
                                }
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>

                    {workOrder.estimatedDuration && (
                      <ListItem>
                        <ListItemIcon>
                          <DurationIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Estimated Duration"
                          secondary={`${hoursEstimate > 0 ? `${hoursEstimate}h ` : ''}${minutesEstimate}min`}
                        />
                      </ListItem>
                    )}

                    <ListItem>
                      <ListItemIcon>
                        <PriorityIcon sx={{ color: getPriorityColor(workOrder.priority) }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Priority"
                        secondary={
                          <Chip
                            label={workOrder.priority || 'MEDIUM'}
                            size="small"
                            sx={{
                              bgcolor: getPriorityColor(workOrder.priority) + '20',
                              color: getPriorityColor(workOrder.priority),
                              fontWeight: 600,
                            }}
                          />
                        }
                      />
                    </ListItem>

                    {workOrder.category && (
                      <ListItem>
                        <ListItemIcon>
                          <CategoryIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Category"
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">
                                {getCategoryIcon(workOrder.category)} {workOrder.category}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>

              {/* Asset Information */}
              {workOrder.assetId && (
                <Card variant="outlined" sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Asset Information
                    </Typography>
                    
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <AssetIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Asset"
                          secondary={workOrder.assetName || `Asset #${workOrder.assetId}`}
                        />
                      </ListItem>

                      {workOrder.location && (
                        <ListItem>
                          <ListItemIcon>
                            <LocationIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Location"
                            secondary={workOrder.location}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              )}
            </Grid>

            {/* Right Column - Details & Assignment */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Assignment & Details
                  </Typography>
                  
                  <List dense>
                    {workOrder.assignedTo && (
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Assigned To"
                          secondary={workOrder.assignedTo}
                        />
                      </ListItem>
                    )}

                    {workOrder.description && (
                      <ListItem alignItems="flex-start">
                        <ListItemIcon>
                          <DescriptionIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Description"
                          secondary={
                            <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                              {workOrder.description}
                            </Typography>
                          }
                        />
                      </ListItem>
                    )}
                  </List>

                  {/* Task Preview */}
                  <Box sx={{ mt: 2, p: 2, bgcolor: theme.palette.grey[50], borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <ChecklistIcon fontSize="small" color="primary" />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Tasks & Checklist
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      This work order contains detailed task information
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Status Information */}
              <Card variant="outlined" sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Current Status
                  </Typography>
                  
                  <Alert 
                    severity={
                      workOrder.status === 'COMPLETED' ? 'success' :
                      workOrder.status === 'IN_PROGRESS' ? 'info' :
                      isOverdue ? 'error' : 'warning'
                    }
                    sx={{ borderRadius: 2 }}
                  >
                    <Typography variant="body2">
                      Status: <strong>{workOrder.status?.replace('_', ' ') || 'OPEN'}</strong>
                    </Typography>
                    {workOrder.status === 'IN_PROGRESS' && (
                      <Typography variant="caption" color="text.secondary">
                        Work is currently in progress
                      </Typography>
                    )}
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: theme.palette.grey[50] }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
          
          <LoadingButton
            variant="contained"
            onClick={handleViewFullDetails}
            loading={isNavigating}
            startIcon={<ViewDetailsIcon />}
            sx={{
              minWidth: 150,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
              },
            }}
          >
            View Full Details
          </LoadingButton>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default WorkOrderPreviewModal;