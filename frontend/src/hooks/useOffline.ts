import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { offlineStorage } from '../services/offlineStorage';
// import { syncService } from '../services/api'; // TODO: Implement sync service

interface OfflineState {
  isOnline: boolean;
  isBackgroundSyncing: boolean;
  pendingOperations: number;
  lastSyncTime: Date | null;
  syncProgress: number;
  offlineCapabilities: {
    canCreateWorkOrders: boolean;
    canUpdateWorkOrders: boolean;
    canViewAssets: boolean;
    canCacheMedia: boolean;
  };
}

export const useOfflineMode = () => {
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isBackgroundSyncing: false,
    pendingOperations: 0,
    lastSyncTime: null,
    syncProgress: 0,
    offlineCapabilities: {
      canCreateWorkOrders: true,
      canUpdateWorkOrders: true,
      canViewAssets: true,
      canCacheMedia: true,
    },
  });

  const queryClient = useQueryClient();

  // Update online status
  const updateOnlineStatus = useCallback(() => {
    setOfflineState(prev => ({ ...prev, isOnline: navigator.onLine }));
  }, []);

  // Sync pending operations
  const syncPendingOperations = useCallback(async () => {
    if (!navigator.onLine) return;

    setOfflineState(prev => ({ ...prev, isBackgroundSyncing: true, syncProgress: 0 }));

    try {
      const pendingOps = await offlineStorage.getPendingOperations();
      
      if (pendingOps.length === 0) {
        setOfflineState(prev => ({ 
          ...prev, 
          isBackgroundSyncing: false,
          lastSyncTime: new Date(),
          pendingOperations: 0 
        }));
        return;
      }

      let completed = 0;
      const total = pendingOps.length;

      for (const operation of pendingOps) {
        try {
          // Attempt to sync the operation
          // TODO: Implement syncService.syncPendingChanges()
          // await syncService.syncPendingChanges();
          await offlineStorage.removePendingOperation(operation.id);
          completed++;
          
          setOfflineState(prev => ({ 
            ...prev, 
            syncProgress: (completed / total) * 100 
          }));
        } catch (error) {
          console.error('Failed to sync operation:', operation.id, error);
          // Keep operation in queue for next sync attempt
        }
      }

      // Update final state
      const remainingOps = await offlineStorage.getPendingOperations();
      setOfflineState(prev => ({
        ...prev,
        isBackgroundSyncing: false,
        pendingOperations: remainingOps.length,
        lastSyncTime: new Date(),
        syncProgress: 100,
      }));

      // Invalidate queries if sync was successful
      if (completed > 0) {
        queryClient.invalidateQueries({ queryKey: ['work-orders'] });
        queryClient.invalidateQueries({ queryKey: ['assets'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setOfflineState(prev => ({ ...prev, isBackgroundSyncing: false }));
    }
  }, [queryClient]);

  // Cache critical data when going offline
  const cacheEssentialData = useCallback(async () => {
    try {
      // Cache current work orders
      const workOrdersData = queryClient.getQueryData(['work-orders']);
      if (workOrdersData) {
        await offlineStorage.saveWorkOrders(workOrdersData as any[]);
      }

      // Cache current assets
      const assetsData = queryClient.getQueryData(['assets']);
      if (assetsData) {
        await offlineStorage.saveAssets(assetsData as any[]);
      }

      // Cache dashboard data
      const dashboardData = queryClient.getQueryData(['dashboard', 'stats']);
      if (dashboardData) {
        await offlineStorage.cacheQuery('dashboard-stats', dashboardData);
      }
    } catch (error) {
      console.error('Failed to cache essential data:', error);
    }
  }, [queryClient]);

  // Initialize and set up event listeners
  useEffect(() => {
    const updatePendingCount = async () => {
      try {
        const pending = await offlineStorage.getPendingOperations();
        setOfflineState(prev => ({ 
          ...prev, 
          pendingOperations: pending.length 
        }));
      } catch (error) {
        console.error('Failed to get pending operations count:', error);
      }
    };

    // Set up network event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Handle network changes
    const handleOnline = () => {
      updateOnlineStatus();
      syncPendingOperations();
    };

    const handleOffline = () => {
      updateOnlineStatus();
      cacheEssentialData();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial setup
    updatePendingCount();
    
    // Periodic sync when online
    const syncInterval = setInterval(() => {
      if (navigator.onLine && !offlineState.isBackgroundSyncing) {
        syncPendingOperations();
        updatePendingCount();
      }
    }, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, [updateOnlineStatus, syncPendingOperations, cacheEssentialData, offlineState.isBackgroundSyncing]);

  // Offline operations
  const offlineOperations = {
    // Create work order offline
    createWorkOrderOffline: async (workOrderData: any) => {
      const tempId = `temp_${Date.now()}`;
      const workOrder = {
        ...workOrderData,
        id: tempId,
        createdAt: new Date().toISOString(),
        status: 'OPEN',
        offline: true,
      };

      // Store locally
      await offlineStorage.saveWorkOrders([workOrder]);
      
      // Add to pending operations
      await offlineStorage.addPendingOperation({
        type: 'CREATE_WORK_ORDER',
        method: 'POST',
        url: '/work-orders',
        data: workOrderData,
        entityId: tempId,
      });

      // Update pending count
      const pending = await offlineStorage.getPendingOperations();
      setOfflineState(prev => ({ 
        ...prev, 
        pendingOperations: pending.length 
      }));

      return workOrder;
    },

    // Update work order offline
    updateWorkOrderOffline: async (id: string, data: any) => {
      await offlineStorage.updateWorkOrder(id, data);
      
      // Add to pending operations
      await offlineStorage.addPendingOperation({
        type: 'UPDATE_WORK_ORDER',
        method: 'PUT',
        url: `/work-orders/${id}`,
        data,
        entityId: id,
      });

      // Update pending count
      const pending = await offlineStorage.getPendingOperations();
      setOfflineState(prev => ({ 
        ...prev, 
        pendingOperations: pending.length 
      }));
    },

    // Get cached work orders
    getCachedWorkOrders: async (filters?: any) => {
      return offlineStorage.getWorkOrders(filters);
    },

    // Get cached assets
    getCachedAssets: async (filters?: any) => {
      return offlineStorage.getAssets(filters);
    },

    // Force sync
    forceSync: syncPendingOperations,

    // Clear offline data
    clearOfflineData: async () => {
      await offlineStorage.clearAllData();
      setOfflineState(prev => ({ 
        ...prev, 
        pendingOperations: 0 
      }));
    },

    // Get storage statistics
    getStorageStats: offlineStorage.getStorageStats,
  };

  return {
    ...offlineState,
    operations: offlineOperations,
  };
};

// Service Worker registration for advanced offline capabilities
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('New version available, please refresh');
            }
          });
        }
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

// Hook for managing offline-first queries
export const useOfflineQuery = (queryKey: string[], queryFn: () => Promise<any>) => {
  const { isOnline, operations } = useOfflineMode();
  const queryClient = useQueryClient();

  const offlineQueryFn = useCallback(async () => {
    const cacheKey = queryKey.join('-');
    
    if (!isOnline) {
      // Try to get from offline storage first
      const cached = await offlineStorage.getCachedQuery(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Fallback to specific entity cache
      if (queryKey.includes('work-orders')) {
        return operations.getCachedWorkOrders();
      } else if (queryKey.includes('assets')) {
        return operations.getCachedAssets();
      }
      
      throw new Error('No offline data available');
    }

    // Online - fetch fresh data and cache it
    const data = await queryFn();
    await offlineStorage.cacheQuery(cacheKey, data);
    return data;
  }, [isOnline, queryKey, queryFn, operations]);

  return offlineQueryFn;
};