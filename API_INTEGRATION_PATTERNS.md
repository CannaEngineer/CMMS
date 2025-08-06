# Portal System API Integration Patterns

## API Architecture Overview

The portal system follows a RESTful API design with clear separation between authenticated admin endpoints and public anonymous endpoints. All APIs use JSON for data exchange and follow consistent patterns for error handling, pagination, and response formatting.

### **Base URLs**
- **Admin API**: `https://api.yourorg.com/api/v1`
- **Public Portal API**: `https://portal.yourorg.com/api/v1/public`

## Admin API Endpoints (Authenticated)

### **Portal Management**

#### **List Portals**
```http
GET /api/v1/portals
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
```typescript
interface PortalListParams {
  type?: PortalType;
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  search?: string;
  organizationId?: string;
  createdAfter?: ISO8601DateTime;
  createdBefore?: ISO8601DateTime;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'created' | 'submissions' | 'updated';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface PortalListResponse {
  data: Portal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta: {
    totalActive: number;
    totalInactive: number;
    totalSubmissions: number;
  };
}
```

#### **Create Portal**
```http
POST /api/v1/portals
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```typescript
interface CreatePortalRequest {
  name: string;
  description: string;
  type: PortalType;
  slug?: string; // Auto-generated if not provided
  
  // Configuration
  settings: {
    isActive: boolean;
    requiresApproval: boolean;
    allowAnonymous: boolean;
    maxFileSize: number;
    allowedFileTypes: string[];
    rateLimitPerHour: number;
    rateLimitPerDay: number;
  };
  
  // Auto Work Order Settings
  workOrderIntegration: {
    autoCreate: boolean;
    defaultPriority: string;
    defaultAssigneeId?: string;
    defaultLocationId?: string;
  };
  
  // Initial form fields
  fields?: PortalFieldConfig[];
  
  // Branding
  branding?: PortalBrandingConfig;
}
```

**Response:**
```typescript
interface CreatePortalResponse {
  success: true;
  data: Portal;
  urls: {
    admin: string;
    public: string;
    qrCode?: string;
  };
}
```

#### **Update Portal**
```http
PUT /api/v1/portals/{portalId}
Authorization: Bearer {jwt_token}
```

#### **Delete Portal**
```http
DELETE /api/v1/portals/{portalId}
Authorization: Bearer {jwt_token}
```

**Response:**
```typescript
interface DeletePortalResponse {
  success: true;
  message: string;
  backupLocation?: string; // Where data was archived
}
```

### **Portal Field Management**

#### **Update Portal Fields**
```http
PUT /api/v1/portals/{portalId}/fields
Authorization: Bearer {jwt_token}
```

**Request Body:**
```typescript
interface UpdateFieldsRequest {
  fields: PortalFieldConfig[];
  preserveSubmissions: boolean; // Whether to preserve existing submissions
}

interface PortalFieldConfig {
  id?: string; // Omit for new fields
  fieldName: string;
  fieldType: FieldType;
  fieldLabel: string;
  fieldPlaceholder?: string;
  fieldDescription?: string;
  isRequired: boolean;
  isVisible: boolean;
  fieldOrder: number;
  
  // Type-specific configuration
  options?: FieldOption[];
  validation?: ValidationRule[];
  conditionalLogic?: ConditionalLogic[];
  
  // Integration mapping
  workOrderMapping?: {
    field: string;
    transform?: string; // JavaScript expression for data transformation
  };
}
```

### **Submission Management**

#### **List Submissions**
```http
GET /api/v1/portal-submissions
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
```typescript
interface SubmissionListParams {
  portalId?: string;
  status?: SubmissionStatus;
  priority?: string;
  submittedAfter?: ISO8601DateTime;
  submittedBefore?: ISO8601DateTime;
  reviewedBy?: string;
  hasWorkOrder?: boolean;
  search?: string; // Search in form data
  page?: number;
  limit?: number;
}
```

#### **Update Submission Status**
```http
PUT /api/v1/portal-submissions/{submissionId}/status
Authorization: Bearer {jwt_token}
```

**Request Body:**
```typescript
interface UpdateSubmissionStatusRequest {
  status: SubmissionStatus;
  reviewNotes?: string;
  internalNotes?: string;
  notifySubmitter?: boolean;
  customMessage?: string;
}
```

#### **Create Work Order from Submission**
```http
POST /api/v1/portal-submissions/{submissionId}/work-order
Authorization: Bearer {jwt_token}
```

**Request Body:**
```typescript
interface CreateWorkOrderRequest {
  // Override default mapping
  title?: string;
  description?: string;
  priority?: string;
  assignedTo?: string;
  assetId?: string;
  locationId?: string;
  
