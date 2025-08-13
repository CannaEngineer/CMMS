# QR System API Architecture

## **API Endpoint Design**

### **Base URL Structure**
```
/api/v1/qr-codes
/api/v1/qr-scan
/api/v1/qr-batch
/api/v1/qr-templates
/api/v1/qr-analytics
```

---

## **1. QR Code Management Endpoints**

### **GET /api/v1/qr-codes**
**Description:** Get all QR codes for organization with filtering and pagination
```typescript
// Query Parameters
interface QRCodeListQuery {
  page?: number;
  limit?: number;
  entityType?: QREntityType;
  status?: QRStatus;
  search?: string;
  sortBy?: 'createdAt' | 'title' | 'scanCount' | 'expiresAt';
  sortOrder?: 'asc' | 'desc';
  includeExpired?: boolean;
}

// Response
interface QRCodeListResponse {
  data: QRCodeWithStats[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    entityTypes: Array<{ type: QREntityType; count: number }>;
    statuses: Array<{ status: QRStatus; count: number }>;
  };
}
```

### **GET /api/v1/qr-codes/:id**
**Description:** Get specific QR code with detailed information
```typescript
interface QRCodeDetailResponse {
  qrCode: QRCodeWithRelations;
  statistics: {
    totalScans: number;
    uniqueUsers: number;
    scansByDevice: Array<{ device: string; count: number }>;
    scansByAction: Array<{ action: QRScanAction; count: number }>;
    recentScans: QRScanLog[];
  };
  relatedEntity: Asset | Location | WorkOrder | null;
}
```

### **POST /api/v1/qr-codes**
**Description:** Generate new QR code for entity
```typescript
interface CreateQRCodeRequest {
  entityType: QREntityType;
  entityId: number;
  title?: string;
  description?: string;
  customData?: Record<string, any>;
  config?: QRCodeConfig;
  security?: QRCodeSecurity;
  templateId?: number;
}

interface QRCodeConfig {
  format?: 'PNG' | 'SVG' | 'PDF';
  size?: number;
  color?: string;
  backgroundColor?: string;
  logoUrl?: string;
  expiresAt?: string;
  maxScans?: number;
}

interface QRCodeSecurity {
  isPublic?: boolean;
  requiresAuth?: boolean;
  allowedRoles?: string[];
  accessPermissions?: Record<string, boolean>;
}
```

### **PUT /api/v1/qr-codes/:id**
**Description:** Update QR code configuration
```typescript
interface UpdateQRCodeRequest {
  title?: string;
  description?: string;
  status?: QRStatus;
  customData?: Record<string, any>;
  config?: Partial<QRCodeConfig>;
  security?: Partial<QRCodeSecurity>;
}
```

### **DELETE /api/v1/qr-codes/:id**
**Description:** Soft delete or revoke QR code
```typescript
// Query Parameters
interface DeleteQRCodeQuery {
  hard?: boolean; // true = permanent delete, false = revoke
  reason?: string;
}
```

### **POST /api/v1/qr-codes/:id/regenerate**
**Description:** Regenerate QR code with new hash/URL
```typescript
interface RegenerateQRCodeRequest {
  preserveStats?: boolean;
  reason?: string;
}
```

### **GET /api/v1/qr-codes/:id/download**
**Description:** Download QR code in specified format
```typescript
// Query Parameters
interface DownloadQRCodeQuery {
  format?: 'PNG' | 'SVG' | 'PDF';
  size?: number;
  includeLabel?: boolean;
  labelTemplate?: string;
}
```

---

## **2. QR Scanning Endpoints**

### **POST /api/v1/qr-scan**
**Description:** Process QR code scan and return appropriate response
```typescript
interface QRScanRequest {
  qrData: string; // The scanned QR code data
  scanAction?: QRScanAction;
  location?: {
    latitude: number;
    longitude: number;
  };
  context?: Record<string, any>;
}

interface QRScanResponse {
  success: boolean;
  data?: {
    entity: Asset | Location | WorkOrder | null;
    qrCode: QRCodePublic;
    permissions: string[];
    redirectUrl?: string;
    availableActions: QRScanAction[];
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### **GET /api/v1/qr-scan/validate/:hash**
**Description:** Validate QR code without logging scan
```typescript
interface QRCodeValidationResponse {
  valid: boolean;
  status: QRStatus;
  entityType?: QREntityType;
  requiresAuth: boolean;
  isExpired: boolean;
  scanLimitExceeded: boolean;
}
```

### **POST /api/v1/qr-scan/:qrId/action**
**Description:** Execute specific action from QR scan
```typescript
interface QRActionRequest {
  action: QRScanAction;
  payload?: Record<string, any>;
}

