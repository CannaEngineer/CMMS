// Portal Submissions Dashboard - Manage and track portal submissions
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Alert,
  CircularProgress,
  Badge,
  Avatar,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Tab,
  Tabs,
  InputAdornment,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Assignment as WorkOrderIcon,
  Chat as ChatIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Person as PersonIcon,
  Schedule as TimeIcon,
  LocationOn as LocationIcon,
  AttachFile as AttachmentIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  PriorityHigh as UrgentIcon,
  Mail as EmailIcon,
  Phone as PhoneIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { portalSubmissionService, workOrdersService } from '../../services/portalService';
import {
  PortalSubmission,
  SubmissionStatus
} from '../../types/portal';

const STATUS_COLORS: Record<string, string> = {
  'SUBMITTED': '#2196f3',
  'REVIEWED': '#ff9800',
  'IN_PROGRESS': '#9c27b0',
  'COMPLETED': '#4caf50',
  'REJECTED': '#f44336',
  'ASSIGNED': '#00bcd4'
};

const STATUS_LABELS: Record<string, string> = {
  'SUBMITTED': 'Submitted',
  'REVIEWED': 'Reviewed',
  'IN_PROGRESS': 'In Progress',
  'COMPLETED': 'Completed',
  'REJECTED': 'Rejected',
  'ASSIGNED': 'Assigned'
};

interface PortalSubmissionsDashboardProps {
  portalId?: string;
}

