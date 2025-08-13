import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  Stack,
  IconButton,
  Button,
} from '@mui/material';
import {
  Build as BuildIcon,
  LocationOn as LocationIcon,
  CheckCircle as OnlineIcon,
  Cancel as OfflineIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';
import UniversalViewContainer, { ViewMapping } from '../UniversalViewContainer';
import { CardField, CardAction } from '../UniversalCardView';
import { TableColumn, TableAction } from '../UniversalTableView';

interface Asset {
  id: string;
  name: string;
  description?: string;
  serialNumber?: string;
  manufacturer?: string;
  status: 'ONLINE' | 'OFFLINE';
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'IMPORTANT';
  location?: {
    id: string;
    name: string;
  };
  workOrders?: { id: string; status: string }[];
  pmSchedules?: { id: string; nextDue: string }[];
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const AssetsViewExample: React.FC = () => {
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  // Mock data
  const assets: Asset[] = [
    {
      id: '1',
      name: 'Industrial Pump A1',
      description: 'High-pressure centrifugal pump for cooling system',
      serialNumber: 'IP-2024-001',
      manufacturer: 'FlowTech Industries',
      status: 'ONLINE',
      criticality: 'HIGH',
      location: { id: '1', name: 'Plant Floor - Section A' },
      workOrders: [
        { id: '1', status: 'OPEN' },
        { id: '2', status: 'COMPLETED' }
      ],
      pmSchedules: [{ id: '1', nextDue: '2024-02-15' }],
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-15T14:30:00Z',
    },
    {
      id: '2',
      name: 'HVAC Unit B2',
      description: 'Central air conditioning unit for building B',
      serialNumber: 'HVAC-2024-002',
      manufacturer: 'CoolAir Systems',
      status: 'OFFLINE',
      criticality: 'IMPORTANT',
      location: { id: '2', name: 'Building B - Roof Level' },
      workOrders: [{ id: '3', status: 'IN_PROGRESS' }],
      pmSchedules: [{ id: '2', nextDue: '2024-02-20' }],
      createdAt: '2024-01-05T09:00:00Z',
      updatedAt: '2024-01-20T11:45:00Z',
    },
    // Add more mock assets as needed...
  ];

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return <OnlineIcon sx={{ color: 'success.main', fontSize: 20 }} />;
      case 'OFFLINE':
        return <OfflineIcon sx={{ color: 'error.main', fontSize: 20 }} />;
      default:
        return <WarningIcon sx={{ color: 'warning.main', fontSize: 20 }} />;
    }
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'IMPORTANT': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  // Action handlers
  const handleViewAsset = (asset: Asset) => {
    console.log('Viewing asset:', asset.name);
  };

  const handleEditAsset = (asset: Asset) => {
    console.log('Editing asset:', asset.name);
  };

  const handleDeleteAsset = (asset: Asset) => {
    console.log('Deleting asset:', asset.name);
  };

  const handleShowQR = (asset: Asset) => {
    console.log('Showing QR code for:', asset.name);
  };

  // View mapping configuration
  const viewMapping: ViewMapping<Asset> = {
    card: {
      fields: [
        {
          key: 'name',
          label: 'Asset Name',
          priority: 'primary',
          render: (value) => (
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              {value}
            </Typography>
          ),
        },
        {
          key: 'status',
          label: 'Status',
          priority: 'primary',
          render: (value, asset) => (
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Chip
                icon={getStatusIcon(value)}
                label={value}
                size="small"
                color={value === 'ONLINE' ? 'success' : 'error'}
                sx={{ fontWeight: 500 }}
              />
              <Chip
                label={asset.criticality}
                size="small"
                color={getCriticalityColor(asset.criticality) as any}
                variant="outlined"
              />
            </Stack>
          ),
        },
        {
          key: 'location',
          label: 'Location',
          priority: 'secondary',
          icon: <LocationIcon fontSize="small" />,
          render: (value) => value?.name || 'No location assigned',
        },
        {
          key: 'workOrders',
          label: 'Work Orders',
          priority: 'secondary',
          render: (value) => `${value?.length || 0} active`,
        },
        {
          key: 'serialNumber',
          label: 'Serial Number',
          priority: 'tertiary',
        },
        {
          key: 'manufacturer',
          label: 'Manufacturer',
          priority: 'tertiary',
        },
        {
          key: 'description',
          label: 'Description',
          priority: 'tertiary',
        },
      ],
      actions: [
        {
          key: 'view',
          label: 'View Details',
          icon: <ViewIcon />,
          onClick: handleViewAsset,
          variant: 'outlined',
        },
        {
          key: 'edit',
          label: 'Edit',
          icon: <EditIcon />,
          onClick: handleEditAsset,
          variant: 'outlined',
        },
        {
          key: 'qr',
          label: 'QR Code',
          icon: <QrCodeIcon />,
          onClick: handleShowQR,
          variant: 'outlined',
          color: 'info',
        },
      ],
    },
    table: {
      columns: [
        {
          key: 'name',
          label: 'Asset Name',
          sortable: true,
          priority: 'high',
          render: (value, asset) => (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {asset.serialNumber}
              </Typography>
            </Box>
          ),
        },
        {
          key: 'status',
          label: 'Status',
          sortable: true,
          priority: 'high',
          align: 'center',
          render: (value) => (
            <Chip
              icon={getStatusIcon(value)}
              label={value}
              size="small"
              color={value === 'ONLINE' ? 'success' : 'error'}
            />
          ),
        },
        {
          key: 'criticality',
          label: 'Criticality',
          sortable: true,
          priority: 'medium',
          align: 'center',
          render: (value) => (
            <Chip
              label={value}
              size="small"
              color={getCriticalityColor(value) as any}
              variant="outlined"
            />
          ),
        },
        {
          key: 'location',
          label: 'Location',
          priority: 'medium',
          hideOnMobile: true,
          render: (value) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {value?.name || 'No location'}
              </Typography>
            </Box>
          ),
        },
        {
          key: 'manufacturer',
          label: 'Manufacturer',
          priority: 'low',
          hideOnMobile: true,
        },
        {
          key: 'workOrders',
          label: 'Work Orders',
          priority: 'medium',
          align: 'center',
          render: (value) => (
            <Chip
              label={value?.length || 0}
              size="small"
              variant="outlined"
            />
          ),
        },
        {
          key: 'updatedAt',
          label: 'Last Updated',
          sortable: true,
          priority: 'low',
          hideOnMobile: true,
          render: (value) => new Date(value).toLocaleDateString(),
        },
      ],
      actions: [
        {
          key: 'view',
          label: 'View Details',
          icon: <ViewIcon />,
          onClick: handleViewAsset,
          color: 'primary',
        },
        {
          key: 'edit',
          label: 'Edit Asset',
          icon: <EditIcon />,
          onClick: handleEditAsset,
          color: 'info',
        },
        {
          key: 'qr',
          label: 'Show QR Code',
          icon: <QrCodeIcon />,
          onClick: handleShowQR,
          color: 'secondary',
        },
        {
          key: 'delete',
          label: 'Delete Asset',
          icon: <DeleteIcon />,
          onClick: handleDeleteAsset,
          color: 'error',
        },
      ],
      pagination: true,
      dense: false,
    },
    list: {
      fields: [
        {
          key: 'name',
          label: 'Asset Name',
          priority: 'primary',
          render: (value, asset) => (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {value}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                <Chip
                  icon={getStatusIcon(asset.status)}
                  label={asset.status}
                  size="small"
                  color={asset.status === 'ONLINE' ? 'success' : 'error'}
                />
                <Chip
                  label={asset.criticality}
                  size="small"
                  color={getCriticalityColor(asset.criticality) as any}
                  variant="outlined"
                />
              </Stack>
            </Box>
          ),
        },
        {
          key: 'location',
          label: 'Location',
          priority: 'secondary',
          icon: <LocationIcon fontSize="small" />,
          render: (value) => value?.name || 'No location',
        },
        {
          key: 'manufacturer',
          label: 'Manufacturer',
          priority: 'secondary',
          render: (value) => value || 'Unknown',
        },
      ],
      actions: [
        {
          key: 'view',
          label: 'View',
          icon: <ViewIcon />,
          onClick: handleViewAsset,
          variant: 'text',
        },
        {
          key: 'edit',
          label: 'Edit',
          icon: <EditIcon />,
          onClick: handleEditAsset,
          variant: 'text',
        },
      ],
    },
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Assets Management
      </Typography>
      
      <UniversalViewContainer
        componentKey="assets"
        items={assets}
        viewMapping={viewMapping}
        availableViews={['card', 'table', 'list']}
        selectedItems={selectedAssets}
        onSelectionChange={setSelectedAssets}
        selectable={true}
        onItemClick={(asset) => console.log('Clicked asset:', asset.name)}
        title="Asset Inventory"
        subtitle={`${assets.length} assets in your facility`}
        headerContent={
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<QrCodeIcon />}>
              Scan QR
            </Button>
            <Button variant="contained" startIcon={<BuildIcon />}>
              Add Asset
            </Button>
          </Stack>
        }
      />
    </Box>
  );
};

export default AssetsViewExample;