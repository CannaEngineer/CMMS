// Portal System Type Definitions
export type PortalType = 
  | 'maintenance-request'
  | 'asset-registration'
  | 'equipment-info'
  | 'general-inquiry'
  | 'inspection-report'
  | 'safety-incident';

export type PortalStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'ARCHIVED';

export type SubmissionStatus = 
  | 'SUBMITTED'
  | 'REVIEWED'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type FieldType = 
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'datetime'
  | 'time'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'image'
  | 'location'
  | 'rating'
  | 'priority'
  | 'asset_picker'
  | 'signature'
  | 'hidden';

export type MessageType = 
  | 'MESSAGE'
  | 'STATUS_UPDATE'
  | 'QUESTION'
  | 'UPDATE_REQUEST'
  | 'NOTIFICATION';

// Core Portal Entity
export interface Portal {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  slug: string;
  type: PortalType;
  
  // Portal Settings
  isActive: boolean;
  requiresApproval: boolean;
  allowAnonymous: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  
  // Rate Limiting
  rateLimitPerHour: number;
  rateLimitPerDay: number;
  
  // Auto Work Order Creation
  autoCreateWorkOrders: boolean;
  defaultWorkOrderPriority: string;
  defaultAssignedUserId?: string;
  
  // QR Code
  qrCodeUrl?: string;
  qrEnabled: boolean;
  
  // URLs
  publicUrl: string;
  adminUrl: string;
  
  // Statistics
  submissionCount: number;
  lastSubmissionAt?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  
  // Relationships
  fields?: PortalField[];
  branding?: PortalBranding;
}

// Portal Form Field Configuration
export interface PortalField {
  id: string;
  portalId: string;
  fieldName: string;
  fieldType: FieldType;
  fieldLabel: string;
  fieldPlaceholder?: string;
  fieldDescription?: string;
  
  // Field Configuration
  isRequired: boolean;
  isVisible: boolean;
  fieldOrder: number;
  
  // Field Options (for select, radio, etc.)
  fieldOptions?: FieldOption[];
  
  // Validation Rules
  validationRules?: ValidationRule[];
  
  // Conditional Logic
  conditionalLogic?: ConditionalLogic[];
  
  // Integration Mapping
  mapsToWorkOrderField?: string;
  mapsToAssetField?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface FieldOption {
  value: string;
  label: string;
  isDefault?: boolean;
  isDisabled?: boolean;
  metadata?: Record<string, any>;
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max' | 'email' | 'phone' | 'url' | 'custom';
  value?: any;
  message: string;
}

export interface ConditionalLogic {
  condition: 'show' | 'hide' | 'require' | 'disable';
  rules: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
    value: any;
  }>;
  logic: 'AND' | 'OR';
}

// Portal Branding and Customization
export interface PortalBranding {
  id: string;
  portalId: string;
  
  // Colors
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  
  // Images
  logoUrl?: string;
  backgroundImageUrl?: string;
  faviconUrl?: string;
  
  // Typography
  fontFamily: string;
  fontSizeBase: number;
  
  // Layout
  layoutStyle: 'modern' | 'classic' | 'minimal';
  showProgressBar: boolean;
  showStepNumbers: boolean;
  
  // Content
  welcomeTitle?: string;
  welcomeMessage?: string;
  successTitle: string;
  successMessage: string;
  footerText?: string;
  
  // Contact Information
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  
  // Custom Styling
  customCSS?: string;
  
  createdAt: string;
  updatedAt: string;
}

// Portal Submission
export interface PortalSubmission {
  id: string;
  portalId: string;
  submissionCode: string;
  
  // Submitter Information
  submitterName?: string;
  submitterEmail?: string;
  submitterPhone?: string;
  submitterLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  
  // Submission Data
  formData: Record<string, any>;
  priority: string;
  category?: string;
  
  // Status
  status: SubmissionStatus;
  
  // Integration
  workOrderId?: string;
  assetId?: string;
  locationId?: string;
  
  // Review Information
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  internalNotes?: string;
  
  // Analytics
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  sessionId?: string;
  
  // Timestamps
  submittedAt: string;
  updatedAt: string;
  
  // Relationships
  portal?: Portal;
  files?: PortalSubmissionFile[];
  communications?: PortalCommunication[];
  workOrder?: any; // Reference to work order if created
}

// Portal Submission Files
export interface PortalSubmissionFile {
  id: string;
  submissionId: string;
  fieldName: string;
  
  // File Information
  filename: string;
  originalFilename: string;
  filePath: string;
  fileUrl?: string;
  mimeType: string;
  fileSize: number;
  
  // Image Metadata
  imageWidth?: number;
  imageHeight?: number;
  
  // Security
  virusScanStatus: 'PENDING' | 'CLEAN' | 'INFECTED' | 'ERROR';
  virusScanResult?: string;
  
  uploadedAt: string;
}

// Communication/Messages
export interface PortalCommunication {
  id: string;
  submissionId: string;
  
  // Message Details
  senderType: 'ADMIN' | 'SUBMITTER' | 'SYSTEM';
  senderUserId?: string;
  senderName?: string;
  senderEmail?: string;
  
  message: string;
  messageType: MessageType;
  
  // Status
  isRead: boolean;
  isInternal: boolean;
  
  // Email
  emailSent: boolean;
  emailSentAt?: string;
  
  createdAt: string;
}

// Portal Templates
export interface PortalTemplate {
  id: string;
  name: string;
  description: string;
  portalType: PortalType;
  
  // Template Configuration
  templateConfig: {
    fields: Partial<PortalField>[];
    branding: Partial<PortalBranding>;
    settings: Partial<Portal>;
  };
  
