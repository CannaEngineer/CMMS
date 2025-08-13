import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Typography,
  Chip,
  Container,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CompleteIcon,
  PlayArrow as StartIcon,
  Pause as HoldIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UniversalViewContainer } from '../components/Common/UniversalViewContainer';
import { ViewProvider } from '../contexts/ViewContext';
import WorkOrderForm from '../components/Forms/WorkOrderForm';
import { workOrdersService } from '../services/api';
import { statusColors } from '../theme/theme';
import { ViewMapping } from '../components/Common/UniversalViewContainer';

interface WorkOrder {
  id: number;
  legacyId?: number;
  title: string;
  description?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assetId?: number;
  assignedToId?: number;
  organizationId: number;
  createdAt: string;
  updatedAt: string;
  asset?: {
    id: number;
    name: string;
  };
  assignedTo?: {
    id: number;
    name: string;
    email?: string;
  };
}

// Helper functions for status and priority
const getStatusColor = (status: string) => {
  switch (status) {
    case 'OPEN': return 'warning';
    case 'IN_PROGRESS': return 'info';
    case 'ON_HOLD': return 'default';
    case 'COMPLETED': return 'success';
    case 'CANCELED': return 'error';
    default: return 'default';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'LOW': return 'default';
    case 'MEDIUM': return 'primary';
    case 'HIGH': return 'warning';
    case 'URGENT': return 'error';
    default: return 'default';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'OPEN': return <StartIcon fontSize="small" />;
    case 'IN_PROGRESS': return <StartIcon fontSize="small" />;
    case 'ON_HOLD': return <HoldIcon fontSize="small" />;
    case 'COMPLETED': return <CompleteIcon fontSize="small" />;
    case 'CANCELED': return <CancelIcon fontSize="small" />;
    default: return null;
  }
};

