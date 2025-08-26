import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  Container, 
  Typography, 
  Box, 
  Chip,
  Alert,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Business as AssetIcon,
  LocationOn as LocationIcon,
  Build as MaintenanceIcon,
  QrCode as QrCodeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  VerifiedUser as StatusIcon,
  Engineering as TechnicalIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ViewProvider, useView } from '../contexts/ViewContext';
import AssetForm from '../components/Forms/AssetForm';
import LocationForm from '../components/Forms/LocationForm';
import UniversalTableView from '../components/Common/UniversalTableView';
import { assetsHierarchy, generateTableColumns } from '../types/table-hierarchy';
import { assetsService } from '../services/api';

interface Asset {
  id: number;
  name: string;
  description?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'DOWN' | 'RETIRED';
  locationId?: number;
  location?: {
    id: number;
    name: string;
  };
  lastMaintenance?: string;
  nextMaintenance?: string;
  createdAt: string;
  updatedAt: string;
}

const AssetsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile } = useView();

  // Form and modal states
  const [assetFormOpen, setAssetFormOpen] = useState(false);
  const [locationFormOpen, setLocationFormOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // Query for assets data
  const { 
    data: assets = [], 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['assets'],
    queryFn: assetsService.getAll,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Query for locations data
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => assetsService.getLocations?.() || Promise.resolve([]),
    staleTime: 10 * 60 * 1000,
  });

  // Asset mutations
  const createAssetMutation = useMutation({
    mutationFn: assetsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setAssetFormOpen(false);
      setSelectedAsset(null);
    },
  });

  const updateAssetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      assetsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setAssetFormOpen(false);
      setSelectedAsset(null);
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: assetsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setSelectedItems([]);
    },
  });

  // Handler functions
  const handleCreateAsset = () => {
    setSelectedAsset(null);
    setFormMode('create');
    setAssetFormOpen(true);
  };

  const handleViewAsset = (asset: Asset) => {
    navigate(`/assets/${asset.id}`);
  };

  const handleEditAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setFormMode('edit');
    setAssetFormOpen(true);
  };

  const handleDeleteAsset = (asset: Asset) => {
    if (window.confirm(`Are you sure you want to delete asset "${asset.name}"?`)) {
      deleteAssetMutation.mutate(asset.id.toString());
    }
  };

  const handleFormSubmit = (data: any) => {
    if (selectedAsset) {
      updateAssetMutation.mutate({ 
        id: selectedAsset.id.toString(), 
        data 
      });
    } else {
      createAssetMutation.mutate(data);
    }
  };

  const handleCreateLocation = () => {
    setLocationFormOpen(true);
  };

  // Helper functions for status and priority
  const getAssetStatusColor = (status: string) => {
    switch (status) {
      case 'OPERATIONAL': return 'success';
      case 'MAINTENANCE': return 'warning';
      case 'DOWN': return 'error';
      case 'RETIRED': return 'default';
      default: return 'default';
    }
  };

  const getAssetStatusIcon = (status: string) => {
    switch (status) {
      case 'OPERATIONAL': return <StatusIcon fontSize="small" />;
      case 'MAINTENANCE': return <MaintenanceIcon fontSize="small" />;
      case 'DOWN': return <StatusIcon fontSize="small" />;
      case 'RETIRED': return <StatusIcon fontSize="small" />;
      default: return null;
    }
  };

  // Enhanced render functions for mobile-optimized display
  const renderAssetName = useCallback((item: Asset) => (
    <Box>
      <Typography 
        variant="body2" 
        fontWeight={600}
        sx={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: isMobile ? '200px' : '300px',
        }}
        title={item.name}
      >
        {item.name}
      </Typography>
      {item.description && (
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: isMobile ? '200px' : '300px',
            display: 'block',
            mt: 0.25,
          }}
          title={item.description}
        >
          {item.description}
        </Typography>
      )}
    </Box>
  ), [isMobile]);

  const renderAssetStatus = useCallback((item: Asset) => (
    <Chip
      icon={getAssetStatusIcon(item.status)}
      label={item.status.replace('_', ' ')}
      color={getAssetStatusColor(item.status) as any}
      size={isMobile ? 'small' : 'medium'}
      variant="filled"
      sx={{ 
        fontWeight: 600,
        minWidth: isMobile ? 'auto' : '120px',
      }}
    />
  ), [isMobile]);

  const renderLocation = useCallback((item: Asset) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <LocationIcon fontSize="small" color="action" />
      <Typography variant="body2">
        {item.location?.name || (
          <span style={{ color: 'rgba(0,0,0,0.4)', fontStyle: 'italic' }}>
            No location
          </span>
        )}
      </Typography>
    </Box>
  ), []);

  const renderTechnicalInfo = useCallback((value: string, label: string) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <TechnicalIcon fontSize="small" color="action" />
      <Typography 
        variant="body2"
        sx={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '150px',
        }}
        title={`${label}: ${value}`}
      >
        {value || (
          <span style={{ color: 'rgba(0,0,0,0.4)', fontStyle: 'italic' }}>
            Not specified
          </span>
        )}
      </Typography>
    </Box>
  ), []);

  // Generate enhanced table columns using our hierarchy system
  const tableColumns = useMemo(() => {
    const hierarchyColumns = generateTableColumns(
      assetsHierarchy,
      isMobile ? 'mobile' : 'desktop'
    );

    // Apply custom render functions
    return hierarchyColumns.map(col => {
      switch (col.key) {
        case 'name':
          return { ...col, render: (value: any, item: Asset) => renderAssetName(item) };
        case 'status':
          return { ...col, render: (value: any, item: Asset) => renderAssetStatus(item) };
        case 'location':
          return { ...col, render: (value: any, item: Asset) => renderLocation(item) };
        case 'serialNumber':
          return { ...col, render: (value: any, item: Asset) => renderTechnicalInfo(item.serialNumber || '', 'Serial Number') };
        case 'manufacturer':
          return { ...col, render: (value: any, item: Asset) => renderTechnicalInfo(item.manufacturer || '', 'Manufacturer') };
        case 'model':
          return { ...col, render: (value: any, item: Asset) => renderTechnicalInfo(item.model || '', 'Model') };
        case 'lastMaintenance':
          return { ...col, render: (value: any, item: Asset) => item.lastMaintenance ? renderTechnicalInfo(
            new Date(item.lastMaintenance).toLocaleDateString(), 'Last Maintenance'
          ) : renderTechnicalInfo('', 'Last Maintenance') };
        default:
          return col;
      }
    });
  }, [isMobile, renderAssetName, renderAssetStatus, renderLocation, renderTechnicalInfo]);

  // Enhanced actions configuration with mobile optimization
  const tableActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: <ViewIcon />,
      onClick: handleViewAsset,
      color: 'primary' as const,
      description: 'View asset details and history',
      touchPriority: 'high' as const,
      hapticFeedback: true,
      shortcut: 'Enter',
    },
    {
      key: 'edit',
      label: 'Edit Asset',
      icon: <EditIcon />,
      onClick: handleEditAsset,
      color: 'secondary' as const,
      description: 'Edit asset information',
      touchPriority: 'high' as const,
      hapticFeedback: true,
    },
    {
      key: 'maintenance',
      label: 'Schedule Maintenance',
      icon: <MaintenanceIcon />,
      onClick: (item: Asset) => navigate(`/assets/${item.id}/maintenance`),
      color: 'warning' as const,
      show: (item: Asset) => item.status !== 'RETIRED',
      description: 'Schedule preventive maintenance',
      touchPriority: 'medium' as const,
      hapticFeedback: true,
    },
    {
      key: 'qr',
      label: 'View QR Code',
      icon: <QrCodeIcon />,
      onClick: (item: Asset) => navigate(`/assets/${item.id}/qr`),
      color: 'info' as const,
      description: 'View or print asset QR code',
      touchPriority: 'medium' as const,
      hapticFeedback: true,
    },
    {
      key: 'delete',
      label: 'Delete Asset',
      icon: <DeleteIcon />,
      onClick: handleDeleteAsset,
      color: 'error' as const,
      description: 'Permanently delete this asset',
      touchPriority: 'low' as const,
      confirmRequired: true,
      hapticFeedback: true,
    },
  ], [handleViewAsset, handleEditAsset, handleDeleteAsset, navigate]);

  // Status indicator function for visual feedback
  const getAssetStatusType = useCallback((item: Asset) => {
    switch (item.status) {
      case 'OPERATIONAL': return 'success';
      case 'MAINTENANCE': return 'warning';
      case 'DOWN': return 'error';
      case 'RETIRED': return 'default';
      default: return 'default';
    }
  }, []);

  // Filter assets by status
  const filteredAssets = useMemo(() => {
    return assets;
  }, [assets]);

  if (error) {
    return (
      <ViewProvider>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            Error loading assets: {(error as any).message}
            <Button onClick={() => refetch()} sx={{ ml: 2 }}>
              Retry
            </Button>
          </Alert>
        </Container>
      </ViewProvider>
    );
  }

  return (
    <ViewProvider>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: { xs: 2, md: 3 } }}>
        <Container maxWidth="xl">
          {/* Header */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h4" component="h1" fontWeight={600}>
              Assets
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<LocationIcon />}
                onClick={handleCreateLocation}
                size={isMobile ? 'small' : 'medium'}
              >
                Add Location
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateAsset}
                size={isMobile ? 'small' : 'medium'}
              >
                New Asset
              </Button>
            </Box>
          </Box>

          {/* Enhanced Mobile-First Assets Table */}
          <UniversalTableView
            items={filteredAssets}
            columns={tableColumns}
            actions={tableActions}
            loading={isLoading}
            selectedItems={new Set(selectedItems.map(String))}
            onSelectionChange={(selectedIds) => setSelectedItems(Array.from(selectedIds).map(Number))}
            selectable={true}
            expandable={true}
            onRowClick={handleViewAsset}
            getRowStatus={getAssetStatusType}
            // Enhanced mobile and accessibility features
            ariaLabel="Assets Table"
            ariaDescription="Table showing all assets with their status, location, and technical details"
            swipeActions={true}
            hapticFeedback={true}
            touchTargetSize={48}
            keyboardNavigation={true}
            mobileActionDrawer={true}
            // Visual enhancements
            dense={false}
            stickyHeader={true}
            maxHeight={isMobile ? 600 : 800}
            pagination={true}
            rowsPerPageOptions={[10, 25, 50, 100]}
            defaultRowsPerPage={isMobile ? 10 : 25}
          />
        </Container>

        {/* Asset Form Dialog */}
        {assetFormOpen && (
          <AssetForm
            open={assetFormOpen}
            onClose={() => {
              setAssetFormOpen(false);
              setSelectedAsset(null);
            }}
            onSubmit={handleFormSubmit}
            initialData={selectedAsset || undefined}
            mode={formMode}
            locations={locations}
            loading={createAssetMutation.isPending || updateAssetMutation.isPending}
          />
        )}

        {/* Location Form Dialog */}
        {locationFormOpen && (
          <LocationForm
            open={locationFormOpen}
            onClose={() => setLocationFormOpen(false)}
            onSubmit={(data: any) => {
              // Handle location creation
              console.log('Creating location:', data);
              setLocationFormOpen(false);
            }}
            mode="create"
          />
        )}
      </Box>
    </ViewProvider>
  );
};

export default AssetsPage;