/**
 * API Service Mocks for Testing
 * Provides consistent mock implementations of API services
 */

import { vi } from 'vitest';
import {
  createMockUser,
  createMockWorkOrder,
  createMockExportTemplate,
  createMockExportHistory,
  createMockExportQueue,
  createMockExportStats,
  createMockTimeEntry,
  createMockComment,
  createMockApiResponse,
  createMockError,
  createMockWorkOrderList,
} from '../factories';

// Mock User Service
export const mockUsersService = {
  getAll: vi.fn().mockResolvedValue([createMockUser()]),
  getById: vi.fn().mockResolvedValue(createMockUser()),
  create: vi.fn().mockResolvedValue(createMockUser()),
  update: vi.fn().mockImplementation((id, data) => 
    Promise.resolve({ ...createMockUser(), id, ...data })
  ),
  delete: vi.fn().mockResolvedValue({ success: true }),
  getCurrentUser: vi.fn().mockResolvedValue(createMockUser()),
  updateProfile: vi.fn().mockImplementation((data) => 
    Promise.resolve({ ...createMockUser(), ...data })
  ),
  changePassword: vi.fn().mockResolvedValue({ success: true }),
};

// Mock Work Orders Service
export const mockWorkOrdersService = {
  getAll: vi.fn().mockResolvedValue(createMockWorkOrderList(5)),
  getById: vi.fn().mockResolvedValue(createMockWorkOrder()),
  create: vi.fn().mockResolvedValue(createMockWorkOrder()),
  update: vi.fn().mockImplementation((id, data) => 
    Promise.resolve({ ...createMockWorkOrder(), id: parseInt(id), ...data })
  ),
  updateStatus: vi.fn().mockImplementation((id, status) =>
    Promise.resolve({ ...createMockWorkOrder(), id: parseInt(id), status })
  ),
  delete: vi.fn().mockResolvedValue({ success: true }),
  logTime: vi.fn().mockImplementation((workOrderId, hours, description, type, isActive) =>
    Promise.resolve(createMockTimeEntry({ workOrderId: parseInt(workOrderId), hours, description }))
  ),
  getTimeEntries: vi.fn().mockResolvedValue([createMockTimeEntry()]),
  getTechnicianWorkOrders: vi.fn().mockResolvedValue(createMockWorkOrderList(3)),
};

// Mock Export Service
export const mockExportService = {
  getTemplates: vi.fn().mockResolvedValue([createMockExportTemplate()]),
  getTemplate: vi.fn().mockResolvedValue(createMockExportTemplate()),
  createTemplate: vi.fn().mockResolvedValue(createMockExportTemplate()),
  updateTemplate: vi.fn().mockImplementation((id, data) =>
    Promise.resolve({ ...createMockExportTemplate(), id, ...data })
  ),
  deleteTemplate: vi.fn().mockResolvedValue({ success: true }),
  duplicateTemplate: vi.fn().mockImplementation((id, name) =>
    Promise.resolve({ ...createMockExportTemplate(), id: `${id}-copy`, name })
  ),
  executeTemplate: vi.fn().mockResolvedValue({ exportId: 'export-1', status: 'queued' }),
  
  getHistory: vi.fn().mockResolvedValue({
    items: [createMockExportHistory()],
    total: 1,
    page: 1,
    limit: 50,
  }),
  getExport: vi.fn().mockResolvedValue(createMockExportHistory()),
  downloadExport: vi.fn().mockResolvedValue({ url: '/api/exports/export-1/download' }),
  retryExport: vi.fn().mockResolvedValue({ exportId: 'export-2', status: 'queued' }),
  cancelExport: vi.fn().mockResolvedValue({ success: true }),
  
  getQueue: vi.fn().mockResolvedValue([createMockExportQueue()]),
  getStats: vi.fn().mockResolvedValue(createMockExportStats()),
  
  requestExport: vi.fn().mockResolvedValue({ exportId: 'export-quick-1', status: 'queued' }),
};

// Mock Comments Service
export const mockCommentsService = {
  getComments: vi.fn().mockResolvedValue([createMockComment()]),
  createComment: vi.fn().mockResolvedValue(createMockComment()),
  updateComment: vi.fn().mockImplementation((id, data) =>
    Promise.resolve({ ...createMockComment(), id, ...data })
  ),
  deleteComment: vi.fn().mockResolvedValue({ success: true }),
};

// Mock Auth Service
export const mockAuthService = {
  login: vi.fn().mockResolvedValue({
    user: createMockUser(),
    token: 'mock-jwt-token',
  }),
  logout: vi.fn().mockResolvedValue({ success: true }),
  register: vi.fn().mockResolvedValue({
    user: createMockUser(),
    token: 'mock-jwt-token',
  }),
  refreshToken: vi.fn().mockResolvedValue({
    token: 'new-mock-jwt-token',
  }),
  getCurrentUser: vi.fn().mockResolvedValue(createMockUser()),
  isAuthenticated: vi.fn().mockReturnValue(true),
};

