import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Stack,
  Button,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Inventory as InventoryIcon,
  ShoppingCart as OrderIcon,
  Warning as WarningIcon,
  CheckCircle as InStockIcon,
  Error as OutOfStockIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import UniversalViewContainer, { ViewMapping } from '../UniversalViewContainer';

interface Part {
  id: string;
  name: string;
  sku: string;
  description?: string;
  stockLevel: number;
  reorderPoint: number;
  unitPrice: number;
  category: string;
  supplier?: {
    id: string;
    name: string;
  };
  location?: string;
  createdAt: string;
  updatedAt: string;
}

const PartsViewExample: React.FC = () => {
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());

  // Mock data
  const parts: Part[] = [
    {
      id: '1',
      name: 'Centrifugal Pump Seal',
      sku: 'PUMP-SEAL-001',
      description: 'Mechanical seal for high-pressure centrifugal pumps',
      stockLevel: 15,
      reorderPoint: 5,
      unitPrice: 89.50,
      category: 'Seals & Gaskets',
      supplier: { id: '1', name: 'Industrial Parts Supply' },
      location: 'A-2-15',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-15T14:30:00Z',
    },
    {
      id: '2',
      name: 'HVAC Filter - HEPA',
      sku: 'HVAC-FILTER-H13',
      description: 'High-efficiency particulate air filter, 24x24x12 inches',
      stockLevel: 3,
      reorderPoint: 8,
      unitPrice: 145.00,
      category: 'Filters',
      supplier: { id: '2', name: 'AirFlow Systems' },
      location: 'B-1-08',
      createdAt: '2024-01-05T09:00:00Z',
      updatedAt: '2024-01-20T11:45:00Z',
    },
    {
      id: '3',
      name: 'Conveyor Belt',
      sku: 'CONV-BELT-48',
      description: '48-inch wide industrial conveyor belt, heavy duty',
      stockLevel: 0,
      reorderPoint: 2,
      unitPrice: 1250.00,
      category: 'Belts & Chains',
      supplier: { id: '3', name: 'Motion Systems Inc' },
      location: 'C-3-22',
      createdAt: '2024-01-10T08:30:00Z',
      updatedAt: '2024-01-22T16:20:00Z',
    },
    // Add more mock parts as needed...
  ];

  // Helper functions
  const getStockStatus = (stockLevel: number, reorderPoint: number) => {
    if (stockLevel === 0) return { status: 'OUT_OF_STOCK', color: 'error', icon: <OutOfStockIcon /> };
    if (stockLevel <= reorderPoint) return { status: 'LOW_STOCK', color: 'warning', icon: <WarningIcon /> };
    return { status: 'IN_STOCK', color: 'success', icon: <InStockIcon /> };
  };

  const getStockProgress = (stockLevel: number, reorderPoint: number) => {
    const maxStock = Math.max(reorderPoint * 3, stockLevel + 10); // Estimate max stock
    return Math.min((stockLevel / maxStock) * 100, 100);
  };

  // Action handlers
  const handleViewPart = (part: Part) => {
    console.log('Viewing part:', part.name);
  };

  const handleEditPart = (part: Part) => {
    console.log('Editing part:', part.name);
  };

  const handleDeletePart = (part: Part) => {
    console.log('Deleting part:', part.name);
  };

  const handleOrderPart = (part: Part) => {
    console.log('Ordering part:', part.name);
  };

  // View mapping configuration
  const viewMapping: ViewMapping<Part> = {
    card: {
      fields: [
        {
          key: 'name',
          label: 'Part Name',
          priority: 'primary',
          render: (value, part) => (
            <Box sx={{ mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {value}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                SKU: {part.sku}
              </Typography>
            </Box>
          ),
        },
        {
          key: 'stockLevel',
          label: 'Stock Status',
          priority: 'primary',
          render: (value, part) => {
            const stockInfo = getStockStatus(value, part.reorderPoint);
            const progress = getStockProgress(value, part.reorderPoint);
            
            return (
              <Box sx={{ mb: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Chip
                    icon={stockInfo.icon}
                    label={`${value} units`}
                    color={stockInfo.color as any}
                    size="small"
                    sx={{ fontWeight: 500 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Reorder at {part.reorderPoint}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  color={stockInfo.color as any}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            );
          },
        },
        {
          key: 'unitPrice',
          label: 'Unit Price',
          priority: 'secondary',
          render: (value) => (
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              ${value.toFixed(2)}
            </Typography>
          ),
        },
        {
          key: 'category',
          label: 'Category',
          priority: 'secondary',
          render: (value) => (
            <Chip label={value} variant="outlined" size="small" />
          ),
        },
        {
          key: 'supplier',
          label: 'Supplier',
          priority: 'secondary',
          render: (value) => value?.name || 'No supplier',
        },
        {
          key: 'description',
          label: 'Description',
          priority: 'tertiary',
        },
        {
          key: 'location',
          label: 'Bin Location',
          priority: 'tertiary',
        },
      ],
      actions: [
        {
          key: 'order',
          label: 'Order Now',
          icon: <OrderIcon />,
          onClick: handleOrderPart,
          color: 'primary',
          show: (part) => part.stockLevel <= part.reorderPoint,
        },
        {
          key: 'view',
          label: 'View Details',
          icon: <ViewIcon />,
          onClick: handleViewPart,
          variant: 'outlined',
        },
        {
          key: 'edit',
          label: 'Edit',
          icon: <EditIcon />,
          onClick: handleEditPart,
          variant: 'outlined',
        },
      ],
    },
    table: {
      columns: [
        {
          key: 'sku',
          label: 'SKU',
          sortable: true,
          priority: 'high',
          width: 140,
          render: (value) => (
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
              {value}
            </Typography>
          ),
        },
        {
          key: 'name',
          label: 'Part Name',
          sortable: true,
          priority: 'high',
          render: (value, part) => (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {value}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {part.description?.substring(0, 40)}
                {part.description && part.description.length > 40 ? '...' : ''}
              </Typography>
            </Box>
          ),
        },
        {
          key: 'stockLevel',
          label: 'Stock Level',
          sortable: true,
          priority: 'high',
          align: 'center',
          render: (value, part) => {
            const stockInfo = getStockStatus(value, part.reorderPoint);
            return (
              <Box sx={{ minWidth: 80 }}>
                <Chip
                  label={`${value}`}
                  color={stockInfo.color as any}
                  size="small"
                  icon={stockInfo.icon}
                />
                <Typography variant="caption" display="block" color="text.secondary">
                  Min: {part.reorderPoint}
                </Typography>
              </Box>
            );
          },
        },
        {
          key: 'unitPrice',
          label: 'Unit Price',
          sortable: true,
          priority: 'medium',
          align: 'right',
          render: (value) => (
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              ${value.toFixed(2)}
            </Typography>
          ),
        },
        {
          key: 'category',
          label: 'Category',
          priority: 'medium',
          hideOnMobile: true,
          render: (value) => (
            <Chip label={value} variant="outlined" size="small" />
          ),
        },
        {
          key: 'supplier',
          label: 'Supplier',
          priority: 'low',
          hideOnMobile: true,
          render: (value) => value?.name || 'No supplier',
        },
        {
          key: 'location',
          label: 'Location',
          priority: 'medium',
          hideOnMobile: true,
          render: (value) => (
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {value || 'Not set'}
            </Typography>
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
          key: 'order',
          label: 'Create Order',
          icon: <OrderIcon />,
          onClick: handleOrderPart,
          color: 'primary',
          show: (part) => part.stockLevel <= part.reorderPoint,
        },
        {
          key: 'view',
          label: 'View Details',
          icon: <ViewIcon />,
          onClick: handleViewPart,
          color: 'info',
        },
        {
          key: 'edit',
          label: 'Edit Part',
          icon: <EditIcon />,
          onClick: handleEditPart,
          color: 'secondary',
        },
        {
          key: 'delete',
          label: 'Delete Part',
          icon: <DeleteIcon />,
          onClick: handleDeletePart,
          color: 'error',
        },
      ],
      pagination: true,
      dense: true,
    },
    list: {
      fields: [
        {
          key: 'name',
          label: 'Part Name',
          priority: 'primary',
          render: (value, part) => {
            const stockInfo = getStockStatus(part.stockLevel, part.reorderPoint);
            
            return (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {value}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  SKU: {part.sku}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip
                    icon={stockInfo.icon}
                    label={`${part.stockLevel} units`}
                    color={stockInfo.color as any}
                    size="small"
                  />
                  <Chip
                    label={`$${part.unitPrice.toFixed(2)}`}
                    variant="outlined"
                    size="small"
                  />
                </Stack>
              </Box>
            );
          },
        },
        {
          key: 'category',
          label: 'Category',
          priority: 'secondary',
          render: (value) => value,
        },
        {
          key: 'location',
          label: 'Location',
          priority: 'secondary',
          render: (value) => value || 'Not set',
        },
      ],
      actions: [
        {
          key: 'order',
          label: 'Order',
          icon: <OrderIcon />,
          onClick: handleOrderPart,
          variant: 'text',
          color: 'primary',
          show: (part) => part.stockLevel <= part.reorderPoint,
        },
        {
          key: 'view',
          label: 'View',
          icon: <ViewIcon />,
          onClick: handleViewPart,
          variant: 'text',
        },
      ],
    },
  };

  // Calculate summary stats
  const totalParts = parts.length;
  const lowStockParts = parts.filter(part => part.stockLevel <= part.reorderPoint && part.stockLevel > 0);
  const outOfStockParts = parts.filter(part => part.stockLevel === 0);
  const totalValue = parts.reduce((sum, part) => sum + (part.stockLevel * part.unitPrice), 0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Parts Inventory
      </Typography>
      
      {/* Quick stats */}
      <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
        <Chip 
          label={`${totalParts} Total Parts`} 
          color="primary" 
          icon={<InventoryIcon />}
          sx={{ fontWeight: 500 }}
        />
        <Chip 
          label={`${lowStockParts.length} Low Stock`} 
          color="warning" 
          icon={<WarningIcon />}
          sx={{ fontWeight: 500 }}
        />
        <Chip 
          label={`${outOfStockParts.length} Out of Stock`} 
          color="error" 
          icon={<OutOfStockIcon />}
          sx={{ fontWeight: 500 }}
        />
        <Chip 
          label={`$${totalValue.toLocaleString()} Total Value`} 
          variant="outlined"
          sx={{ fontWeight: 500 }}
        />
      </Stack>
      
      <UniversalViewContainer
        componentKey="parts"
        items={parts}
        viewMapping={viewMapping}
        availableViews={['table', 'card', 'list']}
        selectedItems={selectedParts}
        onSelectionChange={setSelectedParts}
        selectable={true}
        onItemClick={(part) => console.log('Clicked part:', part.name)}
        title="Inventory Management"
        subtitle={`${parts.length} parts in stock • ${lowStockParts.length + outOfStockParts.length} need attention`}
        headerContent={
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<OrderIcon />}>
              Create Order
            </Button>
            <Button variant="contained" startIcon={<AddIcon />}>
              Add Part
            </Button>
          </Stack>
        }
      />
    </Box>
  );
};

export default PartsViewExample;