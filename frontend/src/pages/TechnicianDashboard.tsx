import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Badge,
  Divider,
  Stack,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Skeleton,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
  Schedule as TimeIcon,
  Assignment as WorkOrderIcon,
  Comment as CommentIcon,
  Person as PersonIcon,
  Build as AssetIcon,
  AccessTime as ClockIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Timer as TimerIcon,
  Flag as PriorityIcon,
  ExpandMore as ExpandMoreIcon,
  QrCodeScanner as QrIcon,
  Notifications as NotificationIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workOrdersService, authService } from '../services/api';
import { statusColors } from '../theme/theme';
import { useComments, useCreateComment } from '../hooks/useComments';

interface WorkOrder {
  id: number;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTo?: string;
  assetName?: string;
  assetId?: number;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  estimatedHours?: number;
}

interface TimeEntry {
  id?: number;
  hours: number;
  description: string;
  workOrderId: number;
  date: string;
}

interface QuickAction {
  label: string;
  icon: React.ReactElement;
  action: () => void;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  disabled?: boolean;
}

export default function TechnicianDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();

  // State management
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [timeEntry, setTimeEntry] = useState({ hours: '', description: '' });
  const [comment, setComment] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Get current user
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  // Fetch work orders assigned to current user
  const { data: workOrders = [], isLoading, refetch } = useQuery({
    queryKey: ['technician-work-orders', currentUser?.email],
    queryFn: async () => {
      try {
        const allWorkOrders = await workOrdersService.getAll();
        // Filter to only show work orders assigned to current user
        const userWorkOrders = allWorkOrders.filter(wo => {
          // Check if assignedTo is a user object with id or email
          if (wo.assignedTo && typeof wo.assignedTo === 'object') {
            return wo.assignedTo.id === currentUser?.id || wo.assignedTo.email === currentUser?.email;
          }
          // Fallback to checking assignedToId directly
          return wo.assignedToId === currentUser?.id;
        });
        
        // Return real work orders only
        console.log(`Found ${userWorkOrders.length} work orders for ${currentUser?.name}`);
        return userWorkOrders;
      } catch (error) {
        console.error('Work orders API error:', error);
        // Return empty array - no mock data
        return [];
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Filter work orders based on selected filter
  const filteredWorkOrders = workOrders.filter(wo => {
    if (filterStatus === 'ALL') return true;
    return wo.status === filterStatus;
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => {
      return workOrdersService.updateStatus(id.toString(), status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-work-orders'] });
      setStatusDialogOpen(false);
      setSelectedWorkOrder(null);
    },
  });

  // Time logging mutation
  const logTimeMutation = useMutation({
    mutationFn: ({ workOrderId, hours, description }: { workOrderId: number; hours: number; description: string }) => {
      return workOrdersService.logTime(workOrderId.toString(), hours, description, 'LABOR', true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-work-orders'] });
      setTimeDialogOpen(false);
      setTimeEntry({ hours: '', description: '' });
      setSelectedWorkOrder(null);
    },
  });

  // Comment mutation
  const createCommentMutation = useCreateComment();

  // Quick action handlers
  const handleStartWork = (workOrder: WorkOrder) => {
    updateStatusMutation.mutate({ id: workOrder.id, status: 'IN_PROGRESS' });
  };

  const handleCompleteWork = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setNewStatus('COMPLETED');
    setStatusDialogOpen(true);
  };

  const handlePauseWork = (workOrder: WorkOrder) => {
    updateStatusMutation.mutate({ id: workOrder.id, status: 'ON_HOLD' });
  };

  const handleLogTime = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setTimeDialogOpen(true);
  };

  const handleAddComment = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setCommentDialogOpen(true);
  };

  const submitStatusUpdate = () => {
    if (selectedWorkOrder) {
      updateStatusMutation.mutate({ id: selectedWorkOrder.id, status: newStatus });
    }
  };

  const submitTimeLog = () => {
    if (selectedWorkOrder && timeEntry.hours && timeEntry.description) {
      logTimeMutation.mutate({
        workOrderId: selectedWorkOrder.id,
        hours: parseFloat(timeEntry.hours),
        description: timeEntry.description,
      });
    }
  };

  const submitComment = () => {
    if (selectedWorkOrder && comment.trim()) {
      createCommentMutation.mutate({
        entityType: 'workOrder',
        entityId: selectedWorkOrder.id,
        commentData: {
          content: comment.trim(),
          isInternal: false,
        },
      }, {
        onSuccess: () => {
          setCommentDialogOpen(false);
          setComment('');
          setSelectedWorkOrder(null);
        },
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'primary';
      case 'ON_HOLD': return 'warning';
      case 'PENDING': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'default';
      default: return 'default';
    }
  };

  const getQuickActions = (workOrder: WorkOrder): QuickAction[] => {
    const actions: QuickAction[] = [];

    switch (workOrder.status) {
      case 'PENDING':
        actions.push({
          label: 'Start',
          icon: <StartIcon />,
          action: () => handleStartWork(workOrder),
          color: 'success',
        });
        break;
      case 'IN_PROGRESS':
        actions.push({
          label: 'Complete',
          icon: <CompleteIcon />,
          action: () => handleCompleteWork(workOrder),
          color: 'success',
        });
        actions.push({
          label: 'Pause',
          icon: <PauseIcon />,
          action: () => handlePauseWork(workOrder),
          color: 'warning',
        });
        break;
      case 'ON_HOLD':
        actions.push({
          label: 'Resume',
          icon: <StartIcon />,
          action: () => handleStartWork(workOrder),
          color: 'primary',
        });
        break;
    }

    actions.push({
      label: 'Log Time',
      icon: <TimerIcon />,
      action: () => handleLogTime(workOrder),
      color: 'primary',
    });

    actions.push({
      label: 'Add Note',
      icon: <CommentIcon />,
      action: () => handleAddComment(workOrder),
      color: 'primary',
    });

    return actions;
  };

  // Stats calculation
  const stats = {
    total: workOrders.length,
    pending: workOrders.filter(wo => wo.status === 'PENDING').length,
    inProgress: workOrders.filter(wo => wo.status === 'IN_PROGRESS').length,
    completed: workOrders.filter(wo => wo.status === 'COMPLETED').length,
    overdue: workOrders.filter(wo => wo.dueDate && new Date(wo.dueDate) < new Date()).length,
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Skeleton variant="rectangular" width="100%" height={60} />
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Grid xs={6} sm={3} key={i}>
                <Skeleton variant="rectangular" width="100%" height={100} />
              </Grid>
            ))}
          </Grid>
          <Skeleton variant="rectangular" width="100%" height={200} />
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', pb: 10 }}>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant={isSmallMobile ? "h5" : "h4"} fontWeight="bold" color="primary">
                My Work Orders
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Welcome back, {currentUser?.name || 'Technician'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={() => refetch()} color="primary">
                <RefreshIcon />
              </IconButton>
              <IconButton color="primary">
                <Badge badgeContent={stats.pending} color="error">
                  <NotificationIcon />
                </Badge>
              </IconButton>
              <IconButton color="primary">
                <QrIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Quick Stats */}
          <Grid container spacing={2}>
            <Grid xs={6} sm={3}>
              <Card>
                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                  <Typography color="text.secondary" variant="body2">
                    Total
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {stats.total}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={6} sm={3}>
              <Card>
                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                  <Typography color="text.secondary" variant="body2">
                    In Progress
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {stats.inProgress}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={6} sm={3}>
              <Card>
                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                  <Typography color="text.secondary" variant="body2">
                    Pending
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {stats.pending}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={6} sm={3}>
              <Card>
                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                  <Typography color="text.secondary" variant="body2">
                    Completed
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.completed}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Filter Bar */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <FilterIcon color="action" />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Filter</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Filter"
              >
                <MenuItem value="ALL">All Orders</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="ON_HOLD">On Hold</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredWorkOrders.length} of {workOrders.length} work orders
            </Typography>
          </Box>
        </Paper>

        {/* Work Orders List */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredWorkOrders.map((workOrder) => {
            const quickActions = getQuickActions(workOrder);
            const isOverdue = workOrder.dueDate && new Date(workOrder.dueDate) < new Date();

            return (
              <Card
                key={workOrder.id}
                sx={{
                  border: isOverdue ? '1px solid' : 'none',
                  borderColor: isOverdue ? 'error.main' : 'transparent',
                  bgcolor: workOrder.status === 'IN_PROGRESS' ? 'primary.50' : 'background.paper',
                }}
              >
                <CardContent sx={{ pb: 1 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ flex: 1, mr: 2 }}>
                      <Typography variant="h6" fontWeight="600" sx={{ mb: 0.5 }}>
                        {workOrder.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        <Chip
                          label={workOrder.status.replace('_', ' ')}
                          color={getStatusColor(workOrder.status) as any}
                          size="small"
                        />
                        <Chip
                          label={workOrder.priority}
                          color={getPriorityColor(workOrder.priority) as any}
                          size="small"
                        />
                        {isOverdue && (
                          <Chip
                            label="OVERDUE"
                            color="error"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      #{workOrder.id}
                    </Typography>
                  </Box>

                  {/* Details */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.4 }}>
                    {workOrder.description}
                  </Typography>

                  {/* Asset and Time Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    {workOrder.assetName && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AssetIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {workOrder.assetName}
                        </Typography>
                      </Box>
                    )}
                    {workOrder.estimatedHours && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ClockIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {workOrder.estimatedHours}h
                        </Typography>
                      </Box>
                    )}
                    {workOrder.dueDate && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TimeIcon fontSize="small" color={isOverdue ? "error" : "action"} />
                        <Typography 
                          variant="body2" 
                          color={isOverdue ? "error" : "text.secondary"}
                          fontWeight={isOverdue ? 600 : 400}
                        >
                          Due {new Date(workOrder.dueDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Progress Bar for In Progress items */}
                  {workOrder.status === 'IN_PROGRESS' && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Progress
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          In Progress...
                        </Typography>
                      </Box>
                      <LinearProgress variant="indeterminate" />
                    </Box>
                  )}
                </CardContent>

                {/* Actions */}
                <CardActions sx={{ px: 2, pb: 2, pt: 0, flexWrap: 'wrap', gap: 1 }}>
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      startIcon={action.icon}
                      onClick={action.action}
                      variant={index === 0 ? 'contained' : 'outlined'}
                      color={action.color}
                      size="small"
                      disabled={action.disabled || updateStatusMutation.isPending}
                      sx={{ minWidth: isSmallMobile ? 'auto' : 100 }}
                    >
                      {isSmallMobile && index > 1 ? '' : action.label}
                    </Button>
                  ))}
                </CardActions>
              </Card>
            );
          })}
        </Box>

        {/* Empty State */}
        {filteredWorkOrders.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <WorkOrderIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No work orders found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filterStatus === 'ALL' 
                ? "You don't have any assigned work orders yet."
                : `No work orders with status: ${filterStatus.toLowerCase()}`
              }
            </Typography>
          </Paper>
        )}
      </Container>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Work Order Status</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>New Status</InputLabel>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                label="New Status"
              >
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="ON_HOLD">On Hold</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitStatusUpdate}
            disabled={!newStatus || updateStatusMutation.isPending}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Time Logging Dialog */}
      <Dialog open={timeDialogOpen} onClose={() => setTimeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log Time</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Hours Worked"
              type="number"
              value={timeEntry.hours}
              onChange={(e) => setTimeEntry({ ...timeEntry, hours: e.target.value })}
              inputProps={{ min: 0, step: 0.25 }}
              helperText="Enter hours in decimal format (e.g., 2.5)"
            />
            <TextField
              fullWidth
              label="Work Description"
              multiline
              rows={3}
              value={timeEntry.description}
              onChange={(e) => setTimeEntry({ ...timeEntry, description: e.target.value })}
              placeholder="Describe what work was performed..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimeDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitTimeLog}
            disabled={!timeEntry.hours || !timeEntry.description.trim() || logTimeMutation.isPending}
            startIcon={logTimeMutation.isPending ? <CircularProgress size={16} /> : <TimerIcon />}
          >
            Log Time
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onClose={() => setCommentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Note</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Your Note"
              multiline
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a note about this work order..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitComment}
            disabled={!comment.trim() || createCommentMutation.isPending}
            startIcon={createCommentMutation.isPending ? <CircularProgress size={16} /> : <CommentIcon />}
          >
            Add Note
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for QR Scanner */}
      <Fab
        color="primary"
        aria-label="scan"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <QrIcon />
      </Fab>
    </Box>
  );
}