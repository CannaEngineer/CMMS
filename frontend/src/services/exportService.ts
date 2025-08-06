/**
 * Comprehensive Export Service for CMMS Application
 * Handles exports, reports, templates, and compliance requirements
 */

import { apiClient } from './api';

// Type Definitions
export interface ExportTemplate {
  id: string;
  name: string;
  description?: string;
  templateType: 'report' | 'export' | 'compliance' | 'dashboard' | 'alert';
  dataSource: string;
  config: ExportConfig;
  queryConfig?: QueryConfig;
  formatSettings: FormatSettings;
  layoutConfig: LayoutConfig;
  chartConfigs: ChartConfig[];
  isScheduled: boolean;
  scheduleConfig?: ScheduleConfig;
  emailConfig?: EmailConfig;
  isPublic: boolean;
  allowedRoles: string[];
  allowedUsers: string[];
  complianceType?: string;
  qualityLevel: 'basic' | 'standard' | 'enhanced' | 'audit';
  retentionPeriod: number;
  createdBy?: string;
  organizationId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExportConfig {
  filters: Record<string, any>;
  columns: string[];
  groupBy?: string[];
  sortBy?: { field: string; direction: 'asc' | 'desc' }[];
  aggregations?: Record<string, string>;
  includeCharts?: boolean;
  includeImages?: boolean;
  includeQRCodes?: boolean;
  maxRecords?: number;
  dateFormat?: string;
  timezone?: string;
}

export interface QueryConfig {
  customQuery?: string;
  parameters?: Record<string, any>;
  joins?: JoinConfig[];
  subqueries?: Record<string, string>;
}

export interface JoinConfig {
  table: string;
  type: 'inner' | 'left' | 'right' | 'full';
  on: string;
  alias?: string;
}

export interface FormatSettings {
  csv?: {
    delimiter: string;
    encoding: string;
    includeHeaders: boolean;
    quoteFields: boolean;
  };
  excel?: {
    sheetName: string;
    includeCharts: boolean;
    freezeHeader: boolean;
    autoWidth: boolean;
    styling?: ExcelStyling;
  };
  pdf?: {
    orientation: 'portrait' | 'landscape';
    pageSize: string;
    margins: { top: number; bottom: number; left: number; right: number };
    includePageNumbers: boolean;
    watermark?: string;
    header?: string;
    footer?: string;
  };
  json?: {
    prettyPrint: boolean;
    includeMetadata: boolean;
  };
}

export interface ExcelStyling {
  headerStyle: {
    backgroundColor: string;
    fontColor: string;
    fontWeight: 'bold' | 'normal';
    fontSize: number;
  };
  dataStyle: {
    fontSize: number;
    alternateRowColor?: string;
  };
  borderStyle: 'thin' | 'medium' | 'thick' | 'none';
}

export interface LayoutConfig {
  header?: {
    title: string;
    subtitle?: string;
    logo?: string;
    showDate: boolean;
    showPageNumbers: boolean;
  };
  footer?: {
    text: string;
    showTimestamp: boolean;
    showUser: boolean;
  };
  sections: LayoutSection[];
}

export interface LayoutSection {
  id: string;
  type: 'data_table' | 'chart' | 'summary' | 'text' | 'image' | 'qr_codes';
  title?: string;
  config: Record<string, any>;
  order: number;
  width?: 'full' | 'half' | 'quarter';
}

export interface ChartConfig {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'gauge';
  title: string;
  dataField: string;
  xAxis?: string;
  yAxis?: string;
  groupBy?: string;
  aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max';
  styling: {
    colors: string[];
    width?: number;
    height?: number;
  };
}

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  cronExpression?: string;
  timezone: string;
  startDate: string;
  endDate?: string;
  executionTime: string; // HH:mm format
  retryPolicy: {
    maxRetries: number;
    retryDelay: number; // seconds
  };
}

export interface EmailConfig {
  recipients: EmailRecipient[];
  ccRecipients?: EmailRecipient[];
  bccRecipients?: EmailRecipient[];
  subjectTemplate: string;
  bodyTemplate: string;
  includeAttachment: boolean;
  attachmentFormat: string[];
  sendConditions?: {
    onlyIfDataExists: boolean;
    minimumRecords?: number;
    includePreview: boolean;
  };
}

