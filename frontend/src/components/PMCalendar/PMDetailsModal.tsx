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
  ListItemSecondaryAction,
  Avatar,
  Stack,
  Tooltip,
  Alert,
  TextField,
  MenuItem,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
  Assignment as WorkOrderIcon,
  Build as AssetIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  AccessTime as DurationIcon,
  Flag as PriorityIcon,
  Warning as CriticalityIcon,
  Description as DescriptionIcon,
  History as HistoryIcon,
  AttachFile as AttachmentIcon,
  CheckCircle as CompleteIcon,
  PlayArrow as StartIcon,
  Cancel as CancelIcon,
  Postpone as PostponeIcon,
  ContentCopy as CopyIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  CalendarMonth as CalendarIcon,
  Engineering as TechnicianIcon,
  Category as TaskTypeIcon,
  Checklist as ChecklistIcon,
  Note as NoteIcon,
  PhotoCamera as PhotoIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { PMScheduleItem } from '../../types/pmCalendar';
import { LoadingButton } from '../Loading';
import { statusColors } from '../../theme/theme';

dayjs.extend(relativeTime);

interface PMDetailsModalProps {
  open: boolean;
  onClose: () => void;
  pm: PMScheduleItem | null;
  onEdit?: (pm: PMScheduleItem) => void;
  onComplete?: (pmId: number) => void;
  onPostpone?: (pmId: number, newDate: Date) => void;
  onCancel?: (pmId: number) => void;
  onViewWorkOrder?: (workOrderId: number) => void;
  onCreateWorkOrder?: (pmId: number) => void;
  onViewAsset?: (assetId: number) => void;
}