export default function WorkOrdersWithViewToggle() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Form and modal states
  const [workOrderFormOpen, setWorkOrderFormOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  
  // Query for work orders data
  const { 
    data: workOrders = [], 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['work-orders'],
    queryFn: workOrdersService.getAll,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Create work order mutation
  const createWorkOrderMutation = useMutation({
    mutationFn: workOrdersService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      setWorkOrderFormOpen(false);
      setSelectedWorkOrder(null);
    },
  });

  // Update work order mutation
  const updateWorkOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      workOrdersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      setWorkOrderFormOpen(false);
      setSelectedWorkOrder(null);
    },
  });

  // Delete work order mutation
  const deleteWorkOrderMutation = useMutation({
    mutationFn: workOrdersService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      setSelectedItems([]);
    },
  });

  // Handler functions
  const handleCreateWorkOrder = () => {
    setSelectedWorkOrder(null);
    setFormMode('create');
    setWorkOrderFormOpen(true);
  };

  const handleViewWorkOrder = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setFormMode('view');
    setWorkOrderFormOpen(true);
  };

  const handleEditWorkOrder = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setFormMode('edit');
    setWorkOrderFormOpen(true);
  };

  const handleDeleteWorkOrder = (workOrder: WorkOrder) => {
    if (window.confirm(`Are you sure you want to delete work order "${workOrder.title}"?`)) {
      deleteWorkOrderMutation.mutate(workOrder.id.toString());
    }
  };

  const handleFormSubmit = (data: any) => {
    if (selectedWorkOrder) {
      updateWorkOrderMutation.mutate({ 
        id: selectedWorkOrder.id.toString(), 
        data 
      });
    } else {
      createWorkOrderMutation.mutate(data);
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} work orders?`)) {
      Promise.all(selectedItems.map(id => 
        deleteWorkOrderMutation.mutateAsync(id.toString())
      ));
    }
  };

  const handleUpdateStatus = (workOrder: WorkOrder, newStatus: string) => {
    updateWorkOrderMutation.mutate({
      id: workOrder.id.toString(),
      data: { ...workOrder, status: newStatus }
    });
  };

  // Define the view mapping for work orders
  const workOrderViewMapping: ViewMapping = {
    // Primary fields (always visible)
    primary: [
      {
        key: 'id',
        label: 'WO#',
        render: (item: WorkOrder) => `WO-${item.id}`,
        sortable: true,
        width: 100,
      },
      {
        key: 'title',
        label: 'Title',
        sortable: true,
      },
      {
        key: 'status',
        label: 'Status',
        render: (item: WorkOrder) => (
          <Chip
            icon={getStatusIcon(item.status)}
            label={item.status.replace('_', ' ')}
            color={getStatusColor(item.status) as any}
            size="small"
            variant="filled"
          />
        ),
        sortable: true,
        width: 130,
      },
      {
        key: 'priority',
        label: 'Priority',
        render: (item: WorkOrder) => (
          <Chip
            label={item.priority}
            color={getPriorityColor(item.priority) as any}
            size="small"
            variant="outlined"
          />
        ),
        sortable: true,
        width: 100,
      },
    ],
    
    // Secondary fields (visible on larger screens)
    secondary: [
      {
        key: 'asset',
        label: 'Asset',
        render: (item: WorkOrder) => item.asset?.name || '-',
        sortable: false,
      },
      {
        key: 'assignedTo',
        label: 'Assigned To',
        render: (item: WorkOrder) => item.assignedTo?.name || 'Unassigned',
        sortable: false,
      },
    ],
    
    // Tertiary fields (visible on desktop only)
    tertiary: [
      {
        key: 'createdAt',
        label: 'Created',
        render: (item: WorkOrder) => new Date(item.createdAt).toLocaleDateString(),
        sortable: true,
        width: 120,
      },
      {
        key: 'updatedAt',
        label: 'Updated',
        render: (item: WorkOrder) => new Date(item.updatedAt).toLocaleDateString(),
        sortable: true,
        width: 120,
      },
    ],
    
    // Card view specific configuration
    cardConfig: {
      title: (item: WorkOrder) => item.title,
      subtitle: (item: WorkOrder) => `WO-${item.id}`,
      description: (item: WorkOrder) => item.description || 'No description',
      badges: (item: WorkOrder) => [
        {
          label: item.status.replace('_', ' '),
          color: getStatusColor(item.status),
          icon: getStatusIcon(item.status),
        },
        {
          label: item.priority,
          color: getPriorityColor(item.priority),
        },
      ],
      metadata: (item: WorkOrder) => [
        { label: 'Asset', value: item.asset?.name || 'None' },
        { label: 'Assigned', value: item.assignedTo?.name || 'Unassigned' },
        { label: 'Created', value: new Date(item.createdAt).toLocaleDateString() },
      ],
    },
    
    // Actions for each item
    actions: [
      {
        label: 'View',
        icon: <ViewIcon />,
        onClick: handleViewWorkOrder,
        color: 'primary',
      },
      {
        label: 'Edit',
        icon: <EditIcon />,
        onClick: handleEditWorkOrder,
        color: 'default',
      },
      {
        label: 'Delete',
        icon: <DeleteIcon />,
        onClick: handleDeleteWorkOrder,
        color: 'error',
        confirmRequired: true,
      },
    ],
    
    // Bulk actions
    bulkActions: [
      {
        label: 'Delete Selected',
        icon: <DeleteIcon />,
        onClick: handleBulkDelete,
        color: 'error',
        confirmRequired: true,
      },
    ],
    
    // Status actions for quick updates
    statusActions: (item: WorkOrder) => {
      const actions = [];
      
      if (item.status === 'OPEN') {
        actions.push({
          label: 'Start',
          icon: <StartIcon />,
          onClick: () => handleUpdateStatus(item, 'IN_PROGRESS'),
          color: 'primary',
        });
      }
      
      if (item.status === 'IN_PROGRESS') {
        actions.push({
          label: 'Hold',
          icon: <HoldIcon />,
          onClick: () => handleUpdateStatus(item, 'ON_HOLD'),
          color: 'warning',
        });
        actions.push({
          label: 'Complete',
          icon: <CompleteIcon />,
          onClick: () => handleUpdateStatus(item, 'COMPLETED'),
          color: 'success',
        });
      }
      
      if (item.status === 'ON_HOLD') {
        actions.push({
          label: 'Resume',
          icon: <StartIcon />,
          onClick: () => handleUpdateStatus(item, 'IN_PROGRESS'),
          color: 'primary',
        });
      }
      
      return actions;
    },
  };

  // Filter work orders by status
  const filterByStatus = useCallback((workOrders: WorkOrder[], status?: string) => {
    if (!status || status === 'ALL') return workOrders;
    return workOrders.filter(wo => wo.status === status);
  }, []);

  // Memoized filtered work orders
  const filteredWorkOrders = useMemo(() => {
    return workOrders;
  }, [workOrders]);

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading work orders: {(error as any).message}
          <Button onClick={() => refetch()} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <ViewProvider>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: { xs: 2, md: 3 } }}>
        <Container maxWidth="xl">
          {/* Header */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="h1" fontWeight={600}>
              Work Orders
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateWorkOrder}
              size={isMobile ? 'small' : 'medium'}
            >
              New Work Order
            </Button>
          </Box>

          {/* Universal View Container */}
          <UniversalViewContainer
            componentKey="workOrders"
            items={filteredWorkOrders}
            viewMapping={workOrderViewMapping}
            availableViews={['table', 'card', 'list']}
            defaultView={isMobile ? 'card' : 'table'}
            selectable={true}
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
            loading={isLoading}
            title=""
            filterOptions={[
              { label: 'All', value: 'ALL' },
              { label: 'Open', value: 'OPEN' },
              { label: 'In Progress', value: 'IN_PROGRESS' },
              { label: 'On Hold', value: 'ON_HOLD' },
              { label: 'Completed', value: 'COMPLETED' },
              { label: 'Canceled', value: 'CANCELED' },
            ]}
            onFilterChange={(filter) => {
              // Handle filter change
              console.log('Filter changed:', filter);
            }}
            searchable={true}
            exportable={true}
            refreshable={true}
            onRefresh={() => refetch()}
          />
        </Container>

        {/* Work Order Form Dialog */}
        {workOrderFormOpen && (
          <WorkOrderForm
            open={workOrderFormOpen}
            onClose={() => {
              setWorkOrderFormOpen(false);
              setSelectedWorkOrder(null);
            }}
            onSubmit={handleFormSubmit}
            initialData={selectedWorkOrder || undefined}
            mode={formMode}
            loading={createWorkOrderMutation.isPending || updateWorkOrderMutation.isPending}
          />
        )}
      </Box>
    </ViewProvider>
  );
}