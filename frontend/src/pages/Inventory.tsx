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
import { ResponsiveText, MobileContainer, MobileCard } from '../components/Common/MobileComponents';
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
  { 
    key: 'sku', 
    label: 'SKU', 
    width: 120, 
    sortable: true, 
    priority: 'high',
    render: (value: string) => (
      <Typography 
        variant="body2" 
        fontWeight="600" 
        sx={{ 
          color: 'primary.main',
          fontFamily: 'monospace',
          fontSize: '0.875rem'
        }}
      >
        {value || 'N/A'}
      </Typography>
    )
  },
  { 
    key: 'name', 
    label: 'Part Name', 
    sortable: true, 
    priority: 'high',
    width: 200,
    render: (value: string, row: Part) => (
      <Box>
        <ResponsiveText
          variant="body2" 
          maxLines={2}
          sx={{ fontWeight: 600 }}
        >
          {value}
        </ResponsiveText>
        {row.description && (
          <ResponsiveText
            variant="caption" 
            color="text.secondary"
            maxLines={1}
          >
            {row.description}
          </ResponsiveText>
        )}
      </Box>
    )
  },
  {
    key: 'stockLevel',
    label: 'Current Stock',
    align: 'center' as const,
    sortable: true,
    priority: 'medium',
    width: 140,
    render: (value: number, row: Part) => (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
        <Chip
          label={`${value} units`}
          size="small"
          variant="filled"
          color={
            value === 0 ? 'error' :
            value <= row.reorderPoint ? 'warning' :
            'success'
          }
          sx={{ 
            fontWeight: '600',
            minWidth: '80px'
          }}
        />
        {value <= row.reorderPoint && value > 0 && (
          <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
            LOW STOCK
          </Typography>
        )}
        {value === 0 && (
          <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
            OUT OF STOCK
          </Typography>
        )}
      </Box>
    ),
  },
  {
    key: 'reorderPoint',
    label: 'Reorder Level',
    align: 'center' as const,
    sortable: true,
    hideOnMobile: true,
    priority: 'low',
    width: 120,
    render: (value: number) => (
      <Typography variant="body2" color="text.secondary">
        {value} units
      </Typography>
    )
  },
  { 
    key: 'supplier', 
    label: 'Supplier',
    hideOnMobile: true,
    priority: 'medium',
    width: 150,
    render: (value: any, row: Part) => (
      <Typography 
        variant="body2"
        sx={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '130px'
        }}
        title={row.supplier?.name || 'No supplier assigned'}
      >
        {row.supplier?.name || (
          <span style={{ color: 'rgba(0,0,0,0.4)', fontStyle: 'italic' }}>No supplier</span>
        )}
      </Typography>
    )
  },
  { 
    key: 'createdAt', 
    label: 'Added',
    hideOnMobile: true,
    priority: 'low',
    width: 100,
    render: (value: string) => (
      <Typography variant="body2" color="text.secondary">
        {new Date(value).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: '2-digit'
        })}
      </Typography>
    )
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
    <MobileContainer maxHeight="100vh" sx={{ bgcolor: 'background.default' }}>
      {/* Header Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <ResponsiveText variant="h4" maxLines={2} sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
              Inventory Management
            </ResponsiveText>
            <ResponsiveText variant="subtitle1" maxLines={2} sx={{ opacity: 0.9, color: 'white' }}>
              Monitor stock levels, track parts, and manage inventory efficiently
            </ResponsiveText>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {!isMobile && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => setPurchaseOrderOpen(true)}
                  sx={{ 
                    borderColor: 'rgba(255,255,255,0.3)', 
                    color: 'white',
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.5)',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Purchase Order
                </Button>
                <UniversalExportButton
                  dataSource="inventory"
                  entityType="parts"
                  buttonText="Export"
                  variant="outlined"
                  sx={{ 
                    borderColor: 'rgba(255,255,255,0.3)', 
                    color: 'white',
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.5)',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                />
              </>
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreatePart}
              sx={{ 
                display: { xs: 'none', sm: 'flex' },
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                }
              }}
            >
              Add Part
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* KPI Cards */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary', fontWeight: 600 }}>
          Inventory Overview
        </Typography>
        <Grid container spacing={3}>
          <Grid xs={12} sm={6} md={3}>
            <StatCard
              title="Total Parts"
              value={totalParts.toLocaleString()}
              subtitle="Unique parts in system"
              icon={<InventoryIcon />}
              color="primary"
            />
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <StatCard
              title="Low Stock Items"
              value={(lowStockParts || []).length}
              subtitle="Need reordering soon"
              icon={<LowStockIcon />}
              color="warning"
              trend={
                (lowStockParts || []).length > 0 ? {
                  value: (lowStockParts || []).length,
                  label: "items below reorder point"
                } : undefined
              }
            />
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <StatCard
              title="Out of Stock"
              value={outOfStockParts.length}
              subtitle="Require immediate action"
              icon={<WarningIcon />}
              color="error"
              trend={
                outOfStockParts.length > 0 ? {
                  value: outOfStockParts.length,
                  label: "critical items"
                } : undefined
              }
            />
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <StatCard
              title="Total Units"
              value={(parts || []).reduce((sum, part) => sum + part.stockLevel, 0).toLocaleString()}
              subtitle="Items in stock"
              icon={<ReportIcon />}
              color="success"
              trend={{
                value: Math.round((parts || []).reduce((sum, part) => sum + part.stockLevel, 0) / Math.max(totalParts, 1)),
                label: "avg per part"
              }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Smart Alerts Section */}
      {(outOfStockParts.length > 0 || (lowStockParts || []).length > outOfStockParts.length) && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary', fontWeight: 600 }}>
            Inventory Alerts
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {outOfStockParts.length > 0 && (
              <Alert 
                severity="error" 
                variant="filled"
                sx={{ 
                  borderRadius: 2,
                  '& .MuiAlert-message': { fontWeight: 500 }
                }}
                action={
                  <Button 
                    color="inherit" 
                    size="small"
                    onClick={() => setPurchaseOrderOpen(true)}
                    sx={{ fontWeight: 600 }}
                  >
                    Create Purchase Order
                  </Button>
                }
              >
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                  {outOfStockParts.length} parts are completely out of stock
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {outOfStockParts.slice(0, 3).map(p => p.name).join(', ')}
                  {outOfStockParts.length > 3 && ` and ${outOfStockParts.length - 3} more...`}
                </Typography>
              </Alert>
            )}

            {(lowStockParts || []).length > outOfStockParts.length && (
              <Alert 
                severity="warning" 
                variant="filled"
                sx={{ 
                  borderRadius: 2,
                  '& .MuiAlert-message': { fontWeight: 500 }
                }}
                action={
                  <Button 
                    color="inherit" 
                    size="small"
                    onClick={() => setTabValue(1)}
                    sx={{ fontWeight: 600 }}
                  >
                    View Low Stock
                  </Button>
                }
              >
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                  {(lowStockParts || []).length - outOfStockParts.length} parts are running low
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Consider reordering soon to avoid stockouts
                </Typography>
              </Alert>
            )}
          </Box>
        </Box>
      )}

      {/* Main Inventory Management Section */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* Enhanced Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: 'grey.50' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable" 
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.95rem',
                minHeight: 56
              },
              '& .Mui-selected': {
                fontWeight: 700
              }
            }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InventoryIcon fontSize="small" />
                  All Parts ({totalParts})
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LowStockIcon fontSize="small" />
                  Low Stock ({(lowStockParts || []).length})
                </Box>
              }
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon fontSize="small" />
                  Out of Stock ({outOfStockParts.length})
                </Box>
              }
            />
            <Tab label="By Category" />
            <Tab label="Purchase History" />
          </Tabs>
        </Box>

        {/* Enhanced Search and Filter Section */}
        <Box sx={{ p: 3, backgroundColor: 'background.paper' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search by name, SKU, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ 
                flexGrow: 1, 
                minWidth: 300,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleFilterClick}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                minWidth: 100
              }}
            >
              Filters
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {getFilteredParts().length} of {totalParts} parts
            </Typography>
          </Box>
        </Box>

        {/* Enhanced Data Table */}
        <Box sx={{ px: 0 }}>
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
            sx={{
              '& .MuiTableHead-root': {
                backgroundColor: 'grey.100',
              },
              '& .MuiTableHead-root .MuiTableCell-root': {
                fontWeight: 700,
                color: 'text.primary',
                borderBottom: '2px solid',
                borderBottomColor: 'divider',
              },
              '& .MuiTableBody-root .MuiTableRow-root': {
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                '& .MuiTableCell-root': {
                  borderBottom: '1px solid',
                  borderBottomColor: 'grey.200',
                }
              }
            }}
          />
        </Box>
      </Paper>

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
    </MobileContainer>
  );
}