interface QRActionResponse {
  success: boolean;
  result?: any;
  nextSteps?: Array<{
    action: string;
    label: string;
    url: string;
  }>;
}
```

---

## **3. Batch Operations Endpoints**

### **GET /api/v1/qr-batch**
**Description:** Get list of batch operations
```typescript
interface QRBatchListQuery {
  page?: number;
  limit?: number;
  status?: QRBatchStatus;
  operationType?: string;
  sortBy?: 'createdAt' | 'status' | 'progress';
}

interface QRBatchListResponse {
  data: QRBatchOperationWithProgress[];
  pagination: PaginationMeta;
}
```

### **POST /api/v1/qr-batch/generate**
**Description:** Start bulk QR code generation
```typescript
interface QRBatchGenerateRequest {
  batchName: string;
  description?: string;
  entityType: QREntityType;
  filters: {
    entityIds?: number[];
    locationIds?: number[];
    assetFilters?: Record<string, any>;
    dateRange?: {
      start: string;
      end: string;
    };
  };
  template?: {
    templateId?: number;
    config?: QRCodeConfig;
  };
  options: {
    outputFormat: 'ZIP' | 'PDF' | 'EXCEL';
    includeLabels: boolean;
    labelTemplate?: string;
    organizationMode?: 'individual' | 'sheet';
  };
}
```

### **POST /api/v1/qr-batch/update**
**Description:** Bulk update QR codes
```typescript
interface QRBatchUpdateRequest {
  batchName: string;
  qrCodeIds: number[];
  updates: {
    status?: QRStatus;
    expiresAt?: string;
    maxScans?: number;
    security?: Partial<QRCodeSecurity>;
  };
}
```

### **POST /api/v1/qr-batch/export**
**Description:** Export QR codes and analytics
```typescript
interface QRBatchExportRequest {
  format: 'CSV' | 'EXCEL' | 'JSON';
  includeAnalytics: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: {
    entityType?: QREntityType;
    status?: QRStatus;
    entityIds?: number[];
  };
}
```

### **GET /api/v1/qr-batch/:batchId**
**Description:** Get batch operation status and progress
```typescript
interface QRBatchStatusResponse {
  batch: QRBatchOperation;
  progress: {
    percentage: number;
    currentItem: string;
    timeRemaining: number;
    itemsPerSecond: number;
  };
  results: {
    successful: Array<{ entityId: number; qrCodeId: number; url: string }>;
    failed: Array<{ entityId: number; error: string; details: any }>;
  };
  downloadUrls: string[];
}
```

### **POST /api/v1/qr-batch/:batchId/cancel**
**Description:** Cancel running batch operation

### **GET /api/v1/qr-batch/:batchId/download**
**Description:** Download batch operation results
```typescript
// Query Parameters
interface BatchDownloadQuery {
  fileType: 'results' | 'errors' | 'qr-codes';
  format?: 'ZIP' | 'PDF';
}
```

---

## **4. Template Management Endpoints**

### **GET /api/v1/qr-templates**
**Description:** Get QR code templates
```typescript
interface QRTemplateListQuery {
  entityType?: QREntityType;
  includeInactive?: boolean;
}