const PMDetailsModal: React.FC<PMDetailsModalProps> = ({
  open,
  onClose,
  pm,
  onEdit,
  onComplete,
  onPostpone,
  onCancel,
  onViewWorkOrder,
  onCreateWorkOrder,
  onViewAsset,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [showPostponeDialog, setShowPostponeDialog] = useState(false);
  const [postponeDate, setPostponeDate] = useState('');

  if (!pm) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return theme.palette.error.main;
      case 'HIGH': return theme.palette.warning.main;
      case 'MEDIUM': return theme.palette.info.main;
      case 'LOW': return theme.palette.success.main;
      default: return theme.palette.grey[500];
    }
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'IMPORTANT': return theme.palette.error.light;
      case 'HIGH': return theme.palette.warning.light;
      case 'MEDIUM': return theme.palette.info.light;
      case 'LOW': return theme.palette.success.light;
      default: return theme.palette.grey[300];
    }
  };

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'INSPECTION': return '🔍';
      case 'CLEANING': return '🧹';
      case 'LUBRICATION': return '🛢️';
      case 'REPLACEMENT': return '🔧';
      case 'CALIBRATION': return '📏';
      case 'TESTING': return '🧪';
      default: return '⚙️';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'COMPLETED': return theme.palette.success.main;
      case 'IN_PROGRESS': return theme.palette.info.main;
      case 'CANCELLED': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const handlePostpone = () => {
    if (postponeDate && onPostpone) {
      onPostpone(pm.id, new Date(postponeDate));
      setShowPostponeDialog(false);
      setPostponeDate('');
      onClose();
    }
  };

  const isOverdue = pm.isOverdue;
  const daysUntilDue = dayjs(pm.scheduledDate).diff(dayjs(), 'day');
  const hoursEstimate = Math.floor(pm.estimatedDuration / 60);
  const minutesEstimate = pm.estimatedDuration % 60;

  return (
    <>
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
            maxHeight: isMobile ? '100%' : '90vh',
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
                bgcolor: getPriorityColor(pm.priority), 
                width: 48, 
                height: 48,
                fontSize: '1.5rem',
              }}>
                {getTaskTypeIcon(pm.taskType)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                  {pm.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                  <Chip
                    label={pm.status || 'SCHEDULED'}
                    size="small"
                    sx={{
                      bgcolor: getStatusColor(pm.status) + '20',
                      color: getStatusColor(pm.status),
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
                  {pm.workOrderId && (
                    <Chip
                      icon={<WorkOrderIcon sx={{ fontSize: 16 }} />}
                      label={`WO #${pm.workOrderId}`}
                      size="small"
                      variant="outlined"
                      onClick={() => onViewWorkOrder?.(pm.workOrderId!)}
                      sx={{ cursor: 'pointer' }}
                    />
                  )}
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
                {!pm.workOrderId && (
                  <Button
                    variant="contained"
                    startIcon={<WorkOrderIcon />}
                    onClick={() => onCreateWorkOrder?.(pm.id)}
                    size="small"
                  >
                    Create Work Order
                  </Button>
                )}
                {pm.workOrderId && (
                  <Button
                    variant="outlined"
                    startIcon={<WorkOrderIcon />}
                    onClick={() => onViewWorkOrder?.(pm.workOrderId!)}
                    size="small"
                  >
                    View Work Order
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => onEdit?.(pm)}
                  size="small"
                >
                  Edit Schedule
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PostponeIcon />}
                  onClick={() => setShowPostponeDialog(true)}
                  size="small"
                  color="warning"
                >
                  Postpone
                </Button>
                {pm.status !== 'COMPLETED' && (
                  <Button
                    variant="outlined"
                    startIcon={<CompleteIcon />}
                    onClick={() => onComplete?.(pm.id)}
                    size="small"
                    color="success"
                  >
                    Mark Complete
                  </Button>
                )}
              </Box>
            </Paper>

            {/* Main Information Grid */}
            <Grid container spacing={3}>
              {/* Left Column - Schedule & Asset Info */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Schedule Information
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
                                {dayjs(pm.scheduledDate).format('MMMM DD, YYYY')}
                              </Typography>
                              <Typography variant="caption" color={isOverdue ? 'error' : 'text.secondary'}>
                                {isOverdue 
                                  ? `${Math.abs(daysUntilDue)} days overdue`
                                  : daysUntilDue === 0 
                                  ? 'Due today'
                                  : `Due in ${daysUntilDue} days`
                                }
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <DurationIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Estimated Duration"
                          secondary={`${hoursEstimate > 0 ? `${hoursEstimate}h ` : ''}${minutesEstimate}min`}
                        />
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <PriorityIcon sx={{ color: getPriorityColor(pm.priority) }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Priority"
                          secondary={
                            <Chip
                              label={pm.priority}
                              size="small"
                              sx={{
                                bgcolor: getPriorityColor(pm.priority) + '20',
                                color: getPriorityColor(pm.priority),
                                fontWeight: 600,
                              }}
                            />
                          }
                        />
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <CriticalityIcon sx={{ color: getCriticalityColor(pm.criticality) }} />
                        </ListItemIcon>
                        <ListItemText
                          primary="Criticality"
                          secondary={
                            <Chip
                              label={pm.criticality}
                              size="small"
                              sx={{
                                bgcolor: getCriticalityColor(pm.criticality),
                                color: theme.palette.getContrastText(getCriticalityColor(pm.criticality)),
                                fontWeight: 600,
                              }}
                            />
                          }
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>

                {/* Asset Information */}
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
                          secondary={pm.assetName}
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            size="small"
                            onClick={() => onViewAsset?.(pm.assetId)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <LocationIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Location"
                          secondary={pm.location}
                        />
                      </ListItem>

                      {pm.assignedTechnician && (
                        <ListItem>
                          <ListItemIcon>
                            <PersonIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Assigned Technician"
                            secondary={pm.assignedTechnician}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Right Column - Task Details */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Task Details
                    </Typography>
                    
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <TaskTypeIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Task Type"
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">
                                {getTaskTypeIcon(pm.taskType)} {pm.taskType}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>

                      {pm.description && (
                        <ListItem alignItems="flex-start">
                          <ListItemIcon>
                            <DescriptionIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Description"
                            secondary={
                              <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                                {pm.description}
                              </Typography>
                            }
                          />
                        </ListItem>
                      )}
                    </List>

                    {/* Task Checklist Preview */}
                    <Box sx={{ mt: 2, p: 2, bgcolor: theme.palette.grey[50], borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <ChecklistIcon fontSize="small" color="primary" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Task Checklist
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Standard checklist items for {pm.taskType.toLowerCase()} tasks
                      </Typography>
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<EditIcon />}
                        sx={{ mt: 1 }}
                        onClick={() => onEdit?.(pm)}
                      >
                        View/Edit Checklist
                      </Button>
                    </Box>
                  </CardContent>
                </Card>

                {/* Notes Section */}
                <Card variant="outlined" sx={{ mt: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Notes & Comments
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => setIsEditingNotes(!isEditingNotes)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    
                    {isEditingNotes ? (
                      <Box>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add notes about this PM schedule..."
                          variant="outlined"
                          size="small"
                        />
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Button size="small" variant="contained" onClick={() => setIsEditingNotes(false)}>
                            Save
                          </Button>
                          <Button size="small" onClick={() => setIsEditingNotes(false)}>
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {notes || 'No notes added yet'}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* History/Timeline Section */}
            <Card variant="outlined" sx={{ mt: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <HistoryIcon color="primary" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Maintenance History
                  </Typography>
                </Box>
                
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <Typography variant="body2">
                    Last completed: {dayjs().subtract(30, 'days').format('MMMM DD, YYYY')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    This task has been completed 12 times in the last 12 months
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: theme.palette.grey[50] }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Print PM details">
                <IconButton size="small">
                  <PrintIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share PM details">
                <IconButton size="small">
                  <ShareIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Copy PM details">
                <IconButton size="small">
                  <CopyIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              {pm.status !== 'COMPLETED' && pm.status !== 'CANCELLED' && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => onCancel?.(pm.id)}
                  startIcon={<CancelIcon />}
                >
                  Cancel PM
                </Button>
              )}
              <Button variant="outlined" onClick={onClose}>
                Close
              </Button>
            </Box>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Postpone Dialog */}
      <Dialog open={showPostponeDialog} onClose={() => setShowPostponeDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Postpone PM Schedule</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Select a new date for this PM schedule:
          </Typography>
          <TextField
            fullWidth
            type="date"
            value={postponeDate}
            onChange={(e) => setPostponeDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: dayjs().add(1, 'day').format('YYYY-MM-DD'),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPostponeDialog(false)}>Cancel</Button>
          <LoadingButton
            variant="contained"
            onClick={handlePostpone}
            disabled={!postponeDate}
            color="warning"
          >
            Postpone
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PMDetailsModal;