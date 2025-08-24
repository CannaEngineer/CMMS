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
  Card,
  CardContent,
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
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Build as AssetIcon,
  LocationOn as LocationIcon,
  Business as ManufacturerIcon,
  Inventory as SerialIcon,
  CalendarToday as DateIcon,
  Assignment as WorkOrderIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  Add as AddIcon,
  NavigateNext as NavigateNextIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsService, workOrdersService, pmService } from '../services/api';
import { statusColors } from '../theme/theme';
import QRCodeDisplay from '../components/QR/QRCodeDisplay';
import AssetForm from '../components/Forms/AssetForm';
import WorkOrderForm from '../components/Forms/WorkOrderForm';
import { FileUploadManager, FileAttachment } from '../components/Common';

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

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [workOrderFormOpen, setWorkOrderFormOpen] = useState(false);

  // Fetch asset data
  const { data: asset, isLoading, error } = useQuery({
    queryKey: ['asset', id],
    queryFn: async () => {
      if (!id) throw new Error('Asset ID is required');
      return assetsService.getById(id);
    },
    enabled: !!id,
  });

  // Fetch related work orders
  const { data: workOrders = [] } = useQuery({
    queryKey: ['asset-work-orders', id],
    queryFn: async () => {
      if (!id) return [];
      return workOrdersService.getByAssetId(id);
    },
    enabled: !!id,
  });

  // Fetch PM schedules for this asset
  const { data: pmSchedules = [] } = useQuery({
    queryKey: ['asset-pm-schedules', id],
    queryFn: async () => {
      if (!id) return [];
      const allSchedules = await pmService.getSchedules();
      return allSchedules.filter((schedule: any) => schedule.assetId === parseInt(id));
    },
    enabled: !!id,
  });

  // Fetch maintenance history for this asset
  const { data: maintenanceHistory = [] } = useQuery({
    queryKey: ['asset-maintenance-history', id],
    queryFn: async () => {
      if (!id) return [];
      // For now, use work orders as maintenance history
      // TODO: Replace with actual maintenance history service when available
      return workOrders.map((wo: any) => ({
        id: wo.id,
        type: 'Work Order',
        title: wo.title,
        description: wo.description,
        date: wo.createdAt,
        completedDate: wo.completedAt,
        status: wo.status,
        technician: wo.assignedTo?.name || 'Unassigned',
        duration: wo.actualHours || wo.estimatedHours,
        cost: wo.totalCost || 0
      }));
    },
    enabled: !!id && workOrders.length > 0,
  });

  // Delete mutation
  const deleteAssetMutation = useMutation({
    mutationFn: assetsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      navigate('/assets');
    },
  });

  // Update mutation
  const updateAssetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => assetsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setEditDialogOpen(false);
    },
  });

  // Create work order mutation
  const createWorkOrderMutation = useMutation({
    mutationFn: workOrdersService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-work-orders', id] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      setWorkOrderFormOpen(false);
      // Optionally navigate to the work order detail
      // navigate(`/work-orders/${data.id}`);
    },
  });

  const handleDelete = () => {
    if (asset && window.confirm(`Are you sure you want to delete "${asset.name}"?`)) {
      deleteAssetMutation.mutate(asset.id.toString());
    }
  };

  const handleSubmit = (data: any) => {
    if (asset?.id) {
      updateAssetMutation.mutate({ id: asset.id.toString(), data });
    }
  };

  const handleCreateWorkOrder = () => {
    setWorkOrderFormOpen(true);
  };

  const handleWorkOrderSubmit = (data: any) => {
    // Include assetId in the work order data
    const workOrderData = {
      ...data,
      assetId: asset?.id,
    };
    createWorkOrderMutation.mutate(workOrderData);
  };

  const handleAttachmentsChange = (attachments: FileAttachment[]) => {
    if (asset?.id) {
      updateAssetMutation.mutate({
        id: asset.id.toString(),
        data: { attachments }
      });
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

  if (error || !asset) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error">
          {error instanceof Error ? error.message : 'Asset not found'}
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
            href="/assets"
            onClick={(e) => {
              e.preventDefault();
              navigate('/assets');
            }}
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <AssetIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Assets
          </Link>
          <Typography color="text.primary">{asset.name}</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/assets')}>
              <BackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {asset.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={asset.status}
                  color={asset.status === 'ONLINE' ? 'success' : 'error'}
                  size="small"
                />
                <Chip
                  label={asset.criticality}
                  color={
                    asset.criticality === 'HIGH' || asset.criticality === 'IMPORTANT' 
                      ? 'error' 
                      : asset.criticality === 'MEDIUM' 
                        ? 'warning' 
                        : 'default'
                  }
                  size="small"
                />
                {asset.location && (
                  <Chip
                    icon={<LocationIcon />}
                    label={asset.location.name}
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleCreateWorkOrder}
            >
              Create Work Order
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditDialogOpen(true)}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              disabled={deleteAssetMutation.isPending}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Content */}
<Grid item xs={12} lg={8}>
          <Paper sx={{ mb: 3 }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab label="Overview" />
              <Tab label="Work Orders" />
              <Tab label="Maintenance" />
              <Tab label="History" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              {/* Asset Details */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Asset Information
                  </Typography>
                  <List>
                    {asset.description && (
                      <ListItem>
                        <ListItemText
                          primary="Description"
                          secondary={asset.description}
                        />
                      </ListItem>
                    )}
                    {asset.serialNumber && (
                      <ListItem>
                        <ListItemIcon>
                          <SerialIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Serial Number"
                          secondary={asset.serialNumber}
                        />
                      </ListItem>
                    )}
                    {asset.modelNumber && (
                      <ListItem>
                        <ListItemText
                          primary="Model Number"
                          secondary={asset.modelNumber}
                        />
                      </ListItem>
                    )}
                    {asset.manufacturer && (
                      <ListItem>
                        <ListItemIcon>
                          <ManufacturerIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Manufacturer"
                          secondary={asset.manufacturer}
                        />
                      </ListItem>
                    )}
                    {asset.year && (
                      <ListItem>
                        <ListItemIcon>
                          <DateIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Year"
                          secondary={asset.year}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Status & Location
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Status"
                        secondary={
                          <Chip
                            label={asset.status}
                            color={asset.status === 'ONLINE' ? 'success' : 'error'}
                            size="small"
                          />
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Criticality"
                        secondary={
                          <Chip
                            label={asset.criticality}
                            color={
                              asset.criticality === 'HIGH' || asset.criticality === 'IMPORTANT' 
                                ? 'error' 
                                : asset.criticality === 'MEDIUM' 
                                  ? 'warning' 
                                  : 'default'
                            }
                            size="small"
                          />
                        }
                      />
                    </ListItem>
                    {asset.location && (
                      <ListItem>
                        <ListItemIcon>
                          <LocationIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Location"
                          secondary={asset.location.name}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>
                
                {/* Attachments Section */}
                <Grid item xs={12}>
                  <Box sx={{ mt: 3 }}>
                    <FileUploadManager
                      entityType="asset"
                      entityId={asset.id.toString()}
                      attachments={asset.attachments || []}
                      onAttachmentsChange={handleAttachmentsChange}
                      title="Asset Attachments"
                      maxFiles={10}
                    />
                  </Box>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {/* Work Orders */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Work Orders</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateWorkOrder}
                >
                  Create Work Order
                </Button>
              </Box>

              {workOrders.length === 0 ? (
                <Alert severity="info">No work orders found for this asset.</Alert>
              ) : (
                <List>
                  {workOrders.map((workOrder, index) => (
                    <React.Fragment key={workOrder.id}>
                      <ListItem
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/work-orders/${workOrder.id}`)}
                      >
                        <ListItemIcon>
                          <WorkOrderIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={workOrder.title}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Status: {workOrder.status} • Priority: {workOrder.priority}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Created: {new Date(workOrder.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        />
                        <Chip
                          label={workOrder.status}
                          size="small"
                          color={
                            workOrder.status === 'COMPLETED' ? 'success' :
                            workOrder.status === 'IN_PROGRESS' ? 'primary' :
                            workOrder.status === 'ON_HOLD' ? 'warning' : 'default'
                          }
                        />
                      </ListItem>
                      {index < workOrders.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {/* Maintenance Schedules */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Preventive Maintenance Schedules</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    // TODO: Implement PM schedule creation
                    console.log('Create PM schedule for asset', id);
                  }}
                >
                  Create PM Schedule
                </Button>
              </Box>

              {pmSchedules.length === 0 ? (
                <Alert severity="info">
                  No preventive maintenance schedules found for this asset.
                  <br />
                  <Button 
                    color="primary" 
                    onClick={() => console.log('Create first PM schedule')}
                    sx={{ mt: 1 }}
                  >
                    Create your first PM schedule
                  </Button>
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {pmSchedules.map((schedule: any) => (
                    <Grid item xs={12} md={6} key={schedule.id}>
                      <Card sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="h6" component="div">
                              {schedule.title || 'Maintenance Schedule'}
                            </Typography>
                            <Chip 
                              label={schedule.status || 'Active'} 
                              size="small"
                              color={schedule.status === 'ACTIVE' ? 'success' : 'default'}
                            />
                          </Box>
                          
                          {schedule.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {schedule.description}
                            </Typography>
                          )}

                          <List dense>
                            <ListItem>
                              <ListItemIcon>
                                <ScheduleIcon />
                              </ListItemIcon>
                              <ListItemText
                                primary="Frequency"
                                secondary={schedule.frequency || 'Not specified'}
                              />
                            </ListItem>
                            
                            {schedule.nextDue && (
                              <ListItem>
                                <ListItemIcon>
                                  <DateIcon />
                                </ListItemIcon>
                                <ListItemText
                                  primary="Next Due"
                                  secondary={new Date(schedule.nextDue).toLocaleDateString()}
                                />
                              </ListItem>
                            )}

                            {schedule.lastPerformed && (
                              <ListItem>
                                <ListItemIcon>
                                  <HistoryIcon />
                                </ListItemIcon>
                                <ListItemText
                                  primary="Last Performed"
                                  secondary={new Date(schedule.lastPerformed).toLocaleDateString()}
                                />
                              </ListItem>
                            )}
                          </List>

                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <Button 
                              size="small" 
                              onClick={() => console.log('Edit schedule', schedule.id)}
                            >
                              Edit
                            </Button>
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => {
                                // Create work order from PM schedule
                                const workOrderData = {
                                  title: `PM: ${schedule.title || 'Scheduled Maintenance'}`,
                                  description: `Preventive maintenance based on schedule: ${schedule.description || ''}`,
                                  assetId: asset?.id,
                                  priority: 'MEDIUM',
                                  status: 'OPEN',
                                  type: 'PREVENTIVE'
                                };
                                createWorkOrderMutation.mutate(workOrderData);
                              }}
                            >
                              Create Work Order
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}

              {/* Quick Stats */}
              {pmSchedules.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Maintenance Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {pmSchedules.length}
                        </Typography>
                        <Typography variant="body2">
                          Total Schedules
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          {pmSchedules.filter((s: any) => s.status === 'ACTIVE').length}
                        </Typography>
                        <Typography variant="body2">
                          Active Schedules
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main">
                          {pmSchedules.filter((s: any) => {
                            if (!s.nextDue) return false;
                            const nextDue = new Date(s.nextDue);
                            const now = new Date();
                            const daysDiff = (nextDue.getTime() - now.getTime()) / (1000 * 3600 * 24);
                            return daysDiff <= 7;
                          }).length}
                        </Typography>
                        <Typography variant="body2">
                          Due Soon
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              {/* History */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Asset Maintenance History</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      // TODO: Implement export functionality
                      console.log('Export history for asset', id);
                    }}
                  >
                    Export History
                  </Button>
                </Box>
              </Box>

              {maintenanceHistory.length === 0 ? (
                <Alert severity="info">
                  No maintenance history available for this asset.
                  <br />
                  History will be populated as work orders are completed.
                </Alert>
              ) : (
                <Box>
                  {/* History Timeline */}
                  <List>
                    {maintenanceHistory
                      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((historyItem: any, index: number) => (
                        <React.Fragment key={historyItem.id}>
                          <ListItem
                            alignItems="flex-start"
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              mb: 2,
                              bgcolor: 'background.paper',
                            }}
                          >
                            <ListItemIcon sx={{ mt: 1 }}>
                              {historyItem.type === 'Work Order' ? (
                                <WorkOrderIcon 
                                  color={
                                    historyItem.status === 'COMPLETED' ? 'success' : 
                                    historyItem.status === 'IN_PROGRESS' ? 'primary' : 
                                    'action'
                                  }
                                />
                              ) : (
                                <HistoryIcon color="action" />
                              )}
                            </ListItemIcon>
                            
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  <Typography variant="subtitle1" fontWeight="medium">
                                    {historyItem.title}
                                  </Typography>
                                  <Chip
                                    label={historyItem.status}
                                    size="small"
                                    color={
                                      historyItem.status === 'COMPLETED' ? 'success' :
                                      historyItem.status === 'IN_PROGRESS' ? 'primary' :
                                      historyItem.status === 'ON_HOLD' ? 'warning' : 
                                      'default'
                                    }
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  {historyItem.description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                      {historyItem.description}
                                    </Typography>
                                  )}
                                  
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">
                                      <strong>Created:</strong> {new Date(historyItem.date).toLocaleDateString()}
                                    </Typography>
                                    
                                    {historyItem.completedDate && (
                                      <Typography variant="caption" color="text.secondary">
                                        <strong>Completed:</strong> {new Date(historyItem.completedDate).toLocaleDateString()}
                                      </Typography>
                                    )}
                                    
                                    <Typography variant="caption" color="text.secondary">
                                      <strong>Technician:</strong> {historyItem.technician}
                                    </Typography>
                                    
                                    {historyItem.duration && (
                                      <Typography variant="caption" color="text.secondary">
                                        <strong>Duration:</strong> {historyItem.duration}h
                                      </Typography>
                                    )}
                                    
                                    {historyItem.cost > 0 && (
                                      <Typography variant="caption" color="text.secondary">
                                        <strong>Cost:</strong> ${historyItem.cost.toFixed(2)}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              }
                            />
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => navigate(`/work-orders/${historyItem.id}`)}
                              >
                                View Details
                              </Button>
                            </Box>
                          </ListItem>
                        </React.Fragment>
                      ))}
                  </List>

                  {/* History Statistics */}
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Maintenance Statistics
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {maintenanceHistory.length}
                          </Typography>
                          <Typography variant="body2">
                            Total Activities
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} sm={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main">
                            {maintenanceHistory.filter((h: any) => h.status === 'COMPLETED').length}
                          </Typography>
                          <Typography variant="body2">
                            Completed
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} sm={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="info.main">
                            {maintenanceHistory.reduce((total: number, h: any) => total + (h.duration || 0), 0).toFixed(1)}h
                          </Typography>
                          <Typography variant="body2">
                            Total Hours
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} sm={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="warning.main">
                            ${maintenanceHistory.reduce((total: number, h: any) => total + (h.cost || 0), 0).toFixed(2)}
                          </Typography>
                          <Typography variant="body2">
                            Total Cost
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Recent Trend Analysis */}
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Recent Trends
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Maintenance Frequency
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {(() => {
                              const now = new Date();
                              const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                              const recentWork = maintenanceHistory.filter((h: any) => 
                                new Date(h.date) >= thirtyDaysAgo
                              );
                              return recentWork.length > 0 
                                ? `${recentWork.length} maintenance activities in the last 30 days`
                                : 'No maintenance activities in the last 30 days';
                            })()}
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Average Resolution Time
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {(() => {
                              const completedWork = maintenanceHistory.filter((h: any) => 
                                h.status === 'COMPLETED' && h.completedDate
                              );
                              if (completedWork.length === 0) return 'No completed work orders yet';
                              
                              const avgDuration = completedWork.reduce((sum: number, h: any) => {
                                const created = new Date(h.date).getTime();
                                const completed = new Date(h.completedDate).getTime();
                                return sum + (completed - created) / (1000 * 60 * 60 * 24);
                              }, 0) / completedWork.length;
                              
                              return `${avgDuration.toFixed(1)} days average`;
                            })()}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              )}
            </TabPanel>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* QR Code */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              QR Code
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <QRCodeDisplay
                entityType="asset"
                entityId={asset.id.toString()}
                entityName={asset.name}
                qrCodeUrl={asset.barcode}
                metadata={{
                  serialNumber: asset.serialNumber,
                  location: asset.location?.name,
                  manufacturer: asset.manufacturer,
                }}
                size={200}
                showLabel={true}
                showActions={true}
              />
            </Box>
          </Paper>

          {/* Asset Image */}
          {asset.imageUrl && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Asset Image
              </Typography>
              <img
                src={asset.imageUrl}
                alt={asset.name}
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 8,
                  border: '1px solid #e0e0e0',
                }}
              />
            </Paper>
          )}

          {/* Quick Stats */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Stats
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Total Work Orders"
                  secondary={workOrders.length}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Open Work Orders"
                  secondary={workOrders.filter(wo => wo.status !== 'COMPLETED').length}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Asset ID"
                  secondary={asset.id}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Created"
                  secondary={new Date(asset.createdAt).toLocaleDateString()}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Last Updated"
                  secondary={new Date(asset.updatedAt).toLocaleDateString()}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <AssetForm
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSubmit={handleSubmit}
        initialData={asset}
        mode="edit"
        loading={updateAssetMutation.isPending}
      />

      {/* Work Order Form Dialog */}
      <WorkOrderForm
        open={workOrderFormOpen}
        onClose={() => setWorkOrderFormOpen(false)}
        onSubmit={handleWorkOrderSubmit}
        initialData={{
          assetId: asset?.id,
          title: asset ? `Work Order for ${asset.name}` : '',
          description: asset ? `Location: ${asset.location?.name || 'Unknown'}\nSerial Number: ${asset.serialNumber || 'N/A'}\nManufacturer: ${asset.manufacturer || 'N/A'}` : '',
          priority: 'MEDIUM',
          status: 'OPEN',
        }}
        mode="create"
        loading={createWorkOrderMutation.isPending}
      />

    </Container>
  );
}