  isSystemTemplate: boolean;
  isPublic: boolean;
  usageCount: number;
  
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// Analytics and Metrics
export interface PortalAnalytics {
  portalId: string;
  timeframe: string;
  
  // Core Metrics
  totalSubmissions: number;
  uniqueSubmissions: number;
  conversionRate: number; // percentage
  averageCompletionTime: number; // minutes
  
  // Trends
  submissionTrend: Array<{
    date: string;
    submissions: number;
    completions: number;
    abandonment: number;
  }>;
  
  // Status Breakdown
  statusBreakdown: Record<SubmissionStatus, number>;
  
  // Traffic Sources
  trafficSources: Array<{
    source: string;
    visits: number;
    submissions: number;
    conversionRate: number;
  }>;
  
  // Device and Browser Data
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
  
  // Geographic Data
  locationData: Array<{
    country: string;
    region?: string;
    city?: string;
    submissions: number;
  }>;
  
  // Performance Metrics
  averageLoadTime: number; // milliseconds
  errorRate: number; // percentage
  
  // Popular Fields and Values
  fieldUsage: Array<{
    fieldName: string;
    fieldLabel: string;
    completionRate: number;
    popularValues: Array<{ value: string; count: number }>;
  }>;
}

// Search and Filter Types
export interface PortalSearchFilters {
  type?: PortalType;
  status?: PortalStatus;
  searchTerm?: string;
  organizationId?: string;
  createdAfter?: string;
  createdBefore?: string;
  hasSubmissions?: boolean;
  isActive?: boolean;
}

export interface SubmissionSearchFilters {
  portalId?: string;
  status?: SubmissionStatus;
  submittedAfter?: string;
  submittedBefore?: string;
  priority?: string;
  hasWorkOrder?: boolean;
  reviewedBy?: string;
  searchTerm?: string;
  page?: number;
  limit?: number;
}

// Request/Response Types
export interface CreatePortalRequest {
  name: string;
  description: string;
  type: PortalType;
  slug?: string;
  organizationId?: string;
  
  // Settings
  isActive?: boolean;
  requiresApproval?: boolean;
  allowAnonymous?: boolean;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  rateLimitPerHour?: number;
  rateLimitPerDay?: number;
  
  // Auto Work Orders
  autoCreateWorkOrders?: boolean;
  defaultWorkOrderPriority?: string;
  defaultAssignedUserId?: string;
  
  // Initial Configuration
  fields?: Partial<PortalField>[];
  branding?: Partial<PortalBranding>;
}

export interface UpdatePortalRequest extends Partial<CreatePortalRequest> {
  id: string;
}

export interface SubmitPortalRequest {
  portalSlug: string;
  formData: Record<string, any>;
  
  // Optional Submitter Info
  submitterName?: string;
  submitterEmail?: string;
  submitterPhone?: string;
  submitterLocation?: {
    latitude: number;
    longitude: number;
  };
  
  // File IDs from previous uploads
  fileIds?: string[];
  
  // Analytics Data
  sessionId?: string;
  userAgent?: string;
  referrer?: string;
}

// Portal Configuration Validation
export interface PortalValidationResult {
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
}

// Portal Integration Types
export interface PortalWebhook {
  id: string;
  portalId: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  lastTriggered?: string;
  createdAt: string;
}

export interface PortalEmailSettings {
  notificationEmails: string[];
  autoResponderEnabled: boolean;
  autoResponderSubject?: string;
  autoResponderTemplate?: string;
  statusUpdateTemplates: Record<SubmissionStatus, string>;
}

// Offline Support Types
export interface OfflinePortalSubmission {
  id: string;
  portalSlug: string;
  formData: Record<string, any>;
  files: File[];
  submissionMetadata: {
    timestamp: number;
    userAgent: string;
    location?: { latitude: number; longitude: number };
  };
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  lastSyncAttempt?: number;
  syncError?: string;
}

// Rate Limiting Types
export interface RateLimitInfo {
  allowed: boolean;
  remainingRequests: number;
  resetTime: string;
  totalRequests: number;
  windowStart: string;
}

// Portal Statistics Summary
export interface PortalStats {
  totalPortals: number;
  activePortals: number;
  totalSubmissions: number;
  pendingReview: number;
  avgResponseTime: number; // hours
  topPerformingPortals: Array<{
    id: string;
    name: string;
    submissions: number;
    conversionRate: number;
  }>;
  recentActivity: Array<{
    type: 'submission' | 'approval' | 'work_order_created';
    portalName: string;
    timestamp: string;
    description: string;
  }>;
}

// Export utility type for portal field values
export type PortalFieldValue = string | number | boolean | string[] | File | File[] | {
  latitude: number;
  longitude: number;
  address?: string;
} | {
  signature: string;
  timestamp: number;
};

// Portal form validation context
export interface PortalFormContext {
  portal: Portal;
  fields: PortalField[];
  values: Record<string, PortalFieldValue>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isOffline: boolean;
  sessionId: string;
}

// Portal deployment configuration
export interface PortalDeploymentConfig {
  baseUrl: string;
  publicBaseUrl: string;
  maxFileSize: number;
  allowedFileTypes: string[];
  rateLimiting: {
    enabled: boolean;
    requestsPerHour: number;
    requestsPerDay: number;
    blacklistEnabled: boolean;
  };
  security: {
    captchaEnabled: boolean;
    captchaSiteKey?: string;
    virusScanningEnabled: boolean;
    contentSecurityPolicy: string;
  };
  analytics: {
    trackingEnabled: boolean;
    retentionDays: number;
    anonymizeIPs: boolean;
  };
  storage: {
    provider: 'local' | 's3' | 'gcs' | 'azure';
    bucket?: string;
    region?: string;
    cdnEnabled: boolean;
    cdnUrl?: string;
  };
}