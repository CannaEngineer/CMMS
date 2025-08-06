// API service for dashboard and other data fetching
import type { DashboardStats, WorkOrderTrends, MaintenanceScheduleItem } from '../hooks/useData';

// Base API configuration - proxy handles the /api prefix
// In development, use empty string to let Vite proxy handle /api routes
// In production, use the full API URL from environment variable
const API_BASE_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_URL || '') 
  : '';

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
        // Create a proper error object with status
        const error: any = new Error(`HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.response = { status: response.status };
        throw error;
      }

      // Handle empty responses (like 204 No Content)
      const contentType = response.headers.get('content-type');
      if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
        return null as any;
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      // Only log errors in development mode
      if (import.meta.env.DEV) {
        console.warn(`API unavailable: ${url}`);
      }
      
      // Preserve error status for proper handling
      if (!error.status && error.name !== 'SyntaxError') {
        error.status = 500;
      }
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
      // Return empty dashboard stats when API is unavailable
      console.warn('Dashboard API not available');
      return {
        workOrders: {
          total: 0,
          overdue: 0,
          byStatus: {
            OPEN: 0,
            IN_PROGRESS: 0,
            COMPLETED: 0,
            ON_HOLD: 0,
          },
        },
        assets: {
          total: 0,
          byStatus: {
            ONLINE: 0,
            OFFLINE: 0,
          },
        },
        inventory: {
          total: 0,
          outOfStock: 0,
        },
        maintenance: {
          scheduled: 0,
          overdue: 0,
        },
      };
    }
  },

  async getTrends(days: number = 7): Promise<WorkOrderTrends[]> {
    try {
      const result = await apiClient.get<WorkOrderTrends[]>(`/dashboard/trends?days=${days}`);
      return result || [];
    } catch (error) {
      // Return empty trends when API is unavailable
      console.warn('Trends API not available');
      return [];
    }
  },

  async getRecentWorkOrders(limit: number = 10): Promise<any[]> {
    try {
      const result = await apiClient.get<any[]>(`/work-orders/recent?limit=${limit}`);
      return result || [];
    } catch (error) {
      // Try to get work orders from the main endpoint
      try {
        const allWorkOrders = await apiClient.get<any[]>('/work-orders');
        const workOrders = allWorkOrders || [];
        // Sort by createdAt descending and take the first 'limit' items
        return workOrders
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
      } catch (fallbackError) {
        // Return empty array if no API is available
        console.warn('Work orders API not available');
        return [];
      }
    }
  },

  async getMaintenanceSchedule(limit: number = 10): Promise<MaintenanceScheduleItem[]> {
    try {
      const result = await apiClient.get<MaintenanceScheduleItem[]>(`/maintenance/schedule?limit=${limit}`);
      return result || [];
    } catch (error) {
      // Return empty maintenance schedule when API is unavailable
      console.warn('Maintenance schedule API not available');
      return [];
    }
  },

  async getMaintenanceStats(): Promise<{ today: number; thisWeek: number }> {
    try {
      return await apiClient.get<{ today: number; thisWeek: number }>('/maintenance/stats');
    } catch (error) {
      // Return empty maintenance stats when API is unavailable
      console.warn('Maintenance stats API not available');
      return {
        today: 0,
        thisWeek: 0,
      };
    }
  },

  async getAssetHealth(): Promise<any[]> {
    try {
      const result = await apiClient.get<any[]>('/dashboard/asset-health');
      return result || [];
    } catch (error) {
      // Return empty asset health when API is unavailable
      console.warn('Asset health API not available');
      return [];
    }
  },

  async getWorkOrderTrends(period: 'week' | 'month' | 'year'): Promise<any[]> {
    try {
      const result = await apiClient.get<any[]>(`/dashboard/work-order-trends?period=${period}`);
      return result || [];
    } catch (error) {
      // Return empty work order trends when API is unavailable
      console.warn('Work order trends API not available');
      return [];
    }
  },
};

// Work Orders service
export const workOrdersService = {
  async getAll(filters?: any): Promise<any[]> {
    try {
      const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
      const result = await apiClient.get<any[]>(`/work-orders${queryParams}`);
      return result || [];
    } catch (error) {
      console.warn('Work orders API not available');
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

  async getByAssetId(assetId: string): Promise<any[]> {
    try {
      return await apiClient.get<any[]>(`/work-orders?assetId=${assetId}`);
    } catch (error) {
      console.warn(`Work orders for asset ${assetId} API not available`);
      return [];
    }
  },
};

// Assets service
export const assetsService = {
  async getAll(filters?: any): Promise<any[]> {
    try {
      const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
      const result = await apiClient.get<any[]>(`/assets${queryParams}`);
      return result || [];
    } catch (error) {
      console.warn('Assets API not available');
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
      const result = await apiClient.get<any[]>('/locations');
      return result || [];
    } catch (error) {
      console.warn('Locations API not available');
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
      const result = await apiClient.get<any[]>('/users');
      return result || [];
    } catch (error) {
      console.warn('Users API not available');
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
      const result = await apiClient.get<any[]>(`/parts${queryParams}`);
      return result || [];
    } catch (error) {
      console.warn('Parts API not available');
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
      const createdPart = await apiClient.post<any>('/parts', part);
      
      // Generate QR code with the actual part ID
      try {
        const { qrService } = await import('./qrService');
        const qrData = qrService.createQRCodeData('part', createdPart.id?.toString() || 'temp', {
          name: createdPart.name,
          partNumber: createdPart.partNumber,
          category: createdPart.category,
        });
        const qrCodeUrl = qrService.generateQRCodeUrl(qrData);
        
        // Update the part with the QR code if generation succeeded
        if (qrCodeUrl && createdPart.id) {
          await apiClient.put<any>(`/parts/${createdPart.id}`, {
            ...createdPart,
            qrCode: qrCodeUrl
          });
        }
      } catch (error) {
        console.error('Failed to generate QR code for part:', error);
      }
      
      return createdPart;
    } catch (error) {
      throw new Error('Failed to create part');
    }
  },

  async update(id: string, part: any): Promise<any> {
    try {
      // If the part doesn't have a QR code, generate one
      if (!part.qrCode) {
        try {
          const { qrService } = await import('./qrService');
          const qrData = qrService.createQRCodeData('part', id, {
            name: part.name,
            partNumber: part.partNumber,
            category: part.category,
          });
          const qrCodeUrl = qrService.generateQRCodeUrl(qrData);
          part = { ...part, qrCode: qrCodeUrl };
        } catch (error) {
          console.error('Failed to generate QR code for part:', error);
        }
      }
      
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

  async getLowStock(): Promise<any[]> {
    try {
      const result = await apiClient.get<any[]>('/parts/low-stock');
      return result || [];
    } catch (error) {
      console.warn('Low stock parts API not available');
      return [];
    }
  },

  async createPurchaseOrder(parts: { partId: string; quantity: number; unitPrice?: number }[]): Promise<any> {
    try {
      const purchaseOrder = {
        id: `PO-${Date.now()}`,
        status: 'PENDING',
        requestedBy: 'System User',
        totalAmount: parts.reduce((sum, part) => sum + (part.quantity * (part.unitPrice || 0)), 0),
        items: parts,
        createdAt: new Date().toISOString(),
        expectedDelivery: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
      };
      return await apiClient.post<any>('/purchase-orders', purchaseOrder);
    } catch (error) {
      console.warn('Purchase order API not available, simulating creation');
      // Simulate successful creation
      return {
        id: `PO-${Date.now()}`,
        status: 'PENDING',
        requestedBy: 'System User',
        totalAmount: parts.reduce((sum, part) => sum + (part.quantity * (part.unitPrice || 15.00)), 0),
        items: parts,
        createdAt: new Date().toISOString(),
        expectedDelivery: new Date(Date.now() + 86400000 * 7).toISOString(),
      };
    }
  },

  async getRecentActivity(limit: number = 10): Promise<any[]> {
    try {
      const result = await apiClient.get<any[]>(`/parts/activity?limit=${limit}`);
      return result || [];
    } catch (error) {
      console.warn('Parts activity API not available');
      return [];
    }
  },
};

// PM (Preventive Maintenance) service
export const pmService = {
  async getTasks(): Promise<any[]> {
    try {
      const result = await apiClient.get<any[]>('/pm-tasks');
      return result || [];
    } catch (error) {
      console.warn('PM Tasks API not available');
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
      const result = await apiClient.get<any[]>('/pm-triggers');
      return result || [];
    } catch (error) {
      console.warn('PM Triggers API not available');
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
      const result = await apiClient.get<any[]>('/pm-schedules');
      return result || [];
    } catch (error) {
      console.warn('PM Schedules API not available');
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

  async getScheduleById(id: string): Promise<any> {
    try {
      return await apiClient.get<any>(`/pm-schedules/${id}`);
    } catch (error) {
      throw new Error(`Failed to fetch PM schedule ${id}`);
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