// Portal Types for Backend API

export type PortalType = 
  | 'MAINTENANCE_REQUEST'
  | 'ASSET_REGISTRATION'
  | 'EQUIPMENT_INFO'
  | 'GENERAL_INQUIRY'
  | 'INSPECTION_REPORT'
  | 'SAFETY_INCIDENT';

export type PortalStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'ARCHIVED';

export type SubmissionStatus = 
  | 'SUBMITTED'
  | 'REVIEWED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED'
  | 'ASSIGNED';

export type FieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'EMAIL'
  | 'PHONE'
  | 'NUMBER'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'RADIO'
  | 'CHECKBOX'
  | 'DATE'
  | 'TIME'
  | 'DATETIME'
  | 'FILE'
  | 'IMAGE'
  | 'LOCATION'
  | 'ASSET_PICKER'
  | 'USER_PICKER'
  | 'PRIORITY'
  | 'RATING'
  | 'SIGNATURE'
  | 'URL'
  | 'CURRENCY';

export interface Portal {
  id: number;
  name: string;
  description?: string;
  type: PortalType;
  status: PortalStatus;
  slug: string;
  organizationId: number;
  
  // Configuration
  isActive: boolean;
  allowAnonymous: boolean;
  requiresApproval: boolean;
  autoCreateWorkOrders: boolean;
  maxSubmissionsPerDay?: number;
  
  // URLs and Access
  publicUrl?: string;
  qrCodeUrl?: string;
  qrEnabled: boolean;
  
  // Branding
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
  customCss?: string;
  
  // Notifications
  notificationEmails?: string;
  autoResponderEnabled: boolean;
  autoResponderMessage?: string;
  
  // Rate Limiting
  rateLimitEnabled: boolean;
  rateLimitRequests: number;
  rateLimitWindow: number;
  
  // Related data
  fields?: PortalField[];
  _count?: {
    submissions: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PortalField {
  id: number;
  portalId: number;
  name: string;
  label: string;
  type: FieldType;
  orderIndex: number;
  isRequired: boolean;
  placeholder?: string;
  helpText?: string;
  options?: any;
  validations?: any;
  conditionalLogic?: any;
  width?: string;
  cssClasses?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortalSubmission {
  id: number;
  portalId: number;
  trackingCode: string;
  status: SubmissionStatus;
  
  // Submission Data
  submissionData: any;
  attachments?: any;
  
  // Submitter Information
  submitterName?: string;
  submitterEmail?: string;
  submitterPhone?: string;
  submitterIp?: string;
  userAgent?: string;
  
  // Processing Information
  assignedToId?: number;
  reviewNotes?: string;
  internalNotes?: string;
  reviewedAt?: Date;
  completedAt?: Date;
  
  // Integration
  workOrderId?: number;
  assetId?: number;
  locationId?: number;
  
  // Priority and Classification
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category?: string;
  tags?: string;
  
  // Relations
  portal?: Portal;
  assignedTo?: any;
  workOrder?: any;
  asset?: any;
  location?: any;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PortalAnalytics {
  id: number;
  portalId: number;
  date: Date;
  
  // Daily Metrics
  views: number;
  submissions: number;
  completions: number;
  bounceRate?: number;
  avgCompletionTime?: number;
  
  // Device/Browser Data
  mobileViews: number;
  desktopViews: number;
  tabletViews: number;
  
  // Traffic Sources
  qrCodeScans: number;
  directAccess: number;
  referralAccess: number;
  
  // Geographic Data
  country?: string;
  region?: string;
  city?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response Types
export interface CreatePortalRequest {
  name: string;
  description?: string;
  type: PortalType;
  isActive?: boolean;
  allowAnonymous?: boolean;
  requiresApproval?: boolean;
  autoCreateWorkOrders?: boolean;
  maxSubmissionsPerDay?: number;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
  customCss?: string;
  notificationEmails?: string;
  autoResponderEnabled?: boolean;
  autoResponderMessage?: string;
  rateLimitEnabled?: boolean;
  rateLimitRequests?: number;
  rateLimitWindow?: number;
  fields?: Partial<PortalField>[];
}

export interface UpdatePortalRequest extends Partial<CreatePortalRequest> {}

export interface SubmitPortalRequest {
  portalSlug: string;
  submissionData: Record<string, any>;
  attachments?: any;
  contactInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  clientInfo?: {
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
  };
}

export interface PortalSearchFilters {
  type?: PortalType;
  status?: PortalStatus;
  searchTerm?: string;
  organizationId?: number;
  createdAfter?: string;
  createdBefore?: string;
}