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
  useTheme,
  useMediaQuery,
  Container,
  Alert,
  CircularProgress,
  Fade,
  Skeleton
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Assignment as WorkOrderIcon,
  Schedule as MaintenanceIcon,
  QrCode2 as QRIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Build as AssetIcon,
  LocationOn as LocationIcon,
  Business as ManufacturerIcon,
  Inventory as SerialIcon,
  CalendarToday as DateIcon,
  Add as AddIcon,
  History as HistoryIcon,
  AttachFile as AttachmentIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsService, workOrdersService, pmService } from '../services/api';
import {
  MobileHeader,
  ExpandableCard,
  FloatingActionMenu,
  PullToRefresh,
  StatusBadge,
  ProgressCard
} from '../components/Common/MobileComponents';

interface Asset {
  id: number;
  name: string;
  status: string;
  criticality: string;
  location?: { name: string };
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  description?: string;
  imageUrl?: string;
  attachments?: any[];
  createdAt: string;
  updatedAt: string;
}

interface WorkOrder {
  id: number;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  assignedTo?: { name: string };
  createdAt: string;
}

const AssetDetailMobile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();

  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'workorders' | 'maintenance' | 'history'>('overview');
  const [showEditForm, setShowEditForm] = useState(false);
  const [showWorkOrderForm, setShowWorkOrderForm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);

  // Queries
  const { data: asset, isLoading, error, refetch } = useQuery<Asset>({
    queryKey: ['asset', id],
    queryFn: () => assetsService.getById(id!),
    enabled: !!id,
  });

  const { data: workOrders = [] } = useQuery<WorkOrder[]>({
    queryKey: ['asset-work-orders', id],
    queryFn: () => workOrdersService.getByAssetId(id!),
    enabled: !!id,
  });

  const { data: maintenanceSchedules = [] } = useQuery({
    queryKey: ['asset-maintenance', id],
    queryFn: () => pmService.getByAssetId(id!),
    enabled: !!id,
  });

  // Calculate asset health score
  const calculateHealthScore = useCallback((asset: Asset, workOrders: WorkOrder[]) => {
    if (!asset) return 0;
    
    let score = 100;
    
    // Status penalties
    if (asset.status === 'OFFLINE') score -= 30;
    else if (asset.status === 'MAINTENANCE') score -= 15;
    
    // Criticality penalties
    if (asset.criticality === 'HIGH') score -= 10;
    else if (asset.criticality === 'IMPORTANT') score -= 5;
    
    // Work order history (recent failures)
    const recentWorkOrders = workOrders.filter(wo => {
      const woDate = new Date(wo.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return woDate > thirtyDaysAgo;
    });
    
    score -= Math.min(recentWorkOrders.length * 5, 25);
    
    return Math.max(0, Math.min(100, score));
  }, []);

  const healthScore = calculateHealthScore(asset!, workOrders);

  // Floating actions
  const floatingActions = [
    {
      icon: <EditIcon />,
      label: 'Edit Asset',
      onClick: () => setShowEditForm(true),
      color: 'primary' as const
    },
    {
      icon: <WorkOrderIcon />,
      label: 'Create Work Order',
      onClick: () => setShowWorkOrderForm(true),
      color: 'secondary' as const
    },
    {
      icon: <MaintenanceIcon />,
      label: 'Schedule PM',
      onClick: () => setShowMaintenanceForm(true),
      color: 'info' as const
    },
    {
      icon: <QRIcon />,
      label: 'View QR Code',
      onClick: () => {/* TODO: Show QR modal */},
      color: 'success' as const
    }
  ];

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['asset', id] }),
      queryClient.invalidateQueries({ queryKey: ['asset-work-orders', id] }),
      queryClient.invalidateQueries({ queryKey: ['asset-maintenance', id] })
    ]);
  }, [queryClient, id]);

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

  if (error || !asset) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <MobileHeader
          title="Asset Not Found"
          onBack={() => navigate(-1)}
        />
        <Container maxWidth="sm" sx={{ py: 2 }}>
          <Alert severity="error">
            Failed to load asset details. Please try again.
            <Button onClick={() => refetch()} sx={{ mt: 1 }}>
              Retry
            </Button>
          </Alert>
        </Container>
      </Box>
    );
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      <MobileHeader
        title={asset.name}
        subtitle={asset.location?.name}
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
            {/* Asset Hero Card */}
            <ExpandableCard
              title="Asset Health"
              subtitle={`${healthScore}% Overall Condition`}
              icon={
                <Avatar
                  sx={{ 
                    bgcolor: `${getHealthColor(healthScore)}.light`,
                    color: `${getHealthColor(healthScore)}.main`
                  }}
                >
                  <AssetIcon />
                </Avatar>
              }
              badge={<StatusBadge status={asset.status} />}
              expanded={true}
              disabled={true}
              elevation={2}
            >
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <ProgressCard
                    title="Health Score"
                    current={healthScore}
                    total={100}
                    color={getHealthColor(healthScore)}
                    icon={<AssetIcon />}
                  />
                </Grid>
                <Grid item xs={6}>
                  <ProgressCard
                    title="Work Orders"
                    current={workOrders.filter(wo => wo.status === 'COMPLETED').length}
                    total={workOrders.length}
                    color="primary"
                    icon={<WorkOrderIcon />}
                  />
                </Grid>
              </Grid>

              {asset.imageUrl && (
                <Box sx={{ mb: 2 }}>
                  <img 
                    src={asset.imageUrl} 
                    alt={asset.name}
                    style={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      borderRadius: 8
                    }}
                  />
                </Box>
              )}

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <StatusBadge status={asset.status} />
                <StatusBadge status={asset.criticality} variant="outlined" />
                {asset.warrantyExpiry && (
                  <Chip 
                    label="Under Warranty" 
                    size="small" 
                    color="success"
                    variant="outlined"
                  />
                )}
              </Stack>
            </ExpandableCard>

            {/* Basic Information */}
            <ExpandableCard
              title="Basic Information"
              subtitle="Asset specifications and details"
              icon={<SerialIcon />}
            >
              <Stack spacing={2}>
                {asset.manufacturer && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ManufacturerIcon color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Manufacturer</Typography>
                      <Typography variant="body1">{asset.manufacturer}</Typography>
                    </Box>
                  </Box>
                )}
                {asset.model && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AssetIcon color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Model</Typography>
                      <Typography variant="body1">{asset.model}</Typography>
                    </Box>
                  </Box>
                )}
                {asset.serialNumber && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <SerialIcon color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Serial Number</Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                        {asset.serialNumber}
                      </Typography>
                    </Box>
                  </Box>
                )}
                {asset.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LocationIcon color="action" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Location</Typography>
                      <Typography variant="body1">{asset.location.name}</Typography>
                    </Box>
                  </Box>
                )}
              </Stack>
            </ExpandableCard>

            {/* Recent Work Orders */}
            <ExpandableCard
              title="Recent Work Orders"
              subtitle={`${workOrders.length} total work orders`}
              icon={<WorkOrderIcon />}
              badge={
                workOrders.filter(wo => wo.status === 'OPEN' || wo.status === 'IN_PROGRESS').length > 0 && (
                  <Chip 
                    label={`${workOrders.filter(wo => wo.status === 'OPEN' || wo.status === 'IN_PROGRESS').length} Active`}
                    size="small"
                    color="warning"
                  />
                )
              }
            >
              {workOrders.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  No work orders found for this asset
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {workOrders.slice(0, 5).map((workOrder) => (
                    <Box
                      key={workOrder.id}
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
                      onClick={() => navigate(`/work-orders/${workOrder.id}`)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          WO-{workOrder.id}
                        </Typography>
                        <StatusBadge status={workOrder.status} size="small" />
                      </Box>
                      <Typography variant="body2" noWrap sx={{ mb: 1 }}>
                        {workOrder.title}
                      </Typography>
                      <Stack direction="row" spacing={2}>
                        <Typography variant="caption" color="text.secondary">
                          Priority: {workOrder.priority}
                        </Typography>
                        {workOrder.assignedTo && (
                          <Typography variant="caption" color="text.secondary">
                            Assigned: {workOrder.assignedTo.name}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  ))}
                  {workOrders.length > 5 && (
                    <Button 
                      variant="text" 
                      onClick={() => navigate(`/work-orders?asset=${asset.id}`)}
                      sx={{ mt: 1 }}
                    >
                      View All {workOrders.length} Work Orders
                    </Button>
                  )}
                </Stack>
              )}
            </ExpandableCard>

            {/* Maintenance Schedules */}
            <ExpandableCard
              title="Maintenance Schedules"
              subtitle={`${maintenanceSchedules.length} active schedules`}
              icon={<MaintenanceIcon />}
            >
              {maintenanceSchedules.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  No maintenance schedules configured
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {maintenanceSchedules.slice(0, 3).map((schedule: any) => (
                    <Box
                      key={schedule.id}
                      sx={{
                        p: 2,
                        bgcolor: 'background.paper',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        {schedule.title}
                      </Typography>
                      <Stack direction="row" spacing={2}>
                        <Typography variant="caption" color="text.secondary">
                          Frequency: {schedule.frequency}
                        </Typography>
                        {schedule.nextDue && (
                          <Typography variant="caption" color="text.secondary">
                            Next: {new Date(schedule.nextDue).toLocaleDateString()}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  ))}
                  {maintenanceSchedules.length > 3 && (
                    <Button variant="text" sx={{ mt: 1 }}>
                      View All Schedules
                    </Button>
                  )}
                </Stack>
              )}
            </ExpandableCard>

            {/* Attachments */}
            {asset.attachments && asset.attachments.length > 0 && (
              <ExpandableCard
                title="Attachments"
                subtitle={`${asset.attachments.length} files`}
                icon={<AttachmentIcon />}
              >
                <Stack spacing={1}>
                  {asset.attachments.map((attachment: any, index: number) => (
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

export default AssetDetailMobile;