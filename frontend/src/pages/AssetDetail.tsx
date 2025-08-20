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
  Snackbar,
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
  CloudUpload as UploadIcon,
  AttachFile as AttachFileIcon,
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  // Update mutation
  const updateAssetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => assetsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setEditDialogOpen(false);
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
    navigate(`/work-orders/new?assetId=${id}`);
  };

  // File upload handler
  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0 || !asset) return;

    setIsUploading(true);
    setUploadError(null);
    
    try {
      const newAttachments: any[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const formData = new FormData();
        formData.append('files', file);
        
        try {
          const response = await fetch('/api/uploads/asset', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: formData,
          });
          
          if (response.ok) {
            const uploadResult = await response.json();
            if (uploadResult.success && uploadResult.files && uploadResult.files.length > 0) {
              const uploadedFile = uploadResult.files[0];
              newAttachments.push({
                url: uploadedFile.url,
                filename: uploadedFile.filename,
                size: uploadedFile.size,
                type: uploadedFile.mimetype,
                fileId: uploadedFile.id,
              });
            }
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || 'Upload failed');
          }
        } catch (error) {
          console.error('Upload error for file:', file.name, error);
          throw error;
        }
      }
      
      // Update asset with new attachments
      const existingAttachments = asset.attachments || [];
      const updatedAttachments = [...existingAttachments, ...newAttachments];
      
      // Update the asset in the backend
      await updateAssetMutation.mutateAsync({
        id: asset.id.toString(),
        data: { attachments: updatedAttachments }
      });
      
      setUploadSuccess(true);
    } catch (error) {
      console.error('File upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleFileUpload(event.target.files);
    }
    // Reset input
    event.target.value = '';
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 2 }}>
                    <Typography variant="h6">
                      Attachments ({asset.attachments?.length || 0})
                    </Typography>
                    <Box>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        style={{ display: 'none' }}
                        id="asset-detail-file-upload"
                        onChange={handleFileInputChange}
                        disabled={isUploading}
                      />
                      <label htmlFor="asset-detail-file-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={isUploading ? <CircularProgress size={20} /> : <UploadIcon />}
                          disabled={isUploading}
                          size="small"
                        >
                          {isUploading ? 'Uploading...' : 'Add Files'}
                        </Button>
                      </label>
                    </Box>
                  </Box>
                  
                  {asset.attachments && asset.attachments.length > 0 ? (
                    <Grid container spacing={2}>
                      {asset.attachments.map((attachment: any, index: number) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Card variant="outlined" sx={{ height: '100%' }}>
                            <CardContent sx={{ p: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <img
                                  src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjRweCIgdmlld0JveD0iMCAwIDI0IDI0IiB3aWR0aD0iMjRweCIgZmlsbD0iIzAwMDAwMCI+PHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Im0xNCAxMi0zIDMtMiAyIDUgNS03LjVIOS41TDIgMTJsNy01LjVINFYyaDEwdjEweiIvPjwvc3ZnPg=="
                                  alt=""
                                  style={{ width: 16, height: 16 }}
                                />
                                <Typography variant="subtitle2" noWrap>
                                  {attachment.filename || `Attachment ${index + 1}`}
                                </Typography>
                              </Box>
                              
                              {attachment.url && (attachment.url.includes('.png') || attachment.url.includes('.jpg') || attachment.url.includes('.jpeg') || attachment.url.includes('.gif')) ? (
                                <Box
                                  sx={{
                                    width: '100%',
                                    height: 120,
                                    backgroundImage: `url(${attachment.url})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    borderRadius: 1,
                                    mb: 1,
                                    cursor: 'pointer',
                                    border: '1px solid',
                                    borderColor: 'divider',
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
                                    mb: 1,
                                  }}
                                >
                                  <img
                                    src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iNDBweCIgdmlld0JveD0iMCAwIDI0IDI0IiB3aWR0aD0iNDBweCIgZmlsbD0iIzk5OTk5OSI+PHBhdGggZD0iTTAgMGgyNHYyNEgwVjB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTE2LjUgNmgtMWwtLjUtLjVoLTVMLjUtNmgtMUM4IDYgOCA2LjQ1IDggMVY5aDh2LTNjMC0uNTUtLjQ1LTEtMS0xem0uNSAydjhoLTNWMTNoM3ptLTUgNXYtM2g0djNoLTR6Ii8+PC9zdmc+"
                                    alt="File"
                                    style={{ width: 40, height: 40 }}
                                  />
                                </Box>
                              )}
                              
                              <Typography variant="caption" color="text.secondary" display="block">
                                Size: {((attachment.size || 0) / 1024).toFixed(1)} KB
                              </Typography>
                              
                              <Button
                                fullWidth
                                size="small"
                                variant="outlined"
                                onClick={() => window.open(attachment.url, '_blank')}
                                sx={{ mt: 1 }}
                              >
                                View/Download
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box 
                      sx={{ 
                        textAlign: 'center', 
                        py: 4, 
                        color: 'text.secondary',
                        border: '1px dashed',
                        borderColor: 'divider',
                        borderRadius: 1 
                      }}
                    >
                      <AttachFileIcon sx={{ fontSize: 48, mb: 1, color: 'text.disabled' }} />
                      <Typography variant="body2">
                        No attachments yet. Click "Add Files" to upload documents or images.
                      </Typography>
                    </Box>
                  )}
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

      {/* Upload Success/Error Notifications */}
      <Snackbar
        open={uploadSuccess}
        autoHideDuration={4000}
        onClose={() => setUploadSuccess(false)}
        message="Files uploaded successfully!"
      />
      
      <Snackbar
        open={!!uploadError}
        autoHideDuration={6000}
        onClose={() => setUploadError(null)}
        message={`Upload failed: ${uploadError}`}
      />
    </Container>
  );
}