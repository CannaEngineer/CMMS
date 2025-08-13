// Portal Service - API integration for portal management
import { apiClient } from './api';
import {
  transformPortalForBackend,
  transformPortalFromBackend,
  transformPortalTypeToBackend,
  transformPortalTypeToFrontend,
  transformPortalFieldForBackend,
  transformPortalFieldFromBackend
} from '../utils/portalTransforms';
import {
  validatePortalForBackend,
  sanitizePortalData
} from '../utils/portalValidation';
import type { 
  Portal, 
  PortalSubmission, 
  PortalField,
  PortalBranding,
  PortalTemplate,
  PortalAnalytics,
  PortalSearchFilters,
  CreatePortalRequest,
  UpdatePortalRequest,
  SubmitPortalRequest,
  PortalCommunication
} from '../types/portal';

export class PortalService {
  private baseUrl = '/api/portals';
  private publicBaseUrl = '/api/public/portals';

  // Portal Management (Admin)
  async getAll(filters?: PortalSearchFilters): Promise<Portal[]> {
    const queryParams = new URLSearchParams();
    
    // Transform frontend filter types to backend format
    if (filters?.type) queryParams.append('type', transformPortalTypeToBackend(filters.type));
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.searchTerm) queryParams.append('search', filters.searchTerm);
    if (filters?.organizationId) queryParams.append('organizationId', filters.organizationId);
    if (filters?.createdAfter) queryParams.append('createdAfter', filters.createdAfter);
    if (filters?.createdBefore) queryParams.append('createdBefore', filters.createdBefore);
    
    const query = queryParams.toString();
    const url = query ? `${this.baseUrl}?${query}` : this.baseUrl;
    