interface QRTemplateListResponse {
  templates: QRTemplate[];
  defaultTemplates: Record<QREntityType, QRTemplate>;
}
```

### **POST /api/v1/qr-templates**
**Description:** Create new QR template
```typescript
interface CreateQRTemplateRequest {
  name: string;
  description?: string;
  entityType: QREntityType;
  config: QRCodeConfig;
  isDefault?: boolean;
}
```

### **PUT /api/v1/qr-templates/:id**
**Description:** Update QR template

### **DELETE /api/v1/qr-templates/:id**
**Description:** Delete QR template

### **POST /api/v1/qr-templates/:id/duplicate**
**Description:** Duplicate existing template
```typescript
interface DuplicateTemplateRequest {
  name: string;
  modifications?: Partial<QRCodeConfig>;
}
```

---

## **5. Analytics & Reporting Endpoints**

### **GET /api/v1/qr-analytics/overview**
**Description:** Get QR system overview analytics
```typescript
interface QRAnalyticsOverview {
  summary: {
    totalQRCodes: number;
    totalScans: number;
    activeQRCodes: number;
    scansToday: number;
    topScannedEntity: {
      entityType: QREntityType;
      entityName: string;
      scanCount: number;
    };
  };
  trends: {
    scansByDay: Array<{ date: string; count: number }>;
    qrCodesByEntityType: Array<{ entityType: QREntityType; count: number }>;
    scansByDevice: Array<{ device: string; count: number; percentage: number }>;
  };
  performance: {
    averageResponseTime: number;
    errorRate: number;
    peakUsageHours: number[];
  };
}
```

### **GET /api/v1/qr-analytics/scans**
**Description:** Get detailed scan analytics
```typescript
interface QRScanAnalyticsQuery {
  dateRange?: {
    start: string;
    end: string;
  };
  entityType?: QREntityType;
  groupBy?: 'day' | 'week' | 'month' | 'hour';
  metrics?: Array<'count' | 'uniqueUsers' | 'avgResponseTime'>;
}

interface QRScanAnalyticsResponse {
  timeline: Array<{
    period: string;
    metrics: Record<string, number>;
  }>;
  breakdown: {
    byAction: Array<{ action: QRScanAction; count: number }>;
    byEntityType: Array<{ entityType: QREntityType; count: number }>;
    byLocation: Array<{ location: string; count: number }>;
    byDevice: Array<{ device: string; count: number }>;
  };
  topEntities: Array<{
    entityType: QREntityType;
    entityId: number;
    entityName: string;
    scanCount: number;
  }>;
}
```

### **GET /api/v1/qr-analytics/entities/:entityType/:entityId**
**Description:** Get analytics for specific entity's QR codes

### **GET /api/v1/qr-analytics/export**
**Description:** Export analytics data
```typescript
interface AnalyticsExportQuery {
  format: 'CSV' | 'EXCEL' | 'PDF';
  reportType: 'overview' | 'detailed' | 'trends';
  dateRange?: {
    start: string;
    end: string;
  };
  includeGraphs?: boolean;
}
```

---

## **HTTP Status Codes & Error Handling**

### **Success Codes**
- `200 OK` - Successful retrieval/update
- `201 Created` - QR code/template created
- `202 Accepted` - Batch operation started
- `204 No Content` - Successful deletion

### **Error Codes**
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - QR code/entity not found
- `409 Conflict` - QR code already exists for entity
- `410 Gone` - QR code expired/revoked
- `422 Unprocessable Entity` - Validation errors
- `429 Too Many Requests` - Rate limiting
- `500 Internal Server Error` - Server error

### **Error Response Format**
```typescript
interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path: string;
    correlationId: string;
  };
}
```

---

## **Rate Limiting**
- **QR Generation:** 100 requests per minute per organization
- **QR Scanning:** 1000 requests per minute (higher for public scans)
- **Batch Operations:** 5 concurrent operations per organization
- **Analytics:** 30 requests per minute per user

---

## **WebSocket Events for Real-time Updates**

### **Batch Operation Progress**
```typescript
// Event: 'qr-batch-progress'
interface QRBatchProgressEvent {
  batchId: string;
  progress: number;
  currentItem: string;
  itemsCompleted: number;
  totalItems: number;
  errors: any[];
}

// Event: 'qr-batch-completed'
interface QRBatchCompletedEvent {
  batchId: string;
  status: QRBatchStatus;
  results: {
    successful: number;
    failed: number;
    downloadUrls: string[];
  };
}
```

### **QR Code Scans**
```typescript
// Event: 'qr-scan-realtime'
interface QRScanRealtimeEvent {
  qrCodeId: number;
  entityType: QREntityType;
  entityId: number;
  scanAction: QRScanAction;
  location?: string;
  timestamp: string;
}
```