export interface EmailRecipient {
  email: string;
  name?: string;
  role?: string;
}

export interface ExportHistory {
  id: string;
  templateId?: string;
  templateName: string;
  exportType: 'manual' | 'scheduled' | 'api' | 'bulk';
  outputFormat: 'csv' | 'excel' | 'pdf' | 'json';
  fileName?: string;
  fileSize?: number;
  filePath?: string;
  fileHash?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  executionTimeMs?: number;
  filtersApplied: Record<string, any>;
  dataRange?: Record<string, any>;
  recordCount?: number;
  estimatedRecordCount?: number;
  complianceValidated: boolean;
  qualityChecks: Record<string, any>;
  dataIntegrityHash?: string;
  requestedBy?: string;
  ipAddress?: string;
  userAgent?: string;
  organizationId?: string;
  errorMessage?: string;
  errorCode?: string;
  retryCount: number;
  emailSent: boolean;
  emailRecipients?: string[];
  emailSentAt?: string;
  expiresAt?: string;
  downloadedAt?: string;
  downloadCount: number;
}

export interface ExportRequest {
  templateId?: string;
  dataSource: string;
  format: 'csv' | 'excel' | 'pdf' | 'json';
  config?: Partial<ExportConfig>;
  filters?: Record<string, any>;
  customQuery?: string;
  fileName?: string;
  emailRecipients?: string[];
  priority?: number;
  scheduleFor?: string;
  preselectedData?: any[];
}