// Mock API instance
export const mockApiInstance = {
  get: vi.fn().mockImplementation((url) => {
    // Simulate different responses based on URL
    if (url.includes('/work-orders')) {
      return Promise.resolve(createMockApiResponse(createMockWorkOrderList(5)));
    }
    if (url.includes('/users/me')) {
      return Promise.resolve(createMockApiResponse(createMockUser()));
    }
    if (url.includes('/export/templates')) {
      return Promise.resolve(createMockApiResponse([createMockExportTemplate()]));
    }
    return Promise.resolve(createMockApiResponse({}));
  }),
  
  post: vi.fn().mockImplementation((url, data) => {
    if (url.includes('/work-orders')) {
      return Promise.resolve(createMockApiResponse(createMockWorkOrder(data)));
    }
    if (url.includes('/export/templates')) {
      return Promise.resolve(createMockApiResponse(createMockExportTemplate(data)));
    }
    return Promise.resolve(createMockApiResponse({ success: true }));
  }),
  
  put: vi.fn().mockImplementation((url, data) => {
    return Promise.resolve(createMockApiResponse({ ...data, updated: true }));
  }),
  
  patch: vi.fn().mockImplementation((url, data) => {
    return Promise.resolve(createMockApiResponse({ ...data, updated: true }));
  }),
  
  delete: vi.fn().mockResolvedValue(createMockApiResponse({ success: true })),
};

// Network error simulation
export const simulateNetworkError = (service: any, method: string, error = createMockError()) => {
  service[method].mockRejectedValueOnce(error);
};

// Slow network simulation
export const simulateSlowNetwork = (service: any, method: string, delay = 2000) => {
  const originalImplementation = service[method].getMockImplementation();
  service[method].mockImplementation((...args: any[]) => 
    new Promise((resolve) => 
      setTimeout(() => resolve(originalImplementation?.(...args)), delay)
    )
  );
};

// Authentication error simulation
export const simulateAuthError = (service: any, method: string) => {
  service[method].mockRejectedValueOnce(
    createMockError('Unauthorized', { response: { status: 401 } })
  );
};

// Validation error simulation
export const simulateValidationError = (service: any, method: string, errors: any) => {
  service[method].mockRejectedValueOnce(
    createMockError('Validation Error', { 
      response: { 
        status: 422, 
        data: { errors } 
      } 
    })
  );
};

// Server error simulation
export const simulateServerError = (service: any, method: string) => {
  service[method].mockRejectedValueOnce(
    createMockError('Internal Server Error', { response: { status: 500 } })
  );
};

// Reset all mocks
export const resetAllMocks = () => {
  vi.clearAllMocks();
  Object.values(mockUsersService).forEach(mock => mock.mockClear());
  Object.values(mockWorkOrdersService).forEach(mock => mock.mockClear());
  Object.values(mockExportService).forEach(mock => mock.mockClear());
  Object.values(mockCommentsService).forEach(mock => mock.mockClear());
  Object.values(mockAuthService).forEach(mock => mock.mockClear());
  Object.values(mockApiInstance).forEach(mock => mock.mockClear());
};

// Create mock services with different states
export const createMockServicesWithData = (data: any) => ({
  usersService: {
    ...mockUsersService,
    getAll: vi.fn().mockResolvedValue(data.users || []),
    getCurrentUser: vi.fn().mockResolvedValue(data.currentUser || createMockUser()),
  },
  workOrdersService: {
    ...mockWorkOrdersService,
    getAll: vi.fn().mockResolvedValue(data.workOrders || []),
    getTechnicianWorkOrders: vi.fn().mockResolvedValue(data.technicianWorkOrders || []),
  },
  exportService: {
    ...mockExportService,
    getTemplates: vi.fn().mockResolvedValue(data.templates || []),
    getHistory: vi.fn().mockResolvedValue(data.history || { items: [], total: 0 }),
    getQueue: vi.fn().mockResolvedValue(data.queue || []),
  },
});

// Mock WebSocket connection
export const mockWebSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
};

// Mock React Query client
export const mockQueryClient = {
  invalidateQueries: vi.fn(),
  refetchQueries: vi.fn(),
  setQueryData: vi.fn(),
  getQueryData: vi.fn(),
  removeQueries: vi.fn(),
  clear: vi.fn(),
};

// Mock local storage with data
export const mockLocalStorageWithUser = (user = createMockUser()) => {
  global.localStorage.getItem.mockImplementation((key) => {
    if (key === 'user') return JSON.stringify(user);
    if (key === 'token') return 'mock-jwt-token';
    return null;
  });
};

// Mock notification service
export const mockNotificationService = {
  show: vi.fn(),
  hide: vi.fn(),
  clear: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
};

// Mock performance observer
export const mockPerformanceObserver = {
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn().mockReturnValue([]),
};