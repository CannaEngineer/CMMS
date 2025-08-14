/**
 * Mock Data Factories for Testing
 * Provides consistent, realistic test data for CMMS system testing
 */

import { vi } from 'vitest';

// User factory
export const createMockUser = (overrides = {}) => ({
  id: 1,
  name: 'John Technician',
  email: 'john@company.com',
  role: 'TECHNICIAN',
  organization: {
    id: 1,
    name: 'ACME Manufacturing',
  },
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Work Order factory
export const createMockWorkOrder = (overrides = {}) => ({
  id: 1,
  title: 'Repair Conveyor Belt Motor',
  description: 'Motor bearing replacement required for Line A conveyor',
  status: 'PENDING',
  priority: 'HIGH',
  assignedTo: {
    id: 1,
    name: 'John Technician',
    email: 'john@company.com',
  },
  assignedToId: 1,
  assetName: 'Conveyor Belt A1',
  assetId: 1,
  createdAt: '2024-01-15T08:00:00Z',
  updatedAt: '2024-01-15T08:00:00Z',
  dueDate: '2024-01-20T17:00:00Z',
  estimatedHours: 4,
  ...overrides,
});

// Export Template factory
export const createMockExportTemplate = (overrides = {}) => ({
  id: 'template-1',
  name: 'Work Orders Report',
  description: 'Weekly work orders summary report',
  entityType: 'workOrder',
  format: 'csv',
  fields: ['id', 'title', 'status', 'assignedTo', 'dueDate'],
  filters: {
    status: ['COMPLETED'],
    dateRange: 'week',
  },
  isActive: true,
  createdBy: 'admin',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  lastExecuted: '2024-01-15T00:00:00Z',
  executionCount: 25,
  ...overrides,
});

// Export History factory
export const createMockExportHistory = (overrides = {}) => ({
  id: 'export-1',
  templateId: 'template-1',
  templateName: 'Work Orders Report',
  status: 'completed',
  startedAt: '2024-01-15T10:00:00Z',
  completedAt: '2024-01-15T10:05:00Z',
  duration: 300000, // 5 minutes in ms
  recordCount: 150,
  fileSize: 25600, // bytes
  downloadUrl: '/api/exports/export-1/download',
  createdBy: 'john@company.com',
  metadata: {
    dateRange: 'week',
    filters: { status: 'COMPLETED' },
  },
  ...overrides,
});

// Export Queue factory
export const createMockExportQueue = (overrides = {}) => ({
  id: 'queue-1',
  templateId: 'template-1',
  templateName: 'Work Orders Report',
  status: 'queued',
  priority: 'normal',
  requestedBy: 'john@company.com',
  requestedAt: '2024-01-15T11:00:00Z',
  estimatedDuration: 180000, // 3 minutes in ms
  progress: 0,
  parameters: {
    dateRange: 'month',
    format: 'xlsx',
  },
  ...overrides,
});

// Export Stats factory
export const createMockExportStats = (overrides = {}) => ({
  totalExports: 156,
  successfulExports: 142,
  failedExports: 14,
  totalRecords: 15670,
  totalSize: 2547200, // bytes
  averageDuration: 245000, // ms
  topTemplates: [
    { templateId: 'template-1', name: 'Work Orders Report', count: 45 },
    { templateId: 'template-2', name: 'Asset Maintenance Report', count: 32 },
  ],
  recentActivity: [
    { date: '2024-01-15', count: 8, successRate: 87.5 },
    { date: '2024-01-14', count: 12, successRate: 91.7 },
  ],
  ...overrides,
});

// Time Entry factory
export const createMockTimeEntry = (overrides = {}) => ({
  id: 1,
  workOrderId: 1,
  hours: 2.5,
  description: 'Replaced motor bearing and tested system',
  date: '2024-01-15',
  type: 'LABOR',
  isActive: true,
  createdBy: 'john@company.com',
  createdAt: '2024-01-15T14:30:00Z',
  ...overrides,
});

// Comment factory
export const createMockComment = (overrides = {}) => ({
  id: 1,
  content: 'Work progressing well, expecting completion by end of day',
  entityType: 'workOrder',
  entityId: 1,
  author: {
    id: 1,
    name: 'John Technician',
    email: 'john@company.com',
  },
  isInternal: false,
  createdAt: '2024-01-15T12:30:00Z',
  updatedAt: '2024-01-15T12:30:00Z',
  ...overrides,
});

// API Response factory
export const createMockApiResponse = (data: any, overrides = {}) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {},
  ...overrides,
});

// Error factory
export const createMockError = (message = 'Network Error', overrides = {}) => ({
  message,
  name: 'Error',
  response: {
    status: 500,
    statusText: 'Internal Server Error',
    data: { error: message },
  },
  ...overrides,
});

