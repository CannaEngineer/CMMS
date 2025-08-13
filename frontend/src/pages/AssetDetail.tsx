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
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsService, workOrdersService } from '../services/api';
import { statusColors } from '../theme/theme';
import QRCodeDisplay from '../components/QR/QRCodeDisplay';
import AssetForm from '../components/Forms/AssetForm';

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

  // Delete mutation
  const deleteAssetMutation = useMutation({
    mutationFn: assetsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      navigate('/assets');
    },
  });

  const handleDelete = () => {
    if (asset && window.confirm(`Are you sure you want to delete "${asset.name}"?`)) {
      deleteAssetMutation.mutate(asset.id.toString());
    }
  };

  const handleCreateWorkOrder = () => {
    navigate(`/work-orders/new?assetId=${id}`);
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
        <Grid xs={12} lg={8}>
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
                <Grid xs={12} md={6}>
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

                <Grid xs={12} md={6}>
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
              <Typography variant="h6" gutterBottom>
                Maintenance Schedules
              </Typography>
              <Alert severity="info">
                Maintenance scheduling coming soon.
              </Alert>
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              {/* History */}
              <Typography variant="h6" gutterBottom>
                Asset History
              </Typography>
              <Alert severity="info">
                Asset history tracking coming soon.
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
        initialData={asset}
        mode="edit"
      />
    </Container>
  );
}