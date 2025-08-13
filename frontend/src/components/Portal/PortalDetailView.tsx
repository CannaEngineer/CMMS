// Portal Detail View - Enhanced with animations and smooth interactions
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Avatar,
  Divider,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Badge,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Fade,
  Grow,
  Slide,
  Zoom,
  Skeleton,
  Fab,
  Snackbar,
  Switch,
  FormControlLabel,
  useMediaQuery as useMQ,
  styled,
  keyframes
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Visibility as ViewIcon,
  QrCode as QrCodeIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Link as LinkIcon,
  FileCopy as CopyIcon,
  GetApp as DownloadIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import { portalService, portalSubmissionService } from '../../services/portalService';
import {
  Portal,
  PortalSubmission,
  PortalAnalytics,
  SubmissionStatus
} from '../../types/portal';

// Enhanced styled components with animations
const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const slideInLeft = keyframes`
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const AnimatedCard = styled(Card)(({ theme }) => ({
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const MetricCard = styled(Card)(({ theme }) => ({
  transition: 'all 0.3s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[6],
    '& .metric-icon': {
      animation: `${pulseAnimation} 1s ease-in-out`,
    },
  },
}));

const StyledFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  zIndex: 1000,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'scale(1.1)',
  },
}));

const AnimatedChip = styled(Chip)(({ theme }) => ({
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.02)',
  },
}));
import PortalSubmissionsDashboard from './PortalSubmissionsDashboard';
import PortalEditDialog from './PortalEditDialog';
import PortalAnalyticsDialog from './PortalAnalyticsDialog';
import PortalShareDialog from './PortalShareDialog';
import PortalConfigurationEditor from './PortalConfigurationEditor';

const PORTAL_TYPE_COLORS: Record<string, string> = {
  'maintenance-request': '#1976d2',
  'asset-registration': '#388e3c',
  'equipment-info': '#f57c00',
  'general-inquiry': '#7b1fa2',
  'inspection-report': '#d32f2f',
  'safety-incident': '#c62828'
};

const PORTAL_TYPE_LABELS: Record<string, string> = {
  'maintenance-request': 'Maintenance Request',
  'asset-registration': 'Asset Registration',
  'equipment-info': 'Equipment Info',
  'general-inquiry': 'General Inquiry',
  'inspection-report': 'Inspection Report',
  'safety-incident': 'Safety Incident'
};

interface PortalDetailViewProps {
  portalId?: string;
  onBack?: () => void;
  onPortalUpdate?: (portal: Portal) => void;
}

interface ToastState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

const PortalDetailView: React.FC<PortalDetailViewProps> = ({
  portalId: propPortalId,
  onBack,
  onPortalUpdate
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const { id: paramPortalId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Use portalId from props or URL params
  const portalId = propPortalId || paramPortalId;
  const [selectedTab, setSelectedTab] = useState(0);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'success'
  });

  const queryClient = useQueryClient();

  // Fetch portal data
  const { data: portal, isLoading, error, refetch } = useQuery({
    queryKey: ['portal', portalId],
    queryFn: () => portalService.getById(portalId!),
    enabled: !!portalId
  });

  // Fetch portal analytics
  const { data: analytics } = useQuery({
    queryKey: ['portal-analytics', portalId],
    queryFn: () => portalService.getAnalytics(portalId!, '30d'),
    enabled: !!portal && !!portalId
  });

  // Fetch recent submissions
  const { data: recentSubmissions } = useQuery({
    queryKey: ['portal-recent-submissions', portalId],
    queryFn: () => portalSubmissionService.getSubmissions(portalId!, { limit: 5 }),
    enabled: !!portal && !!portalId
  });

  // Update portal mutation
  const updatePortalMutation = useMutation({
    mutationFn: (updates: Partial<Portal>) => portalService.update(portalId!, updates),
    onSuccess: (updatedPortal) => {
      queryClient.invalidateQueries({ queryKey: ['portal', portalId] });
      queryClient.invalidateQueries({ queryKey: ['portals'] });
      if (onPortalUpdate) onPortalUpdate(updatedPortal);
    }
  });

  const showToast = (message: string, severity: ToastState['severity'] = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast('URL copied to clipboard!', 'success');
    } catch (err) {
      console.error('Failed to copy URL:', err);
      showToast('Failed to copy URL. Please try again.', 'error');
    }
  };

  const handleStatusToggle = async () => {
    if (!portal) return;
    
    setIsToggling(true);
    try {
      const newStatus = !portal.isActive;
      // Optimistic update
      queryClient.setQueryData(['portal', portalId], (old: Portal | undefined) => 
        old ? { ...old, isActive: newStatus } : old
      );
      
      await updatePortalMutation.mutateAsync({ isActive: newStatus });
      showToast(
        newStatus ? 'Portal activated successfully!' : 'Portal deactivated successfully!',
        'success'
      );
    } catch (error) {
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['portal', portalId] });
      showToast('Failed to update portal status', 'error');
    } finally {
      setIsToggling(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const getStatusIcon = (portal: Portal) => {
    if (!portal.isActive) return <InactiveIcon color="error" />;
    if (portal.submissionCount === 0) return <WarningIcon color="warning" />;
    return <ActiveIcon color="success" />;
  };

  const getStatusText = (portal: Portal) => {
    if (!portal.isActive) return 'Inactive';
    if (portal.submissionCount === 0) return 'No Submissions';
    return 'Active';
  };

  const getStatusColor = (portal: Portal) => {
    if (!portal.isActive) return 'error';
    if (portal.submissionCount === 0) return 'warning';
    return 'success';
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load portal details. Please try again later.
        </Alert>
        <Button startIcon={<BackIcon />} onClick={onBack || (() => navigate('/portals'))}>
          Back to Portals
        </Button>
      </Box>
    );
  }

  if (isLoading || !portal) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={onBack || (() => navigate('/portals'))} sx={{ mr: 1 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            {portal.name}
          </Typography>
          
          {/* Action Buttons */}
          <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', sm: 'flex' } }}>
            <Button
              variant="outlined"
              startIcon={<ViewIcon />}
              onClick={() => window.open(portal.publicUrl, '_blank')}
            >
              View Portal
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setShowEditDialog(true)}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={() => setShowShareDialog(true)}
            >
              Share
            </Button>
            <Button
              variant="contained"
              startIcon={<AnalyticsIcon />}
              onClick={() => setShowAnalyticsDialog(true)}
            >
              Analytics
            </Button>
          </Stack>
        </Box>

        {/* Portal Metadata */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Chip
            label={PORTAL_TYPE_LABELS[portal.type]}
            sx={{
              backgroundColor: PORTAL_TYPE_COLORS[portal.type],
              color: 'white'
            }}
          />
          <Chip
            icon={getStatusIcon(portal)}
            label={getStatusText(portal)}
            color={getStatusColor(portal) as any}
            variant="outlined"
          />
          <Typography variant="body2" color="text.secondary">
            Created {formatDistanceToNow(new Date(portal.createdAt))} ago
          </Typography>
          {portal.lastSubmissionAt && (
            <Typography variant="body2" color="text.secondary">
              Last submission {formatDistanceToNow(new Date(portal.lastSubmissionAt))} ago
            </Typography>
          )}
        </Box>

        {/* Portal Description */}
        {portal.description && (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {portal.description}
          </Typography>
        )}
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6} md={3}>
          <Grow in timeout={400}>
            <MetricCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Submissions
                    </Typography>
                    <Typography variant="h4">
                      {portal.submissionCount.toLocaleString()}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main }} className="metric-icon">
                    <AssignmentIcon />
                  </Avatar>
                </Box>
                </CardContent>
              </MetricCard>
            </Grow>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Grow in timeout={600}>
            <MetricCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Avg. Response Time
                    </Typography>
                    <Typography variant="h4">
                      {analytics?.averageResponseTime ? `${Math.round(analytics.averageResponseTime)}h` : 'N/A'}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.palette.success.main }} className="metric-icon">
                    <ScheduleIcon />
                  </Avatar>
                </Box>
                </CardContent>
              </MetricCard>
            </Grow>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Grow in timeout={800}>
            <MetricCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Completion Rate
                    </Typography>
                    <Typography variant="h4">
                      {analytics?.conversionRate ? `${Math.round(analytics.conversionRate)}%` : 'N/A'}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.palette.info.main }} className="metric-icon">
                    <TrendingUpIcon />
                  </Avatar>
                </Box>
                </CardContent>
              </MetricCard>
            </Grow>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Grow in timeout={1000}>
            <MetricCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Fields Count
                    </Typography>
                    <Typography variant="h4">
                      {portal.fields?.length || 0}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: theme.palette.warning.main }} className="metric-icon">
                    <SettingsIcon />
                  </Avatar>
                </Box>
                </CardContent>
              </MetricCard>
            </Grow>
        </Grid>
      </Grid>

      {/* Tabbed Interface */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons="auto"
          >
            <Tab label="Overview" />
            <Tab 
              label={
                <Badge 
                  badgeContent={recentSubmissions?.submissions?.filter(s => 
                    ['SUBMITTED', 'REVIEWED'].includes(s.status)
                  ).length || 0} 
                  color="error"
                >
                  Submissions
                </Badge>
              } 
            />
            <Tab label="Settings" />
            <Tab label="Analytics" />
            <Tab label="Share & QR" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Overview Tab */}
          {selectedTab === 0 && (
            <Grid container spacing={3}>
              {/* Portal Configuration */}
              <Grid xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Portal Configuration
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <LinkIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Public URL"
                        secondary={portal.publicUrl}
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Copy URL">
                          <IconButton 
                            size="small" 
                            onClick={() => handleCopyUrl(portal.publicUrl)}
                            sx={{
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                color: theme.palette.primary.main,
                              },
                            }}
                          >
                            <CopyIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Open Portal">
                          <IconButton 
                            size="small" 
                            onClick={() => window.open(portal.publicUrl, '_blank')}
                            sx={{
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                color: theme.palette.success.main,
                              },
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <QrCodeIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="QR Code"
                        secondary={portal.qrEnabled ? "Enabled" : "Disabled"}
                      />
                      <ListItemSecondaryAction>
                        <Button 
                          size="small" 
                          onClick={() => setShowShareDialog(true)}
                        >
                          View QR
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <PeopleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Anonymous Submissions"
                        secondary={portal.allowAnonymous ? "Allowed" : "Requires Login"}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <InfoIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Approval Required"
                        secondary={portal.requiresApproval ? "Yes" : "No"}
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>

              {/* Recent Submissions */}
              <Grid xs={12} md={6}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Recent Submissions
                  </Typography>
                  <Button 
                    size="small" 
                    onClick={() => setSelectedTab(1)}
                  >
                    View All
                  </Button>
                </Box>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {recentSubmissions?.submissions?.length > 0 ? (
                    <List dense>
                      {recentSubmissions.submissions.slice(0, 5).map((submission: PortalSubmission) => (
                        <ListItem key={submission.id}>
                          <ListItemText
                            primary={submission.submitterName || 'Anonymous'}
                            secondary={submission.submittedAt ? `${formatDistanceToNow(new Date(submission.submittedAt))} ago` : 'Unknown time'}
                          />
                          <Chip
                            label={submission.status}
                            size="small"
                            color={submission.status === 'SUBMITTED' ? 'warning' : 'default'}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No submissions yet
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {/* Portal Fields Summary */}
              <Grid xs={12}>
                <Typography variant="h6" gutterBottom>
                  Form Fields ({portal.fields?.length || 0})
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {portal.fields && portal.fields.length > 0 ? (
                    <Grid container spacing={2}>
                      {portal.fields.map((field) => (
                        <Grid xs={12} sm={6} md={4} key={field.id}>
                          <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {field.fieldLabel}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {field.fieldType} {field.isRequired && '(Required)'}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      No fields configured
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Submissions Tab */}
          {selectedTab === 1 && (
            <PortalSubmissionsDashboard portalId={portalId} />
          )}

          {/* Settings Tab */}
          {selectedTab === 2 && (
            <PortalConfigurationEditor 
              portal={portal}
              onSave={(updatedPortal) => {
                updatePortalMutation.mutate(updatedPortal);
              }}
            />
          )}

          {/* Analytics Tab */}
          {selectedTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Portal Analytics
              </Typography>
              {analytics ? (
                <Grid container spacing={3}>
                  <Grid xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Performance Metrics
                        </Typography>
                        <List>
                          <ListItem>
                            <ListItemText
                              primary="Total Submissions"
                              secondary={analytics.totalSubmissions.toLocaleString()}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Conversion Rate"
                              secondary={`${Math.round(analytics.conversionRate)}%`}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Average Completion Time"
                              secondary={`${Math.round(analytics.averageCompletionTime)} minutes`}
                            />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Quick Actions
                        </Typography>
                        <Stack spacing={2}>
                          <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => setShowAnalyticsDialog(true)}
                          >
                            View Detailed Analytics
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            fullWidth
                          >
                            Export Analytics
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              ) : (
                <Typography color="text.secondary">
                  Analytics data is not available yet.
                </Typography>
              )}
            </Box>
          )}

          {/* Share & QR Tab */}
          {selectedTab === 4 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Share Portal
              </Typography>
              <Grid container spacing={3}>
                <Grid xs={12} md={8}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Portal URL
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontFamily: 'monospace',
                            backgroundColor: 'grey.100',
                            p: 1,
                            borderRadius: 1,
                            flexGrow: 1,
                            wordBreak: 'break-all'
                          }}
                        >
                          {portal.publicUrl}
                        </Typography>
                        <Button
                          variant="outlined"
                          startIcon={<CopyIcon />}
                          onClick={() => handleCopyUrl(portal.publicUrl)}
                          sx={{
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: theme.shadows[4],
                            },
                          }}
                        >
                          Copy
                        </Button>
                      </Box>
                      <Button
                        variant="contained"
                        startIcon={<QrCodeIcon />}
                        onClick={() => setShowShareDialog(true)}
                      >
                        Generate QR Code
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Card>

      {/* Enhanced Mobile Action Buttons */}
      {isMobile && (
        <Zoom in timeout={600}>
          <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}>
            <Stack spacing={1}>
              <Fade in timeout={800}>
                <StyledFab
                  color="primary"
                  size="small"
                  onClick={() => setShowShareDialog(true)}
                  sx={{ bgcolor: theme.palette.secondary.main }}
                >
                  <ShareIcon />
                </StyledFab>
              </Fade>
              <Fade in timeout={1000}>
                <StyledFab
                  color="primary"
                  size="medium"
                  onClick={() => setShowEditDialog(true)}
                >
                  <EditIcon />
                </StyledFab>
              </Fade>
              <Fade in timeout={1200}>
                <StyledFab
                  color="secondary"
                  size="small"
                  onClick={() => window.open(portal.publicUrl, '_blank')}
                  sx={{ bgcolor: theme.palette.success.main }}
                >
                  <ViewIcon />
                </StyledFab>
              </Fade>
            </Stack>
          </Box>
        </Zoom>
      )}

      {/* Dialogs */}
      {portal && showEditDialog && (
        <PortalEditDialog
          open={showEditDialog}
          portal={portal}
          onClose={() => setShowEditDialog(false)}
          onSuccess={() => {
            setShowEditDialog(false);
            refetch();
            showToast('Portal updated successfully!', 'success');
          }}
        />
      )}

      {portal && showAnalyticsDialog && (
        <PortalAnalyticsDialog
          open={showAnalyticsDialog}
          portal={portal}
          onClose={() => setShowAnalyticsDialog(false)}
        />
      )}

      {portal && showShareDialog && (
        <PortalShareDialog
          open={showShareDialog}
          portal={portal}
          onClose={() => setShowShareDialog(false)}
        />
      )}

      {/* Toast Notifications */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setToast(prev => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PortalDetailView;