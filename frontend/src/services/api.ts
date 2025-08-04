import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
  
  register: async (data: { email: string; password: string; name: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },
};

// Work Order services
export const workOrderService = {
  getAll: async (params?: { status?: string; priority?: string; assignedTo?: number }) => {
    const response = await api.get('/work-orders', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/work-orders/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/work-orders', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/work-orders/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/work-orders/${id}`);
    return response.data;
  },
};

// Asset services
export const assetService = {
  getAll: async (params?: { status?: string; locationId?: number }) => {
    const response = await api.get('/assets', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/assets/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/assets', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/assets/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/assets/${id}`);
    return response.data;
  },
  
  getMaintenanceHistory: async (id: string) => {
    const response = await api.get(`/assets/${id}/maintenance-history`);
    return response.data;
  },
};

// Location services
export const locationService = {
  getAll: async () => {
    const response = await api.get('/locations');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/locations/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/locations', data);
    return response.data;
  },
};

// Parts/Inventory services
export const partService = {
  getAll: async () => {
    const response = await api.get('/parts');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/parts/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/parts', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/parts/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/parts/${id}`);
    return response.data;
  },
  
  getLowStock: async () => {
    const response = await api.get('/parts/low-stock');
    return response.data;
  },
  
  updateStock: async (id: string, quantity: number) => {
    const response = await api.patch(`/parts/${id}/stock`, { quantity });
    return response.data;
  },
};

// User services
export const userService = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/users', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
  
  getWorkOrders: async (id: string) => {
    const response = await api.get(`/users/${id}/work-orders`);
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/users/stats');
    return response.data;
  },
};

// Dashboard services
export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
  
  getWorkOrderTrends: async (period: 'week' | 'month' | 'year' = 'month') => {
    const response = await api.get('/dashboard/work-order-trends', { params: { period } });
    return response.data;
  },
  
  getAssetHealth: async () => {
    const response = await api.get('/dashboard/asset-health');
    return response.data;
  },

  getRecentWorkOrders: async (limit: number = 10) => {
    const response = await api.get('/dashboard/recent-work-orders', { params: { limit } });
    return response.data;
  },

  getMaintenanceSchedule: async () => {
    const response = await api.get('/dashboard/maintenance-schedule');
    return response.data;
  },
};

// PM Schedule services
export const pmScheduleService = {
  getAll: async () => {
    const response = await api.get('/pm-schedules');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/pm-schedules/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/pm-schedules', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/pm-schedules/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/pm-schedules/${id}`);
    return response.data;
  },
};

// Offline sync service
export const syncService = {
  checkOnlineStatus: () => navigator.onLine,
  
  syncPendingChanges: async () => {
    const pendingChanges = JSON.parse(localStorage.getItem('pendingChanges') || '[]');
    if (pendingChanges.length === 0) return;
    
    try {
      const response = await api.post('/sync/bulk', { changes: pendingChanges });
      localStorage.removeItem('pendingChanges');
      return response.data;
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  },
  
  addPendingChange: (change: any) => {
    const pendingChanges = JSON.parse(localStorage.getItem('pendingChanges') || '[]');
    pendingChanges.push({
      ...change,
      timestamp: new Date().toISOString(),
      id: `pending_${Date.now()}`,
    });
    localStorage.setItem('pendingChanges', JSON.stringify(pendingChanges));
  },
};

export default api;