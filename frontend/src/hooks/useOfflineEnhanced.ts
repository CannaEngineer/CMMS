import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineStorage } from '../services/offlineStorage';

interface OfflineState {
  isOffline: boolean;
  isOnline: boolean;
  queueSize: number;
  lastSyncTime: Date | null;
  pendingUploads: number;
  syncInProgress: boolean;
  connectionQuality: 'poor' | 'good' | 'excellent' | 'unknown';
  estimatedSyncTime: number; // in seconds
}

interface SyncOptions {
  priority?: 'high' | 'medium' | 'low';
  retryCount?: number;
  timeout?: number;
}

export const useOfflineEnhanced = () => {
  const [state, setState] = useState<OfflineState>({
    isOffline: !navigator.onLine,
    isOnline: navigator.onLine,
    queueSize: 0,
    lastSyncTime: null,
    pendingUploads: 0,
    syncInProgress: false,
    connectionQuality: 'unknown',
    estimatedSyncTime: 0,
  });

  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const connectionTestRef = useRef<AbortController>();

  // Test connection quality
  const testConnectionQuality = useCallback(async (): Promise<'poor' | 'good' | 'excellent'> => {
    try {
      const startTime = performance.now();
      
      // Cancel any previous test
      if (connectionTestRef.current) {
        connectionTestRef.current.abort();
      }
      
      connectionTestRef.current = new AbortController();
      
      const response = await fetch('/api/health-check', {
        method: 'HEAD',
        signal: connectionTestRef.current.signal,
        cache: 'no-cache',
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        if (responseTime < 500) return 'excellent';
        if (responseTime < 1500) return 'good';
        return 'poor';
      }
      
      return 'poor';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'poor';
      }
      return 'poor';
    }
  }, []);

  // Update queue size and pending uploads
  const updateQueueInfo = useCallback(async () => {
    try {
      const [pendingOperations, stats] = await Promise.all([
        offlineStorage.getPendingOperations(),
        offlineStorage.getStorageStats(),
      ]);
      
      setState(prev => ({
        ...prev,
        queueSize: pendingOperations.length,
        pendingUploads: stats.pendingOperations,
        estimatedSyncTime: Math.ceil(pendingOperations.length * 2), // Estimate 2 seconds per operation
      }));
    } catch (error) {
      console.error('Failed to update queue info:', error);
    }
  }, []);

  // Sync pending operations when online
  const syncPendingOperations = useCallback(async (options: SyncOptions = {}) => {
    if (!navigator.onLine || state.syncInProgress) {
      return { success: false, error: 'Cannot sync while offline or sync in progress' };
    }

    setState(prev => ({ ...prev, syncInProgress: true }));

    try {
      const pendingOperations = await offlineStorage.getPendingOperations();
      
      if (pendingOperations.length === 0) {
        setState(prev => ({ ...prev, syncInProgress: false }));
        return { success: true, synced: 0 };
      }

      const results = await Promise.allSettled(
        pendingOperations.map(async (operation) => {
          const { retryCount = 3, timeout = 10000 } = options;
          
          let lastError;
          for (let attempt = 0; attempt <= retryCount; attempt++) {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), timeout);

              const response = await fetch(operation.url, {
                method: operation.method,
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: operation.data ? JSON.stringify(operation.data) : undefined,
                signal: controller.signal,
              });

              clearTimeout(timeoutId);

              if (response.ok) {
                await offlineStorage.removePendingOperation(operation.id);
                return { success: true, operationId: operation.id };
              } else {
                lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
            } catch (error) {
              lastError = error;
              if (attempt < retryCount) {
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
              }
            }
          }
          
          throw lastError;
        })
      );

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.length - successful;

      setState(prev => ({
        ...prev,
        syncInProgress: false,
        lastSyncTime: new Date(),
        queueSize: prev.queueSize - successful,
      }));

      await updateQueueInfo();

      return {
        success: failed === 0,
        synced: successful,
        failed,
        errors: results
          .filter(result => result.status === 'rejected')
          .map(result => (result as PromiseRejectedResult).reason),
      };
    } catch (error) {
      setState(prev => ({ ...prev, syncInProgress: false }));
      return { success: false, error: error instanceof Error ? error.message : 'Sync failed' };
    }
  }, [state.syncInProgress, updateQueueInfo]);

  // Force refresh data from server
  const forceRefresh = useCallback(async () => {
    if (!navigator.onLine) {
      return { success: false, error: 'Cannot refresh while offline' };
    }

    try {
      // Clear cache and refetch data
      const cacheKeys = ['work-orders', 'assets', 'users', 'locations'];
      for (const key of cacheKeys) {
        await offlineStorage.performOperation('queryCache', 'readwrite', (store) => 
          store.delete(key)
        );
      }

      // Trigger a full sync
      await syncPendingOperations({ priority: 'high' });

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Refresh failed' 
      };
    }
  }, [syncPendingOperations]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = async () => {
      const quality = await testConnectionQuality();
      
      setState(prev => ({
        ...prev,
        isOffline: false,
        isOnline: true,
        connectionQuality: quality,
      }));

      // Auto-sync when coming online
      if (state.queueSize > 0) {
        setTimeout(() => {
          syncPendingOperations({ priority: 'medium' });
        }, 1000); // Small delay to ensure connection is stable
      }
    };

    const handleOffline = () => {
      setState(prev => ({
        ...prev,
        isOffline: true,
        isOnline: false,
        connectionQuality: 'poor',
        syncInProgress: false,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.queueSize, syncPendingOperations, testConnectionQuality]);

  // Periodic sync and quality checks
  useEffect(() => {
    const performPeriodicTasks = async () => {
      if (navigator.onLine) {
        const quality = await testConnectionQuality();
        setState(prev => ({ ...prev, connectionQuality: quality }));

        // Auto-sync if there are pending operations and connection is good
        if (state.queueSize > 0 && quality !== 'poor' && !state.syncInProgress) {
          syncPendingOperations({ priority: 'low' });
        }
      }
      
      await updateQueueInfo();
    };

    // Initial check
    performPeriodicTasks();

    // Set up interval
    syncIntervalRef.current = setInterval(performPeriodicTasks, 30000); // Every 30 seconds

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (connectionTestRef.current) {
        connectionTestRef.current.abort();
      }
    };
  }, [state.queueSize, state.syncInProgress, syncPendingOperations, testConnectionQuality, updateQueueInfo]);

  // Add operation to queue
  const queueOperation = useCallback(async (operation: {
    type: string;
    method: string;
    url: string;
    data?: any;
    entityId?: string;
  }) => {
    try {
      const operationId = await offlineStorage.addPendingOperation(operation);
      await updateQueueInfo();

      // If online with good connection, try to sync immediately
      if (navigator.onLine && state.connectionQuality === 'excellent' && !state.syncInProgress) {
        setTimeout(() => {
          syncPendingOperations({ priority: 'high' });
        }, 100);
      }

      return { success: true, operationId };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to queue operation' 
      };
    }
  }, [state.connectionQuality, state.syncInProgress, syncPendingOperations, updateQueueInfo]);

  // Clear all offline data
  const clearOfflineData = useCallback(async () => {
    try {
      await offlineStorage.clearAllData();
      setState(prev => ({
        ...prev,
        queueSize: 0,
        pendingUploads: 0,
        lastSyncTime: null,
        estimatedSyncTime: 0,
      }));
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to clear data' 
      };
    }
  }, []);

  // Get storage statistics
  const getStorageStats = useCallback(async () => {
    try {
      return await offlineStorage.getStorageStats();
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return null;
    }
  }, []);

  return {
    ...state,
    
    // Actions
    syncPendingOperations,
    forceRefresh,
    queueOperation,
    clearOfflineData,
    getStorageStats,
    testConnectionQuality,
    
    // Computed values
    canSync: navigator.onLine && !state.syncInProgress,
    shouldShowOfflineIndicator: state.isOffline || state.queueSize > 0,
    connectionStatus: state.isOffline ? 'offline' : state.connectionQuality,
    
    // Helper functions
    isOperationPending: (operationId: string) => 
      offlineStorage.performOperation('pendingOperations', 'readonly', (store) => 
        store.get(operationId)
      ).then(result => !!result),
  };
};