import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Fade,
  Skeleton,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Stack,
  Paper,
  InputAdornment,
  TextField,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Import our new error handling and loading components
import { ComponentErrorBoundary } from '../ErrorBoundary/ErrorBoundary';
import { useToast, useApiError, createRetryAction } from '../Toast/ToastProvider';

// Import services
import { workOrdersService } from '../../services/api';

interface WorkOrder {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeEmail?: string;
  createdAt: string;
  updatedAt: string;
}

const EnhancedWorkOrdersList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  // Hooks for error handling and loading
  const { showSuccess, showError, showWarning } = useToast();
  const { handleError } = useApiError();
  const { executeWithLoading, isLoading: operationLoading } = useAsyncOperation();
  
  const queryClient = useQueryClient();

  // Fetch work orders with enhanced error handling
  const {
    data: workOrders = [],
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['workOrders', { search: searchTerm }],
    queryFn: async () => {
      try {
        const filters = searchTerm ? { search: searchTerm } : undefined;
        const result = await workOrdersService.getAll(filters);
        return result || [];
      } catch (error) {
        // Let React Query handle retries, but log the error
        console.error('Failed to fetch work orders:', error);
        throw error;
      }
    },
    staleTime: 30000, // Data is fresh for 30 seconds
    retry: (failureCount, error: any) => {
      // Custom retry logic
      if (error?.status >= 400 && error?.status < 500) {
        return false; // Don't retry client errors
      }
      return failureCount < 2; // Retry up to 2 times for other errors
    },
    onError: (error: any) => {
      handleError(error, 'Failed to load work orders');
    }
  });

  // Mutation for updating work order status
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return workOrdersService.updateStatus(id, status);
    },
    onSuccess: (data, variables) => {
      showSuccess(`Work order status updated to ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    },
    onError: (error: any) => {
      handleError(error, 'Failed to update work order status');
    }
  });

  // Mutation for deleting work order
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return workOrdersService.delete(id);
    },
    onSuccess: (_, deletedId) => {
      showSuccess('Work order deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    },
    onError: (error: any, deletedId) => {
      handleError(error, 'Failed to delete work order');
    }
  });

  // Handle refresh with user feedback
  const handleRefresh = useCallback(async () => {
    try {
      await executeWithLoading(
        async () => {
          await refetch();
        },
        { message: 'Refreshing work orders...' }
      );
      showSuccess('Work orders refreshed');
    } catch (error) {
      handleError(error, 'Failed to refresh work orders');
    }
  }, [refetch, executeWithLoading, showSuccess, handleError]);

  // Handle status update with optimistic updates
  const handleStatusUpdate = useCallback(async (workOrder: WorkOrder, newStatus: string) => {
    try {
      // Optimistic update
      queryClient.setQueryData(['workOrders'], (oldData: WorkOrder[] = []) => 
        oldData.map(wo => 
          wo.id === workOrder.id 
            ? { ...wo, status: newStatus as WorkOrder['status'] }
            : wo
        )
      );

      await statusMutation.mutateAsync({ id: workOrder.id, status: newStatus });
    } catch (error) {
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      handleError(error, 'Failed to update work order status');
    }
  }, [queryClient, statusMutation, handleError]);

  // Handle delete with confirmation
  const handleDelete = useCallback(async (workOrder: WorkOrder) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${workOrder.title}"?`);
    if (!confirmed) return;

    try {
      await executeWithLoading(
        async () => {
          await deleteMutation.mutateAsync(workOrder.id);
        },
        { 
          message: 'Deleting work order...',
          useGlobalLoading: true 
        }
      );
    } catch (error) {
      // Error is already handled by the mutation
    }
  }, [deleteMutation, executeWithLoading]);

  // Handle menu actions
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, workOrder: WorkOrder) => {
    setMenuAnchor(event.currentTarget);
    setSelectedWorkOrder(workOrder);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedWorkOrder(null);
  };

  // Get status color
  const getStatusColor = (status: WorkOrder['status']) => {
    switch (status) {
      case 'OPEN':
        return 'info';
      case 'IN_PROGRESS':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'ON_HOLD':
        return 'error';
      default:
        return 'default';
    }
  };

  // Handle search with debouncing
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  }, []);

  // Show error state with retry option
  if (error && !workOrders.length) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Failed to load work orders
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={operationLoading}
        >
          Try Again
        </Button>
      </Paper>
    );
  }

  return (
    <ComponentErrorBoundary>
      <Box sx={{ p: 3 }}>
        {/* Header with actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Work Orders
          </Typography>
          <Stack direction="row" spacing={2}>
            <Tooltip title="Refresh work orders">
              <IconButton 
                onClick={handleRefresh} 
                disabled={isFetching || operationLoading}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => showWarning('Create work order feature not implemented yet')}
            >
              Create Work Order
            </Button>
          </Stack>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search work orders..."
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        {/* Loading state */}
        {isLoading && (
          <Stack spacing={2}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="80%" height={20} />
                  <Skeleton variant="text" width="40%" height={20} />
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {/* Work Orders List */}
        {!isLoading && (
          <Fade in={!isLoading}>
            <Stack spacing={2}>
              {workOrders.length === 0 ? (
                <Alert severity="info" sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    No work orders found
                  </Typography>
                  <Typography variant="body2">
                    {searchTerm 
                      ? `No work orders match your search for "${searchTerm}"`
                      : 'Create your first work order to get started'
                    }
                  </Typography>
                </Alert>
              ) : (
                workOrders.map((workOrder) => (
                  <Card key={workOrder.id} elevation={1}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            {workOrder.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {workOrder.description}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                            <Chip
                              label={workOrder.status}
                              color={getStatusColor(workOrder.status) as any}
                              size="small"
                            />
                            <Chip
                              label={workOrder.priority}
                              variant="outlined"
                              size="small"
                            />
                          </Stack>
                          {workOrder.assigneeEmail && (
                            <Typography variant="caption" color="text.secondary">
                              Assigned to: {workOrder.assigneeEmail}
                            </Typography>
                          )}
                        </Box>
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, workOrder)}
                          disabled={statusMutation.isLoading || deleteMutation.isLoading}
                        >
                          <MoreIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))
              )}
            </Stack>
          </Fade>
        )}

        {/* Context Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => {
            if (selectedWorkOrder) {
              handleStatusUpdate(selectedWorkOrder, 'IN_PROGRESS');
            }
            handleMenuClose();
          }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Start Work</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            if (selectedWorkOrder) {
              handleStatusUpdate(selectedWorkOrder, 'COMPLETED');
            }
            handleMenuClose();
          }}>
            <ListItemIcon>
              <SuccessIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Mark Complete</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            if (selectedWorkOrder) {
              handleDelete(selectedWorkOrder);
            }
            handleMenuClose();
          }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        {/* Inline loading for operations */}
        <InlineLoading
          loading={operationLoading}
          message="Processing request..."
        />
      </Box>
    </ComponentErrorBoundary>
  );
};

export default EnhancedWorkOrdersList;