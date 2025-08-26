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
  Badge,
  Tooltip,
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
  Person as PersonIcon,
  Business as AssetIcon,
  Schedule as DateIcon,
  PriorityHigh as PriorityIcon,
  Assignment as WorkOrderIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ViewProvider, useView } from '../contexts/ViewContext';
import WorkOrderForm from '../components/Forms/WorkOrderForm';
import UniversalTableView from '../components/Common/UniversalTableView';
import { workOrdersService } from '../services/api';
import { statusColors } from '../theme/theme';
import { workOrdersHierarchy, generateTableColumns } from '../types/table-hierarchy';

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
  const { isMobile } = useView();
  
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

  // Enhanced render functions for mobile-optimized display
  const renderWorkOrderId = useCallback((item: WorkOrder) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <WorkOrderIcon fontSize="small" color="primary" />
      <Typography 
        variant="body2" 
        fontWeight={600} 
        sx={{ 
          fontFamily: 'monospace',
          color: 'primary.main',
        }}
      >
        WO-{item.id}
      </Typography>
    </Box>
  ), []);

  const renderWorkOrderTitle = useCallback((item: WorkOrder) => (
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
        title={item.title}
      >
        {item.title}
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

  const renderStatus = useCallback((item: WorkOrder) => (
    <Chip
      icon={getStatusIcon(item.status)}
      label={item.status.replace('_', ' ')}
      color={getStatusColor(item.status) as any}
      size={isMobile ? 'small' : 'medium'}
      variant="filled"
      sx={{ 
        fontWeight: 600,
        minWidth: isMobile ? 'auto' : '120px',
      }}
    />
  ), [isMobile]);

  const renderPriority = useCallback((item: WorkOrder) => (
    <Chip
      icon={<PriorityIcon fontSize="small" />}
      label={item.priority}
      color={getPriorityColor(item.priority) as any}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 600 }}
    />
  ), []);

  const renderAssignedTo = useCallback((item: WorkOrder) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <PersonIcon fontSize="small" color="action" />
      <Typography variant="body2">
        {item.assignedTo?.name || (
          <span style={{ color: 'rgba(0,0,0,0.4)', fontStyle: 'italic' }}>
            Unassigned
          </span>
        )}
      </Typography>
    </Box>
  ), []);

  const renderAsset = useCallback((item: WorkOrder) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <AssetIcon fontSize="small" color="action" />
      <Typography 
        variant="body2"
        sx={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '150px',
        }}
        title={item.asset?.name || 'No asset assigned'}
      >
        {item.asset?.name || (
          <span style={{ color: 'rgba(0,0,0,0.4)', fontStyle: 'italic' }}>
            No asset
          </span>
        )}
      </Typography>
    </Box>
  ), []);

  const renderDate = useCallback((dateString: string) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <DateIcon fontSize="small" color="action" />
      <Typography variant="body2" color="text.secondary">
        {new Date(dateString).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: isMobile ? '2-digit' : 'numeric',
        })}
      </Typography>
    </Box>
  ), [isMobile]);

  // Generate enhanced table columns using our hierarchy system
  const tableColumns = useMemo(() => {
    const hierarchyColumns = generateTableColumns(
      workOrdersHierarchy,
      isMobile ? 'mobile' : 'desktop'
    );

    // Apply custom render functions
    return hierarchyColumns.map(col => {
      switch (col.key) {
        case 'id':
          return { ...col, render: (value: any, item: WorkOrder) => renderWorkOrderId(item) };
        case 'title':
          return { ...col, render: (value: any, item: WorkOrder) => renderWorkOrderTitle(item) };
        case 'status':
          return { ...col, render: (value: any, item: WorkOrder) => renderStatus(item) };
        case 'priority':
          return { ...col, render: (value: any, item: WorkOrder) => renderPriority(item) };
        case 'assignedTo':
          return { ...col, render: (value: any, item: WorkOrder) => renderAssignedTo(item) };
        case 'asset':
          return { ...col, render: (value: any, item: WorkOrder) => renderAsset(item) };
        case 'createdAt':
          return { ...col, render: (value: any, item: WorkOrder) => renderDate(item.createdAt) };
        case 'updatedAt':
          return { ...col, render: (value: any, item: WorkOrder) => renderDate(item.updatedAt) };
        default:
          return col;
      }
    });
  }, [isMobile, renderWorkOrderId, renderWorkOrderTitle, renderStatus, renderPriority, renderAssignedTo, renderAsset, renderDate]);

  // Enhanced actions configuration with mobile optimization
  const tableActions = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: <ViewIcon />,
      onClick: handleViewWorkOrder,
      color: 'primary' as const,
      description: 'View work order details',
      touchPriority: 'high' as const,
      hapticFeedback: true,
      shortcut: 'Enter',
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditIcon />,
      onClick: handleEditWorkOrder,
      color: 'secondary' as const,
      description: 'Edit work order information',
      touchPriority: 'high' as const,
      hapticFeedback: true,
    },
    {
      key: 'start',
      label: 'Start Work',
      icon: <StartIcon />,
      onClick: (item: WorkOrder) => handleUpdateStatus(item, 'IN_PROGRESS'),
      color: 'primary' as const,
      show: (item: WorkOrder) => item.status === 'OPEN',
      description: 'Begin working on this order',
      touchPriority: 'medium' as const,
      hapticFeedback: true,
    },
    {
      key: 'complete',
      label: 'Complete',
      icon: <CompleteIcon />,
      onClick: (item: WorkOrder) => handleUpdateStatus(item, 'COMPLETED'),
      color: 'success' as const,
      show: (item: WorkOrder) => item.status === 'IN_PROGRESS',
      description: 'Mark work order as completed',
      touchPriority: 'medium' as const,
      hapticFeedback: true,
    },
    {
      key: 'hold',
      label: 'Put on Hold',
      icon: <HoldIcon />,
      onClick: (item: WorkOrder) => handleUpdateStatus(item, 'ON_HOLD'),
      color: 'warning' as const,
      show: (item: WorkOrder) => item.status === 'IN_PROGRESS',
      description: 'Pause work on this order',
      touchPriority: 'low' as const,
      hapticFeedback: true,
    },
    {
      key: 'resume',
      label: 'Resume',
      icon: <StartIcon />,
      onClick: (item: WorkOrder) => handleUpdateStatus(item, 'IN_PROGRESS'),
      color: 'primary' as const,
      show: (item: WorkOrder) => item.status === 'ON_HOLD',
      description: 'Resume work on this order',
      touchPriority: 'medium' as const,
      hapticFeedback: true,
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteIcon />,
      onClick: handleDeleteWorkOrder,
      color: 'error' as const,
      description: 'Permanently delete this work order',
      touchPriority: 'low' as const,
      confirmRequired: true,
      hapticFeedback: true,
    },
  ], [handleViewWorkOrder, handleEditWorkOrder, handleDeleteWorkOrder, handleUpdateStatus]);

  // Status indicator function for visual feedback
  const getWorkOrderStatus = useCallback((item: WorkOrder) => {
    switch (item.status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'info';
      case 'OPEN': return 'warning';
      case 'ON_HOLD': return 'default';
      case 'CANCELED': return 'error';
      default: return 'default';
    }
  }, []);

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

          {/* Enhanced Mobile-First Work Orders Table */}
          <UniversalTableView
            items={filteredWorkOrders}
            columns={tableColumns}
            actions={tableActions}
            loading={isLoading}
            selectedItems={new Set(selectedItems.map(String))}
            onSelectionChange={(selectedIds) => setSelectedItems(Array.from(selectedIds).map(Number))}
            selectable={true}
            expandable={true}
            onRowClick={handleViewWorkOrder}
            getRowStatus={getWorkOrderStatus}
            // Enhanced mobile and accessibility features
            ariaLabel="Work Orders Table"
            ariaDescription="Table showing all work orders with their status, priority, and assignment details"
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