// Form validation error factory
export const createMockValidationError = (field: string, message: string) => ({
  type: 'validation',
  field,
  message,
});

// Performance metrics factory
export const createMockPerformanceMetrics = (overrides = {}) => ({
  renderTime: 150, // ms
  loadTime: 500, // ms
  memoryUsage: 25600, // bytes
  componentCount: 12,
  reRenderCount: 3,
  ...overrides,
});

// Browser environment factory
export const createMockBrowserEnvironment = (overrides = {}) => ({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  platform: 'Win32',
  language: 'en-US',
  online: true,
  cookieEnabled: true,
  doNotTrack: null,
  ...overrides,
});

// Mobile device factory
export const createMockMobileEnvironment = (overrides = {}) => ({
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
  platform: 'iPhone',
  language: 'en-US',
  online: true,
  touchEnabled: true,
  orientation: 'portrait',
  screenSize: { width: 375, height: 812 },
  ...overrides,
});

// Network condition factory
export const createMockNetworkCondition = (type: 'online' | 'offline' | 'slow' = 'online') => {
  const conditions = {
    online: { online: true, effectiveType: '4g', downlink: 10 },
    offline: { online: false, effectiveType: 'none', downlink: 0 },
    slow: { online: true, effectiveType: '2g', downlink: 0.5 },
  };
  return conditions[type];
};

// Industrial environment simulation factory
export const createMockIndustrialEnvironment = (overrides = {}) => ({
  temperature: 85, // Fahrenheit
  humidity: 65, // percent
  noiseLevel: 75, // decibels
  lighting: 'fluorescent',
  dustLevel: 'moderate',
  vibration: 'low',
  connectivity: 'wifi',
  signalStrength: 3, // out of 5
  powerCondition: 'stable',
  ...overrides,
});

// Create factories for different user roles
export const createMockAdmin = (overrides = {}) => 
  createMockUser({ role: 'ADMIN', name: 'Alice Admin', email: 'alice@company.com', ...overrides });

export const createMockManager = (overrides = {}) => 
  createMockUser({ role: 'MANAGER', name: 'Bob Manager', email: 'bob@company.com', ...overrides });

export const createMockTechnician = (overrides = {}) => 
  createMockUser({ role: 'TECHNICIAN', name: 'Charlie Tech', email: 'charlie@company.com', ...overrides });

// Create work orders with different statuses
export const createMockPendingWorkOrder = (overrides = {}) =>
  createMockWorkOrder({ status: 'PENDING', ...overrides });

export const createMockInProgressWorkOrder = (overrides = {}) =>
  createMockWorkOrder({ status: 'IN_PROGRESS', ...overrides });

export const createMockCompletedWorkOrder = (overrides = {}) =>
  createMockWorkOrder({ status: 'COMPLETED', ...overrides });

export const createMockOverdueWorkOrder = (overrides = {}) =>
  createMockWorkOrder({ 
    status: 'PENDING',
    dueDate: '2024-01-10T17:00:00Z', // Past date
    ...overrides 
  });

// Create work orders with different priorities
export const createMockUrgentWorkOrder = (overrides = {}) =>
  createMockWorkOrder({ priority: 'URGENT', ...overrides });

export const createMockHighPriorityWorkOrder = (overrides = {}) =>
  createMockWorkOrder({ priority: 'HIGH', ...overrides });

export const createMockLowPriorityWorkOrder = (overrides = {}) =>
  createMockWorkOrder({ priority: 'LOW', ...overrides });

// Create export items with different statuses
export const createMockProcessingExport = (overrides = {}) =>
  createMockExportHistory({ status: 'processing', completedAt: null, ...overrides });

export const createMockFailedExport = (overrides = {}) =>
  createMockExportHistory({ 
    status: 'failed', 
    error: 'Database connection timeout',
    ...overrides 
  });

export const createMockQueuedExport = (overrides = {}) =>
  createMockExportQueue({ status: 'queued', progress: 0, ...overrides });

export const createMockProcessingQueueExport = (overrides = {}) =>
  createMockExportQueue({ status: 'processing', progress: 45, ...overrides });

// Utility functions for creating arrays of mock data
export const createMockWorkOrderList = (count: number, overrides = {}) => 
  Array.from({ length: count }, (_, i) => createMockWorkOrder({ id: i + 1, ...overrides }));

export const createMockExportTemplateList = (count: number, overrides = {}) =>
  Array.from({ length: count }, (_, i) => createMockExportTemplate({ 
    id: `template-${i + 1}`, 
    name: `Template ${i + 1}`,
    ...overrides 
  }));

export const createMockExportHistoryList = (count: number, overrides = {}) =>
  Array.from({ length: count }, (_, i) => createMockExportHistory({ 
    id: `export-${i + 1}`,
    ...overrides 
  }));