// API service for dashboard and other data fetching
import { DashboardStats, WorkOrderTrends, RecentWorkOrder, MaintenanceScheduleItem } from '../hooks/useData';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Generic API client with error handling and retries
class ApiClient {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Initialize API client
const apiClient = new ApiClient(API_BASE_URL);

// Dashboard service
export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    try {
      return await apiClient.get<DashboardStats>('/dashboard/stats');
    } catch (error) {
      // Mock fallback data for development/demo
      console.warn('Dashboard API not available, using mock data');
      return {
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
      };
    }
  },

  async getTrends(days: number = 7): Promise<WorkOrderTrends[]> {
    try {
      return await apiClient.get<WorkOrderTrends[]>(`/dashboard/trends?days=${days}`);
    } catch (error) {
      // Mock fallback data
      console.warn('Trends API not available, using mock data');
      const trends = [];
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        trends.push({
          date: date.toLocaleDateString(),
          created: Math.floor(Math.random() * 10) + 5,
          completed: Math.floor(Math.random() * 12) + 3,
        });
      }
      return trends;
    }
  },

  async getRecentWorkOrders(limit: number = 10): Promise<RecentWorkOrder[]> {
    try {
      return await apiClient.get<RecentWorkOrder[]>(`/work-orders/recent?limit=${limit}`);
    } catch (error) {
      // Mock fallback data
      console.warn('Recent work orders API not available, using mock data');
      return [
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
    }
  },

  async getMaintenanceSchedule(limit: number = 10): Promise<MaintenanceScheduleItem[]> {
    try {
      return await apiClient.get<MaintenanceScheduleItem[]>(`/maintenance/schedule?limit=${limit}`);
    } catch (error) {
      // Mock fallback data
      console.warn('Maintenance schedule API not available, using mock data');
      return [
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
    }
  },

  async getMaintenanceStats(): Promise<{ thisMonth: number; thisWeek: number }> {
    try {
      return await apiClient.get<{ thisMonth: number; thisWeek: number }>('/maintenance/stats');
    } catch (error) {
      // Mock fallback data
      console.warn('Maintenance stats API not available, using mock data');
      return {
        thisMonth: 15,
        thisWeek: 4,
      };
    }
  },
};

// Work Orders service
export const workOrdersService = {
  async getAll(filters?: any): Promise<any[]> {
    try {
      const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
      return await apiClient.get<any[]>(`/work-orders${queryParams}`);
    } catch (error) {
      console.warn('Work orders API not available, using mock data');
      return [];
    }
  },

  async getById(id: string): Promise<any> {
    try {
      return await apiClient.get<any>(`/work-orders/${id}`);
    } catch (error) {
      throw new Error(`Failed to fetch work order ${id}`);
    }
  },

  async create(workOrder: any): Promise<any> {
    try {
      return await apiClient.post<any>('/work-orders', workOrder);
    } catch (error) {
      throw new Error('Failed to create work order');
    }
  },

  async update(id: string, workOrder: any): Promise<any> {
    try {
      return await apiClient.put<any>(`/work-orders/${id}`, workOrder);
    } catch (error) {
      throw new Error(`Failed to update work order ${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/work-orders/${id}`);
    } catch (error) {
      throw new Error(`Failed to delete work order ${id}`);
    }
  },

  async updateStatus(id: string, status: string): Promise<any> {
    try {
      return await apiClient.put<any>(`/work-orders/${id}/status`, { status });
    } catch (error) {
      throw new Error(`Failed to update work order status ${id}`);
    }
  },
};

// Assets service
export const assetsService = {
  async getAll(filters?: any): Promise<any[]> {
    try {
      const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
      return await apiClient.get<any[]>(`/assets${queryParams}`);
    } catch (error) {
      console.warn('Assets API not available, using mock data');
      return [];
    }
  },

  async getById(id: string): Promise<any> {
    try {
      return await apiClient.get<any>(`/assets/${id}`);
    } catch (error) {
      throw new Error(`Failed to fetch asset ${id}`);
    }
  },

  async create(asset: any): Promise<any> {
    try {
      return await apiClient.post<any>('/assets', asset);
    } catch (error) {
      throw new Error('Failed to create asset');
    }
  },

  async update(id: string, asset: any): Promise<any> {
    try {
      return await apiClient.put<any>(`/assets/${id}`, asset);
    } catch (error) {
      throw new Error(`Failed to update asset ${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/assets/${id}`);
    } catch (error) {
      throw new Error(`Failed to delete asset ${id}`);
    }
  },
};

// Locations service
export const locationsService = {
  async getAll(): Promise<any[]> {
    try {
      return await apiClient.get<any[]>('/locations');
    } catch (error) {
      console.warn('Locations API not available, using mock data');
      return [];
    }
  },

  async getById(id: string): Promise<any> {
    try {
      return await apiClient.get<any>(`/locations/${id}`);
    } catch (error) {
      throw new Error(`Failed to fetch location ${id}`);
    }
  },

  async create(location: any): Promise<any> {
    try {
      return await apiClient.post<any>('/locations', location);
    } catch (error) {
      throw new Error('Failed to create location');
    }
  },

  async update(id: string, location: any): Promise<any> {
    try {
      return await apiClient.put<any>(`/locations/${id}`, location);
    } catch (error) {
      throw new Error(`Failed to update location ${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/locations/${id}`);
    } catch (error) {
      throw new Error(`Failed to delete location ${id}`);
    }
  },
};

// Users service
export const usersService = {
  async getAll(): Promise<any[]> {
    try {
      return await apiClient.get<any[]>('/users');
    } catch (error) {
      console.warn('Users API not available, using mock data');
      return [];
    }
  },

  async getById(id: string): Promise<any> {
    try {
      return await apiClient.get<any>(`/users/${id}`);
    } catch (error) {
      throw new Error(`Failed to fetch user ${id}`);
    }
  },

  async create(user: any): Promise<any> {
    try {
      return await apiClient.post<any>('/users', user);
    } catch (error) {
      throw new Error('Failed to create user');
    }
  },

  async update(id: string, user: any): Promise<any> {
    try {
      return await apiClient.put<any>(`/users/${id}`, user);
    } catch (error) {
      throw new Error(`Failed to update user ${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/users/${id}`);
    } catch (error) {
      throw new Error(`Failed to delete user ${id}`);
    }
  },
};

// Authentication service
export const authService = {
  async login(credentials: { email: string; password: string }): Promise<any> {
    try {
      return await apiClient.post<any>('/auth/login', credentials);
    } catch (error) {
      throw new Error('Failed to login');
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Logout can fail silently
      console.warn('Logout request failed, continuing with local logout');
    }
  },

  async register(userData: any): Promise<any> {
    try {
      return await apiClient.post<any>('/auth/register', userData);
    } catch (error) {
      throw new Error('Failed to register');
    }
  },

  async getCurrentUser(): Promise<any> {
    try {
      return await apiClient.get<any>('/auth/me');
    } catch (error) {
      throw new Error('Failed to get current user');
    }
  },

  async refreshToken(): Promise<any> {
    try {
      return await apiClient.post<any>('/auth/refresh');
    } catch (error) {
      throw new Error('Failed to refresh token');
    }
  },
};

// Parts/Inventory service
export const partsService = {
  async getAll(filters?: any): Promise<any[]> {
    try {
      const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
      return await apiClient.get<any[]>(`/parts${queryParams}`);
    } catch (error) {
      console.warn('Parts API not available, using mock data');
      return [];
    }
  },

  async getById(id: string): Promise<any> {
    try {
      return await apiClient.get<any>(`/parts/${id}`);
    } catch (error) {
      throw new Error(`Failed to fetch part ${id}`);
    }
  },

  async create(part: any): Promise<any> {
    try {
      return await apiClient.post<any>('/parts', part);
    } catch (error) {
      throw new Error('Failed to create part');
    }
  },

  async update(id: string, part: any): Promise<any> {
    try {
      return await apiClient.put<any>(`/parts/${id}`, part);
    } catch (error) {
      throw new Error(`Failed to update part ${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/parts/${id}`);
    } catch (error) {
      throw new Error(`Failed to delete part ${id}`);
    }
  },

  async updateStock(id: string, quantity: number): Promise<any> {
    try {
      return await apiClient.put<any>(`/parts/${id}/stock`, { quantity });
    } catch (error) {
      throw new Error(`Failed to update stock for part ${id}`);
    }
  },
};

// PM (Preventive Maintenance) service
export const pmService = {
  async getTasks(): Promise<any[]> {
    try {
      return await apiClient.get<any[]>('/pm-tasks');
    } catch (error) {
      console.warn('PM Tasks API not available, using mock data');
      return [];
    }
  },

  async createTask(task: any): Promise<any> {
    try {
      return await apiClient.post<any>('/pm-tasks', task);
    } catch (error) {
      throw new Error('Failed to create PM task');
    }
  },

  async getTriggers(): Promise<any[]> {
    try {
      return await apiClient.get<any[]>('/pm-triggers');
    } catch (error) {
      console.warn('PM Triggers API not available, using mock data');
      return [];
    }
  },

  async createTrigger(trigger: any): Promise<any> {
    try {
      return await apiClient.post<any>('/pm-triggers', trigger);
    } catch (error) {
      throw new Error('Failed to create PM trigger');
    }
  },

  async getSchedules(): Promise<any[]> {
    try {
      return await apiClient.get<any[]>('/pm-schedules');
    } catch (error) {
      console.warn('PM Schedules API not available, using mock data');
      return [];
    }
  },

  async createSchedule(schedule: any): Promise<any> {
    try {
      return await apiClient.post<any>('/pm-schedules', schedule);
    } catch (error) {
      throw new Error('Failed to create PM schedule');
    }
  },

  async updateSchedule(id: string, schedule: any): Promise<any> {
    try {
      return await apiClient.put<any>(`/pm-schedules/${id}`, schedule);
    } catch (error) {
      throw new Error(`Failed to update PM schedule ${id}`);
    }
  },

  async deleteSchedule(id: string): Promise<void> {
    try {
      await apiClient.delete(`/pm-schedules/${id}`);
    } catch (error) {
      throw new Error(`Failed to delete PM schedule ${id}`);
    }
  },
};

// Export the API client for custom usage
export { apiClient };

// Helper function to handle API errors with user-friendly messages
export function getApiErrorMessage(error: any): string {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

// Helper function to check if we're in development mode
export function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

// Helper function to create mock delay for development
export function mockDelay(ms: number = 1000): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}