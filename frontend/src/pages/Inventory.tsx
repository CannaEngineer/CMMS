import React, { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme,
  useMediaQuery,
  Fab,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon,
  ShoppingCart as OrderIcon,
  TrendingDown as LowStockIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import StatCard from '../components/Common/StatCard';
import DataTable from '../components/Common/DataTable';
import UniversalExportButton from '../components/Common/UniversalExportButton';
import PartForm from '../components/Forms/PartForm';
import { LoadingSpinner, LoadingBar, TemplatedSkeleton, LoadingOverlay } from '../components/Loading';
import { statusColors } from '../theme/theme';
import { partsService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import PurchaseOrderDialog from '../components/PurchaseOrder/PurchaseOrderDialog';

interface Part {
  id: number;
  name: string;
  sku?: string;
  description?: string;
  stockLevel: number;
  reorderPoint: number;
  supplier?: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

const inventoryColumns = [
  { key: 'sku', label: 'SKU', width: 120, sortable: true, priority: 'high' },
  { key: 'name', label: 'Part Name', sortable: true, priority: 'high' },
  { key: 'description', label: 'Description', hideOnMobile: true, priority: 'low' },
  {
    key: 'stockLevel',
    label: 'Stock',
    align: 'center' as const,
    sortable: true,
    priority: 'medium',
    render: (value: number, row: Part) => (
      <Chip
        label={value}
        size="small"
        color={
          value === 0 ? 'error' :
          value <= row.reorderPoint ? 'warning' :
          'success'
        }
      />
    ),
  },
  {
    key: 'reorderPoint',
    label: 'Reorder Point',
    align: 'center' as const,
    sortable: true,
    hideOnMobile: true,
    priority: 'low',
  },
  { 
    key: 'supplier', 
    label: 'Supplier',
    hideOnMobile: true,
    priority: 'medium',
    render: (value: any, row: Part) => row.supplier?.name || 'N/A'
  },
  { 
    key: 'createdAt', 
    label: 'Created',
    hideOnMobile: true,
    priority: 'low',
    render: (value: string) => new Date(value).toLocaleDateString()
  },
];

export default function Inventory() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });
  const [purchaseOrderOpen, setPurchaseOrderOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch all parts
  const { data: parts = [], isLoading, error } = useQuery({
    queryKey: ['parts'],
    queryFn: partsService.getAll,
  });

  // Fetch low stock parts
  const { data: lowStockParts = [] } = useQuery({
    queryKey: ['parts', 'low-stock'],
    queryFn: partsService.getLowStock,
  });

  // Fetch recent activity
  const { data: recentActivity = [] } = useQuery({
    queryKey: ['parts', 'recent-activity'],
    queryFn: () => partsService.getRecentActivity(10),
  });

  // Create part mutation
  const createPartMutation = useMutation({
    mutationFn: partsService.create,
    onSuccess: (data) => {
      // Check if this was a merge operation based on the part's updatedAt vs createdAt
      const wasUpdated = data.updatedAt && data.createdAt && 
        new Date(data.updatedAt).getTime() > new Date(data.createdAt).getTime();
      
      if (wasUpdated) {
        console.log('🔄 Part merged with existing part:', data);
        setSnackbar({ 
          open: true, 
          message: `Part "${data.name}" merged with existing part (Stock: ${data.stockLevel})`, 
          severity: 'info' 
        });
      } else {
        console.log('✅ Part created successfully:', data);
        setSnackbar({ 
          open: true, 
          message: `Part "${data.name}" created successfully`, 
          severity: 'success' 
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      setOpenDialog(false);
    },
    onError: (error: any) => {
      console.error('❌ Failed to create part:', error);
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to create part', severity: 'error' });
    },
  });

  // Update part mutation
  const updatePartMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => partsService.update(id, data),
    onSuccess: (data) => {
      console.log('✅ Part updated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      setOpenDialog(false);
      setSnackbar({ open: true, message: 'Part updated successfully', severity: 'success' });
    },
    onError: (error: any) => {
      console.error('❌ Failed to update part:', error);
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to update part', severity: 'error' });
    },
  });

  // Delete part mutation
  const deletePartMutation = useMutation({
    mutationFn: partsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      setSnackbar({ open: true, message: 'Part deleted successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to delete part', severity: 'error' });
    },
  });


  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchor(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchor(null);
  };

  const handleCreatePart = () => {
    setSelectedPart(null);
    setFormMode('create');
    setOpenDialog(true);
  };

  const handleViewPart = (part: Part) => {
    navigate(`/inventory/parts/${part.id}`);
  };

  const handleEditPart = (part: Part) => {
    setSelectedPart(part);
    setFormMode('edit');
    setOpenDialog(true);
  };

  const handleSubmitPart = (data: any) => {
    if (selectedPart) {
      updatePartMutation.mutate({ id: selectedPart.id.toString(), data });
    } else {
      createPartMutation.mutate(data);
    }
  };

  const handlePurchaseOrderSubmit = async (orderData: any) => {
    try {
      console.log('Creating purchase order:', orderData);
      // Create the purchase order with the selected items
      const result = await partsService.createPurchaseOrder(orderData.items.map((item: any) => ({
        partId: item.partId.toString(),
        partName: item.part.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        notes: item.notes,
      })));
      
      setSnackbar({
        open: true,
        message: `Purchase order ${result.id} created successfully with ${orderData.items.length} items`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Purchase order creation failed:', error);
      setSnackbar({
        open: true,
        message: `Failed to create purchase order: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    }
  };

  const handleInventoryUpdate = async (partId: number, newStockLevel: number, newReorderPoint: number) => {
    try {
      // Update the part with new inventory levels
      const part = (parts || []).find(p => p.id === partId);
      if (part) {
        // Create update data with the correct structure
        const updateData = {
          id: part.id,
          name: part.name,
          sku: part.sku,
          description: part.description,
          stockLevel: newStockLevel,
          reorderPoint: newReorderPoint,
          supplier: part.supplier,
          createdAt: part.createdAt,
          updatedAt: new Date().toISOString(),
        };
        
        await partsService.update(part.id.toString(), updateData);
        
        // Refresh the parts data
        queryClient.invalidateQueries({ queryKey: ['parts'] });
        
        setSnackbar({
          open: true,
          message: `Inventory updated for ${part.name}`,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Inventory update error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update inventory levels - API simulation mode',
        severity: 'warning'
      });
      
      // Since we're in mock mode, let's simulate the update locally
      // This would normally be handled by the backend
      queryClient.setQueryData(['parts'], (oldParts: any[]) => {
        return oldParts.map(p => 
          p.id === partId 
            ? { ...p, stockLevel: newStockLevel, reorderPoint: newReorderPoint, updatedAt: new Date().toISOString() }
            : p
        );
      });
    }
  };

  const outOfStockParts = (parts || []).filter(part => part.stockLevel === 0);
  const totalParts = (parts || []).length;

  // Filter parts based on tab selection
  const getFilteredParts = () => {
    switch (tabValue) {
      case 1: // Low Stock
        return lowStockParts || [];
      case 2: // Out of Stock
        return outOfStockParts || [];
      default: // All Parts
        return (parts || []).filter(part => 
          searchTerm === '' || 
          part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          part.sku?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <LoadingOverlay
        open={true}
        message="Loading inventory..."
        context="data"
      />
    );
  }

  // Error state
  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load inventory data. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Inventory Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {!isMobile && (
            <>
              <UniversalExportButton
                dataSource="inventory"
                entityType="parts"
                buttonText="Export"
              />
            </>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreatePart}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            Add Part
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Total Parts"
            value={totalParts}
            subtitle="In inventory"
            icon={<InventoryIcon />}
            color="primary"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock Items"
            value={(lowStockParts || []).length}
            subtitle="Need reordering"
            icon={<LowStockIcon />}
            color="warning"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Out of Stock"
            value={outOfStockParts.length}
            subtitle="Urgent attention needed"
            icon={<WarningIcon />}
            color="error"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Total Items"
            value={(parts || []).reduce((sum, part) => sum + part.stockLevel, 0)}
            subtitle="Current stock count"
            icon={<ReportIcon />}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Alerts for low/out of stock */}
      {outOfStockParts.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>{outOfStockParts.length} parts are out of stock:</strong>{' '}
          {outOfStockParts.map(p => p.name).join(', ')}
        </Alert>
      )}

      {(lowStockParts || []).length > (outOfStockParts || []).length && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>{(lowStockParts || []).length - (outOfStockParts || []).length} parts are low on stock</strong>{' '}
          and need reordering soon.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Inventory Table */}
        <Grid xs={12}>
          <Paper sx={{ mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
              <Tab label={`All Parts (${totalParts})`} />
              <Tab label={`Low Stock (${(lowStockParts || []).length})`} />
              <Tab label={`Out of Stock (${outOfStockParts.length})`} />
              <Tab label="By Category" />
              <Tab label="Recent Orders" />
            </Tabs>
          </Paper>

          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                placeholder="Search parts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flexGrow: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={handleFilterClick}
              >
                Filter
              </Button>
            </Box>
          </Paper>

          <DataTable
            title=""
            columns={inventoryColumns}
            data={getFilteredParts()}
            onRowClick={handleViewPart}
            onView={handleViewPart}
            onEdit={handleEditPart}
            onDelete={(part: Part) => {
              if (confirm(`Are you sure you want to delete "${part.name}"? This action cannot be undone.`)) {
                deletePartMutation.mutate(part.id.toString());
              }
            }}
            searchable={false}
            selectable
            loading={isLoading}
          />
        </Grid>

      </Grid>

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleCreatePart}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={handleFilterClose}
      >
        <MenuItem onClick={handleFilterClose}>All Categories</MenuItem>
        <MenuItem onClick={handleFilterClose}>Electrical</MenuItem>
        <MenuItem onClick={handleFilterClose}>Mechanical</MenuItem>
        <MenuItem onClick={handleFilterClose}>Fluids</MenuItem>
        <MenuItem onClick={handleFilterClose}>Filters</MenuItem>
        <MenuItem onClick={handleFilterClose}>Low Stock Only</MenuItem>
        <MenuItem onClick={handleFilterClose}>Out of Stock Only</MenuItem>
      </Menu>

      {/* Part Form Dialog */}
      <PartForm
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSubmit={handleSubmitPart}
        initialData={selectedPart || {}}
        mode={formMode}
      />

      {/* Purchase Order Dialog */}
      <PurchaseOrderDialog
        open={purchaseOrderOpen}
        onClose={() => setPurchaseOrderOpen(false)}
        parts={parts}
        onSubmit={handlePurchaseOrderSubmit}
        onUpdateInventory={handleInventoryUpdate}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}