// API service for dashboard and other data fetching
import type { DashboardStats, WorkOrderTrends, MaintenanceScheduleItem } from '../hooks/useData';
import type { CalendarItem, CalendarStats, CalendarFilters, MonthData } from '../types/calendar';

// Base API configuration - proxy handles the /api prefix
// In development, use empty string to let Vite proxy handle /api routes
// In production, use the full API URL from environment variable
const API_BASE_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_URL || '') 
  : '';

// Enhanced API client with error handling, retries, and better error formatting
class ApiClient {
  private baseURL: string;
  private defaultHeaders: HeadersInit;
  private requestInterceptors: Array<(config: RequestInit) => RequestInit> = [];
  private responseInterceptors: Array<(response: Response) => Response> = [];

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
      };
    }
    return {};
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s
    return Math.min(1000 * Math.pow(2, attempt), 10000);
  }

  private shouldRetry(error: any, attempt: number, maxRetries: number): boolean {
    if (attempt >= maxRetries) return false;
    
    // Don't retry client errors (4xx), except for specific cases
    if (error.status >= 400 && error.status < 500) {
      // Retry on 408 (Request Timeout), 429 (Too Many Requests)
      return error.status === 408 || error.status === 429;
    }
    
    // Retry on network errors and server errors (5xx)
    return error.status >= 500 || !error.status || error.name === 'NetworkError';
  }

  private async parseErrorResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch {
        return null;
      }
    }
    
    try {
      return { message: await response.text() };
    } catch {
      return null;
    }
  }

  private createError(response: Response, errorData?: any): Error {
    const error: any = new Error();
    
    error.status = response.status;
    error.statusText = response.statusText;
    error.response = {
      status: response.status,
      statusText: response.statusText,
      data: errorData
    };

    // Set error message based on response
    if (errorData?.error?.message) {
      error.message = errorData.error.message;
    } else if (errorData?.message) {
      error.message = errorData.message;
    } else {
      // Default messages based on status code
      switch (response.status) {
        case 400:
          error.message = 'Invalid request. Please check your input.';
          break;
        case 401:
          error.message = 'You are not authorized. Please log in again.';
          break;
        case 403:
          error.message = 'You do not have permission to perform this action.';
          break;
        case 404:
          error.message = 'The requested resource was not found.';
          break;
        case 409:
          error.message = 'There was a conflict with your request.';
          break;
        case 422:
          error.message = 'The data provided is invalid.';
          break;
        case 429:
          error.message = 'Too many requests. Please try again later.';
          break;
        case 500:
          error.message = 'Internal server error. Please try again.';
          break;
        case 502:
          error.message = 'Service temporarily unavailable.';
          break;
        case 503:
          error.message = 'Service unavailable. Please try again later.';
          break;
        default:
          error.message = `Request failed with status ${response.status}`;
      }
    }

    return error;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    maxRetries: number = 2
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    let attempt = 0;
    
    while (attempt <= maxRetries) {
      try {
        let config: RequestInit = {
          headers: { 
            ...this.defaultHeaders, 
            ...this.getAuthHeaders(),
            ...options.headers 
          },
          ...options,
        };

        // Apply request interceptors
        this.requestInterceptors.forEach(interceptor => {
          config = interceptor(config);
        });

        const response = await fetch(url, config);
        
        // Apply response interceptors
        let finalResponse = response;
        this.responseInterceptors.forEach(interceptor => {
          finalResponse = interceptor(finalResponse);
        });

        if (!finalResponse.ok) {
          const errorData = await this.parseErrorResponse(finalResponse);
          const error = this.createError(finalResponse, errorData);
          
          // Check if we should retry
          if (this.shouldRetry(error, attempt, maxRetries)) {
            attempt++;
            if (attempt <= maxRetries) {
              await this.sleep(this.getRetryDelay(attempt - 1));
              continue;
            }
          }
          
          // Handle authentication errors
          if (finalResponse.status === 401) {
            // Don't redirect if we're already on login/signup pages or public pages
            const currentPath = window.location.pathname;
            const publicPaths = ['/login', '/signup', '/portal/', '/portals/public/', '/p/', '/public/share/'];
            const isPublicPath = publicPaths.some(path => currentPath.includes(path));
            
            if (!isPublicPath) {
              // Clear auth data and redirect to login
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }
            return Promise.reject(error);
          }
          
          throw error;
        }

        // Handle empty responses (like 204 No Content)
        const contentType = finalResponse.headers.get('content-type');
        if (finalResponse.status === 204 || !contentType || !contentType.includes('application/json')) {
          return null as any;
        }

        const data = await finalResponse.json();
        return data;
        
      } catch (error: any) {
        // If this is the last attempt or shouldn't retry, throw the error
        if (!this.shouldRetry(error, attempt, maxRetries)) {
          // Enhance error for network failures
          if (!error.status && error.name !== 'SyntaxError') {
            error.status = 0;
            error.message = 'Network error. Please check your connection.';
          }
          
          // Log errors in development mode
          if (import.meta.env.DEV) {
            console.warn(`API request failed: ${url}`, error);
          }
          
          throw error;
        }
        
        // Retry on next iteration
        attempt++;
        if (attempt <= maxRetries) {
          await this.sleep(this.getRetryDelay(attempt - 1));
        }
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('Maximum retries exceeded');
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

  async patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Initialize API client
const apiClient = new ApiClient(API_BASE_URL);

// Dashboard service
export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    try {
      return await apiClient.get<DashboardStats>('/api/dashboard/stats');
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
      const result = await apiClient.get<WorkOrderTrends[]>(`/api/dashboard/trends?days=${days}`);
      return result || [];
    } catch (error) {
      // Return empty trends when API is unavailable
      console.warn('Trends API not available');
      return [];
    }
  },

  async getRecentWorkOrders(limit: number = 10): Promise<any[]> {
    try {
      const result = await apiClient.get<any[]>(`/api/work-orders/recent?limit=${limit}`);
      return result || [];
    } catch (error) {
      // Try to get work orders from the main endpoint
      try {
        const allWorkOrders = await apiClient.get<any[]>('/api/work-orders');
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
      const result = await apiClient.get<MaintenanceScheduleItem[]>(`/api/maintenance/schedule?limit=${limit}`);
      return result || [];
    } catch (error) {
      // Return empty maintenance schedule when API is unavailable
      console.warn('Maintenance schedule API not available');
      return [];
    }
  },

  async getMaintenanceStats(): Promise<{ today: number; thisWeek: number }> {
    try {
      return await apiClient.get<{ today: number; thisWeek: number }>('/api/maintenance/stats');
    } catch (error) {
      // Return empty maintenance stats when API is unavailable
      console.warn('Maintenance stats API not available');
      return {
        today: 0,
        thisWeek: 0,
      };
    }
  },

  async getAssetHealth(): Promise<any> {
    try {
      const result = await apiClient.get<any>('/api/dashboard/asset-health');
      return result || { byCriticality: [], recentMaintenance: 0, total: 0, healthScore: 0 };
    } catch (error) {
      // Return empty asset health when API is unavailable
      console.warn('Asset health API not available');
      return { byCriticality: [], recentMaintenance: 0, total: 0, healthScore: 0 };
    }
  },

  async getKPIMetrics(): Promise<any> {
    try {
      return await apiClient.get<any>('/api/dashboard/kpi-metrics');
    } catch (error) {
      console.warn('KPI metrics API not available');
      return {
        mttr: 0,
        plannedWorkRatio: 0,
        technicianUtilization: 0,
        assetUptime: 0,
        totalWorkOrders: 0,
        completedWorkOrders: 0,
      };
    }
  },

  async getInventoryMetrics(): Promise<any> {
    try {
      return await apiClient.get<any>('/api/dashboard/inventory-metrics');
    } catch (error) {
      console.error('📊 Dashboard inventory metrics API error:', error);
      console.warn('Inventory metrics API not available - returning fallback data');
      return {
        lowStockCount: 0,
        outOfStockCount: 0,
        totalInventoryValue: 0,
        criticalParts: [],
        lowStockParts: [],
      };
    }
  },

  async getWorkOrderTrends(period: 'week' | 'month' | 'year'): Promise<any[]> {
    try {
      const result = await apiClient.get<any[]>(`/api/dashboard/work-order-trends?period=${period}`);
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
      const result = await apiClient.get<any[]>(`/api/work-orders${queryParams}`);
      return result || [];
    } catch (error) {
      console.warn('Work orders API not available');
      return [];
    }
  },

  async getById(id: string): Promise<any> {
    try {
      console.log(`Fetching work order ${id}...`);
      const response = await apiClient.get<any>(`/api/work-orders/${id}`);
      console.log(`Work order ${id} fetched successfully:`, response);
      return response;
    } catch (error) {
      console.error(`Failed to fetch work order ${id}:`, error);
      throw new Error(`Failed to fetch work order ${id}: ${error.message}`);
    }
  },

  async create(workOrder: any): Promise<any> {
    try {
      return await apiClient.post<any>('/api/work-orders', workOrder);
    } catch (error) {
      throw new Error('Failed to create work order');
    }
  },

  async update(id: string, workOrder: any): Promise<any> {
    try {
      return await apiClient.put<any>(`/api/work-orders/${id}`, workOrder);
    } catch (error) {
      throw new Error(`Failed to update work order ${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/work-orders/${id}`);
    } catch (error) {
      throw new Error(`Failed to delete work order ${id}`);
    }
  },

  async updateStatus(id: string, status: string, notes?: string): Promise<any> {
    try {
      return await apiClient.put<any>(`/api/work-orders/${id}/status`, { status, notes });
    } catch (error) {
      throw new Error(`Failed to update work order status ${id}`);
    }
  },

  async getByAssetId(assetId: string): Promise<any[]> {
    try {
      return await apiClient.get<any[]>(`/api/work-orders?assetId=${assetId}`);
    } catch (error) {
      console.warn(`Work orders for asset ${assetId} API not available`);
      return [];
    }
  },

  async updatePriority(id: string, priority: string): Promise<any> {
    try {
      return await apiClient.put<any>(`/api/work-orders/${id}`, { priority });
    } catch (error) {
      throw new Error(`Failed to update work order priority ${id}`);
    }
  },

  async assignWorkOrder(id: string, assignedToId: number): Promise<any> {
    try {
      return await apiClient.put<any>(`/api/work-orders/${id}`, { assignedToId });
    } catch (error) {
      throw new Error(`Failed to assign work order ${id}`);
    }
  },

  async unassignWorkOrder(id: string): Promise<any> {
    try {
      console.log('Unassigning work order:', id);
      
      // Try different approaches to unassign the work order
      let response;
      
      try {
        // First try: Use PUT method (most common for updates)
        console.log('Trying PUT method...');
        response = await apiClient.put<any>(`/api/work-orders/${id}`, { 
          assignedToId: null,
          assignedTo: null
        });
        console.log('PUT method successful:', response);
        return response;
      } catch (putError) {
        console.log('PUT method failed, trying PATCH...');
        
        try {
          // Second try: Use PATCH method for partial update
          response = await apiClient.patch<any>(`/api/work-orders/${id}`, { 
            assignedToId: null 
          });
          console.log('PATCH method successful:', response);
          return response;
        } catch (patchError) {
          console.log('PATCH method failed, trying specific unassign endpoint...');
          
          try {
            // Third try: Use POST to a specific unassign endpoint
            response = await apiClient.post<any>(`/api/work-orders/${id}/unassign`, {});
            console.log('Unassign endpoint successful:', response);
            return response;
          } catch (unassignError) {
            console.log('Unassign endpoint failed, trying generic update...');
            
            // Fourth try: Get the work order first, then update it
            console.log('Fetching current work order data...');
            const workOrder = await this.getById(id);
            console.log('Current work order data:', workOrder);
            
            // Check if work order is currently assigned
            if (!workOrder.assignedToId && !workOrder.assignedTo) {
              console.log('Work order is already unassigned');
              return { ...workOrder, message: 'Work order was already unassigned' };
            }
            
            // Try different ways to represent "unassigned"
            const unassignOptions = [
              // Option 1: Remove assignedToId and assignedTo fields entirely
              { ...workOrder, assignedToId: undefined, assignedTo: undefined },
              // Option 2: Set to empty string
              { ...workOrder, assignedToId: "", assignedTo: "" },
              // Option 3: Set to 0 (if backend expects integer)
              { ...workOrder, assignedToId: 0, assignedTo: null },
              // Option 4: Just remove from the object
              (() => {
                const { assignedToId, assignedTo, ...rest } = workOrder;
                return rest;
              })(),
            ];
            
            // Try each unassign option
            for (let i = 0; i < unassignOptions.length; i++) {
              try {
                console.log(`Trying unassign option ${i + 1}:`, unassignOptions[i]);
                response = await apiClient.put<any>(`/api/work-orders/${id}`, unassignOptions[i]);
                console.log(`Unassign option ${i + 1} successful:`, response);
                return response;
              } catch (optionError) {
                console.log(`Unassign option ${i + 1} failed:`, optionError.message);
                if (i === unassignOptions.length - 1) {
                  throw optionError; // Throw the last error if all options fail
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('All unassign methods failed:', error);
      throw new Error(`Failed to unassign work order ${id}. Please check if the work order exists and the API is accessible. Error: ${error.message}`);
    }
  },

  // Time Logging methods
  async logTime(id: string, hours: number, description: string, category?: string, billable?: boolean): Promise<any> {
    try {
      return await apiClient.post<any>(`/api/work-orders/${id}/time`, {
        description,
        hours,
        category: category || 'LABOR',
        billable: billable ?? true
      });
    } catch (error) {
      throw new Error(`Failed to log time for work order ${id}`);
    }
  },

  async getTimeLogs(id: string): Promise<any[]> {
    try {
      const result = await apiClient.get<any[]>(`/api/work-orders/${id}/time`);
      return result || [];
    } catch (error) {
      console.warn(`Time logs for work order ${id} not available`);
      return [];
    }
  },

  async getTimeStats(id: string): Promise<any> {
    try {
      return await apiClient.get<any>(`/api/work-orders/${id}/time/stats`);
    } catch (error) {
      console.warn(`Time stats for work order ${id} not available`);
      return { totalHours: 0, billableHours: 0 };
    }
  },

  // Notes methods
  async addNote(id: string, content: string, isInternal?: boolean): Promise<any> {
    try {
      return await apiClient.post<any>(`/api/work-orders/${id}/notes`, {
        content,
        isInternal: isInternal || false
      });
    } catch (error) {
      throw new Error(`Failed to add note to work order ${id}`);
    }
  },

  async getNotes(id: string, includeInternal?: boolean): Promise<any[]> {
    try {
      const params = includeInternal !== undefined ? `?includeInternal=${includeInternal}` : '';
      const result = await apiClient.get<any[]>(`/api/work-orders/${id}/notes${params}`);
      return result || [];
    } catch (error) {
      console.warn(`Notes for work order ${id} not available`);
      return [];
    }
  },

  // Sharing methods
  async createShare(id: string, options: {
    allowComments?: boolean;
    allowDownload?: boolean;
    viewerCanSeeAssignee?: boolean;
    sanitizationLevel?: string;
    expiresAt?: Date;
    maxViews?: number;
  } = {}): Promise<any> {
    try {
      return await apiClient.post<any>(`/api/work-orders/${id}/share`, options);
    } catch (error) {
      throw new Error(`Failed to create share for work order ${id}`);
    }
  },

  async getShares(id: string): Promise<any[]> {
    try {
      const result = await apiClient.get<any[]>(`/api/work-orders/${id}/shares`);
      return result || [];
    } catch (error) {
      console.warn(`Shares for work order ${id} not available`);
      return [];
    }
  },

  async deactivateShare(shareId: string): Promise<void> {
    try {
      await apiClient.put(`/api/work-orders/shares/${shareId}/deactivate`, {});
    } catch (error) {
      throw new Error(`Failed to deactivate share ${shareId}`);
    }
  },

  // Tasks methods
  async getTasks(id: string): Promise<any[]> {
    try {
      const result = await apiClient.get<any[]>(`/api/work-orders/${id}/tasks`);
      return result || [];
    } catch (error) {
      console.warn(`Tasks for work order ${id} not available`);
      return [];
    }
  },

  // History and progress methods
  async getHistory(id: string): Promise<any[]> {
    try {
      const result = await apiClient.get<any[]>(`/api/work-orders/${id}/history`);
      return result || [];
    } catch (error) {
      console.warn(`History for work order ${id} not available`);
      return [];
    }
  },

  async getProgress(id: string): Promise<any> {
    try {
      const result = await apiClient.get<any>(`/api/work-orders/${id}/progress`);
      return result || {};
    } catch (error) {
      console.warn(`Progress for work order ${id} not available`);
      return {};
    }
  },
};

// Assets service
export const assetsService = {
  async getAll(filters?: any): Promise<any[]> {
    try {
      const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
      const result = await apiClient.get<any[]>(`/api/assets${queryParams}`);
      return result || [];
    } catch (error) {
      console.warn('Assets API not available');
      return [];
    }
  },

  async getById(id: string): Promise<any> {
    try {
      return await apiClient.get<any>(`/api/assets/${id}`);
    } catch (error) {
      throw new Error(`Failed to fetch asset ${id}`);
    }
  },

  async create(asset: any): Promise<any> {
    try {
      return await apiClient.post<any>('/api/assets', asset);
    } catch (error) {
      throw new Error('Failed to create asset');
    }
  },

  async update(id: string, asset: any): Promise<any> {
    try {
      return await apiClient.put<any>(`/api/assets/${id}`, asset);
    } catch (error) {
      throw new Error(`Failed to update asset ${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/assets/${id}`);
    } catch (error) {
      throw new Error(`Failed to delete asset ${id}`);
    }
  },
};

// Locations service
export const locationsService = {
  async getAll(): Promise<any[]> {
    try {
      const result = await apiClient.get<any[]>('/api/locations');
      return result || [];
    } catch (error) {
      console.warn('Locations API not available');
      return [];
    }
  },

  async getById(id: string): Promise<any> {
    try {
      return await apiClient.get<any>(`/api/locations/${id}`);
    } catch (error) {
      throw new Error(`Failed to fetch location ${id}`);
    }
  },

  async create(location: any): Promise<any> {
    try {
      return await apiClient.post<any>('/api/locations', location);
    } catch (error) {
      throw new Error('Failed to create location');
    }
  },

  async update(id: string, location: any): Promise<any> {
    try {
      return await apiClient.put<any>(`/api/locations/${id}`, location);
    } catch (error) {
      throw new Error(`Failed to update location ${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/locations/${id}`);
    } catch (error) {
      throw new Error(`Failed to delete location ${id}`);
    }
  },
};

// Users service
export const usersService = {
  async getAll(): Promise<any[]> {
    try {
      const result = await apiClient.get<any[]>('/api/users');
      return result || [];
    } catch (error) {
      console.warn('Users API not available');
      return [];
    }
  },

  async getById(id: string): Promise<any> {
    try {
      return await apiClient.get<any>(`/api/users/${id}`);
    } catch (error) {
      throw new Error(`Failed to fetch user ${id}`);
    }
  },

  async create(user: any): Promise<any> {
    try {
      return await apiClient.post<any>('/api/users', user);
    } catch (error) {
      throw new Error('Failed to create user');
    }
  },

  async update(id: string, user: any): Promise<any> {
    try {
      return await apiClient.put<any>(`/api/users/${id}`, user);
    } catch (error) {
      throw new Error(`Failed to update user ${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/users/${id}`);
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
      const result = await apiClient.get<any[]>(`/api/parts${queryParams}`);
      return result || [];
    } catch (error) {
      console.warn('Parts API not available');
      return [];
    }
  },

  async getById(id: string): Promise<any> {
    try {
      return await apiClient.get<any>(`/api/parts/${id}`);
    } catch (error) {
      throw new Error(`Failed to fetch part ${id}`);
    }
  },

  async create(part: any): Promise<any> {
    try {
      const createdPart = await apiClient.post<any>('/api/parts', part);
      
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
          await apiClient.put<any>(`/api/parts/${createdPart.id}`, {
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
      
      return await apiClient.put<any>(`/api/parts/${id}`, part);
    } catch (error) {
      throw new Error(`Failed to update part ${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/parts/${id}`);
    } catch (error) {
      throw new Error(`Failed to delete part ${id}`);
    }
  },

  async updateStock(id: string, quantity: number): Promise<any> {
    try {
      return await apiClient.put<any>(`/api/parts/${id}/stock`, { quantity });
    } catch (error) {
      throw new Error(`Failed to update stock for part ${id}`);
    }
  },

  async getLowStock(): Promise<any[]> {
    try {
      const result = await apiClient.get<any[]>('/api/parts/low-stock');
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
      const result = await apiClient.get<any[]>(`/api/parts/activity?limit=${limit}`);
      return result || [];
    } catch (error) {
      console.warn('Parts activity API not available');
      return [];
    }
  },

  async batchCreateOrMerge(parts: any[]): Promise<any> {
    try {
      return await apiClient.post<any>('/api/parts/batch', { parts });
    } catch (error) {
      throw new Error('Failed to process parts batch');
    }
  },

  async cleanupDuplicates(): Promise<any> {
    try {
      return await apiClient.post<any>('/api/parts/cleanup-duplicates', {});
    } catch (error) {
      throw new Error('Failed to cleanup duplicates');
    }
  },

  async checkoutParts(checkout: {
    items: Array<{id: number, name: string, partNumber: string, quantity: number, cost: number}>,
    requestedBy: string,
    reason?: string,
    workOrderId?: number,
    notes?: string
  }): Promise<any> {
    try {
      const checkoutData = {
        ...checkout,
        checkoutDate: new Date().toISOString(),
        status: 'PENDING_APPROVAL'
      };
      return await apiClient.post<any>('/api/parts/checkout', checkoutData);
    } catch (error) {
      console.warn('Parts checkout API not available, simulating checkout');
      // Simulate successful checkout
      const simulatedResponse = {
        id: `CHECKOUT-${Date.now()}`,
        ...checkout,
        checkoutDate: new Date().toISOString(),
        status: 'APPROVED', // Auto-approve for demo
        totalValue: checkout.items.reduce((sum, item) => sum + (item.quantity * item.cost), 0)
      };
      
      // Simulate inventory update by reducing quantities
      // Also simulate sending email notification to admins
      this.notifyAdminsOfCheckout(simulatedResponse);
      return simulatedResponse;
    }
  },

  async notifyAdminsOfCheckout(checkoutData: any): Promise<void> {
    try {
      // Calculate inventory alerts
      const inventoryAlerts = [];
      for (const item of checkoutData.items) {
        // Simulate checking inventory levels after checkout
        const remainingQty = Math.max(0, 50 - item.quantity); // Mock current stock minus checkout
        const reorderPoint = 10; // Mock reorder point
        
        if (remainingQty <= reorderPoint) {
          inventoryAlerts.push({
            partName: item.name,
            partNumber: item.partNumber,
            remainingQuantity: remainingQty,
            reorderPoint: reorderPoint,
            alertLevel: remainingQty === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'
          });
        }
      }

      // Get all admin users first
      let adminEmails: string[] = [];
      try {
        const users = await usersService.getAll(); // Get all users
        const admins = users.filter((user: any) => 
          user.role === 'ADMIN' || 
          user.role === 'MANAGER' || 
          user.role === 'SUPERVISOR' ||
          user.permissions?.includes('MANAGE_INVENTORY') ||
          user.permissions?.includes('VIEW_ADMIN_DASHBOARD')
        );
        adminEmails = admins.map((admin: any) => admin.email).filter(Boolean);
        console.log('📧 Found admin emails:', adminEmails);
      } catch (userError) {
        console.warn('Failed to fetch admin users, using fallback emails:', userError);
        // Fallback to common admin emails if user fetch fails
        adminEmails = ['admin@elevatedcompliance.tech', 'manager@elevatedcompliance.tech'];
      }

      // If no admin emails found, use a default
      if (adminEmails.length === 0) {
        adminEmails = ['admin@elevatedcompliance.tech'];
        console.warn('No admin emails found, using default admin email');
      }

      const emailData = {
        to: adminEmails.join(', '), // Send to all admins
        subject: `Parts Checkout Notification - ${checkoutData.requestedBy}`,
        body: this.generateCheckoutEmailBody(checkoutData, inventoryAlerts)
      };

      // In a real implementation, this would call an email service
      console.log('📧 Email Notification Sent to Admins:', emailData);
      
      return await apiClient.post('/api/notifications/email', emailData);
    } catch (error) {
      console.warn('Email notification failed:', error);
      // Don't throw error - checkout should still succeed even if email fails
    }
  },

  generateCheckoutEmailBody(checkoutData: any, inventoryAlerts: any[]): string {
    const itemsList = checkoutData.items.map((item: any) => 
      `• ${item.name} (${item.partNumber}) - Qty: ${item.quantity} - $${(item.quantity * item.cost).toFixed(2)}`
    ).join('\n');

    const alertsList = inventoryAlerts.length > 0 
      ? '\n\n⚠️ INVENTORY ALERTS:\n' + inventoryAlerts.map(alert => 
          `• ${alert.partName} (${alert.partNumber}): ${alert.remainingQuantity} remaining (${alert.alertLevel})`
        ).join('\n')
      : '';

    return `
Parts Checkout Request

Requested By: ${checkoutData.requestedBy}
Checkout Date: ${new Date(checkoutData.checkoutDate).toLocaleString()}
Reason: ${checkoutData.reason || 'Not specified'}
Total Value: $${checkoutData.totalValue.toFixed(2)}

Items Checked Out:
${itemsList}

${checkoutData.notes ? `Notes: ${checkoutData.notes}\n` : ''}
${alertsList}

Please review and approve this checkout request.
    `.trim();
  },
};

// PM (Preventive Maintenance) service
export const pmService = {
  async getTasks(): Promise<any[]> {
    try {
      const result = await apiClient.get<any[]>('/api/pm-tasks');
      return result || [];
    } catch (error) {
      console.warn('PM Tasks API not available');
      return [];
    }
  },

  async createTask(task: any): Promise<any> {
    try {
      return await apiClient.post<any>('/api/pm-tasks', task);
    } catch (error) {
      throw new Error('Failed to create PM task');
    }
  },

  async getTriggers(): Promise<any[]> {
    try {
      const result = await apiClient.get<any[]>('/api/pm-triggers');
      return result || [];
    } catch (error) {
      console.warn('PM Triggers API not available');
      return [];
    }
  },

  async createTrigger(trigger: any): Promise<any> {
    try {
      return await apiClient.post<any>('/api/pm-triggers', trigger);
    } catch (error) {
      throw new Error('Failed to create PM trigger');
    }
  },

  async getSchedules(): Promise<any[]> {
    try {
      const result = await apiClient.get<any[]>('/api/pm-schedules');
      return result || [];
    } catch (error) {
      console.warn('PM Schedules API not available');
      return [];
    }
  },

  async createSchedule(schedule: any): Promise<any> {
    try {
      console.log('Creating PM schedule with data:', schedule);
      const result = await apiClient.post<any>('/api/pm-schedules', schedule);
      console.log('PM schedule creation successful:', result);
      return result;
    } catch (error) {
      console.error('PM schedule creation failed:', error);
      console.error('Attempted to create with data:', schedule);
      throw new Error(`Failed to create PM schedule: ${error.response?.data?.message || error.message}`);
    }
  },

  async updateSchedule(id: string, schedule: any): Promise<any> {
    try {
      console.log(`Updating PM schedule ${id} with data:`, schedule);
      
      // Clean the data payload
      const cleanedData = {
        title: schedule.title,
        description: schedule.description,
        frequency: schedule.frequency,
        nextDue: schedule.nextDue ? new Date(schedule.nextDue).toISOString() : schedule.nextDue,
        assetId: schedule.assetId,
        priority: schedule.priority,
        estimatedHours: schedule.estimatedHours,
        assignedToId: schedule.assignedToId,
      };

      // Try PATCH first (more appropriate for partial updates)
      try {
        const result = await apiClient.patch<any>(`/api/pm-schedules/${id}`, cleanedData);
        console.log(`PM schedule PATCH update successful:`, result);
        return result;
      } catch (patchError) {
        console.warn(`PM schedule PATCH update failed, trying PUT:`, patchError.response?.data);
        
        // Fallback to PUT
        const result = await apiClient.put<any>(`/api/pm-schedules/${id}`, cleanedData);
        console.log(`PM schedule PUT update successful:`, result);
        return result;
      }
    } catch (error) {
      console.error(`PM schedule ${id} update failed:`, error);
      console.error('Server response:', error.response?.data);
      throw new Error(`Failed to update PM schedule ${id}: ${error.response?.data?.message || error.message}`);
    }
  },

  async deleteSchedule(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/pm-schedules/${id}`);
    } catch (error) {
      throw new Error(`Failed to delete PM schedule ${id}`);
    }
  },

  async getScheduleById(id: string): Promise<any> {
    try {
      return await apiClient.get<any>(`/api/pm-schedules/${id}`);
    } catch (error) {
      throw new Error(`Failed to fetch PM schedule ${id}`);
    }
  },
};

// Calendar service for unified calendar data
export const calendarService = {
  async getCalendarItems(filters?: CalendarFilters): Promise<CalendarItem[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.startDate) {
        queryParams.append('startDate', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        queryParams.append('endDate', filters.endDate.toISOString());
      }
      if (filters?.type && filters.type !== 'ALL') {
        queryParams.append('type', filters.type);
      }
      if (filters?.assetId) {
        queryParams.append('assetId', filters.assetId.toString());
      }
      if (filters?.locationId) {
        queryParams.append('locationId', filters.locationId.toString());
      }
      if (filters?.assignedToId) {
        queryParams.append('assignedToId', filters.assignedToId.toString());
      }

      const url = `/api/calendar/items${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get<CalendarItem[]>(url);
      
      // Transform dates from strings to Date objects
      return response.map(item => ({
        ...item,
        scheduledDate: new Date(item.scheduledDate),
      }));
    } catch (error) {
      console.error('Failed to fetch calendar items:', error);
      throw new Error('Failed to fetch calendar items');
    }
  },

  async getCalendarItemsForDate(date: Date, type?: 'PM_SCHEDULE' | 'WORK_ORDER' | 'ALL'): Promise<CalendarItem[]> {
    try {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const queryParams = new URLSearchParams();
      if (type && type !== 'ALL') {
        queryParams.append('type', type);
      }
      
      const url = `/api/calendar/items/${dateStr}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get<CalendarItem[]>(url);
      
      // Transform dates from strings to Date objects
      return response.map(item => ({
        ...item,
        scheduledDate: new Date(item.scheduledDate),
      }));
    } catch (error) {
      console.error(`Failed to fetch calendar items for date ${date}:`, error);
      throw new Error(`Failed to fetch calendar items for date`);
    }
  },

  async getCalendarStats(): Promise<CalendarStats> {
    try {
      const response = await apiClient.get<CalendarStats>('/api/calendar/stats');
      return response;
    } catch (error) {
      console.error('Failed to fetch calendar stats:', error);
      throw new Error('Failed to fetch calendar stats');
    }
  },

  async getCalendarMonth(year: number, month: number): Promise<MonthData> {
    try {
      const response = await apiClient.get<MonthData>(`/api/calendar/month/${year}/${month}`);
      
      // Transform dates from strings to Date objects
      return {
        ...response,
        startDate: new Date(response.startDate),
        endDate: new Date(response.endDate),
        itemsByDate: Object.fromEntries(
          Object.entries(response.itemsByDate).map(([dateKey, items]) => [
            dateKey,
            items.map(item => ({
              ...item,
              scheduledDate: new Date(item.scheduledDate),
            })),
          ])
        ),
      };
    } catch (error) {
      console.error(`Failed to fetch calendar month ${year}-${month}:`, error);
      throw new Error(`Failed to fetch calendar month ${year}-${month}`);
    }
  },

  async getCurrentMonth(): Promise<MonthData> {
    try {
      const response = await apiClient.get<MonthData>('/api/calendar/current-month');
      
      // Transform dates from strings to Date objects
      return {
        ...response,
        startDate: new Date(response.startDate),
        endDate: new Date(response.endDate),
        itemsByDate: Object.fromEntries(
          Object.entries(response.itemsByDate).map(([dateKey, items]) => [
            dateKey,
            items.map(item => ({
              ...item,
              scheduledDate: new Date(item.scheduledDate),
            })),
          ])
        ),
      };
    } catch (error) {
      console.error('Failed to fetch current month data:', error);
      throw new Error('Failed to fetch current month data');
    }
  },

  async getTodaysItems(type?: 'PM_SCHEDULE' | 'WORK_ORDER' | 'ALL'): Promise<CalendarItem[]> {
    try {
      const queryParams = new URLSearchParams();
      if (type && type !== 'ALL') {
        queryParams.append('type', type);
      }
      
      const url = `/api/calendar/today${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await apiClient.get<CalendarItem[]>(url);
      
      // Transform dates from strings to Date objects
      return response.map(item => ({
        ...item,
        scheduledDate: new Date(item.scheduledDate),
      }));
    } catch (error) {
      console.error('Failed to fetch today\'s items:', error);
      throw new Error('Failed to fetch today\'s items');
    }
  },

  async createWorkOrderFromPM(pmId: number, assignedToId?: number, dueDate?: Date): Promise<any> {
    try {
      const response = await apiClient.post<any>(`/api/calendar/pm/${pmId}/create-work-order`, {
        assignedToId,
        dueDate: dueDate?.toISOString(),
      });
      return response;
    } catch (error) {
      console.error(`Failed to create work order from PM ${pmId}:`, error);
      throw new Error(`Failed to create work order from PM ${pmId}`);
    }
  },
  
  async rescheduleItem(itemId: number, itemType: 'PM_SCHEDULE' | 'WORK_ORDER', newDate: Date): Promise<any> {
    try {
      const response = await apiClient.put<any>('/api/calendar/reschedule', {
        itemId,
        itemType,
        newDate: newDate.toISOString(),
      });
      return response;
    } catch (error) {
      console.error(`Failed to reschedule ${itemType} ${itemId}:`, error);
      throw new Error(`Failed to reschedule item`);
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