    try {
      const portals = await apiClient.get<any[]>(url);
      return Array.isArray(portals) ? portals.map(p => transformPortalFromBackend(p)) : [];
    } catch (error) {
      console.error('Error fetching portals:', error);
      return [];
    }
  }

  async getById(id: string): Promise<Portal> {
    try {
      const portal = await apiClient.get<any>(`${this.baseUrl}/${id}`);
      return transformPortalFromBackend(portal);
    } catch (error) {
      console.error('Error fetching portal by ID:', error);
      throw error;
    }
  }

  // Removed - now using transformPortalFromBackend from utils

  async create(portal: CreatePortalRequest): Promise<Portal> {
    try {
      // Sanitize and validate portal data
      const sanitizedPortal = sanitizePortalData(portal);
      const validation = validatePortalForBackend(sanitizedPortal);
      
      if (!validation.isValid) {
        const errorMessages = validation.errors.join('; ');
        throw new Error(`Portal validation failed: ${errorMessages}`);
      }
      
      // Transform portal data to backend format
      const backendPortal = transformPortalForBackend(sanitizedPortal);
      console.log('Original portal data:', JSON.stringify(portal, null, 2));
      console.log('Transformed portal data to backend:', JSON.stringify(backendPortal, null, 2));
      
      const created = await apiClient.post<any>(this.baseUrl, backendPortal);
      return transformPortalFromBackend(created);
    } catch (error) {
      console.error('Error creating portal:', error);
      throw error;
    }
  }

  async update(id: string, portal: UpdatePortalRequest): Promise<Portal> {
    try {
      // Transform portal data to backend format
      const backendPortal = transformPortalForBackend(portal);
      console.log('Updating portal with ID:', id, 'Data:', JSON.stringify(backendPortal, null, 2));
      const updated = await apiClient.put<any>(`${this.baseUrl}/${id}`, backendPortal);
      return transformPortalFromBackend(updated);
    } catch (error) {
      console.error('Error updating portal:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await apiClient.delete(`${this.baseUrl}/${id}`);
    } catch (error: any) {
      // Log the error for debugging
      console.error('Portal deletion error:', error);
      
      // Re-throw the error with proper structure for React Query
      if (error.response) {
        error.status = error.response.status;
      }
      throw error;
    }
  }

  async duplicate(id: string, name?: string): Promise<Portal> {
    try {
      const duplicated = await apiClient.post<any>(`${this.baseUrl}/${id}/duplicate`, { name });
      return transformPortalFromBackend(duplicated);
    } catch (error) {
      console.error('Error duplicating portal:', error);
      throw error;
    }
  }

  // Portal Fields Management
  async getFields(portalId: string): Promise<PortalField[]> {
    return apiClient.get<PortalField[]>(`${this.baseUrl}/${portalId}/fields`);
  }

  async updateFields(portalId: string, fields: Partial<PortalField>[]): Promise<PortalField[]> {
    try {
      // Transform fields to backend format
      const backendFields = fields.map(transformPortalFieldForBackend);
      const updated = await apiClient.put<any[]>(`${this.baseUrl}/${portalId}/fields`, { fields: backendFields });
      return updated.map(transformPortalFieldFromBackend);
    } catch (error) {
      console.error('Error updating portal fields:', error);
      throw error;
    }
  }

  // Portal Branding
  async getBranding(portalId: string): Promise<PortalBranding> {
    return apiClient.get<PortalBranding>(`${this.baseUrl}/${portalId}/branding`);
  }

  async updateBranding(portalId: string, branding: Partial<PortalBranding>): Promise<PortalBranding> {
    return apiClient.put<PortalBranding>(`${this.baseUrl}/${portalId}/branding`, branding);
  }

  // Portal Templates
  async getTemplates(type?: string): Promise<PortalTemplate[]> {
    const url = type ? `${this.baseUrl}/templates?type=${type}` : `${this.baseUrl}/templates`;
    return apiClient.get<PortalTemplate[]>(url);
  }

  async createFromTemplate(templateId: string, customization: Partial<CreatePortalRequest>): Promise<Portal> {
    return apiClient.post<Portal>(`${this.baseUrl}/templates/${templateId}/create`, customization);
  }

  // Portal Analytics
  async getAnalytics(portalId: string, timeframe: string = '30d'): Promise<PortalAnalytics> {
    return apiClient.get<PortalAnalytics>(`${this.baseUrl}/${portalId}/analytics?timeframe=${timeframe}`);
  }

  async trackEvent(portalId: string, event: {
    eventType: string;
    eventData?: Record<string, any>;
    sessionId?: string;
    userAgent?: string;
    referrer?: string;
    userLocation?: { latitude: number; longitude: number };
  }): Promise<void> {
    return apiClient.post(`${this.baseUrl}/${portalId}/analytics/events`, event);
  }

  // QR Code Management
  async generateQRCode(portalId: string, options?: {
    size?: number;
    format?: 'png' | 'svg';
    includeTracking?: boolean;
  }): Promise<{ qrCodeUrl: string; trackingUrl: string }> {
    return apiClient.post(`${this.baseUrl}/${portalId}/qr-code`, options || {});
  }

  // Public Portal Access (No Auth Required)
  async getPublicPortal(slug: string): Promise<{
    portal: Omit<Portal, 'internalSettings'>;
    fields: PortalField[];
    branding: PortalBranding;
  }> {
    return apiClient.get(`${this.publicBaseUrl}/${slug}`);
  }

  async checkRateLimit(portalSlug: string, ipAddress: string): Promise<{
    allowed: boolean;
    remainingRequests: number;
    resetTime: string;
  }> {
    return apiClient.get(`${this.publicBaseUrl}/${portalSlug}/rate-limit?ip=${ipAddress}`);
  }

  // Portal Submissions (Public)
  async submitPortal(request: SubmitPortalRequest): Promise<{
    submissionId: string;
    trackingCode: string;
    message: string;
  }> {
    return apiClient.post(`${this.publicBaseUrl}/submit`, request);
  }

  async getSubmissionStatus(trackingCode: string): Promise<{
    status: string;
    statusMessage: string;
    submittedAt: string;
    lastUpdated: string;
    communications: PortalCommunication[];
  }> {
    return apiClient.get(`${this.publicBaseUrl}/submission-status/${trackingCode}`);
  }

  // File Upload for Submissions
  async uploadSubmissionFile(
    portalSlug: string, 
    file: File, 
    fieldName: string,
    sessionId?: string
  ): Promise<{
    fileId: string;
    filename: string;
    url: string;
    size: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fieldName', fieldName);
    if (sessionId) formData.append('sessionId', sessionId);

    return apiClient.post(`${this.publicBaseUrl}/${portalSlug}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Submission Management (Admin)
  async getSubmissions(filters?: {
    portalId?: string;
    status?: string;
    submittedAfter?: string;
    submittedBefore?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    submissions: PortalSubmission[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
  }> {
    const queryParams = new URLSearchParams();
    
    if (filters?.portalId) queryParams.append('portalId', filters.portalId);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.submittedAfter) queryParams.append('submittedAfter', filters.submittedAfter);
    if (filters?.submittedBefore) queryParams.append('submittedBefore', filters.submittedBefore);
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    
    const query = queryParams.toString();
    const url = query ? `${this.baseUrl}?${query}` : this.baseUrl;
    
    return apiClient.get(url);
  }

  async getSubmissionById(id: string): Promise<PortalSubmission> {
    return apiClient.get<PortalSubmission>(`${this.baseUrl}/${id}`);
  }

  async updateSubmissionStatus(
    id: string, 
    status: string, 
    reviewNotes?: string,
    internalNotes?: string
  ): Promise<PortalSubmission> {
    return apiClient.put<PortalSubmission>(`${this.baseUrl}/${id}/status`, {
      status,
      reviewNotes,
      internalNotes
    });
  }

  async createWorkOrderFromSubmission(
    submissionId: string,
    workOrderData?: {
      title?: string;
      description?: string;
      priority?: string;
      assignedTo?: string;
      assetId?: string;
      locationId?: string;
    }
  ): Promise<{ workOrderId: string }> {
    return apiClient.post(`${this.baseUrl}/${submissionId}/work-order`, workOrderData || {});
  }

  // Communication with Submitters
  async getCommunications(submissionId: string): Promise<PortalCommunication[]> {
    return apiClient.get<PortalCommunication[]>(`${this.baseUrl}/${submissionId}/communications`);
  }

  async addCommunication(
    submissionId: string,
    message: string,
    messageType: string = 'MESSAGE',
    isInternal: boolean = false,
    sendEmail: boolean = true
  ): Promise<PortalCommunication> {
    return apiClient.post<PortalCommunication>(`${this.baseUrl}/${submissionId}/communications`, {
      message,
      messageType,
      isInternal,
      sendEmail
    });
  }

  // Bulk Operations
  async bulkUpdateSubmissions(
    submissionIds: string[],
    updates: {
      status?: string;
      reviewNotes?: string;
      assignedTo?: string;
    }
  ): Promise<{ updated: number; failed: string[] }> {
    return apiClient.post(`${this.baseUrl}/bulk-update`, {
      submissionIds,
      updates
    });
  }

  async exportSubmissions(
    filters: {
      portalId?: string;
      status?: string;
      submittedAfter?: string;
      submittedBefore?: string;
    },
    format: 'csv' | 'xlsx' = 'xlsx'
  ): Promise<{ downloadUrl: string; filename: string }> {
    return apiClient.post(`${this.baseUrl}/export`, { filters, format });
  }

  // Portal Statistics and Reports
  async getPortalStats(portalId: string, period: '7d' | '30d' | '90d' = '30d'): Promise<{
    totalSubmissions: number;
    submissionTrend: Array<{ date: string; count: number }>;
    statusBreakdown: Record<string, number>;
    avgResponseTime: number; // hours
    completionRate: number; // percentage
    topReferrers: Array<{ source: string; count: number }>;
    deviceBreakdown: Record<string, number>;
    locationData: Array<{ country: string; count: number }>;
  }> {
    return apiClient.get(`${this.baseUrl}/${portalId}/stats?period=${period}`);
  }

  // Portal Health and Monitoring
  async getPortalHealth(portalId: string): Promise<{
    isActive: boolean;
    lastSubmission: string | null;
    avgLoadTime: number;
    errorRate: number;
    uptime: number;
    alerts: Array<{
      type: string;
      message: string;
      severity: 'low' | 'medium' | 'high';
      timestamp: string;
    }>;
  }> {
    return apiClient.get(`${this.baseUrl}/${portalId}/health`);
  }

  // Portal Testing and Validation
  async validatePortalConfiguration(portalId: string): Promise<{
    isValid: boolean;
    errors: Array<{
      field: string;
      message: string;
      severity: 'error' | 'warning';
    }>;
    warnings: Array<{
      field: string;
      message: string;
      suggestion: string;
    }>;
  }> {
    return apiClient.post(`${this.baseUrl}/${portalId}/validate`);
  }

  async testPortalSubmission(portalId: string, testData: Record<string, any>): Promise<{
    success: boolean;
    validationErrors: Array<{ field: string; message: string }>;
    processingTime: number;
    workOrderCreated: boolean;
    workOrderId?: string;
  }> {
    return apiClient.post(`${this.baseUrl}/${portalId}/test-submission`, { testData });
  }

  // Advanced Features
  async createPortalWebhook(portalId: string, webhook: {
    url: string;
    events: string[];
    secret?: string;
    isActive: boolean;
  }): Promise<{ webhookId: string }> {
    return apiClient.post(`${this.baseUrl}/${portalId}/webhooks`, webhook);
  }

  async getPortalIntegrations(portalId: string): Promise<{
    webhooks: Array<{
      id: string;
      url: string;
      events: string[];
      isActive: boolean;
      lastTriggered: string | null;
    }>;
    emailSettings: {
      notificationEmails: string[];
      autoResponderEnabled: boolean;
      customTemplates: Record<string, string>;
    };
  }> {
    return apiClient.get(`${this.baseUrl}/${portalId}/integrations`);
  }

  // QR Code generation for portals
  async generatePortalQRCode(portalId: string, options?: {
    size?: number;
    includeTracking?: boolean;
  }): Promise<{ qrCodeUrl: string; qrCodeData: string; publicUrl: string }> {
    try {
      const portal = await this.getById(portalId);
      
      // Import QR service
      const { qrService } = await import('./qrService');
      
      // Create tracking URL
      const trackingParams = options?.includeTracking ? '?qr=1' : '';
      const publicUrl = `${window.location.origin}/portal/${portal.slug}${trackingParams}`;
      
      // Create QR code data structure
      const qrData = qrService.createQRCodeData('portal', portalId, {
        name: portal.name,
        type: portal.type,
        slug: portal.slug,
        publicUrl
      });
      
      // Generate QR code
      const qrCodeUrl = qrService.generateQRCodeUrl(qrData, {
        size: options?.size || 256,
        errorCorrectionLevel: 'M'
      });
      
      return {
        qrCodeUrl,
        qrCodeData: JSON.stringify(qrData),
        publicUrl
      };
    } catch (error) {
      throw new PortalError('Failed to generate QR code', 'QR_GENERATION_FAILED', 500);
    }
  }

  async updatePortalQRCode(portalId: string): Promise<Portal> {
    const { qrCodeUrl, publicUrl } = await this.generatePortalQRCode(portalId, { includeTracking: true });
    
    return this.update(portalId, {
      qrCodeUrl,
      publicUrl,
      qrEnabled: true
    });
  }

  // Bulk QR code generation for multiple portals
  async bulkGenerateQRCodes(portalIds: string[]): Promise<Array<{
    portalId: string;
    success: boolean;
    qrCodeUrl?: string;
    error?: string;
  }>> {
    const results = [];
    
    for (const portalId of portalIds) {
      try {
        const { qrCodeUrl } = await this.generatePortalQRCode(portalId);
        await this.update(portalId, { qrCodeUrl, qrEnabled: true });
        
        results.push({
          portalId,
          success: true,
          qrCodeUrl
        });
      } catch (error) {
        results.push({
          portalId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return results;
  }
}

// Singleton instance
export const portalService = new PortalService();

// Portal Template Service for pre-built portal templates
export class PortalTemplateService {
  async getTemplates(): Promise<any[]> {
    // Mock template data - replace with real API call
    return [
      {
        id: 'maintenance-basic',
        name: 'Basic Maintenance Request',
        description: 'Simple maintenance request form with essential fields',
        type: 'maintenance-request',
        category: 'Maintenance',
        fields: [
          { type: 'text', name: 'title', label: 'Issue Title', required: true },
          { type: 'textarea', name: 'description', label: 'Description', required: true },
          { type: 'select', name: 'priority', label: 'Priority', options: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
          { type: 'location', name: 'location', label: 'Location', required: true },
          { type: 'image', name: 'photos', label: 'Photos' },
        ],
        branding: {
          primaryColor: '#1976d2',
          secondaryColor: '#ffffff',
        }
      },
      {
        id: 'asset-registration',
        name: 'Asset Registration',
        description: 'Register new equipment and assets',
        type: 'asset-registration',
        category: 'Assets',
        fields: [
          { type: 'text', name: 'assetName', label: 'Asset Name', required: true },
          { type: 'text', name: 'manufacturer', label: 'Manufacturer' },
          { type: 'text', name: 'model', label: 'Model Number' },
          { type: 'text', name: 'serialNumber', label: 'Serial Number' },
          { type: 'location', name: 'location', label: 'Installation Location', required: true },
          { type: 'date', name: 'installationDate', label: 'Installation Date' },
          { type: 'image', name: 'photos', label: 'Asset Photos' },
        ],
        branding: {
          primaryColor: '#388e3c',
          secondaryColor: '#ffffff',
        }
      },
      {
        id: 'safety-incident',
        name: 'Safety Incident Report',
        description: 'Report workplace safety incidents and hazards',
        type: 'safety-incident',
        category: 'Safety',
        fields: [
          { type: 'select', name: 'incidentType', label: 'Incident Type', required: true, options: ['Injury', 'Near Miss', 'Property Damage', 'Environmental'] },
          { type: 'select', name: 'severity', label: 'Severity', required: true, options: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          { type: 'textarea', name: 'description', label: 'Incident Description', required: true },
          { type: 'location', name: 'location', label: 'Incident Location', required: true },
          { type: 'datetime', name: 'incidentTime', label: 'When did this occur?', required: true },
          { type: 'text', name: 'witnesses', label: 'Witnesses' },
          { type: 'image', name: 'photos', label: 'Evidence Photos' },
        ],
        branding: {
          primaryColor: '#d32f2f',
          secondaryColor: '#ffffff',
        }
      },
      {
        id: 'inspection-report',
        name: 'Equipment Inspection',
        description: 'Submit routine equipment inspection results',
        type: 'inspection-report',
        category: 'Inspections',
        fields: [
          { type: 'asset_picker', name: 'asset', label: 'Equipment Being Inspected', required: true },
          { type: 'select', name: 'inspectionType', label: 'Inspection Type', required: true, options: ['Routine', 'Safety', 'Compliance', 'Pre-Use'] },
          { type: 'select', name: 'overallCondition', label: 'Overall Condition', required: true, options: ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'] },
          { type: 'textarea', name: 'findings', label: 'Inspection Findings' },
          { type: 'textarea', name: 'recommendations', label: 'Recommendations' },
          { type: 'checkbox', name: 'requiresRepair', label: 'Requires Immediate Repair' },
          { type: 'image', name: 'photos', label: 'Inspection Photos' },
          { type: 'signature', name: 'inspectorSignature', label: 'Inspector Signature' },
        ],
        branding: {
          primaryColor: '#f57c00',
          secondaryColor: '#ffffff',
        }
      }
    ];
  }

  async getTemplate(id: string): Promise<any> {
    const templates = await this.getTemplates();
    return templates.find(t => t.id === id);
  }
}

export const portalTemplateService = new PortalTemplateService();

// Public Portal Service for anonymous/public access
export class PublicPortalService {
  private baseUrl = '/api/public/portals';

  async getPortalInfo(slug: string): Promise<{
    id: string;
    name: string;
    description: string;
    type: string;
    isActive: boolean;
    configuration: {
      fields: any[];
      allowAnonymous: boolean;
      allowFileUploads: boolean;
      maxFiles: number;
      maxFileSize: number;
      allowedFileTypes: string[];
      allowLocationSelection: boolean;
      defaultLanguage: string;
    };
    branding: {
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
      backgroundColor: string;
      textColor: string;
      fontFamily: string;
      fontSize: {
        heading: number;
        body: number;
      };
      layout: string;
      cardStyle: string;
      showProgressBar: boolean;
      welcomeMessage: string;
      instructionsText: string;
      thankYouMessage: string;
    };
    organizationInfo: {
      logoUrl?: string;
      contactInfo?: string;
    };
  }> {
    // Mock data - replace with real API call
    return {
      id: `portal-${slug}`,
      name: 'Maintenance Request Portal',
      description: 'Submit maintenance requests and issues',
      type: 'maintenance-request',
      isActive: true,
      configuration: {
        fields: [
          { 
            id: '1',
            name: 'title', 
            label: 'Issue Title', 
            type: 'text',
            isRequired: true,
            isVisible: true,
            placeholder: 'Enter a brief title for your request',
            helpText: 'Provide a clear, descriptive title'
          },
          { 
            id: '2',
            name: 'description', 
            label: 'Description', 
            type: 'textarea',
            isRequired: true,
            isVisible: true,
            placeholder: 'Provide detailed information about the issue',
            helpText: 'Include as much detail as possible to help us understand the issue'
          },
          { 
            id: '3',
            name: 'priority', 
            label: 'Priority', 
            type: 'priority-selector',
            isRequired: false,
            isVisible: true,
            helpText: 'Select the urgency level for this request'
          },
          { 
            id: '4',
            name: 'location', 
            label: 'Location', 
            type: 'location-picker',
            isRequired: true,
            isVisible: true,
            placeholder: 'Where is the issue located?',
            helpText: 'Specify the exact location where the issue is occurring'
          },
          { 
            id: '5',
            name: 'photos', 
            label: 'Photos', 
            type: 'photo-capture',
            isRequired: false,
            isVisible: true,
            placeholder: 'Upload photos of the issue (optional)',
            helpText: 'Photos help us better understand and diagnose the issue'
          },
        ],
        allowAnonymous: true,
        allowFileUploads: true,
        maxFiles: 5,
        maxFileSize: 10,
        allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
        allowLocationSelection: true,
        defaultLanguage: 'en'
      },
      branding: {
        primaryColor: '#1976d2',
        secondaryColor: '#ffffff',
        accentColor: '#ff4081',
        backgroundColor: '#ffffff',
        textColor: '#333333',
        fontFamily: 'Roboto, Arial, sans-serif',
        fontSize: {
          heading: 28,
          body: 16
        },
        layout: 'single-step',
        cardStyle: 'elevated',
        showProgressBar: false,
        welcomeMessage: 'Submit your maintenance request',
        instructionsText: 'Please provide as much detail as possible to help us resolve your issue quickly.',
        thankYouMessage: 'Thank you for your submission!'
      },
      organizationInfo: {
        logoUrl: undefined,
        contactInfo: 'For questions, contact support@example.com'
      }
    };
  }

  async recordPortalView(portalId: string, analytics: {
    userAgent?: string;
    referrer?: string;
    timestamp?: string;
    sessionId?: string;
  }): Promise<void> {
    // Mock implementation - replace with real API call
    console.log('Recording portal view:', portalId, analytics);
  }

  async submitPortalRequest(portalSlug: string, data: {
    submissionData: Record<string, any>;
    contactInfo: {
      name: string;
      email: string;
      phone?: string;
    };
  }): Promise<{
    submissionId: string;
    trackingCode: string;
    message: string;
  }> {
    // Mock implementation - replace with real API call
    return {
      submissionId: `sub-${Date.now()}`,
      trackingCode: Math.random().toString(36).substr(2, 8).toUpperCase(),
      message: 'Your submission has been received successfully!'
    };
  }

  async uploadFile(portalSlug: string, file: File, fieldName: string): Promise<{
    fileId: string;
    filename: string;
    url: string;
    size: number;
  }> {
    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('fieldName', fieldName);

      const response = await fetch(`/api/portals/public/${portalSlug}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.files && result.files.length > 0) {
        const uploadedFile = result.files[0];
        return {
          fileId: uploadedFile.id,
          filename: uploadedFile.filename,
          url: uploadedFile.url,
          size: uploadedFile.size
        };
      } else {
        throw new Error('Upload failed: No files processed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  async uploadMultipleFiles(portalSlug: string, files: File[], fieldName: string): Promise<Array<{
    fileId: string;
    filename: string;
    url: string;
    size: number;
  }>> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('fieldName', fieldName);

      const response = await fetch(`/api/portals/public/${portalSlug}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.files) {
        return result.files.map((file: any) => ({
          fileId: file.id,
          filename: file.filename,
          url: file.url,
          size: file.size
        }));
      } else {
        throw new Error('Upload failed: No files processed');
      }
    } catch (error) {
      console.error('Multiple file upload error:', error);
      throw error;
    }
  }
}

export const publicPortalService = new PublicPortalService();

// Portal Submission Service for managing submissions
export class PortalSubmissionService {
  private baseUrl = '/api/portal-submissions';

  async submitForm(request: {
    portalId: string;
    formData: Record<string, any>;
    files?: File[];
    submitter?: {
      name?: string;
      email?: string;
      phone?: string;
      isAnonymous?: boolean;
      allowFollowUp?: boolean;
      preferredContact?: string;
    };
    captchaToken?: string;
    language?: string;
    submissionLocation?: {
      latitude: number;
      longitude: number;
    };
    referrer?: string;
    utmParams?: Record<string, any>;
  }): Promise<{
    submissionId: string;
    trackingCode: string;
    message: string;
  }> {
    // Convert to backend format
    const backendRequest = {
      portalSlug: request.portalId.replace('portal-', ''), // Extract slug from portal ID
      submissionData: request.formData,
      attachments: request.files?.map(f => ({
        filename: f.name,
        size: f.size,
        type: f.type
      })),
      contactInfo: {
        name: request.submitter?.name || 'Anonymous',
        email: request.submitter?.email || '',
        phone: request.submitter?.phone || ''
      }
    };

    try {
      return await apiClient.post('/api/portals/public/submit', backendRequest);
    } catch (error) {
      console.error('Error submitting portal form:', error);
      throw error;
    }
  }

  async getSubmissions(portalId?: string, filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    submissions: any[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
  }> {
    const queryParams = new URLSearchParams();
    
    if (portalId) queryParams.append('portalId', portalId);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    
    const query = queryParams.toString();
    const url = query ? `/api/portals/admin/submissions?${query}` : '/api/portals/admin/submissions';
    
    return apiClient.get(url);
  }

  async updateSubmissionStatus(id: string, status: string, notes?: string): Promise<any> {
    return apiClient.put(`/api/portals/submissions/${id}/status`, {
      status,
      reviewNotes: notes
    });
  }

  async createWorkOrderFromSubmission(submissionId: string): Promise<{ workOrderId: string }> {
    return apiClient.post(`/api/portals/submissions/${submissionId}/work-order`);
  }

  async addCommunication(submissionId: string, message: string, isInternal: boolean): Promise<any> {
    return apiClient.post(`/api/portals/submissions/${submissionId}/communications`, {
      message,
      isInternal
    });
  }
}

export const portalSubmissionService = new PortalSubmissionService();

// Work Orders Service for portal integration
export class WorkOrdersService {
  async createFromSubmission(submissionData: any): Promise<{ workOrderId: string }> {
    // Mock implementation - replace with real API call
    return {
      workOrderId: `wo-${Date.now()}`
    };
  }

  async getWorkOrdersBySubmission(submissionId: string): Promise<any[]> {
    // Mock implementation - replace with real API call
    return [
      {
        id: `wo-${submissionId}`,
        title: 'Work Order from Portal Submission',
        status: 'OPEN',
        createdAt: new Date().toISOString()
      }
    ];
  }
}

export const workOrdersService = new WorkOrdersService();

// Portal-specific error handling
export class PortalError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'PortalError';
  }
}

// Enhanced error handling for portal operations
export function handlePortalError(error: any): PortalError {
  if (error instanceof PortalError) {
    return error;
  }

  // Map common HTTP errors to portal-specific errors
  switch (error.status || error.statusCode) {
    case 404:
      return new PortalError('Portal not found', 'PORTAL_NOT_FOUND', 404);
    case 403:
      return new PortalError('Access denied to portal', 'PORTAL_ACCESS_DENIED', 403);
    case 429:
      return new PortalError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
    case 413:
      return new PortalError('File too large', 'FILE_TOO_LARGE', 413);
    case 415:
      return new PortalError('Unsupported file type', 'UNSUPPORTED_MEDIA_TYPE', 415);
    default:
      return new PortalError(
        error.message || 'Portal operation failed',
        'PORTAL_ERROR',
        error.status || 500,
        error.details
      );
  }
}

// Utility functions for portal operations
export const portalUtils = {
  generatePortalSlug: (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50)
      .replace(/^-|-$/g, '');
  },

  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePhone: (phone: string): boolean => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  },

  formatFileSize: (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  },

  generateTrackingCode: (): string => {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  },

  isValidFileType: (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type);
  },

  sanitizeFormData: (data: Record<string, any>): Record<string, any> => {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Basic HTML sanitization - in production, use a proper library like DOMPurify
        sanitized[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]*>/g, '')
          .trim();
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
};