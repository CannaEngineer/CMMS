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
  LinearProgress,
  useTheme,
  useMediaQuery,
  Fab,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  QrCode as QrCodeIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon,
  ShoppingCart as OrderIcon,
  TrendingDown as LowStockIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import StatCard from '../components/Common/StatCard';
import DataTable from '../components/Common/DataTable';
import PartForm from '../components/Forms/PartForm';
import { statusColors } from '../theme/theme';
import { partService } from '../services/api';

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
  { id: 'sku', label: 'SKU', width: 120 },
  { id: 'name', label: 'Part Name' },
  { id: 'description', label: 'Description' },
  {
    id: 'stockLevel',
    label: 'Stock',
    align: 'center' as const,
    format: (value: number, row: Part) => (
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
    id: 'reorderPoint',
    label: 'Reorder Point',
    align: 'center' as const,
  },
  { 
    id: 'supplier', 
    label: 'Supplier',
    format: (value: any, row: Part) => row.supplier?.name || 'N/A'
  },
  { 
    id: 'createdAt', 
    label: 'Created',
    format: (value: string) => new Date(value).toLocaleDateString()
  },
];

export default function Inventory() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const queryClient = useQueryClient();

  // Fetch all parts
  const { data: parts = [], isLoading, error } = useQuery({
    queryKey: ['parts'],
    queryFn: partService.getAll,
  });

  // Fetch low stock parts
  const { data: lowStockParts = [] } = useQuery({
    queryKey: ['parts', 'low-stock'],
    queryFn: partService.getLowStock,
  });

  // Create part mutation
  const createPartMutation = useMutation({
    mutationFn: partService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      setOpenDialog(false);
      setSnackbar({ open: true, message: 'Part created successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to create part', severity: 'error' });
    },
  });

  // Update part mutation
  const updatePartMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => partService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      setOpenDialog(false);
      setSnackbar({ open: true, message: 'Part updated successfully', severity: 'success' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to update part', severity: 'error' });
    },
  });

  // Delete part mutation
  const deletePartMutation = useMutation({
    mutationFn: partService.delete,
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
    setSelectedPart(part);
    setFormMode('view');
    setOpenDialog(true);
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

  const outOfStockParts = parts.filter(part => part.stockLevel === 0);
  const totalParts = parts.length;

  // Filter parts based on tab selection
  const getFilteredParts = () => {
    switch (tabValue) {
      case 1: // Low Stock
        return lowStockParts;
      case 2: // Out of Stock
        return outOfStockParts;
      default: // All Parts
        return parts.filter(part => 
          searchTerm === '' || 
          part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          part.sku?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
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
              <Button
                variant="outlined"
                startIcon={<QrCodeIcon />}
              >
                Scan
              </Button>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
              >
                Import
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
              >
                Export
              </Button>
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
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Parts"
            value={totalParts}
            subtitle="In inventory"
            icon={<InventoryIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock Items"
            value={lowStockParts.length}
            subtitle="Need reordering"
            icon={<LowStockIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Out of Stock"
            value={outOfStockParts.length}
            subtitle="Urgent attention needed"
            icon={<WarningIcon />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Items"
            value={parts.reduce((sum, part) => sum + part.stockLevel, 0)}
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

      {lowStockParts.length > outOfStockParts.length && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>{lowStockParts.length - outOfStockParts.length} parts are low on stock</strong>{' '}
          and need reordering soon.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Inventory Table */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
              <Tab label={`All Parts (${totalParts})`} />
              <Tab label={`Low Stock (${lowStockParts.length})`} />
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
            searchable={false}
            selectable
            loading={isLoading}
          />
        </Grid>

        {/* Quick Actions Sidebar */}
        <Grid item xs={12} md={3}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Quick Actions</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<OrderIcon />}
                  fullWidth
                >
                  Create Purchase Order
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<QrCodeIcon />}
                  fullWidth
                >
                  Generate Barcodes
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ReportIcon />}
                  fullWidth
                >
                  Inventory Report
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Stock Levels</Typography>
              <List dense>
                {parts.slice(0, 5).map((part) => (
                  <ListItem key={part.id} sx={{ px: 0 }}>
                    <ListItemText
                      primary={part.name}
                      secondary={
                        <Box>
                          <Typography variant="caption">
                            {part.stockLevel} / {part.reorderPoint} (reorder point)
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min((part.stockLevel / Math.max(part.reorderPoint * 2, 1)) * 100, 100)}
                            color={
                              part.stockLevel === 0 ? 'error' :
                              part.stockLevel <= part.reorderPoint ? 'warning' :
                              'success'
                            }
                            sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Recent Activity</Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <OrderIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="PO-2024-001 received"
                    secondary="2 hours ago"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <WarningIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Low stock alert"
                    secondary="Hydraulic Oil ISO 46"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <InventoryIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Stock updated"
                    secondary="Motor Bearing 6205"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
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