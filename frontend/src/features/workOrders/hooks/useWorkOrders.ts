import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workOrdersService } from '../../../services/api';
import { useOfflineMode } from '../../../hooks/useOffline';

export const useWorkOrdersList = (filters?: { 
  status?: string; 
  priority?: string; 
  assignedTo?: number;
  page?: number;
  limit?: number;
}) => {
  const queryClient = useQueryClient();
  const { isOnline, operations } = useOfflineMode();

  const query = useQuery({
    queryKey: ['work-orders', 'list', filters],
    queryFn: async () => {
      if (!isOnline) {
        return operations.getCachedWorkOrders(filters);
      }
      return workOrdersService.getAll(filters);
    },
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (!isOnline) {
        await operations.updateWorkOrderOffline(id, data);
        return { ...data, id, offline: true };
      }
      return workOrdersService.update(id, data);
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['work-orders'] });
      
      const previousData = queryClient.getQueryData(['work-orders', 'list', filters]);
      
      // Optimistic update
      queryClient.setQueryData(['work-orders', 'list', filters], (old: any) => {
        if (!old) return old;
        return old.map((wo: any) => wo.id === id ? { ...wo, ...data } : wo);
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['work-orders', 'list', filters], context.previousData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!isOnline) {
        return operations.createWorkOrderOffline(data);
      }
      return workOrdersService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: workOrdersService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    workOrders: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    updateWorkOrder: updateMutation.mutate,
    createWorkOrder: createMutation.mutate,
    deleteWorkOrder: deleteMutation.mutate,
    isUpdating: updateMutation.isPending,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

export const useWorkOrderDetails = (id: string) => {
  const { isOnline } = useOfflineMode();

  return useQuery({
    queryKey: ['work-orders', 'detail', id],
    queryFn: async () => {
      if (!isOnline) {
        // Try to get from cache
        const cached = await workOrdersService.getById(id);
        if (!cached) {
          throw new Error('Work order not available offline');
        }
        return cached;
      }
      return workOrdersService.getById(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Batch operations for mobile efficiency
export const useWorkOrderBatchActions = () => {
  const queryClient = useQueryClient();
  
  const batchUpdateMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; data: any }>) => {
      // For now, process sequentially - in production, use batch API
      const results = [];
      for (const update of updates) {
        const result = await workOrdersService.update(update.id, update.data);
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const batchStatusUpdateMutation = useMutation({
    mutationFn: async (workOrderIds: string[], status: string) => {
      const updates = workOrderIds.map(id => ({ id, data: { status } }));
      return batchUpdateMutation.mutateAsync(updates);
    },
  });

  return {
    batchUpdate: batchUpdateMutation.mutate,
    batchStatusUpdate: batchStatusUpdateMutation.mutate,
    isBatchUpdating: batchUpdateMutation.isPending || batchStatusUpdateMutation.isPending,
  };
};