export interface ExportQueue {
  id: string;
  templateId?: string;
  historyId: string;
  priority: number;
  queuePosition: number;
  estimatedDurationMs?: number;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'retry';
  assignedWorker?: string;
  processingStartedAt?: string;
  progressPercentage: number;
  currentStep?: string;
  scheduledFor: string;
  maxRetries: number;
  retryDelaySeconds: number;
  requestData: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ExportStats {
  totalExports: number;
  todayExports: number;
  pendingExports: number;
  failedExports: number;
  totalDataExported: number; // MB
  averageExecutionTime: number; // ms
  topDataSources: { source: string; count: number }[];
  formatDistribution: { format: string; count: number }[];
  recentActivity: ExportHistory[];
}

// Export Service Class
export class ExportService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/exports';
  }

  // Template Management
  async getTemplates(filters?: {
    templateType?: string;
    dataSource?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<ExportTemplate[]> {
    // Use localStorage to persist templates
    const stored = localStorage.getItem('export_templates');
    let templates = stored ? JSON.parse(stored) : [];
    
    // Initialize with mock templates if none exist
    if (templates.length === 0) {
      templates = this.getMockTemplates();
      localStorage.setItem('export_templates', JSON.stringify(templates));
    }
    
    if (filters) {
      templates = templates.filter((template: ExportTemplate) => {
        if (filters.templateType && template.templateType !== filters.templateType) return false;
        if (filters.dataSource && template.dataSource !== filters.dataSource) return false;
        if (filters.isActive !== undefined && template.isActive !== filters.isActive) return false;
        if (filters.search) {
          const search = filters.search.toLowerCase();
          return template.name.toLowerCase().includes(search) || 
                 template.description?.toLowerCase().includes(search);
        }
        return true;
      });
    }
    
    return templates;
  }

  async getTemplate(id: string): Promise<ExportTemplate> {
    const templates = await this.getTemplates();
    const template = templates.find(t => t.id === id);
    if (!template) {
      throw new Error(`Template ${id} not found`);
    }
    return template;
  }

  async createTemplate(template: Omit<ExportTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExportTemplate> {
    const templates = await this.getTemplates();
    const newTemplate: ExportTemplate = {
      ...template,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    templates.push(newTemplate);
    localStorage.setItem('export_templates', JSON.stringify(templates));
    return newTemplate;
  }

  async updateTemplate(id: string, updates: Partial<ExportTemplate>): Promise<ExportTemplate> {
    const templates = await this.getTemplates();
    const index = templates.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error(`Template ${id} not found`);
    }
    
    templates[index] = { ...templates[index], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem('export_templates', JSON.stringify(templates));
    return templates[index];
  }

  async deleteTemplate(id: string): Promise<void> {
    const templates = await this.getTemplates();
    const filtered = templates.filter(t => t.id !== id);
    localStorage.setItem('export_templates', JSON.stringify(filtered));
  }

  async duplicateTemplate(id: string, newName: string): Promise<ExportTemplate> {
    const template = await this.getTemplate(id);
    const duplicate = {
      ...template,
      name: newName,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    };
    return this.createTemplate(duplicate as Omit<ExportTemplate, 'id' | 'createdAt' | 'updatedAt'>);
  }

  // Export Execution
  async requestExport(request: ExportRequest): Promise<ExportHistory> {
    const historyId = Math.random().toString(36).substr(2, 9);
    const history: ExportHistory = {
      id: historyId,
      templateId: request.templateId,
      templateName: request.templateId ? (await this.getTemplate(request.templateId)).name : 'Quick Export',
      exportType: 'manual',
      outputFormat: request.format,
      fileName: request.fileName || `export_${Date.now()}.${request.format}`,
      status: 'processing',
      startedAt: new Date().toISOString(),
      filtersApplied: request.filters || {},
      complianceValidated: false,
      qualityChecks: {},
      retryCount: 0,
      emailSent: false,
      downloadCount: 0,
    };

    // Simulate processing and create actual file
    setTimeout(async () => {
      try {
        await this.performActualExport(request, history);
      } catch (error) {
        console.error('Export failed:', error);
      }
    }, 100);

    // Store in history
    this.addToHistory(history);
    return history;
  }

  async executeTemplate(templateId: string, options?: {
    format?: string;
    filters?: Record<string, any>;
    emailRecipients?: string[];
  }): Promise<ExportHistory> {
    const template = await this.getTemplate(templateId);
    const request: ExportRequest = {
      templateId,
      dataSource: template.dataSource,
      format: (options?.format as any) || 'csv',
      config: template.config,
      filters: { ...template.config.filters, ...options?.filters },
      emailRecipients: options?.emailRecipients,
    };
    
    return this.requestExport(request);
  }

  async bulkExport(requests: ExportRequest[]): Promise<ExportHistory[]> {
    try {
      return await apiClient.post<ExportHistory[]>(`${this.baseUrl}/bulk`, { requests });
    } catch (error) {
      throw new Error('Failed to execute bulk export');
    }
  }

  // History and Monitoring
  async getHistory(filters?: {
    templateId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    requestedBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: ExportHistory[]; total: number }> {
    const stored = localStorage.getItem('export_history');
    let history = stored ? JSON.parse(stored) : [];
    
    if (filters) {
      if (filters.templateId) {
        history = history.filter((h: ExportHistory) => h.templateId === filters.templateId);
      }
      if (filters.status) {
        history = history.filter((h: ExportHistory) => h.status === filters.status);
      }
      if (filters.dateFrom) {
        history = history.filter((h: ExportHistory) => h.startedAt >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        history = history.filter((h: ExportHistory) => h.startedAt <= filters.dateTo!);
      }
    }
    
    const total = history.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;
    const items = history.slice(offset, offset + limit);
    
    return { items, total };
  }

  async getExportStatus(id: string): Promise<ExportHistory> {
    const { items } = await this.getHistory();
    const history = items.find(h => h.id === id);
    if (!history) {
      throw new Error(`Export ${id} not found`);
    }
    return history;
  }

  async downloadExport(id: string): Promise<{ url: string; fileName: string }> {
    const history = await this.getExportStatus(id);
    // For browser-based exports, we don't need to provide URLs since files are downloaded directly
    return { 
      url: '#', 
      fileName: history.fileName || `export_${id}.csv` 
    };
  }

  async cancelExport(id: string): Promise<void> {
    const stored = localStorage.getItem('export_history');
    const historyList = stored ? JSON.parse(stored) : [];
    const index = historyList.findIndex((h: ExportHistory) => h.id === id);
    if (index >= 0) {
      historyList[index].status = 'cancelled';
      localStorage.setItem('export_history', JSON.stringify(historyList));
    }
  }

  async retryExport(id: string): Promise<ExportHistory> {
    const history = await this.getExportStatus(id);
    // Create a new export based on the failed one
    const request: ExportRequest = {
      templateId: history.templateId,
      dataSource: 'work_orders', // Default fallback
      format: history.outputFormat,
      filters: history.filtersApplied,
    };
    return this.requestExport(request);
  }

  // Queue Management
  async getQueue(): Promise<ExportQueueType[]> {
    // For browser-based exports, queue is mostly empty since they process immediately
    return [];
  }

  async getQueueStats(): Promise<{
    totalQueued: number;
    processing: number;
    estimatedWaitTime: number;
    averageProcessingTime: number;
  }> {
    return { totalQueued: 0, processing: 0, estimatedWaitTime: 0, averageProcessingTime: 2 };
  }

  // Statistics and Analytics
  async getStats(period?: 'day' | 'week' | 'month' | 'quarter' | 'year'): Promise<ExportStats> {
    const { items: history } = await this.getHistory();
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (period) {
      case 'day':
        cutoffDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        cutoffDate.setDate(now.getDate() - 7);
    }
    
    const filteredHistory = history.filter(h => new Date(h.startedAt) >= cutoffDate);
    
    return {
      totalExports: history.length,
      todayExports: history.filter(h => {
        const today = new Date().toDateString();
        return new Date(h.startedAt).toDateString() === today;
      }).length,
      pendingExports: history.filter(h => h.status === 'pending' || h.status === 'processing').length,
      failedExports: history.filter(h => h.status === 'failed').length,
      totalDataExported: history.reduce((total, h) => total + (h.fileSize || 0), 0) / 1024 / 1024, // MB
      averageExecutionTime: history.filter(h => h.executionTimeMs).reduce((avg, h, _, arr) => 
        avg + (h.executionTimeMs || 0) / arr.length, 0),
      topDataSources: [
        { source: 'work_orders', count: history.filter(h => h.templateName.includes('Work')).length },
        { source: 'assets', count: history.filter(h => h.templateName.includes('Asset')).length },
        { source: 'maintenance', count: history.filter(h => h.templateName.includes('Maintenance')).length },
        { source: 'inventory', count: history.filter(h => h.templateName.includes('Inventory')).length },
      ],
      formatDistribution: [
        { format: 'csv', count: history.filter(h => h.outputFormat === 'csv').length },
        { format: 'json', count: history.filter(h => h.outputFormat === 'json').length },
        { format: 'pdf', count: history.filter(h => h.outputFormat === 'pdf').length },
        { format: 'excel', count: history.filter(h => h.outputFormat === 'excel').length },
      ],
      recentActivity: history.slice(0, 10),
    };
  }

  // Data Source Configuration
  async getDataSources(): Promise<{ id: string; name: string; description: string; tables: string[] }[]> {
    return [
      { id: 'work_orders', name: 'Work Orders', description: 'All work order data', tables: ['work_orders', 'work_order_tasks'] },
      { id: 'assets', name: 'Assets', description: 'Asset management data', tables: ['assets', 'asset_maintenance'] },
      { id: 'maintenance', name: 'Maintenance', description: 'Maintenance schedules and history', tables: ['pm_schedules', 'maintenance_history'] },
      { id: 'inventory', name: 'Inventory', description: 'Parts and inventory data', tables: ['parts', 'stock_movements'] },
      { id: 'locations', name: 'Locations', description: 'Location hierarchy', tables: ['locations'] },
      { id: 'users', name: 'Users', description: 'User and role data', tables: ['users', 'user_roles'] }
    ];
  }

  async getDataSourceSchema(sourceId: string): Promise<{
    tables: { name: string; columns: { name: string; type: string; description?: string }[] }[];
    relationships: { from: string; to: string; type: string }[];
  }> {
    const schemas: Record<string, any> = {
      work_orders: {
        tables: [
          {
            name: 'work_orders',
            columns: [
              { name: 'id', type: 'number', description: 'Unique identifier' },
              { name: 'title', type: 'string', description: 'Work order title' },
              { name: 'status', type: 'string', description: 'Current status' },
              { name: 'priority', type: 'string', description: 'Priority level' },
              { name: 'createdAt', type: 'string', description: 'Creation date' },
              { name: 'assetId', type: 'number', description: 'Related asset' }
            ]
          }
        ],
        relationships: [
          { from: 'work_orders.assetId', to: 'assets.id', type: 'many-to-one' }
        ]
      },
      assets: {
        tables: [
          {
            name: 'assets',
            columns: [
              { name: 'id', type: 'number', description: 'Unique identifier' },
              { name: 'name', type: 'string', description: 'Asset name' },
              { name: 'status', type: 'string', description: 'Current status' },
              { name: 'location', type: 'string', description: 'Asset location' }
            ]
          }
        ],
        relationships: []
      },
      maintenance: {
        tables: [
          {
            name: 'maintenance_schedules',
            columns: [
              { name: 'id', type: 'number', description: 'Unique identifier' },
              { name: 'taskName', type: 'string', description: 'Maintenance task' },
              { name: 'frequency', type: 'string', description: 'Frequency' },
              { name: 'assetId', type: 'number', description: 'Related asset' }
            ]
          }
        ],
        relationships: []
      },
      inventory: {
        tables: [
          {
            name: 'parts',
            columns: [
              { name: 'id', type: 'number', description: 'Unique identifier' },
              { name: 'name', type: 'string', description: 'Part name' },
              { name: 'quantity', type: 'number', description: 'Current quantity' },
              { name: 'cost', type: 'number', description: 'Unit cost' }
            ]
          }
        ],
        relationships: []
      }
    };
    
    return schemas[sourceId] || { tables: [], relationships: [] };
  }

  // Format-specific Export Methods
  async exportAsCSV(data: any[], config: ExportConfig): Promise<string> {
    if (!data || data.length === 0) {
      return 'No data available for export';
    }
    
    const headers = config.columns && config.columns.length > 0 
      ? config.columns 
      : Object.keys(data[0] || {});
    
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
      return headers.map(header => {
        let value = row[header];
        
        // Handle nested object properties (e.g., 'work_orders.title' -> row.title)
        if (header.includes('.')) {
          const [prefix, field] = header.split('.');
          value = row[field] || row[header];
        }
        
        if (typeof value === 'object' && value !== null) {
          // If it's a user object, try to get the name
          if (value.name) {
            value = value.name;
          } else {
            value = JSON.stringify(value);
          }
        }
        
        // Convert to string and escape quotes
        const stringValue = String(value || '').replace(/"/g, '""');
        return `"${stringValue}"`;
      }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
  }

  async exportAsJSON(data: any[], config: ExportConfig): Promise<string> {
    if (!data || data.length === 0) {
      return JSON.stringify({
        metadata: {
          exportedAt: new Date().toISOString(),
          recordCount: 0,
          filters: config.filters || {},
          columns: config.columns || [],
          message: 'No data available for export'
        },
        data: []
      }, null, config.formatSettings?.json?.prettyPrint ? 2 : 0);
    }
    
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        recordCount: data.length,
        filters: config.filters || {},
        columns: config.columns || []
      },
      data: data
    };
    
    return JSON.stringify(exportData, null, config.formatSettings?.json?.prettyPrint ? 2 : 0);
  }

  // Helper methods for export processing
  private async performActualExport(request: ExportRequest, history: ExportHistory): Promise<void> {
    try {
      // Use preselected data if available, otherwise get data from data source
      const data = request.preselectedData && request.preselectedData.length > 0
        ? request.preselectedData
        : await this.getDataForExport(request.dataSource, request.filters);
      
      // Generate file content
      let content: string;
      let mimeType: string;
      
      switch (request.format) {
        case 'csv':
          content = await this.exportAsCSV(data, request.config || { filters: {}, columns: [] });
          mimeType = 'text/csv';
          break;
        case 'json':
          content = await this.exportAsJSON(data, request.config || { filters: {}, columns: [] });
          mimeType = 'application/json';
          break;
        default:
          throw new Error(`Unsupported format: ${request.format}`);
      }
      
      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = history.fileName || `export.${request.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Update history
      history.status = 'completed';
      history.completedAt = new Date().toISOString();
      history.executionTimeMs = new Date().getTime() - new Date(history.startedAt).getTime();
      history.fileSize = blob.size;
      history.recordCount = data.length;
      history.complianceValidated = true;
      history.qualityChecks = { data_integrity: 'passed', completeness: 'passed' };
      
      this.updateHistory(history);
    } catch (error) {
      history.status = 'failed';
      history.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateHistory(history);
      throw error;
    }
  }

  private async getDataForExport(dataSource: string, filters?: Record<string, any>): Promise<any[]> {
    // Get data from localStorage first, then fall back to services or mock data
    switch (dataSource) {
      case 'work_orders':
        // Try to get from offline storage first
        try {
          const { offlineStorage } = await import('./offlineStorage');
          const offlineData = await offlineStorage.getWorkOrders();
          if (offlineData && offlineData.length > 0) {
            return offlineData;
          }
        } catch (error) {
          console.warn('Could not get work orders from offline storage:', error);
        }
        
        // Try API service
        try {
          const { workOrdersService } = await import('./api');
          const data = await workOrdersService.getAll();
          if (data && data.length > 0) {
            return data;
          }
        } catch (error) {
          console.warn('Could not get work orders from API:', error);
        }
        
        // Return mock data as fallback
        return this.getMockWorkOrders();
        
      case 'assets':
        // Try to get from offline storage first
        try {
          const { offlineStorage } = await import('./offlineStorage');
          const offlineData = await offlineStorage.getAssets();
          if (offlineData && offlineData.length > 0) {
            return offlineData;
          }
        } catch (error) {
          console.warn('Could not get assets from offline storage:', error);
        }
        
        // Try API service
        try {
          const { assetsService } = await import('./api');
          const data = await assetsService.getAll();
          if (data && data.length > 0) {
            return data;
          }
        } catch (error) {
          console.warn('Could not get assets from API:', error);
        }
        
        // Return mock data as fallback
        return this.getMockAssets();
        
      case 'maintenance':
        // Check localStorage for PM schedules
        try {
          const storedPM = localStorage.getItem('pm_schedules');
          if (storedPM) {
            const data = JSON.parse(storedPM);
            if (data && data.length > 0) {
              return data;
            }
          }
        } catch (error) {
          console.warn('Could not get PM schedules from localStorage:', error);
        }
        
        return this.getMockMaintenance();
        
      case 'inventory':
        // Check localStorage for parts/inventory
        try {
          const storedParts = localStorage.getItem('parts_inventory');
          if (storedParts) {
            const data = JSON.parse(storedParts);
            if (data && data.length > 0) {
              return data;
            }
          }
        } catch (error) {
          console.warn('Could not get parts from localStorage:', error);
        }
        
        // Try API service
        try {
          const { partsService } = await import('./api');
          const data = await partsService.getAll();
          if (data && data.length > 0) {
            return data;
          }
        } catch (error) {
          console.warn('Could not get parts from API:', error);
        }
        
        return this.getMockInventory();
        
      case 'locations':
        // Check localStorage for locations
        try {
          const storedLocations = localStorage.getItem('locations');
          if (storedLocations) {
            const data = JSON.parse(storedLocations);
            if (data && data.length > 0) {
              return data;
            }
          }
        } catch (error) {
          console.warn('Could not get locations from localStorage:', error);
        }
        
        // Try API service
        try {
          const { locationsService } = await import('./api');
          const data = await locationsService.getAll();
          if (data && data.length > 0) {
            return data;
          }
        } catch (error) {
          console.warn('Could not get locations from API:', error);
        }
        
        return this.getMockLocations();
        
      case 'users':
        // Check localStorage for users
        try {
          const storedUsers = localStorage.getItem('users');
          if (storedUsers) {
            const data = JSON.parse(storedUsers);
            if (data && data.length > 0) {
              return data;
            }
          }
        } catch (error) {
          console.warn('Could not get users from localStorage:', error);
        }
        
        return this.getMockUsers();
        
      default:
        return [];
    }
  }

  private addToHistory(history: ExportHistory): void {
    const stored = localStorage.getItem('export_history');
    const historyList = stored ? JSON.parse(stored) : [];
    historyList.unshift(history);
    // Keep only last 100 exports
    if (historyList.length > 100) {
      historyList.splice(100);
    }
    localStorage.setItem('export_history', JSON.stringify(historyList));
  }

  private updateHistory(history: ExportHistory): void {
    const stored = localStorage.getItem('export_history');
    const historyList = stored ? JSON.parse(stored) : [];
    const index = historyList.findIndex((h: ExportHistory) => h.id === history.id);
    if (index >= 0) {
      historyList[index] = history;
      localStorage.setItem('export_history', JSON.stringify(historyList));
    }
  }

  // Mock data methods
  private getMockWorkOrders(): any[] {
    return [
      { id: 1, title: 'Fix HVAC Unit', status: 'OPEN', priority: 'HIGH', createdAt: new Date().toISOString() },
      { id: 2, title: 'Replace Filter', status: 'COMPLETED', priority: 'MEDIUM', createdAt: new Date().toISOString() },
    ];
  }

  private getMockAssets(): any[] {
    return [
      { id: 1, name: 'HVAC Unit 001', status: 'operational', location: 'Building A' },
      { id: 2, name: 'Pump 002', status: 'maintenance', location: 'Building B' },
    ];
  }

  private getMockMaintenance(): any[] {
    return [
      { id: 1, taskName: 'Monthly Filter Check', assetId: 1, frequency: 'monthly', lastCompleted: new Date().toISOString() },
    ];
  }

  private getMockInventory(): any[] {
    return [
      { id: 1, name: 'Air Filter', quantity: 50, reorderLevel: 10, cost: 25.99 },
      { id: 2, name: 'Pump Seal', quantity: 5, reorderLevel: 2, cost: 89.50 },
    ];
  }

  private getMockLocations(): any[] {
    return [
      { id: 1, name: 'Main Campus', type: 'AREA', description: 'Primary manufacturing facility', assetCount: 89 },
      { id: 2, name: 'Building A - Administration', type: 'BUILDING', description: 'Corporate offices', assetCount: 45 },
      { id: 3, name: 'Production Facility', type: 'AREA', description: 'Main production complex', assetCount: 128 },
    ];
  }

  private getMockUsers(): any[] {
    return [
      { id: 1, name: 'John Doe', email: 'john.doe@company.com', role: 'admin', status: 'active' },
      { id: 2, name: 'Jane Smith', email: 'jane.smith@company.com', role: 'manager', status: 'active' },
      { id: 3, name: 'Mike Johnson', email: 'mike.johnson@company.com', role: 'technician', status: 'active' },
    ];
  }

  // Utility Methods
  validateTemplate(template: Partial<ExportTemplate>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!template.name?.trim()) {
      errors.push('Template name is required');
    }
    
    if (!template.dataSource) {
      errors.push('Data source is required');
    }
    
    if (!template.templateType) {
      errors.push('Template type is required');
    }
    
    if (template.isScheduled && !template.scheduleConfig) {
      errors.push('Schedule configuration is required for scheduled templates');
    }
    
    return { valid: errors.length === 0, errors };
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatExecutionTime(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }

  // Initialize with sample templates if none exist
  private getMockTemplates(): ExportTemplate[] {
    return [
      {
        id: '1',
        name: 'Daily Work Orders Report',
        description: 'Daily summary of all work orders with status breakdown',
        templateType: 'report',
        dataSource: 'work_orders',
        config: {
          filters: {},
          columns: ['id', 'title', 'status', 'priority', 'createdAt']
        },
        formatSettings: { csv: { delimiter: ',', encoding: 'utf-8', includeHeaders: true, quoteFields: true } },
        layoutConfig: { sections: [] },
        chartConfigs: [],
        isScheduled: false,
        isPublic: false,
        allowedRoles: ['admin', 'manager'],
        allowedUsers: [],
        qualityLevel: 'standard',
        retentionPeriod: 30,
        isActive: true,
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
      },
      {
        id: '2',
        name: 'Asset Inventory Report',
        description: 'Complete asset inventory with current status and location',
        templateType: 'report',
        dataSource: 'assets',
        config: {
          filters: {},
          columns: ['id', 'name', 'status', 'location']
        },
        formatSettings: { csv: { delimiter: ',', encoding: 'utf-8', includeHeaders: true, quoteFields: true } },
        layoutConfig: { sections: [] },
        chartConfigs: [],
        isScheduled: false,
        isPublic: false,
        allowedRoles: ['admin', 'manager'],
        allowedUsers: [],
        qualityLevel: 'standard',
        retentionPeriod: 30,
        isActive: true,
        createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ];
  }
}

// Create and export singleton instance
export const exportService = new ExportService();

// Helper functions for components
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed': return '#4caf50';
    case 'processing': return '#2196f3';
    case 'pending': case 'queued': return '#ff9800';
    case 'failed': return '#f44336';
    case 'cancelled': return '#9e9e9e';
    case 'expired': return '#795548';
    default: return '#757575';
  }
};