  // Custom field mapping
  fieldMapping?: Record<string, string>;
  
  // Copy attachments
  copyAttachments?: boolean;
}
```

**Response:**
```typescript
interface CreateWorkOrderResponse {
  success: true;
  data: {
    workOrderId: string;
    workOrderNumber: string;
    assignedTo?: {
      id: string;
      name: string;
      email: string;
    };
  };
  submission: PortalSubmission; // Updated submission with work order link
}
```

### **Analytics and Reporting**

#### **Portal Analytics**
```http
GET /api/v1/portals/{portalId}/analytics
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
```typescript
interface AnalyticsParams {
  timeframe: '7d' | '30d' | '90d' | '1y' | 'custom';
  startDate?: ISO8601DateTime; // Required if timeframe is 'custom'
  endDate?: ISO8601DateTime;
  metrics?: string[]; // Specific metrics to include
  groupBy?: 'day' | 'week' | 'month';
}
```

**Response:**
```typescript
interface PortalAnalyticsResponse {
  summary: {
    totalSubmissions: number;
    uniqueSubmissions: number;
    conversionRate: number;
    averageCompletionTime: number; // seconds
    bounceRate: number;
  };
  
  trends: {
    submissions: TimeSeriesData[];
    conversions: TimeSeriesData[];
    abandonment: TimeSeriesData[];
  };
  
  breakdown: {
    byStatus: Record<SubmissionStatus, number>;
    byDevice: Record<string, number>;
    bySource: Array<{ source: string; count: number; percentage: number }>;
    byLocation: Array<{ country: string; region?: string; count: number }>;
  };
  
  performance: {
    averageLoadTime: number;
    errorRate: number;
    slowRequests: number;
  };
  
  fieldAnalytics: Array<{
    fieldName: string;
    fieldLabel: string;
    completionRate: number;
    averageTimeToComplete: number;
    popularValues: Array<{ value: string; count: number }>;
    validationErrors: number;
  }>;
}
```

## Public API Endpoints (No Authentication)

### **Portal Access**

#### **Get Portal Configuration**
```http
GET /api/v1/public/portals/{slug}
X-Client-Type: web|mobile
X-Session-ID: {unique_session_id}
```

**Response:**
```typescript
interface PublicPortalResponse {
  portal: {
    id: string;
    name: string;
    description: string;
    type: PortalType;
    settings: {
      maxFileSize: number;
      allowedFileTypes: string[];
      allowAnonymous: boolean;
    };
  };
  
  fields: Array<{
    fieldName: string;
    fieldType: FieldType;
    fieldLabel: string;
    fieldPlaceholder?: string;
    fieldDescription?: string;
    isRequired: boolean;
    fieldOrder: number;
    options?: FieldOption[];
    validation?: ValidationRule[];
  }>;
  
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
    welcomeTitle?: string;
    welcomeMessage?: string;
    contactInfo?: {
      name?: string;
      email?: string;
      phone?: string;
    };
  };
  
  meta: {
    version: string;
    lastUpdated: ISO8601DateTime;
    estimatedCompletionTime: number; // seconds
  };
}
```

#### **Check Rate Limit**
```http
GET /api/v1/public/portals/{slug}/rate-limit
X-Forwarded-For: {client_ip}
```

**Response:**
```typescript
interface RateLimitResponse {
  allowed: boolean;
  limits: {
    perHour: {
      limit: number;
      remaining: number;
      resetTime: ISO8601DateTime;
    };
    perDay: {
      limit: number;
      remaining: number;
      resetTime: ISO8601DateTime;
    };
  };
  blocked?: {
    reason: string;
    blockedUntil: ISO8601DateTime;
  };
}
```

### **File Upload**

#### **Upload File**
```http
POST /api/v1/public/portals/{slug}/upload
Content-Type: multipart/form-data
X-Session-ID: {session_id}
```

**Form Data:**
```typescript
interface FileUploadData {
  file: File;
  fieldName: string;
  sessionId: string;
  metadata?: {
    originalName: string;
    description?: string;
  };
}
```

**Response:**
```typescript
interface FileUploadResponse {
  success: true;
  data: {
    fileId: string;
    filename: string;
    size: number;
    mimeType: string;
    url: string; // Temporary access URL
    thumbnailUrl?: string; // For images
  };
  security: {
    virusScanStatus: 'pending' | 'clean' | 'scanning';
    scanId?: string;
  };
}
```

### **Portal Submission**

#### **Submit Portal Form**
```http
POST /api/v1/public/portals/submit
Content-Type: application/json
X-Session-ID: {session_id}
X-Client-Type: web|mobile
X-Forwarded-For: {client_ip}
```

**Request Body:**
```typescript
interface PortalSubmissionRequest {
  portalSlug: string;
  formData: Record<string, any>;
  
  // Optional submitter information
  submitter?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
    };
  };
  
  // File references from uploads
  files?: Array<{
    fieldName: string;
    fileId: string;
  }>;
  
  // Client metadata
  metadata: {
    sessionId: string;
    userAgent: string;
    referrer?: string;
    startTime: number; // Form start timestamp
    completionTime: number; // Time taken to complete
    clientTimezone: string;
  };
  
  // Captcha verification (if enabled)
  captcha?: {
    token: string;
    provider: 'recaptcha' | 'hcaptcha';
  };
}
```

**Response:**
```typescript
interface PortalSubmissionResponse {
  success: true;
  data: {
    submissionId: string;
    trackingCode: string;
    status: SubmissionStatus;
    message: string;
    estimatedProcessingTime?: string;
  };
  
  workOrder?: {
    created: boolean;
    workOrderId?: string;
    workOrderNumber?: string;
  };
  
  notifications: {
    emailSent: boolean;
    smsNotification?: boolean;
  };
  
  nextSteps?: {
    trackingUrl: string;
    instructions: string[];
  };
}
```

#### **Track Submission Status**
```http
GET /api/v1/public/submission-status/{trackingCode}
```

**Response:**
```typescript
interface SubmissionTrackingResponse {
  submission: {
    id: string;
    trackingCode: string;
    status: SubmissionStatus;
    statusMessage: string;
    submittedAt: ISO8601DateTime;
    lastUpdated: ISO8601DateTime;
  };
  
  timeline: Array<{
    status: SubmissionStatus;
    timestamp: ISO8601DateTime;
    message: string;
    isPublic: boolean;
  }>;
  
  workOrder?: {
    id: string;
    number: string;
    status: string;
    assignedTo?: string;
    estimatedCompletion?: ISO8601DateTime;
  };
  
  communications: Array<{
    id: string;
    message: string;
    timestamp: ISO8601DateTime;
    senderType: 'ADMIN' | 'SYSTEM';
    isPublic: boolean;
  }>;
  
  attachments?: Array<{
    id: string;
    filename: string;
    size: number;
    downloadUrl: string;
    expiresAt: ISO8601DateTime;
  }>;
}
```

## Integration Patterns

### **1. Work Order Integration**

#### **Automatic Work Order Creation**
When a portal submission is approved, the system can automatically create work orders based on field mappings:

```typescript
interface WorkOrderMapping {
  portalId: string;
  enabled: boolean;
  
  fieldMappings: Array<{
    portalField: string;
    workOrderField: string;
    transform?: string; // JavaScript expression
    required?: boolean;
  }>;
  
  defaults: {
    priority: string;
    assignedTo?: string;
    locationId?: string;
    categoryId?: string;
  };
  
  conditions?: Array<{
    field: string;
    operator: string;
    value: any;
    action: 'create' | 'skip' | 'route_to';
    target?: string;
  }>;
}
```

#### **Field Mapping Examples**
```typescript
const fieldMappings = [
  {
    portalField: 'issue_description',
    workOrderField: 'description',
    transform: 'value.trim().substring(0, 500)'
  },
  {
    portalField: 'equipment_id',
    workOrderField: 'assetId',
    transform: 'parseInt(value)'
  },
  {
    portalField: 'urgency_level',
    workOrderField: 'priority',
    transform: `
      const urgencyMap = { 'Low': 'LOW', 'Medium': 'MEDIUM', 'High': 'HIGH', 'Critical': 'CRITICAL' };
      return urgencyMap[value] || 'MEDIUM';
    `
  }
];
```

### **2. QR Code Integration**

#### **QR Code Generation**
```http
POST /api/v1/portals/{portalId}/qr-code
Authorization: Bearer {jwt_token}
```

**Request Body:**
```typescript
interface QRCodeGenerationRequest {
  options: {
    size: number; // 200-2000 pixels
    format: 'png' | 'svg';
    errorCorrection: 'L' | 'M' | 'Q' | 'H';
    includeTracking: boolean;
    customization?: {
      logo?: string; // Base64 encoded logo
      colors?: {
        foreground: string;
        background: string;
      };
    };
  };
  
  metadata?: {
    locationName?: string;
    assetTag?: string;
    description?: string;
  };
}
```

**Response:**
```typescript
interface QRCodeResponse {
  success: true;
  data: {
    qrCodeUrl: string; // Direct link to QR code image
    portalUrl: string; // URL that QR code points to
    trackingParams: {
      source: 'qr_code';
      campaign?: string;
      medium: 'physical' | 'digital';
    };
  };
  
  analytics: {
    trackingEnabled: boolean;
    analyticsUrl?: string;
  };
  
  printing: {
    printableUrl: string;
    formats: Array<{
      name: string;
      size: string;
      downloadUrl: string;
    }>;
  };
}
```

### **3. Webhook Integration**

#### **Configure Webhooks**
```http
POST /api/v1/portals/{portalId}/webhooks
Authorization: Bearer {jwt_token}
```

**Request Body:**
```typescript
interface WebhookConfig {
  url: string;
  events: Array<
    'submission.created' | 
    'submission.approved' | 
    'submission.rejected' | 
    'work_order.created' | 
    'file.uploaded'
  >;
  secret?: string; // For HMAC verification
  headers?: Record<string, string>;
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
    maxDelay: number;
  };
}
```

#### **Webhook Payload Format**
```typescript
interface WebhookPayload {
  event: string;
  timestamp: ISO8601DateTime;
  portalId: string;
  organizationId: string;
  
  data: {
    submission?: PortalSubmission;
    workOrder?: WorkOrder;
    file?: PortalSubmissionFile;
    previousStatus?: string;
    changes?: Record<string, any>;
  };
  
  metadata: {
    webhookId: string;
    deliveryId: string;
    attempt: number;
  };
}
```

### **4. Email Integration**

#### **Configure Email Templates**
```http
PUT /api/v1/portals/{portalId}/email-templates
Authorization: Bearer {jwt_token}
```

**Request Body:**
```typescript
interface EmailTemplateConfig {
  templates: {
    submission_received: {
      subject: string;
      htmlBody: string;
      textBody: string;
      enabled: boolean;
    };
    status_update: {
      subject: string;
      htmlBody: string;
      textBody: string;
      enabled: boolean;
    };
    work_order_created: {
      subject: string;
      htmlBody: string;
      textBody: string;
      enabled: boolean;
    };
  };
  
  settings: {
    fromName: string;
    fromEmail: string;
    replyTo?: string;
    notificationEmails: string[];
  };
  
  variables: Array<{
    name: string;
    description: string;
    example: string;
  }>;
}
```

## Error Handling

### **Standard Error Response Format**
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string; // For validation errors
  };
  timestamp: ISO8601DateTime;
  requestId: string;
}
```

### **Common Error Codes**
```typescript
const errorCodes = {
  // Authentication & Authorization
  'AUTH_REQUIRED': 'Authentication required',
  'AUTH_INVALID': 'Invalid authentication token',
  'PERMISSION_DENIED': 'Insufficient permissions',
  
  // Validation
  'VALIDATION_ERROR': 'Request validation failed',
  'REQUIRED_FIELD': 'Required field missing',
  'INVALID_FORMAT': 'Invalid field format',
  
  // Rate Limiting
  'RATE_LIMIT_EXCEEDED': 'Rate limit exceeded',
  'IP_BLOCKED': 'IP address blocked',
  
  // Portal Specific
  'PORTAL_NOT_FOUND': 'Portal not found',
  'PORTAL_INACTIVE': 'Portal is not active',
  'SUBMISSION_FAILED': 'Submission processing failed',
  'FILE_TOO_LARGE': 'File exceeds size limit',
  'INVALID_FILE_TYPE': 'File type not allowed',
  'VIRUS_DETECTED': 'File failed security scan',
  
  // System
  'INTERNAL_ERROR': 'Internal server error',
  'SERVICE_UNAVAILABLE': 'Service temporarily unavailable',
  'MAINTENANCE_MODE': 'System under maintenance'
};
```

This comprehensive API documentation provides all the endpoints and integration patterns needed to implement a robust portal system that integrates seamlessly with the existing CMMS work order workflow.