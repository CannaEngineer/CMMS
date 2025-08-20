import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Chip,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Breadcrumbs,
  Link,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Menu,
  Fade,
  Avatar,
  Stack,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as WorkOrderIcon,
  Build as AssetIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  NavigateNext as NavigateNextIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
  Update as UpdateIcon,
  PriorityHigh as PriorityIcon,
  PersonAdd as AssignIcon,
  AccessTime as TimeIcon,
  Comment as CommentIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Flag as FlagIcon,
  Cancel as CancelIcon,
  RestartAlt as RestartIcon,
  Timer as TimerIcon,
  AttachFile as AttachFileIcon,
  Notifications as NotifyIcon,
  Image as ImageIcon,
  GetApp as DownloadIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workOrdersService, usersService } from '../services/api';
import { statusColors } from '../theme/theme';
import QRCodeDisplay from '../components/QR/QRCodeDisplay';
import WorkOrderForm from '../components/Forms/WorkOrderForm';
import { useComments, useCreateComment, useCommentCount } from '../hooks/useComments';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function WorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Quick Actions state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [priorityDialogOpen, setPriorityDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  
  // Form state
  const [newStatus, setNewStatus] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [comment, setComment] = useState('');
  const [timeEntry, setTimeEntry] = useState('');
  const [statusNotes, setStatusNotes] = useState('');

  // Fetch work order data
  const { data: workOrder, isLoading, error } = useQuery({
    queryKey: ['work-order', id],
    queryFn: async () => {
      if (!id) throw new Error('Work order ID is required');
      // Add mock data for better demo
      const mockWorkOrder = {
        id: parseInt(id),
        title: `Work Order ${id}`,
        description: 'This is a detailed work order description explaining what needs to be done.',
        status: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'][Math.floor(Math.random() * 4)],
        priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][Math.floor(Math.random() * 4)],
        assignedTo: 'John Smith',
        assetId: Math.floor(Math.random() * 10) + 1,
        assetName: `Asset ${Math.floor(Math.random() * 10) + 1}`,
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
        estimatedHours: Math.floor(Math.random() * 8) + 1,
        qrCode: null, // Will be generated automatically
      };
      
      try {
        const result = await workOrdersService.getById(id);
        return { ...mockWorkOrder, ...result };
      } catch (error) {
        console.warn(`Work order ${id} API not available, using mock data`);
        return mockWorkOrder;
      }
    },
    enabled: !!id,
  });

  // Fetch users for assignment dropdown
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const result = await usersService.getAll();
        return result;
      } catch (error) {
        console.warn('Users API not available, using mock data');
        // Mock users data
        return [
          { id: '1', name: 'John Smith', email: 'john.smith@company.com', role: 'Technician' },
          { id: '2', name: 'Sarah Johnson', email: 'sarah.johnson@company.com', role: 'Senior Technician' },
          { id: '3', name: 'Mike Wilson', email: 'mike.wilson@company.com', role: 'Maintenance Manager' },
          { id: '4', name: 'Emily Brown', email: 'emily.brown@company.com', role: 'Technician' },
          { id: '5', name: 'David Lee', email: 'david.lee@company.com', role: 'Specialist' },
        ];
      }
    },
  });

  // Fetch comments for the work order using the real comment system
  const { data: comments = [], isLoading: commentsLoading, refetch: refetchComments } = useComments(
    'workOrder',
    parseInt(id || '0'),
    { includeReplies: true }
  );

  // Get comment count for the work order
  const { data: commentCount = 0 } = useCommentCount('workOrder', parseInt(id || '0'));

  // Fetch time logs for the work order
  const { data: timeLogs = [], refetch: refetchTimeLogs } = useQuery({
    queryKey: ['work-order-time-logs', id],
    queryFn: async () => {
      if (!id) return [];
      return workOrdersService.getTimeLogs(id);
    },
    enabled: !!id,
  });

  // Fetch time stats for the work order
  const { data: timeStats } = useQuery({
    queryKey: ['work-order-time-stats', id],
    queryFn: async () => {
      if (!id) return { totalHours: 0, billableHours: 0 };
      return workOrdersService.getTimeStats(id);
    },
    enabled: !!id,
  });

  // Update mutation
  const updateWorkOrderMutation = useMutation({
    mutationFn: (updatedData: any) => {
      if (!id) throw new Error('Work order ID is required');
      return workOrdersService.update(id, updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order', id] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      setEditDialogOpen(false);
    },
    onError: (error) => {
      console.error('Failed to update work order:', error);
    },
  });

  // Delete mutation
  const deleteWorkOrderMutation = useMutation({
    mutationFn: workOrdersService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      navigate('/work-orders');
    },
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ status, notes }: { status: string; notes?: string }) => {
      if (!id) throw new Error('Work order ID is required');
      return workOrdersService.updateStatus(id, status, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order', id] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      setStatusDialogOpen(false);
      setStatusNotes('');
    },
  });

  // Priority update mutation
  const updatePriorityMutation = useMutation({
    mutationFn: ({ priority }: { priority: string }) => {
      if (!id) throw new Error('Work order ID is required');
      return workOrdersService.updatePriority(id, priority);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order', id] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      setPriorityDialogOpen(false);
    },
  });

  // Assignment mutation
  const assignWorkOrderMutation = useMutation({
    mutationFn: ({ assigneeEmail }: { assigneeEmail: string }) => {
      if (!id) throw new Error('Work order ID is required');
      return workOrdersService.assignWorkOrder(id, assigneeEmail);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order', id] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      setAssignDialogOpen(false);
      setAssigneeEmail('');
      setSelectedUser('');
    },
  });

  // Add comment mutation using the real comment system
  const createCommentMutation = useCreateComment();

  // Log time mutation
  const logTimeMutation = useMutation({
    mutationFn: ({ hours, description }: { hours: number; description: string }) => {
      if (!id) throw new Error('Work order ID is required');
      return workOrdersService.logTime(id, hours, description, 'LABOR', true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order', id] });
      queryClient.invalidateQueries({ queryKey: ['work-order-time-logs', id] });
      queryClient.invalidateQueries({ queryKey: ['work-order-time-stats', id] });
      refetchTimeLogs();
      setTimeDialogOpen(false);
      setTimeEntry('');
      setComment(''); // Clear the comment field too
    },
  });

  const handleDelete = () => {
    if (workOrder && window.confirm(`Are you sure you want to delete "${workOrder.title}"?`)) {
      deleteWorkOrderMutation.mutate(workOrder.id.toString());
    }
  };

  const handleStatusUpdate = (status: string, notes?: string) => {
    updateStatusMutation.mutate({ status, notes });
  };

  const handleQuickStatusUpdate = (status: string) => {
    setNewStatus(status);
    setStatusDialogOpen(true);
  };

  const handlePriorityUpdate = () => {
    if (newPriority) {
      updatePriorityMutation.mutate({ priority: newPriority });
    }
  };

  const handleAssignWorkOrder = () => {
    const userToAssign = users.find(user => user.id === selectedUser);
    if (userToAssign) {
      assignWorkOrderMutation.mutate({ assigneeEmail: userToAssign.email });
    } else if (assigneeEmail.trim()) {
      // Fallback to manual email entry
      assignWorkOrderMutation.mutate({ assigneeEmail: assigneeEmail.trim() });
    }
  };

  const handleAddComment = () => {
    if (comment.trim()) {
      createCommentMutation.mutate({
        entityType: 'workOrder',
        entityId: parseInt(id || '0'),
        commentData: {
          content: comment.trim(),
          isInternal: false,
        },
      }, {
        onSuccess: () => {
          setCommentDialogOpen(false);
          setComment('');
          refetchComments(); // Refresh comments list
        },
      });
    }
  };

  const handleLogTime = () => {
    const hours = parseFloat(timeEntry);
    if (hours > 0 && comment.trim()) {
      logTimeMutation.mutate({ hours, description: comment.trim() });
    }
  };

  const handlePrint = () => {
    // Create a print-friendly version of the work order
    const printContent = `
      <html>
        <head>
          <title>Work Order #${workOrder?.id} - ${workOrder?.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; }
            .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            .status.OPEN { background-color: #e3f2fd; color: #1976d2; }
            .status.IN_PROGRESS { background-color: #f3e5f5; color: #7b1fa2; }
            .status.COMPLETED { background-color: #e8f5e8; color: #388e3c; }
            .status.ON_HOLD { background-color: #fff3e0; color: #f57c00; }
            .priority { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            .priority.HIGH, .priority.URGENT { background-color: #ffebee; color: #d32f2f; }
            .priority.MEDIUM { background-color: #fff8e1; color: #f57c00; }
            .priority.LOW { background-color: #f1f8e9; color: #689f38; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Work Order #${workOrder?.id}</h1>
            <h2>${workOrder?.title}</h2>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="section">
            <h3>Status & Priority</h3>
            <p><span class="label">Status:</span> <span class="status ${workOrder?.status}">${workOrder?.status}</span></p>
            <p><span class="label">Priority:</span> <span class="priority ${workOrder?.priority}">${workOrder?.priority}</span></p>
          </div>
          
          <div class="section">
            <h3>Description</h3>
            <p>${workOrder?.description || 'No description provided.'}</p>
          </div>
          
          <div class="section">
            <h3>Details</h3>
            <p><span class="label">Created:</span> ${new Date(workOrder?.createdAt || '').toLocaleDateString()}</p>
            ${workOrder?.dueDate ? `<p><span class="label">Due Date:</span> ${new Date(workOrder.dueDate).toLocaleDateString()}</p>` : ''}
            ${workOrder?.assignedTo ? `<p><span class="label">Assigned To:</span> ${typeof workOrder.assignedTo === 'string' ? workOrder.assignedTo : workOrder.assignedTo.name}</p>` : ''}
            ${workOrder?.estimatedHours ? `<p><span class="label">Estimated Hours:</span> ${workOrder.estimatedHours} hours</p>` : ''}
            ${workOrder?.assetName ? `<p><span class="label">Asset:</span> ${workOrder.assetName}</p>` : ''}
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  // Share work order mutation
  const createShareMutation = useMutation({
    mutationFn: () => {
      if (!id) throw new Error('Work order ID is required');
      return workOrdersService.createShare(id, {
        allowComments: true,
        allowDownload: false,
        viewerCanSeeAssignee: false,
        sanitizationLevel: 'STANDARD'
      });
    },
    onSuccess: async (shareData) => {
      // Use the share URL from the backend, which knows the correct domain
      const publicShareUrl = shareData.shareUrl || `${window.location.origin}/public/share/${shareData.shareToken}`;
      
      try {
        await navigator.clipboard.writeText(publicShareUrl);
        
        // Show success message
        const button = document.querySelector('[aria-label="Share work order"]') as HTMLElement;
        if (button) {
          const originalText = button.innerHTML;
          button.innerHTML = `<span style="color: #4caf50;">✓ Public link copied!</span>`;
          setTimeout(() => {
            button.innerHTML = originalText;
          }, 3000);
        } else {
          alert(`Public share link copied to clipboard!\n\n${publicShareUrl}`);
        }
      } catch (clipboardError) {
        // Fallback: show the URL in an alert
        alert(`Public share link created:\n\n${publicShareUrl}\n\nCopy this link to share with others.`);
      }
    },
    onError: (error) => {
      console.error('Error creating share:', error);
      alert('Failed to create public share link. Please try again.');
    }
  });

  const handleShare = () => {
    createShareMutation.mutate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'primary';
      case 'ON_HOLD':
        return 'warning';
      case 'PENDING':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'default';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !workOrder) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error">
          {error instanceof Error ? error.message : 'Work order not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
          <Link
            color="inherit"
            href="/work-orders"
            onClick={(e) => {
              e.preventDefault();
              navigate('/work-orders');
            }}
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <WorkOrderIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Work Orders
          </Link>
          <Typography color="text.primary">{workOrder.title}</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/work-orders')}>
              <BackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {workOrder.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={workOrder.status}
                  color={getStatusColor(workOrder.status) as any}
                  size="small"
                />
                <Chip
                  label={workOrder.priority}
                  color={getPriorityColor(workOrder.priority) as any}
                  size="small"
                />
                {workOrder.assetName && (
                  <Chip
                    icon={<AssetIcon />}
                    label={workOrder.assetName}
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/assets/${workOrder.assetId}`)}
                    sx={{ cursor: 'pointer' }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {/* Status-based Primary Actions */}
            {workOrder.status === 'PENDING' && (
              <Button
                variant="contained"
                startIcon={<StartIcon />}
                onClick={() => handleStatusUpdate('IN_PROGRESS')}
                disabled={updateStatusMutation.isPending}
                color="success"
              >
                Start Work
              </Button>
            )}
            {workOrder.status === 'IN_PROGRESS' && (
              <>
                <Button
                  variant="contained"
                  startIcon={<CompleteIcon />}
                  onClick={() => handleQuickStatusUpdate('COMPLETED')}
                  disabled={updateStatusMutation.isPending}
                  color="success"
                >
                  Mark Complete
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PauseIcon />}
                  onClick={() => handleQuickStatusUpdate('ON_HOLD')}
                  disabled={updateStatusMutation.isPending}
                >
                  Put on Hold
                </Button>
              </>
            )}
            {workOrder.status === 'ON_HOLD' && (
              <Button
                variant="contained"
                startIcon={<RestartIcon />}
                onClick={() => handleStatusUpdate('IN_PROGRESS')}
                disabled={updateStatusMutation.isPending}
                color="primary"
              >
                Resume Work
              </Button>
            )}
            {workOrder.status === 'COMPLETED' && (
              <Button
                variant="outlined"
                startIcon={<RestartIcon />}
                onClick={() => handleQuickStatusUpdate('IN_PROGRESS')}
                disabled={updateStatusMutation.isPending}
              >
                Reopen
              </Button>
            )}
            
            {/* Core Actions */}
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditDialogOpen(true)}
            >
              Edit
            </Button>
            <Tooltip title="More actions">
              <Button
                variant="outlined"
                startIcon={<UpdateIcon />}
                onClick={() => setStatusDialogOpen(true)}
              >
                Update Status
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Quick Actions Section */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'primary.main' }}>
        <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FlagIcon />
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {/* Priority Management */}
          <Tooltip title="Update work order priority">
            <Button
              variant="outlined"
              startIcon={<PriorityIcon />}
              onClick={() => {
                setNewPriority(workOrder.priority);
                setPriorityDialogOpen(true);
              }}
              size="small"
              color={workOrder.priority === 'URGENT' ? 'error' : workOrder.priority === 'HIGH' ? 'warning' : 'primary'}
            >
              Priority: {workOrder.priority}
            </Button>
          </Tooltip>

          {/* Assignment */}
          <Tooltip title="Assign to technician">
            <Button
              variant="outlined"
              startIcon={<AssignIcon />}
              onClick={() => setAssignDialogOpen(true)}
              size="small"
            >
              {workOrder.assignedTo ? `Assigned: ${typeof workOrder.assignedTo === 'string' ? workOrder.assignedTo : workOrder.assignedTo.name}` : 'Assign'}
            </Button>
          </Tooltip>

          {/* Time Logging */}
          <Tooltip title="Log time spent">
            <Button
              variant="outlined"
              startIcon={<TimerIcon />}
              onClick={() => setTimeDialogOpen(true)}
              size="small"
            >
              Log Time
            </Button>
          </Tooltip>

          {/* Comments */}
          <Tooltip title="View and add comments">
            <Button
              variant="outlined"
              startIcon={<CommentIcon />}
              onClick={() => setCommentDialogOpen(true)}
              size="small"
              endIcon={commentCount > 0 && (
                <Chip 
                  label={commentCount} 
                  size="small" 
                  sx={{ 
                    height: 18, 
                    fontSize: '0.7rem',
                    ml: 0.5,
                    bgcolor: 'primary.main',
                    color: 'white',
                  }} 
                />
              )}
            >
              {commentCount > 0 ? `Comments (${commentCount})` : 'Add Note'}
            </Button>
          </Tooltip>

          {/* Communication & Sharing */}
          <Tooltip title="Print work order">
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              size="small"
            >
              Print
            </Button>
          </Tooltip>

          <Tooltip title="Create public share link">
            <Button
              variant="outlined"
              startIcon={createShareMutation.isPending ? <CircularProgress size={16} /> : <ShareIcon />}
              onClick={handleShare}
              size="small"
              disabled={createShareMutation.isPending}
              aria-label="Share work order"
            >
              {createShareMutation.isPending ? 'Creating Link...' : 'Share'}
            </Button>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Send notification to assignee">
            <Button
              variant="outlined"
              startIcon={<NotifyIcon />}
              onClick={() => {
                // Implement notification functionality
                alert('Notification sent to assignee');
              }}
              size="small"
              disabled={!workOrder.assignedTo}
            >
              Notify
            </Button>
          </Tooltip>

          {/* File Management */}
          <Tooltip title="Attach files or photos">
            <Button
              variant="outlined"
              startIcon={<AttachFileIcon />}
              onClick={() => {
                // Implement file attachment functionality
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = 'image/*,.pdf,.doc,.docx';
                input.click();
              }}
              size="small"
            >
              Attach Files
            </Button>
          </Tooltip>

          {/* Danger Zone */}
          {workOrder.status !== 'COMPLETED' && (
            <Tooltip title="Cancel work order">
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => handleQuickStatusUpdate('CANCELLED')}
                size="small"
                color="error"
                disabled={updateStatusMutation.isPending}
              >
                Cancel
              </Button>
            </Tooltip>
          )}

          <Tooltip title="Delete work order">
            <Button
              variant="outlined"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              size="small"
              color="error"
              disabled={deleteWorkOrderMutation.isPending}
            >
              Delete
            </Button>
          </Tooltip>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid xs={12} lg={8}>
          <Paper sx={{ mb: 3 }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab label="Overview" />
              <Tab label={`Time Tracking (${timeStats?.totalHours || 0}h)`} />
              <Tab label="Progress" />
              <Tab label="History" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {/* Work Order Details */}
              <Grid container spacing={3}>
                <Grid xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3 }}>
                    {workOrder.description || 'No description provided.'}
                  </Typography>
                </Grid>

                <Grid xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Work Order Information
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Status"
                        secondary={workOrder.status}
                      />
                      <Chip
                        label={workOrder.status}
                        color={getStatusColor(workOrder.status) as any}
                        size="small"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Priority"
                        secondary={workOrder.priority}
                      />
                      <Chip
                        label={workOrder.priority}
                        color={getPriorityColor(workOrder.priority) as any}
                        size="small"
                      />
                    </ListItem>
                    {workOrder.assignedTo && (
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Assigned To"
                          secondary={typeof workOrder.assignedTo === 'string' ? workOrder.assignedTo : workOrder.assignedTo.name}
                        />
                      </ListItem>
                    )}
                    {workOrder.estimatedHours && (
                      <ListItem>
                        <ListItemIcon>
                          <ScheduleIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Estimated Hours"
                          secondary={`${workOrder.estimatedHours} hours`}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>

                <Grid xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Dates & Asset
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Created"
                        secondary={new Date(workOrder.createdAt).toLocaleDateString()}
                      />
                    </ListItem>
                    {workOrder.dueDate && (
                      <ListItem>
                        <ListItemText
                          primary="Due Date"
                          secondary={new Date(workOrder.dueDate).toLocaleDateString()}
                        />
                      </ListItem>
                    )}
                    {workOrder.assetName && (
                      <ListItem>
                        <ListItemIcon>
                          <AssetIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Asset"
                          secondary={
                            <Link
                              component="button"
                              variant="body2"
                              onClick={() => navigate(`/assets/${workOrder.assetId}`)}
                            >
                              {workOrder.assetName}
                            </Link>
                          }
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>

                {/* Attachments Section */}
                {workOrder.attachments && workOrder.attachments.length > 0 && (
                  <Grid xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                      Attachments ({workOrder.attachments.length})
                    </Typography>
                    <Grid container spacing={2}>
                      {workOrder.attachments.map((attachment: any, index: number) => (
                        <Grid key={index} xs={12} sm={6} md={4}>
                          <Card variant="outlined" sx={{ height: '100%' }}>
                            <CardContent sx={{ p: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <ImageIcon color="primary" />
                                <Typography variant="subtitle2" noWrap>
                                  {attachment.filename || `Attachment ${index + 1}`}
                                </Typography>
                              </Box>
                              
                              {attachment.url && attachment.url.includes('.png') || attachment.url.includes('.jpg') || attachment.url.includes('.jpeg') || attachment.url.includes('.gif') ? (
                                <Box
                                  component="img"
                                  src={attachment.url}
                                  alt={attachment.filename || `Attachment ${index + 1}`}
                                  sx={{
                                    width: '100%',
                                    height: 120,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                    mb: 2,
                                    cursor: 'pointer',
                                    '&:hover': {
                                      opacity: 0.8,
                                    },
                                  }}
                                  onClick={() => window.open(attachment.url, '_blank')}
                                />
                              ) : (
                                <Box
                                  sx={{
                                    width: '100%',
                                    height: 120,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'grey.100',
                                    borderRadius: 1,
                                    mb: 2,
                                  }}
                                >
                                  <AttachFileIcon sx={{ fontSize: 40, color: 'grey.500' }} />
                                </Box>
                              )}
                              
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Size: {attachment.size ? (attachment.size / 1024).toFixed(1) + ' KB' : 'Unknown'}
                              </Typography>
                              
                              <Button
                                fullWidth
                                variant="outlined"
                                size="small"
                                startIcon={<DownloadIcon />}
                                onClick={() => window.open(attachment.url, '_blank')}
                                disabled={!attachment.url}
                              >
                                View/Download
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                )}
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Time Tracking
              </Typography>
              
              {/* Time Stats Summary */}
              {timeStats && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          Total Hours
                        </Typography>
                        <Typography variant="h4">
                          {timeStats.totalHours || 0}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          Billable Hours
                        </Typography>
                        <Typography variant="h4">
                          {timeStats.billableHours || 0}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          Non-Billable
                        </Typography>
                        <Typography variant="h4">
                          {timeStats.nonBillableHours || 0}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid xs={12} sm={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          Estimated Hours
                        </Typography>
                        <Typography variant="h4">
                          {timeStats.estimatedHours || workOrder.estimatedHours || '-'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Time Logs List */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Time Log Entries ({timeLogs.length})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<TimerIcon />}
                  onClick={() => setTimeDialogOpen(true)}
                  size="small"
                >
                  Log Time
                </Button>
              </Box>

              {timeLogs.length === 0 ? (
                <Alert severity="info">
                  No time has been logged for this work order yet.
                </Alert>
              ) : (
                <List>
                  {timeLogs
                    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime())
                    .map((log: any) => (
                      <ListItem key={log.id} divider>
                        <ListItemIcon>
                          <TimeIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" fontWeight={500}>
                                {log.hours} hours
                              </Typography>
                              {log.billable && (
                                <Chip label="Billable" size="small" color="success" />
                              )}
                              {log.category && (
                                <Chip label={log.category} size="small" variant="outlined" />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                {log.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                By {log.user?.name || 'Unknown'} on {new Date(log.loggedAt).toLocaleString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                </List>
              )}
              
              {/* Time by Category Breakdown */}
              {timeStats?.timeByCategory && Object.keys(timeStats.timeByCategory).length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Time by Category
                  </Typography>
                  <Grid container spacing={1}>
                    {Object.entries(timeStats.timeByCategory).map(([category, hours]) => (
                      <Grid key={category}>
                        <Chip
                          label={`${category}: ${hours}h`}
                          variant="outlined"
                          color="primary"
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>
                Work Progress
              </Typography>
              <Alert severity="info">
                Progress tracking coming soon.
              </Alert>
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <Typography variant="h6" gutterBottom>
                Work Order History
              </Typography>
              <Alert severity="info">
                History tracking coming soon.
              </Alert>
            </TabPanel>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid xs={12} lg={4}>
          {/* QR Code */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              QR Code
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <QRCodeDisplay
                entityType="work-order"
                entityId={workOrder.id.toString()}
                entityName={workOrder.title}
                qrCodeUrl={workOrder.qrCode}
                metadata={{
                  priority: workOrder.priority,
                  status: workOrder.status,
                  assignedTo: typeof workOrder.assignedTo === 'string' ? workOrder.assignedTo : workOrder.assignedTo?.name,
                }}
                size={200}
                showLabel={true}
                showActions={true}
              />
            </Box>
          </Paper>

          {/* Quick Stats */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Info
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Work Order ID"
                  secondary={workOrder.id}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Current Status"
                  secondary={workOrder.status}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Priority Level"
                  secondary={workOrder.priority}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Created"
                  secondary={new Date(workOrder.createdAt).toLocaleDateString()}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Last Updated"
                  secondary={new Date(workOrder.updatedAt).toLocaleDateString()}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <WorkOrderForm
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSubmit={(updatedData) => updateWorkOrderMutation.mutate(updatedData)}
        initialData={workOrder}
        mode="edit"
        loading={updateWorkOrderMutation.isPending}
      />

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Work Order Status</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>New Status</InputLabel>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                label="New Status"
              >
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="ON_HOLD">On Hold</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Status Notes (Optional)"
              multiline
              rows={3}
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="Add any notes about this status change..."
              fullWidth
            />

            {newStatus === 'COMPLETED' && (
              <Alert severity="success">
                This will mark the work order as completed and notify relevant parties.
              </Alert>
            )}

            {newStatus === 'CANCELLED' && (
              <Alert severity="warning">
                This will cancel the work order. This action should be used carefully.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleStatusUpdate(newStatus, statusNotes)}
            disabled={updateStatusMutation.isPending || !newStatus}
            startIcon={updateStatusMutation.isPending ? <CircularProgress size={16} /> : null}
          >
            {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Priority Update Dialog */}
      <Dialog
        open={priorityDialogOpen}
        onClose={() => setPriorityDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Work Order Priority</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Priority Level</InputLabel>
              <Select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                label="Priority Level"
              >
                <MenuItem value="LOW">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />
                    Low Priority
                  </Box>
                </MenuItem>
                <MenuItem value="MEDIUM">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main' }} />
                    Medium Priority
                  </Box>
                </MenuItem>
                <MenuItem value="HIGH">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'error.main' }} />
                    High Priority
                  </Box>
                </MenuItem>
                <MenuItem value="URGENT">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'error.dark' }} />
                    Urgent Priority
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            {newPriority === 'URGENT' && (
              <Alert severity="error">
                Urgent priority will notify all relevant parties immediately.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPriorityDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePriorityUpdate}
            disabled={updatePriorityMutation.isPending || !newPriority}
            startIcon={updatePriorityMutation.isPending ? <CircularProgress size={16} /> : null}
          >
            {updatePriorityMutation.isPending ? 'Updating...' : 'Update Priority'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Work Order</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Alert severity="info" icon={<AssignIcon />}>
              Assign this work order to a technician. They will be notified via email.
            </Alert>
            
            <FormControl fullWidth>
              <InputLabel>Select Technician</InputLabel>
              <Select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                label="Select Technician"
              >
                <MenuItem value="">
                  <em>Select a technician...</em>
                </MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Typography variant="body1" fontWeight="medium">
                        {user.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.email} • {user.role}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Divider sx={{ my: 1 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>
            
            <TextField
              fullWidth
              label="Enter Email Manually"
              type="email"
              value={assigneeEmail}
              onChange={(e) => setAssigneeEmail(e.target.value)}
              placeholder="Enter technician's email address"
              helperText="For technicians not in the system"
              disabled={Boolean(selectedUser)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAssignWorkOrder}
            disabled={(!selectedUser && !assigneeEmail.trim()) || assignWorkOrderMutation.isPending}
            startIcon={assignWorkOrderMutation.isPending ? <CircularProgress size={16} /> : <AssignIcon />}
          >
            {assignWorkOrderMutation.isPending ? 'Assigning...' : 'Assign Work Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Time Logging Dialog */}
      <Dialog
        open={timeDialogOpen}
        onClose={() => setTimeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Log Time</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Hours Worked"
              type="number"
              value={timeEntry}
              onChange={(e) => setTimeEntry(e.target.value)}
              placeholder="e.g., 2.5"
              inputProps={{ min: 0, step: 0.25 }}
              helperText="Enter hours in decimal format (e.g., 1.5 for 1 hour 30 minutes)"
            />
            
            <TextField
              fullWidth
              label="Work Description"
              multiline
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe the work performed..."
            />

            {parseFloat(timeEntry) > 0 && (
              <Alert severity="info">
                Logging {timeEntry} hours of work on this order.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimeDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleLogTime}
            disabled={!timeEntry || !comment.trim() || logTimeMutation.isPending}
            startIcon={logTimeMutation.isPending ? <CircularProgress size={16} /> : <TimerIcon />}
          >
            {logTimeMutation.isPending ? 'Logging...' : 'Log Time'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '80vh', maxHeight: '600px' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CommentIcon />
            Work Order Comments & Notes
            <Chip label={`${commentCount} comments`} size="small" variant="outlined" />
          </Box>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 0, p: 0 }}>
          {/* Existing Comments */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            {comments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <CommentIcon sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
                <Typography variant="body1">
                  No comments yet. Be the first to add a note!
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {comments
                  .filter(comment => !comment.parentId) // Only show top-level comments
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((commentItem) => (
                    <Paper
                      key={commentItem.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        bgcolor: commentItem.isInternal ? 'warning.50' : 'background.paper',
                        borderColor: commentItem.isInternal ? 'warning.200' : 'divider',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: commentItem.isInternal ? 'warning.main' : 'primary.main',
                            fontSize: '0.875rem',
                          }}
                        >
                          {commentItem.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight="600">
                              {commentItem.user.name}
                            </Typography>
                            <Chip
                              label={commentItem.user.role}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                            {commentItem.isInternal && (
                              <Chip
                                label="Internal"
                                size="small"
                                color="warning"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                            {commentItem.isPinned && (
                              <Chip
                                label="Pinned"
                                size="small"
                                color="error"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.775rem' }}>
                            {new Date(commentItem.createdAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                            {commentItem.editedAt && (
                              <span style={{ fontStyle: 'italic' }}> • Edited</span>
                            )}
                          </Typography>
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {commentItem.content}
                          </Typography>
                          {commentItem.replies && commentItem.replies.length > 0 && (
                            <Box sx={{ mt: 2, pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
                              {commentItem.replies.map((reply) => (
                                <Box key={reply.id} sx={{ mt: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                      {reply.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </Avatar>
                                    <Typography variant="body2" fontWeight="600">
                                      {reply.user.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {new Date(reply.createdAt).toLocaleString()}
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" sx={{ ml: 4 }}>
                                    {reply.content}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  ))}
              </Stack>
            )}
          </Box>

          {/* Add New Comment */}
          <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Add New Comment
            </Typography>
            <TextField
              fullWidth
              label="Your comment or note"
              multiline
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter your comment, note, or update about this work order..."
              sx={{ mb: 2 }}
            />
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Comments will be visible to all team members and will be logged with your name and timestamp.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCommentDialogOpen(false)} size="large">
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleAddComment}
            disabled={!comment.trim() || createCommentMutation.isPending}
            startIcon={createCommentMutation.isPending ? <CircularProgress size={16} /> : <CommentIcon />}
            size="large"
          >
            {createCommentMutation.isPending ? 'Adding Comment...' : 'Add Comment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}