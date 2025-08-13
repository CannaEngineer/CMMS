import { useState, useEffect, useCallback } from 'react';

// Mock data structure matching what the Dashboard expects
export interface DashboardStats {
  workOrders: {
    total: number;
    overdue: number;
    byStatus: {
      OPEN: number;
      IN_PROGRESS: number;
      COMPLETED: number;
      ON_HOLD: number;
    };
  };
  assets: {
    total: number;
    byStatus: {
      ONLINE: number;
      OFFLINE: number;
    };
  };
  inventory: {
    total: number;
    outOfStock: number;
  };
  maintenance: {
    scheduled: number;
    overdue: number;
  };
}

export interface WorkOrderTrends {
  date: string;
  created: number;
  completed: number;
}

export interface RecentWorkOrder {
  id: string;
  title: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTo: string;
  createdAt: string;
  dueDate?: string;
}

export interface MaintenanceScheduleItem {
  id: string;
  assetName: string;
  taskName: string;
  dueDate: string;
  type: 'PREVENTIVE' | 'CORRECTIVE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface MaintenanceSchedule {
  items: MaintenanceScheduleItem[];
  today: number;
  thisWeek: number;
}

export interface NetworkStatus {
  isOnline: boolean;
  pendingChanges: number;
}

// Mock data generator
const generateMockStats = (): DashboardStats => ({
  workOrders: {
    total: 45,
    overdue: 3,
    byStatus: {
      OPEN: 12,
      IN_PROGRESS: 18,
      COMPLETED: 145,
      ON_HOLD: 5,
    },
  },
  assets: {
    total: 89,
    byStatus: {
      ONLINE: 85,
      OFFLINE: 4,
    },
  },
  inventory: {
    total: 234,
    outOfStock: 8,
  },
  maintenance: {
    scheduled: 15,
    overdue: 2,
  },
});

const generateMockTrends = (): WorkOrderTrends[] => {
  const trends = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    trends.push({
      date: date.toLocaleDateString(),
      created: Math.floor(Math.random() * 10) + 5,
      completed: Math.floor(Math.random() * 12) + 3,
    });
  }
  return trends;
};

const generateMockRecentWorkOrders = (): RecentWorkOrder[] => [
  {
    id: '1',
    title: 'HVAC System Maintenance',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assignedTo: 'John Smith',
    createdAt: '2024-01-15',
    dueDate: '2024-01-16',
  },
  {
    id: '2',
    title: 'Conveyor Belt Inspection',
    status: 'OPEN',
    priority: 'MEDIUM',
    assignedTo: 'Sarah Johnson',
    createdAt: '2024-01-14',
    dueDate: '2024-01-17',
  },
  {
    id: '3',
    title: 'Emergency Generator Test',
    status: 'COMPLETED',
    priority: 'HIGH',
    assignedTo: 'Mike Wilson',
    createdAt: '2024-01-13',
    dueDate: '2024-01-15',
  },
  {
    id: '4',
    title: 'Pump Replacement',
    status: 'ON_HOLD',
    priority: 'URGENT',
    assignedTo: 'Lisa Brown',
    createdAt: '2024-01-12',
    dueDate: '2024-01-14',
  },
];

const generateMockSchedule = (): MaintenanceScheduleItem[] => [
  {
    id: '1',
    assetName: 'Main Compressor',
    taskName: 'Monthly Oil Change',
    dueDate: '2024-01-20',
    type: 'PREVENTIVE',
    priority: 'MEDIUM',
  },
  {
    id: '2',
    assetName: 'Conveyor System',
    taskName: 'Belt Tension Check',
    dueDate: '2024-01-18',
    type: 'PREVENTIVE',
    priority: 'LOW',
  },
  {
    id: '3',
    assetName: 'HVAC Unit B',
    taskName: 'Filter Replacement',
    dueDate: '2024-01-16',
    type: 'PREVENTIVE',
    priority: 'HIGH',
  },
];

// Custom hook for dashboard data
export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<WorkOrderTrends[]>([]);
  const [recentWorkOrders, setRecentWorkOrders] = useState<RecentWorkOrder[]>([]);
  const [schedule, setSchedule] = useState<MaintenanceSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsError(false);
      setError(null);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, these would be actual API calls
      const mockStats = generateMockStats();
      const mockTrends = generateMockTrends();
      const mockRecentWO = generateMockRecentWorkOrders();
      const mockScheduleArray = generateMockSchedule();
      
      // Process schedule array to create computed properties
      const today = new Date().toISOString().split('T')[0];
      const oneWeekFromNow = new Date();
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
      const oneWeekFromNowStr = oneWeekFromNow.toISOString().split('T')[0];
      
      const processedSchedule = {
        items: mockScheduleArray,
        today: mockScheduleArray.filter(item => item.dueDate === today).length,
        thisWeek: mockScheduleArray.filter(item => {
          const dueDate = item.dueDate;
          return dueDate >= today && dueDate <= oneWeekFromNowStr;
        }).length,
      };
      
      setStats(mockStats);
      setTrends(mockTrends);
      setRecentWorkOrders(mockRecentWO);
      setSchedule(processedSchedule);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    stats,
    trends,
    recentWorkOrders,
    schedule,
    isLoading,
    isError,
    error,
    refresh,
    refreshing,
  };
}

// Custom hook for network status
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true; // Default to online if navigator is not available
  });
  const [pendingChanges, setPendingChanges] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Mock pending changes - in a real app this would track offline actions
  useEffect(() => {
    if (!isOnline) {
      // Simulate pending changes accumulating when offline
      const interval = setInterval(() => {
        setPendingChanges(prev => prev + Math.floor(Math.random() * 2));
      }, 5000);

      return () => clearInterval(interval);
    } else {
      // Clear pending changes when back online
      setPendingChanges(0);
    }
  }, [isOnline]);

  return {
    isOnline,
    pendingChanges,
  };
}

// Custom hook for optimistic updates (used in forms and actions)
export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (data: T) => Promise<T>
) {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(
    async (optimisticData: T) => {
      const previousData = data;
      
      // Apply optimistic update immediately
      setData(optimisticData);
      setIsLoading(true);
      setError(null);

      try {
        const result = await updateFn(optimisticData);
        setData(result);
      } catch (err) {
        // Revert on error
        setData(previousData);
        setError(err instanceof Error ? err.message : 'Update failed');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [data, updateFn]
  );

  return {
    data,
    update,
    isLoading,
    error,
  };
}

// Custom hook for data with retry logic
export function useDataWithRetry<T>(
  fetchFn: () => Promise<T>,
  dependencies: React.DependencyList = []
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
      setRetryCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn]);

  const retry = useCallback(async () => {
    setRetryCount(prev => prev + 1);
    try {
      await fetchData();
    } catch (err) {
      // Error already handled in fetchData
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  return {
    data,
    isLoading,
    error,
    retry,
    retryCount,
  };
}