const PortalSubmissionsDashboard: React.FC<PortalSubmissionsDashboardProps> = ({
  portalId
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedSubmission, setSelectedSubmission] = useState<PortalSubmission | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showWorkOrderDialog, setShowWorkOrderDialog] = useState(false);
  const [showCommunicationDialog, setShowCommunicationDialog] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // New status and notes for updates
  const [newStatus, setNewStatus] = useState<SubmissionStatus>('submitted');
  const [statusNotes, setStatusNotes] = useState('');
  const [communicationMessage, setCommunicationMessage] = useState('');

  const queryClient = useQueryClient();

  // Fetch submissions
  const { data: submissionsData, isLoading, error, refetch } = useQuery({
    queryKey: ['portal-submissions', portalId, filters, searchTerm],
    queryFn: () => portalSubmissionService.getSubmissions(portalId, { 
      ...filters, 
      searchTerm: searchTerm || undefined 
    })
  });

  const submissions = submissionsData?.submissions || [];

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      portalSubmissionService.updateSubmissionStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-submissions'] });
      setShowStatusDialog(false);
      setStatusNotes('');
    }
  });

  const createWorkOrderMutation = useMutation({
    mutationFn: (submissionId: string) =>
      portalSubmissionService.createWorkOrderFromSubmission(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-submissions'] });
      setShowWorkOrderDialog(false);
    }
  });

  const addCommunicationMutation = useMutation({
    mutationFn: ({ submissionId, message }: { submissionId: string; message: string }) =>
      portalSubmissionService.addCommunication(submissionId, message, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-submissions'] });
      setShowCommunicationDialog(false);
      setCommunicationMessage('');
    }
  });

  // Filter submissions by tab
  const getFilteredSubmissions = () => {
    let filtered = submissions;
    
    switch (selectedTab) {
      case 0: // All
        break;
      case 1: // Pending
        filtered = submissions.filter(s => ['SUBMITTED', 'REVIEWED'].includes(s.status));
        break;
      case 2: // In Progress
        filtered = submissions.filter(s => ['ASSIGNED', 'IN_PROGRESS'].includes(s.status));
        break;
      case 3: // Completed
        filtered = submissions.filter(s => s.status === 'COMPLETED');
        break;
      case 4: // Urgent
        filtered = submissions.filter(s => s.priority === 'URGENT');
        break;
    }
    
    return filtered;
  };

  const filteredSubmissions = getFilteredSubmissions();
  const paginatedSubmissions = filteredSubmissions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Handle actions
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, submission: PortalSubmission) => {
    event.stopPropagation();
    setSelectedSubmission(submission);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSubmission(null);
  };

  const handleAction = (action: string) => {
    if (!selectedSubmission) return;

    switch (action) {
      case 'view':
        setShowDetails(true);
        break;
      case 'approve':
        setNewStatus('approved');
        setShowStatusDialog(true);
        break;
      case 'reject':
        setNewStatus('rejected');
        setShowStatusDialog(true);
        break;
      case 'create-work-order':
        setShowWorkOrderDialog(true);
        break;
      case 'communicate':
        setShowCommunicationDialog(true);
        break;
    }
    
    handleMenuClose();
  };

  const handleStatusUpdate = () => {
    if (selectedSubmission) {
      updateStatusMutation.mutate({
        id: selectedSubmission.id,
        status: newStatus,
        notes: statusNotes
      });
    }
  };

  const handleCreateWorkOrder = () => {
    if (selectedSubmission) {
      createWorkOrderMutation.mutate(selectedSubmission.id);
    }
  };

  const handleSendMessage = () => {
    if (selectedSubmission && communicationMessage.trim()) {
      addCommunicationMutation.mutate({
        submissionId: selectedSubmission.id,
        message: communicationMessage.trim()
      });
    }
  };

  const getUrgentCount = () => submissions.filter(s => s.priority === 'URGENT' && !['COMPLETED', 'REJECTED'].includes(s.status)).length;
  const getPendingCount = () => submissions.filter(s => ['SUBMITTED', 'REVIEWED'].includes(s.status)).length;

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load submissions. Please try again later.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Portal Submissions
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search submissions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ minWidth: 300, flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          size="small"
        >
          Filters
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
          <Tab label="All" />
          <Tab 
            label={
              <Badge badgeContent={getPendingCount()} color="warning">
                Pending
              </Badge>
            } 
          />
          <Tab label="Approved" />
          <Tab label="Completed" />
          <Tab 
            label={
              <Badge badgeContent={getUrgentCount()} color="error">
                Urgent
              </Badge>
            } 
          />
        </Tabs>
      </Box>

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Submissions Table/Cards */}
      {!isLoading && (
        <>
          {isMobile ? (
            // Mobile Card View
            <Box>
              {paginatedSubmissions.map((submission) => (
                <Card
                  key={submission.id}
                  sx={{ mb: 2, cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedSubmission(submission);
                    setShowDetails(true);
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {submission.portal?.name || 'Portal'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {submission.submitterName || 'Anonymous'} • {submission.submittedAt ? formatDistanceToNow(new Date(submission.submittedAt)) + ' ago' : 'Unknown time'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {submission.priority === 'URGENT' && (
                          <UrgentIcon color="error" fontSize="small" />
                        )}
                        <Chip
                          label={STATUS_LABELS[submission.status]}
                          size="small"
                          sx={{
                            backgroundColor: STATUS_COLORS[submission.status],
                            color: 'white'
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuClick(e, submission)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    {/* Form Data Preview */}
                    <Box sx={{ mb: 2 }}>
                      {Object.entries(submission.submissionData || {}).slice(0, 2).map(([key, value]) => (
                        <Typography key={key} variant="body2" sx={{ mb: 0.5 }}>
                          <strong>{key}:</strong> {String(value).substring(0, 100)}
                          {String(value).length > 100 && '...'}
                        </Typography>
                      ))}
                    </Box>

                    {/* Metadata */}
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {submission.files && Array.isArray(submission.files) && submission.files.length > 0 && (
                        <Chip
                          icon={<AttachmentIcon />}
                          label={`${submission.files?.length || 0} files`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {submission.workOrderId && (
                        <Chip
                          icon={<WorkOrderIcon />}
                          label="Work Order Created"
                          size="small"
                          variant="outlined"
                          color="success"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            // Desktop Table View
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Submitter</TableCell>
                    <TableCell>Portal</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Attachments</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedSubmissions.map((submission) => (
                    <TableRow
                      key={submission.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setShowDetails(true);
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2">
                              {submission.submitterName || 'Anonymous'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {submission.submitterEmail}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {submission.portal?.name || 'Portal'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={STATUS_LABELS[submission.status]}
                          size="small"
                          sx={{
                            backgroundColor: STATUS_COLORS[submission.status],
                            color: 'white'
                          }}
                        />
                      </TableCell>
                      
                      <TableCell>
                        {submission.priority === 'URGENT' && (
                          <Chip
                            icon={<UrgentIcon />}
                            label="Urgent"
                            size="small"
                            color="error"
                          />
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {submission.submittedAt ? format(new Date(submission.submittedAt), 'MMM dd, yyyy') : 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {submission.submittedAt ? format(new Date(submission.submittedAt), 'HH:mm') : ''}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        {submission.files && Array.isArray(submission.files) && submission.files.length > 0 && (
                          <Chip
                            icon={<AttachmentIcon />}
                            label={submission.files?.length || 0}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <IconButton
                          onClick={(e) => handleMenuClick(e, submission)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          <TablePagination
            component="div"
            count={filteredSubmissions.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />

          {/* Empty State */}
          {filteredSubmissions.length === 0 && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                textAlign: 'center'
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No submissions found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm || Object.keys(filters).length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Submissions will appear here once users submit through your portals'
                }
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleAction('view')}>
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleAction('approve')}>
          <ApproveIcon sx={{ mr: 1 }} />
          Approve
        </MenuItem>
        <MenuItem onClick={() => handleAction('reject')}>
          <RejectIcon sx={{ mr: 1 }} />
          Reject
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleAction('create-work-order')}>
          <WorkOrderIcon sx={{ mr: 1 }} />
          Create Work Order
        </MenuItem>
        <MenuItem onClick={() => handleAction('communicate')}>
          <ChatIcon sx={{ mr: 1 }} />
          Send Message
        </MenuItem>
      </Menu>

      {/* Submission Details Dialog */}
      {selectedSubmission && (
        <SubmissionDetailsDialog
          submission={selectedSubmission}
          open={showDetails}
          onClose={() => setShowDetails(false)}
        />
      )}

      {/* Status Update Dialog */}
      <Dialog
        open={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Status</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>New Status</InputLabel>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as SubmissionStatus)}
                label="New Status"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Notes (Optional)"
              multiline
              rows={3}
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="Add any notes about this status change..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStatusDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleStatusUpdate}
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Work Order Creation Dialog */}
      <Dialog
        open={showWorkOrderDialog}
        onClose={() => setShowWorkOrderDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Work Order</DialogTitle>
        <DialogContent>
          <Typography>
            This will create a work order based on the submission details.
            The submitter will be notified when the work order is created.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWorkOrderDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateWorkOrder}
            disabled={createWorkOrderMutation.isPending}
          >
            {createWorkOrderMutation.isPending ? 'Creating...' : 'Create Work Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Communication Dialog */}
      <Dialog
        open={showCommunicationDialog}
        onClose={() => setShowCommunicationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Message</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Message"
            multiline
            rows={4}
            value={communicationMessage}
            onChange={(e) => setCommunicationMessage(e.target.value)}
            placeholder="Enter your message to the submitter..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCommunicationDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!communicationMessage.trim() || addCommunicationMutation.isPending}
          >
            {addCommunicationMutation.isPending ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Submission Details Dialog Component
const SubmissionDetailsDialog: React.FC<{
  submission: PortalSubmission;
  open: boolean;
  onClose: () => void;
}> = ({ submission, open, onClose }) => {
  const queryClient = useQueryClient();
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [communicationOpen, setCommunicationOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(submission.status);
  const [reviewNotes, setReviewNotes] = useState(submission.reviewNotes || '');
  const [communicationMessage, setCommunicationMessage] = useState('');

  // Update submission status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      portalSubmissionService.updateSubmissionStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-submissions'] });
      setStatusUpdateOpen(false);
      setReviewNotes('');
    }
  });

  // Create work order mutation
  const createWorkOrderMutation = useMutation({
    mutationFn: (submissionId: string) =>
      portalSubmissionService.createWorkOrderFromSubmission(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-submissions'] });
    }
  });

  // Add communication mutation
  const addCommunicationMutation = useMutation({
    mutationFn: ({ submissionId, message, isInternal }: { submissionId: string; message: string; isInternal: boolean }) =>
      portalSubmissionService.addCommunication(submissionId, message, isInternal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-submissions'] });
      setCommunicationMessage('');
      setCommunicationOpen(false);
    }
  });

  const handleStatusUpdate = () => {
    updateStatusMutation.mutate({
      id: submission.id.toString(),
      status: newStatus,
      notes: reviewNotes
    });
  };

  const handleCreateWorkOrder = () => {
    createWorkOrderMutation.mutate(submission.id.toString());
  };

  const handleAddCommunication = (isInternal: boolean) => {
    if (communicationMessage.trim()) {
      addCommunicationMutation.mutate({
        submissionId: submission.id.toString(),
        message: communicationMessage.trim(),
        isInternal
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh', maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">
              Submission Details - {submission.submissionCode}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {submission.portal?.name} • {submission.submittedAt ? format(new Date(submission.submittedAt), 'PPpp') : 'Unknown date'}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Quick Actions */}
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'primary.main' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {/* Status Management */}
                  {submission.status === 'SUBMITTED' && (
                    <>
                      <Button
                        variant="contained"
                        startIcon={<ApproveIcon />}
                        onClick={() => {
                          setNewStatus('REVIEWED');
                          setStatusUpdateOpen(true);
                        }}
                        size="small"
                        color="success"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<RejectIcon />}
                        onClick={() => {
                          setNewStatus('REJECTED');
                          setStatusUpdateOpen(true);
                        }}
                        size="small"
                        color="error"
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  
                  {submission.status !== 'COMPLETED' && submission.status !== 'REJECTED' && (
                    <Button
                      variant="outlined"
                      startIcon={<ApproveIcon />}
                      onClick={() => setStatusUpdateOpen(true)}
                      size="small"
                    >
                      Update Status
                    </Button>
                  )}

                  {/* Work Order Management */}
                  {!submission.workOrderId && submission.status !== 'REJECTED' && (
                    <Button
                      variant="outlined"
                      startIcon={<WorkOrderIcon />}
                      onClick={handleCreateWorkOrder}
                      disabled={createWorkOrderMutation.isPending}
                      size="small"
                      color="primary"
                    >
                      {createWorkOrderMutation.isPending ? 'Creating...' : 'Create Work Order'}
                    </Button>
                  )}
                  
                  {submission.workOrderId && (
                    <Button
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      href={`/work-orders/${submission.workOrderId}`}
                      target="_blank"
                      size="small"
                    >
                      View Work Order #{submission.workOrderId}
                    </Button>
                  )}

                  {/* Communication */}
                  {submission.submitterEmail && (
                    <>
                      <Button
                        variant="outlined"
                        startIcon={<ChatIcon />}
                        onClick={() => setCommunicationOpen(true)}
                        size="small"
                      >
                        Send Message
                      </Button>
                      <Button
                        variant="text"
                        startIcon={<EmailIcon />}
                        href={`mailto:${submission.submitterEmail}?subject=Re: ${submission.submissionCode}&body=Hello ${submission.submitterName || 'there'},%0D%0A%0D%0ARegarding your submission (${submission.submissionCode}):%0D%0A%0D%0A`}
                        size="small"
                      >
                        Email Direct
                      </Button>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Submitter Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Submitter Information
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Name"
                      secondary={submission.submitterName || 'Anonymous'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Email"
                      secondary={submission.submitterEmail || 'Not provided'}
                    />
                    {submission.submitterEmail && (
                      <ListItemSecondaryAction>
                        <IconButton size="small" href={`mailto:${submission.submitterEmail}`}>
                          <EmailIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Phone"
                      secondary={submission.submitterPhone || 'Not provided'}
                    />
                    {submission.submitterPhone && (
                      <ListItemSecondaryAction>
                        <IconButton size="small" href={`tel:${submission.submitterPhone}`}>
                          <PhoneIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="IP Address"
                      secondary={submission.submitterIp || 'Not recorded'}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Submission Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <TimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Submission Information
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Status"
                      secondary={
                        <Chip
                          label={STATUS_LABELS[submission.status]}
                          size="small"
                          sx={{
                            backgroundColor: STATUS_COLORS[submission.status],
                            color: 'white'
                          }}
                        />
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Priority"
                      secondary={
                        <Chip
                          label={submission.priority}
                          size="small"
                          color={submission.priority === 'URGENT' ? 'error' : submission.priority === 'HIGH' ? 'warning' : 'default'}
                        />
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Submitted"
                      secondary={submission.submittedAt ? format(new Date(submission.submittedAt), 'PPpp') : 'Unknown'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Portal"
                      secondary={submission.portal?.name || 'Portal'}
                    />
                  </ListItem>
                  {submission.workOrderId && (
                    <ListItem>
                      <ListItemText
                        primary="Work Order"
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">#{submission.workOrderId}</Typography>
                            {submission.workOrder && (
                              <Chip
                                label={submission.workOrder.status}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  )}
                  {submission.reviewedAt && (
                    <ListItem>
                      <ListItemText
                        primary="Reviewed"
                        secondary={format(new Date(submission.reviewedAt), 'PPpp')}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Form Data */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Form Data
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(submission.submissionData || submission.formData || {}).map(([key, value]) => (
                    <Grid item xs={12} sm={6} key={key}>
                      <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </Typography>
                        <Typography variant="body1">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Files */}
          {submission.files && Array.isArray(submission.files) && submission.files.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <AttachmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Attachments ({submission.files?.length || 0})
                  </Typography>
                  <Grid container spacing={2}>
                    {(submission.files || []).map((file) => (
                      <Grid item xs={12} sm={6} md={4} key={file.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="body2" gutterBottom>
                              {file.originalFilename || file.filename}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(file.fileSize / 1024 / 1024).toFixed(1)} MB
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Button size="small" href={file.fileUrl || file.filePath} target="_blank">
                                View
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Communication Thread */}
          {submission.communications && submission.communications.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <ChatIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Communication History
                  </Typography>
                  <List>
                    {submission.communications.map((message) => (
                      <ListItem key={message.id}>
                        <ListItemAvatar>
                          <Avatar>
                            {message.senderType === 'ADMIN' ? 'A' : 'U'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={message.message}
                          secondary={`${message.senderName} • ${format(new Date(message.createdAt), 'PPp')}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      {/* Status Update Dialog */}
      <Dialog
        open={statusUpdateOpen}
        onClose={() => setStatusUpdateOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Submission Status</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>New Status</InputLabel>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                label="New Status"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: STATUS_COLORS[value]
                        }}
                      />
                      {label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Review Notes (Optional)"
              multiline
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add any notes about this status change..."
              fullWidth
            />

            {newStatus === 'REJECTED' && (
              <Alert severity="warning">
                This will notify the submitter that their request has been rejected.
              </Alert>
            )}

            {newStatus === 'COMPLETED' && (
              <Alert severity="success">
                This will mark the submission as completed and notify the submitter.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusUpdateOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleStatusUpdate}
            disabled={updateStatusMutation.isPending}
            startIcon={updateStatusMutation.isPending ? <CircularProgress size={16} /> : null}
          >
            {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Communication Dialog */}
      <Dialog
        open={communicationOpen}
        onClose={() => {
          setCommunicationOpen(false);
          setCommunicationMessage('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Message to Submitter</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Alert severity="info" icon={<EmailIcon />}>
              This message will be sent to {submission.submitterEmail || 'the submitter'} and added to the communication history.
            </Alert>
            
            <TextField
              fullWidth
              label="Message"
              multiline
              rows={4}
              value={communicationMessage}
              onChange={(e) => setCommunicationMessage(e.target.value)}
              placeholder="Enter your message to the submitter..."
              helperText={`Message will be sent to: ${submission.submitterEmail || 'No email provided'}`}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCommunicationOpen(false);
            setCommunicationMessage('');
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleAddCommunication(false)}
            disabled={!communicationMessage.trim() || addCommunicationMutation.isPending}
            startIcon={addCommunicationMutation.isPending ? <CircularProgress size={16} /> : <EmailIcon />}
          >
            {addCommunicationMutation.isPending ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default PortalSubmissionsDashboard;