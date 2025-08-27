import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Avatar,
  Chip,
  Stack,
  Grid,
  TextField,
  useTheme,
  useMediaQuery,
  Container,
  Alert,
  CircularProgress,
  Skeleton,
  Card,
  CardContent,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  CheckCircle as CompleteIcon,
  Person as AssignIcon,
  Schedule as TimeIcon,
  Comment as CommentIcon,
  Build as AssetIcon,
  Priority as PriorityIcon,
  CalendarToday as DateIcon,
  AttachFile as AttachmentIcon,
  Share as ShareIcon,
  MoreVert as MoreIcon,
  AccessTime as ClockIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workOrdersService } from '../services/api';
import {
  MobileHeader,
  ExpandableCard,
  FloatingActionMenu,
  PullToRefresh,
  StatusBadge,
  ProgressCard
} from '../components/Common/MobileComponents';

interface WorkOrder {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignedTo?: { id: number; name: string; email: string };
  asset?: { id: number; name: string; location?: { name: string } };
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  attachments?: any[];
  comments?: any[];
}

interface TimeEntry {
  id: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  description?: string;
  userId: number;
  user: { name: string };
}

const WorkOrderDetailMobile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();

  // State management
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [showStatusChange, setShowStatusChange] = useState(false);

  // Queries
  const { data: workOrder, isLoading, error, refetch } = useQuery<WorkOrder>({
    queryKey: ['work-order', id],
    queryFn: () => workOrdersService.getById(id!),
    enabled: !!id,
  });

  const { data: timeEntries = [] } = useQuery<TimeEntry[]>({
    queryKey: ['work-order-time', id],
    queryFn: () => workOrdersService.getTimeEntries(id!),
    enabled: !!id,
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ status }: { status: string }) => 
      workOrdersService.updateStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order', id] });
    }
  });

  // Calculate progress based on status
  const getProgress = useCallback((status: string) => {
    switch (status) {
      case 'OPEN': return 0;
      case 'IN_PROGRESS': return 50;
      case 'ON_HOLD': return 25;
      case 'COMPLETED': return 100;
      case 'CANCELLED': return 0;
      default: return 0;
    }
  }, []);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'info';
      case 'IN_PROGRESS': return 'warning';
      case 'ON_HOLD': return 'error';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'error';
      case 'URGENT': return 'error';
      default: return 'default';
    }
  };

  // Quick status actions
  const quickActions = [
    {
      status: 'IN_PROGRESS',
      label: 'Start Work',
      icon: <StartIcon />,
      color: 'warning' as const,
      condition: (wo: WorkOrder) => wo.status === 'OPEN'
    },
    {
      status: 'ON_HOLD',
      label: 'Put on Hold',
      icon: <StopIcon />,
      color: 'error' as const,
      condition: (wo: WorkOrder) => wo.status === 'IN_PROGRESS'
    },
    {
      status: 'COMPLETED',
      label: 'Complete',
      icon: <CompleteIcon />,
      color: 'success' as const,
      condition: (wo: WorkOrder) => wo.status === 'IN_PROGRESS'
    },
    {
      status: 'OPEN',
      label: 'Reopen',
      icon: <StartIcon />,
      color: 'info' as const,
      condition: (wo: WorkOrder) => wo.status === 'ON_HOLD'
    }
  ];

  const availableActions = workOrder ? quickActions.filter(action => action.condition(workOrder)) : [];

  // Floating actions
  const floatingActions = [
    {
      icon: <EditIcon />,
      label: 'Edit Work Order',
      onClick: () => navigate(`/work-orders/${id}/edit`),
      color: 'primary' as const
    },
    {
      icon: <CommentIcon />,
      label: 'Add Comment',
      onClick: () => {/* TODO: Show comment modal */},
      color: 'secondary' as const
    },
    {
      icon: <TimeIcon />,
      label: isTimerRunning ? 'Stop Timer' : 'Start Timer',
      onClick: () => setIsTimerRunning(!isTimerRunning),
      color: isTimerRunning ? 'error' : 'success' as const
    },
    {
      icon: <AssignIcon />,
      label: 'Reassign',
      onClick: () => {/* TODO: Show assign modal */},
      color: 'info' as const
    }
  ];

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['work-order', id] }),
      queryClient.invalidateQueries({ queryKey: ['work-order-time', id] })
    ]);
  }, [queryClient, id]);

  // Handle status change
  const handleStatusChange = async (status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ status });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <MobileHeader
          title="Loading..."
          onBack={() => navigate(-1)}
        />
        <Container maxWidth="sm" sx={{ py: 2 }}>
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
          </Stack>
        </Container>
      </Box>
    );
  }

  if (error || !workOrder) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <MobileHeader
          title="Work Order Not Found"
          onBack={() => navigate(-1)}
        />
        <Container maxWidth="sm" sx={{ py: 2 }}>
          <Alert severity="error">
            Failed to load work order details. Please try again.
            <Button onClick={() => refetch()} sx={{ mt: 1 }}>
              Retry
            </Button>
          </Alert>
        </Container>
      </Box>
    );
  }

  const progress = getProgress(workOrder.status);
  const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      <MobileHeader
        title={`WO-${workOrder.id}`}
        subtitle={workOrder.title}
        onBack={() => navigate(-1)}
        actions={[
          <IconButton key="share" size="large">
            <ShareIcon />
          </IconButton>,
          <IconButton key="more" size="large">
            <MoreIcon />
          </IconButton>
        ]}
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <Container maxWidth="sm" sx={{ py: 2 }}>
          <Stack spacing={2}>
            {/* Status Progress Card */}
            <ExpandableCard
              title="Work Order Progress"
              subtitle={`${progress}% Complete`}
              icon={
                <Avatar
                  sx={{ 
                    bgcolor: `${getStatusColor(workOrder.status)}.light`,
                    color: `${getStatusColor(workOrder.status)}.main`
                  }}
                >
                  {progress === 100 ? <CompleteIcon /> : <ClockIcon />}
                </Avatar>
              }
              badge={<StatusBadge status={workOrder.status} />}
              expanded={true}
              disabled={true}
              elevation={2}
            >
              <LinearProgress
                variant="determinate"
                value={progress}
                color={getStatusColor(workOrder.status)}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  mb: 3,
                  bgcolor: (theme) => theme.palette.grey[200]
                }}
              />

              {/* Quick Actions */}
              {availableActions.length > 0 && (
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {availableActions.map((action) => (
                    <Grid item xs={6} key={action.status}>
                      <Button
                        variant="outlined"
                        color={action.color}
                        fullWidth
                        startIcon={action.icon}
                        onClick={() => handleStatusChange(action.status)}
                        disabled={updateStatusMutation.isPending}
                        sx={{ minHeight: 48 }}
                      >
                        {action.label}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              )}

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <ProgressCard
                    title="Priority"
                    current={0}
                    total={0}
                    color={getPriorityColor(workOrder.priority)}
                    showPercentage={false}
                    icon={<PriorityIcon />}
                  />
                  <Typography variant="body2" textAlign="center" sx={{ mt: 1 }}>
                    {workOrder.priority}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <ProgressCard
                    title="Time Logged"
                    current={totalHours}
                    total={workOrder.estimatedHours || totalHours || 1}
                    color="primary"
                    showPercentage={false}
                    icon={<TimeIcon />}
                  />
                  <Typography variant="body2" textAlign="center" sx={{ mt: 1 }}>
                    {totalHours.toFixed(1)}h / {workOrder.estimatedHours || 'Est'}h
                  </Typography>
                </Grid>
              </Grid>
            </ExpandableCard>

            {/* Work Order Details */}
            <ExpandableCard
              title="Work Order Details"
              subtitle="Description and specifications"
              icon={<EditIcon />}
            >
              <Stack spacing={2}>
                {workOrder.description && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Description
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {workOrder.description}
                    </Typography>
                  </Box>
                )}

                {workOrder.dueDate && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DateIcon color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Due Date</Typography>
                      <Typography variant="body1">
                        {new Date(workOrder.dueDate).toLocaleDateString()}
                        {new Date(workOrder.dueDate) < new Date() && (
                          <Chip label="Overdue" size="small" color="error" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {workOrder.assignedTo && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {workOrder.assignedTo.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Assigned To</Typography>
                      <Typography variant="body1">{workOrder.assignedTo.name}</Typography>
                    </Box>
                  </Box>
                )}
              </Stack>
            </ExpandableCard>

            {/* Asset Information */}
            {workOrder.asset && (
              <ExpandableCard
                title="Asset Information"
                subtitle={workOrder.asset.name}
                icon={<AssetIcon />}
              >
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                  onClick={() => navigate(`/assets/${workOrder.asset!.id}`)}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    {workOrder.asset.name}
                  </Typography>
                  {workOrder.asset.location && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LocationIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {workOrder.asset.location.name}
                      </Typography>
                    </Stack>
                  )}
                  <Button size="small" variant="text" sx={{ mt: 1, p: 0 }}>
                    View Asset Details
                  </Button>
                </Box>
              </ExpandableCard>
            )}

            {/* Time Tracking */}
            <ExpandableCard
              title="Time Tracking"
              subtitle={`${totalHours.toFixed(1)} hours logged`}
              icon={<TimeIcon />}
              badge={
                isTimerRunning && (
                  <Chip label="Timer Running" size="small" color="success" />
                )
              }
            >
              {isTimerRunning && (
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'success.light', 
                  borderRadius: 1, 
                  mb: 2,
                  textAlign: 'center'
                }}>
                  <Typography variant="h4" color="success.dark">
                    {Math.floor(currentTime / 3600)}:{String(Math.floor((currentTime % 3600) / 60)).padStart(2, '0')}:{String(currentTime % 60).padStart(2, '0')}
                  </Typography>
                  <Typography variant="body2" color="success.dark">
                    Timer Running
                  </Typography>
                </Box>
              )}

              {timeEntries.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  No time entries recorded yet
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {timeEntries.slice(0, 5).map((entry) => (
                    <Box
                      key={entry.id}
                      sx={{
                        p: 2,
                        bgcolor: 'background.paper',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2">
                          {entry.user.name}
                        </Typography>
                        <Chip 
                          label={`${(entry.duration || 0).toFixed(1)}h`} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(entry.startTime).toLocaleString()}
                        {entry.endTime && ` - ${new Date(entry.endTime).toLocaleString()}`}
                      </Typography>
                      {entry.description && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {entry.description}
                        </Typography>
                      )}
                    </Box>
                  ))}
                  {timeEntries.length > 5 && (
                    <Button variant="text" sx={{ mt: 1 }}>
                      View All Time Entries
                    </Button>
                  )}
                </Stack>
              )}
            </ExpandableCard>

            {/* Comments */}
            <ExpandableCard
              title="Comments"
              subtitle={`${workOrder.comments?.length || 0} comments`}
              icon={<CommentIcon />}
            >
              <Stack spacing={2}>
                {/* Add Comment */}
                <Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mt: 1 }}
                    disabled={!newComment.trim()}
                  >
                    Add Comment
                  </Button>
                </Box>

                <Divider />

                {/* Comments List */}
                {workOrder.comments?.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                    No comments yet
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {workOrder.comments?.map((comment: any) => (
                      <Box key={comment.id} sx={{ display: 'flex', gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {comment.user?.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {comment.user?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(comment.createdAt).toLocaleString()}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {comment.content}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Stack>
            </ExpandableCard>

            {/* Attachments */}
            {workOrder.attachments && workOrder.attachments.length > 0 && (
              <ExpandableCard
                title="Attachments"
                subtitle={`${workOrder.attachments.length} files`}
                icon={<AttachmentIcon />}
              >
                <Stack spacing={1}>
                  {workOrder.attachments.map((attachment: any, index: number) => (
                    <Box
                      key={index}
                      sx={{
                        p: 1.5,
                        bgcolor: 'background.paper',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}
                    >
                      <AttachmentIcon color="action" />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap>
                          {attachment.filename || `Attachment ${index + 1}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {attachment.type || 'Unknown type'}
                        </Typography>
                      </Box>
                      <Button size="small" variant="outlined">
                        View
                      </Button>
                    </Box>
                  ))}
                </Stack>
              </ExpandableCard>
            )}
          </Stack>
        </Container>
      </PullToRefresh>

      {/* Floating Action Menu */}
      <FloatingActionMenu actions={floatingActions} />
    </Box>
  );
};

export default WorkOrderDetailMobile;