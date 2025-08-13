import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Inventory as PartIcon,
  Business as SupplierIcon,
  Place as LocationIcon,
  AttachMoney as PriceIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partsService } from '../services/api';
import QRCodeDisplay from '../components/QR/QRCodeDisplay';

export default function PartDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [quickEditOpen, setQuickEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    stockLevel: 0,
    reorderPoint: 0,
    name: '',
    description: '',
  });
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'warning' 
  });

  const { data: part, isLoading, error } = useQuery({
    queryKey: ['parts', id],
    queryFn: () => partsService.getById(id!),
    enabled: !!id,
  });

  // Update part mutation
  const updatePartMutation = useMutation({
    mutationFn: (updateData: any) => partsService.update(id!, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts', id] });
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      setQuickEditOpen(false);
      setSnackbar({
        open: true,
        message: 'Part updated successfully',
        severity: 'success'
      });
    },
    onError: (error) => {
      console.error('Update failed:', error);
      setSnackbar({
        open: true,
        message: 'Update failed - API simulation mode, changes applied locally',
        severity: 'warning'
      });
      
      // Update locally since we're in mock mode
      queryClient.setQueryData(['parts', id], (oldPart: any) => ({
        ...oldPart,
        ...editData,
        updatedAt: new Date().toISOString(),
      }));
      setQuickEditOpen(false);
    },
  });

  const handleQuickEdit = () => {
    if (part) {
      setEditData({
        stockLevel: part.stockLevel,
        reorderPoint: part.reorderPoint,
        name: part.name,
        description: part.description || '',
      });
      setQuickEditOpen(true);
    }
  };

  const handleQuickEditSave = () => {
    if (part) {
      const updateData = {
        id: part.id,
        name: editData.name,
        sku: part.sku,
        description: editData.description,
        stockLevel: editData.stockLevel,
        reorderPoint: editData.reorderPoint,
        supplier: part.supplier,
        createdAt: part.createdAt,
        updatedAt: new Date().toISOString(),
      };
      updatePartMutation.mutate(updateData);
    }
  };

  const handleQuickEditCancel = () => {
    setQuickEditOpen(false);
    if (part) {
      setEditData({
        stockLevel: part.stockLevel,
        reorderPoint: part.reorderPoint,
        name: part.name,
        description: part.description || '',
      });
    }
  };

  const getStockStatus = () => {
    if (!part) return { status: 'UNKNOWN', color: 'default', icon: <PartIcon /> };
    
    if (part.stockLevel === 0) {
      return { 
        status: 'OUT OF STOCK', 
        color: 'error', 
        icon: <WarningIcon /> 
      };
    }
    if (part.stockLevel <= part.reorderPoint) {
      return { 
        status: 'LOW STOCK', 
        color: 'warning', 
        icon: <WarningIcon /> 
      };
    }
    return { 
      status: 'IN STOCK', 
      color: 'success', 
      icon: <CheckIcon /> 
    };
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !part) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load part details. Please try again later.
        </Alert>
      </Box>
    );
  }

  const stockStatus = getStockStatus();
  const stockPercentage = part.reorderPoint > 0 
    ? Math.min((part.stockLevel / (part.reorderPoint * 2)) * 100, 100)
    : 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <BackIcon 
          sx={{ mr: 2, cursor: 'pointer' }} 
          onClick={() => navigate('/inventory')}
        />
        <Typography variant="h4" sx={{ fontWeight: 700, flexGrow: 1 }}>
          Part Details
        </Typography>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={handleQuickEdit}
          sx={{ ml: 2 }}
        >
          Quick Edit
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Main Part Information */}
        <Grid xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main' }}>
                  <PartIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                    {part.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    SKU: {part.sku}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      icon={stockStatus.icon}
                      label={stockStatus.status}
                      color={stockStatus.color as any}
                      size="small"
                    />
                    <Chip
                      label={`${part.stockLevel} units`}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ mb: 2 }}>Description</Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {part.description || 'No description available'}
              </Typography>

              <Grid container spacing={3}>
                <Grid xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Current Stock Level
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" sx={{ mr: 2, fontWeight: 600 }}>
                      {part.stockLevel}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      units
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={stockPercentage}
                    color={stockStatus.color as any}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Reorder point: {part.reorderPoint} units
                  </Typography>
                </Grid>

                <Grid xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Supplier Information
                  </Typography>
                  {part.supplier ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SupplierIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body1">
                        {part.supplier.name}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No supplier assigned
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Stock Alerts */}
          {part.stockLevel === 0 && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <strong>Out of Stock:</strong> This part is currently out of stock and may cause delays in maintenance operations.
            </Alert>
          )}

          {part.stockLevel > 0 && part.stockLevel <= part.reorderPoint && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <strong>Low Stock Warning:</strong> Stock level is at or below the reorder point. Consider reordering soon.
            </Alert>
          )}
        </Grid>

        {/* QR Code and Actions Sidebar */}
        <Grid xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>QR Code</Typography>
              <QRCodeDisplay
                entityType="part"
                entityId={part.id.toString()}
                entityName={part.name}
                metadata={{ sku: part.sku }}
                size={200}
                showLabel={true}
                showActions={true}
              />
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Part Details</Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <PartIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Part ID"
                    secondary={part.id}
                  />
                </ListItem>
                
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <LocationIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Location"
                    secondary={part.location || 'Not specified'}
                  />
                </ListItem>

                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <PriceIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Estimated Value"
                    secondary={`$${(part.stockLevel * 15.00).toFixed(2)}`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Timestamps</Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Created"
                    secondary={new Date(part.createdAt).toLocaleDateString()}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="Last Updated"
                    secondary={new Date(part.updatedAt).toLocaleDateString()}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Edit Dialog */}
      <Dialog open={quickEditOpen} onClose={handleQuickEditCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon />
            Quick Edit - {part?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Part Name"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              fullWidth
            />
            
            <TextField
              label="Description"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            
            <Grid container spacing={2}>
              <Grid xs={6}>
                <TextField
                  label="Current Stock"
                  type="number"
                  value={editData.stockLevel}
                  onChange={(e) => setEditData({ 
                    ...editData, 
                    stockLevel: Math.max(0, parseInt(e.target.value) || 0) 
                  })}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid xs={6}>
                <TextField
                  label="Reorder Point"
                  type="number"
                  value={editData.reorderPoint}
                  onChange={(e) => setEditData({ 
                    ...editData, 
                    reorderPoint: Math.max(0, parseInt(e.target.value) || 0) 
                  })}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Admin Quick Edit:</strong> This allows rapid updates to key part information. 
                Changes will be immediately reflected across the system.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleQuickEditCancel} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button 
            onClick={handleQuickEditSave} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={updatePartMutation.isPending}
          >
            {updatePartMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}