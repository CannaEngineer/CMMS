/**
 * QR SYSTEM ZOD VALIDATION SCHEMAS
 * Comprehensive validation schemas for all QR system operations
 */

import { z } from 'zod';
import { QREntityType, QRStatus, QRBatchStatus, QRScanAction, QRFormat, QRBatchOperationType } from './qr-system-types';

// =====================================================
// ENUM SCHEMAS
// =====================================================

export const QREntityTypeSchema = z.nativeEnum(QREntityType);
export const QRStatusSchema = z.nativeEnum(QRStatus);
export const QRBatchStatusSchema = z.nativeEnum(QRBatchStatus);
export const QRScanActionSchema = z.nativeEnum(QRScanAction);
export const QRFormatSchema = z.nativeEnum(QRFormat);
export const QRBatchOperationTypeSchema = z.nativeEnum(QRBatchOperationType);

// =====================================================
// BASIC VALIDATION SCHEMAS
// =====================================================

export const HexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format');
export const URLSchema = z.string().url('Invalid URL format');
export const DateTimeSchema = z.string().datetime('Invalid datetime format');
export const PositiveIntegerSchema = z.number().int().positive('Must be a positive integer');
export const NonNegativeIntegerSchema = z.number().int().min(0, 'Must be non-negative');

// =====================================================
// CONFIGURATION SCHEMAS
// =====================================================

export const QRCodeConfigSchema = z.object({
  format: QRFormatSchema.optional().default(QRFormat.PNG),
  size: z.number().int().min(50).max(2000).optional().default(200),
  color: HexColorSchema.optional().default('#000000'),
  backgroundColor: HexColorSchema.optional().default('#FFFFFF'),
  logoUrl: URLSchema.optional(),
  expiresAt: z.string().datetime().optional(),
  maxScans: PositiveIntegerSchema.optional(),
  errorCorrectionLevel: z.enum(['L', 'M', 'Q', 'H']).optional().default('M'),
  margin: z.number().int().min(0).max(50).optional().default(4)
}).strict();

export const QRCodeSecuritySchema = z.object({
  isPublic: z.boolean().optional().default(false),
  requiresAuth: z.boolean().optional().default(true),
  allowedRoles: z.array(z.string()).optional().default([]),
  accessPermissions: z.record(z.string(), z.boolean()).optional().default({}),
  ipWhitelist: z.array(z.string()).optional(),
  timeRestrictions: z.object({
    startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    timezone: z.string()
  }).optional()
}).strict();

export const QRLabelConfigSchema = z.object({
  includeTitle: z.boolean().default(true),
  includeDescription: z.boolean().default(false),
  includeEntityInfo: z.boolean().default(true),
  includeQRCode: z.boolean().default(true),
  fontSize: z.number().int().min(8).max(72).default(12),
  fontFamily: z.string().default('Arial'),
  layout: z.enum(['horizontal', 'vertical']).default('vertical'),
  paperSize: z.enum(['A4', 'Letter', 'Label']).default('A4'),
  margin: z.number().min(0).max(100).default(10)
}).strict();

// =====================================================
// CORE ENTITY SCHEMAS
// =====================================================

export const CreateQRCodeSchema = z.object({
  entityType: QREntityTypeSchema,
  entityId: PositiveIntegerSchema,
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  customData: z.record(z.string(), z.any()).optional().default({}),
  config: QRCodeConfigSchema.optional(),
  security: QRCodeSecuritySchema.optional(),
  templateId: PositiveIntegerSchema.optional()
}).strict();

export const UpdateQRCodeSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  status: QRStatusSchema.optional(),
  customData: z.record(z.string(), z.any()).optional(),
  config: QRCodeConfigSchema.partial().optional(),
  security: QRCodeSecuritySchema.partial().optional()
}).strict();

export const QRScanSchema = z.object({
  qrData: z.string().min(1, 'QR data cannot be empty'),
  scanAction: QRScanActionSchema.optional().default(QRScanAction.VIEW),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }).optional(),
  context: z.record(z.string(), z.any()).optional().default({})
}).strict();

// =====================================================
// BATCH OPERATION SCHEMAS
// =====================================================

export const QRBatchGenerateSchema = z.object({
  batchName: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  entityType: QREntityTypeSchema,
  filters: z.object({
    entityIds: z.array(PositiveIntegerSchema).optional(),
    locationIds: z.array(PositiveIntegerSchema).optional(),
    assetFilters: z.record(z.string(), z.any()).optional(),
    dateRange: z.object({
      start: DateTimeSchema,
      end: DateTimeSchema
    }).optional()
  }).strict(),
  template: z.object({
    templateId: PositiveIntegerSchema.optional(),
    config: QRCodeConfigSchema.optional()
  }).optional(),
  options: z.object({
    outputFormat: z.enum(['ZIP', 'PDF', 'EXCEL']),
    includeLabels: z.boolean(),
    labelTemplate: z.string().optional(),
    organizationMode: z.enum(['individual', 'sheet'])
  }).strict()
}).strict();

export const QRBatchUpdateSchema = z.object({
  batchName: z.string().min(1).max(255),
  qrCodeIds: z.array(PositiveIntegerSchema).min(1, 'At least one QR code ID required'),
  updates: z.object({
    status: QRStatusSchema.optional(),
    expiresAt: DateTimeSchema.optional(),
    maxScans: PositiveIntegerSchema.optional(),
    security: QRCodeSecuritySchema.partial().optional()
  }).strict()
}).strict();

export const QRBatchExportSchema = z.object({
  format: z.enum(['CSV', 'EXCEL', 'JSON']),
  includeAnalytics: z.boolean(),
  dateRange: z.object({
    start: DateTimeSchema,
    end: DateTimeSchema
  }).optional(),
  filters: z.object({
    entityType: QREntityTypeSchema.optional(),
    status: QRStatusSchema.optional(),
    entityIds: z.array(PositiveIntegerSchema).optional()
  }).optional()
}).strict();

// =====================================================
// TEMPLATE SCHEMAS
// =====================================================

export const CreateQRTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  entityType: QREntityTypeSchema,
  config: QRCodeConfigSchema,
  isDefault: z.boolean().optional().default(false)
}).strict();

export const UpdateQRTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  config: QRCodeConfigSchema.optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional()
}).strict();

export const DuplicateTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  modifications: QRCodeConfigSchema.partial().optional()
}).strict();

// =====================================================
// QUERY PARAMETER SCHEMAS
// =====================================================

export const QRCodeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  entityType: QREntityTypeSchema.optional(),
  status: QRStatusSchema.optional(),
  search: z.string().max(255).optional(),
  sortBy: z.enum(['createdAt', 'title', 'scanCount', 'expiresAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  includeExpired: z.coerce.boolean().optional().default(false)
}).strict();

export const QRBatchListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: QRBatchStatusSchema.optional(),
  operationType: QRBatchOperationTypeSchema.optional(),
  sortBy: z.enum(['createdAt', 'status', 'progress']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
}).strict();

export const DownloadQRCodeQuerySchema = z.object({
  format: QRFormatSchema.optional().default(QRFormat.PNG),
  size: z.coerce.number().int().min(50).max(2000).optional().default(200),
  includeLabel: z.coerce.boolean().optional().default(false),
  labelTemplate: z.string().optional()
}).strict();

export const BatchDownloadQuerySchema = z.object({
  fileType: z.enum(['results', 'errors', 'qr-codes']),
  format: z.enum(['ZIP', 'PDF']).optional().default('ZIP')
}).strict();

export const DeleteQRCodeQuerySchema = z.object({
  hard: z.coerce.boolean().optional().default(false),
  reason: z.string().max(500).optional()
}).strict();

// =====================================================
// ANALYTICS SCHEMAS
// =====================================================

export const QRAnalyticsQuerySchema = z.object({
  dateRange: z.object({
    start: DateTimeSchema,
    end: DateTimeSchema
  }).optional(),
  entityType: QREntityTypeSchema.optional(),
  groupBy: z.enum(['day', 'week', 'month', 'hour']).optional().default('day'),
  metrics: z.array(z.enum(['count', 'uniqueUsers', 'avgResponseTime'])).optional().default(['count'])
}).strict();

export const AnalyticsExportQuerySchema = z.object({
  format: z.enum(['CSV', 'EXCEL', 'PDF']),
  reportType: z.enum(['overview', 'detailed', 'trends']),
  dateRange: z.object({
    start: DateTimeSchema,
    end: DateTimeSchema
  }).optional(),
  includeGraphs: z.coerce.boolean().optional().default(false)
}).strict();

// =====================================================
// ACTION SCHEMAS
// =====================================================

export const QRActionSchema = z.object({
  action: QRScanActionSchema,
  payload: z.record(z.string(), z.any()).optional()
}).strict();

export const RegenerateQRCodeSchema = z.object({
  preserveStats: z.boolean().optional().default(true),
  reason: z.string().max(500).optional()
}).strict();

export const QRValidationQuerySchema = z.object({
  checkExpiration: z.coerce.boolean().optional().default(true),
  checkScanLimit: z.coerce.boolean().optional().default(true)
}).strict();

// =====================================================
// TEMPLATE LIST SCHEMAS
// =====================================================

export const QRTemplateListQuerySchema = z.object({
  entityType: QREntityTypeSchema.optional(),
  includeInactive: z.coerce.boolean().optional().default(false),
  sortBy: z.enum(['name', 'createdAt', 'usageCount']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
}).strict();

// =====================================================
// WEBSOCKET EVENT SCHEMAS
// =====================================================

export const WebSocketEventSchema = z.object({
  event: z.string(),
  data: z.any(),
  timestamp: DateTimeSchema,
  organizationId: PositiveIntegerSchema,
  userId: PositiveIntegerSchema.optional()
}).strict();

export const QRBatchProgressEventSchema = z.object({
  batchId: z.string(),
  progress: z.number().min(0).max(100),
  currentItem: z.string(),
  itemsCompleted: NonNegativeIntegerSchema,
  totalItems: PositiveIntegerSchema,
  errors: z.array(z.any()),
  estimatedCompletion: DateTimeSchema.optional()
}).strict();

export const QRScanRealtimeEventSchema = z.object({
  qrCodeId: PositiveIntegerSchema,
  entityType: QREntityTypeSchema,
  entityId: PositiveIntegerSchema,
  scanAction: QRScanActionSchema,
  location: z.string().optional(),
  timestamp: DateTimeSchema,
  userId: PositiveIntegerSchema.optional(),
  deviceType: z.string().optional()
}).strict();

// =====================================================
// CUSTOM VALIDATION FUNCTIONS
// =====================================================

export const validateEntityExists = async (entityType: QREntityType, entityId: number, organizationId: number): Promise<boolean> => {
  // This would be implemented with actual database checks
  // Return true if entity exists in the organization, false otherwise
  return true; // Placeholder
};

export const validateQRCodeUniqueness = async (entityType: QREntityType, entityId: number, organizationId: number): Promise<boolean> => {
  // Check if QR code already exists for this entity
  return true; // Placeholder
};

export const validateUserPermissions = (userRole: string, requiredPermissions: string[]): boolean => {
  // Implement role-based permission checking
  return true; // Placeholder
};

// =====================================================
// SCHEMA REFINEMENTS
// =====================================================

export const CreateQRCodeSchemaWithValidation = CreateQRCodeSchema.refine(
  async (data) => {
    // Add custom validation logic here
    return true;
  },
  {
    message: "Invalid QR code configuration"
  }
);

export const QRBatchGenerateSchemaWithValidation = QRBatchGenerateSchema.refine(
  (data) => {
    // Validate date range if provided
    if (data.filters.dateRange) {
      const start = new Date(data.filters.dateRange.start);
      const end = new Date(data.filters.dateRange.end);
      return start < end;
    }
    return true;
  },
  {
    message: "End date must be after start date",
    path: ["filters", "dateRange"]
  }
);

// =====================================================
// HELPER FUNCTIONS FOR SCHEMA USAGE
// =====================================================

export const validateWithSchema = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
};

export const formatValidationErrors = (error: z.ZodError): Array<{ field: string; message: string }> => {
  return error.issues.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
};

// =====================================================
// SCHEMA EXPORT MAP
// =====================================================

export const QRSchemas = {
  // Core entities
  createQRCode: CreateQRCodeSchema,
  updateQRCode: UpdateQRCodeSchema,
  scanQR: QRScanSchema,
  
  // Batch operations
  batchGenerate: QRBatchGenerateSchema,
  batchUpdate: QRBatchUpdateSchema,
  batchExport: QRBatchExportSchema,
  
  // Templates
  createTemplate: CreateQRTemplateSchema,
  updateTemplate: UpdateQRTemplateSchema,
  duplicateTemplate: DuplicateTemplateSchema,
  
  // Queries
  qrCodeList: QRCodeListQuerySchema,
  batchList: QRBatchListQuerySchema,
  downloadQR: DownloadQRCodeQuerySchema,
  batchDownload: BatchDownloadQuerySchema,
  deleteQRCode: DeleteQRCodeQuerySchema,
  
  // Analytics
  analytics: QRAnalyticsQuerySchema,
  analyticsExport: AnalyticsExportQuerySchema,
  
  // Actions
  qrAction: QRActionSchema,
  regenerateQR: RegenerateQRCodeSchema,
  validation: QRValidationQuerySchema,
  
  // Templates
  templateList: QRTemplateListQuerySchema,
  
  // WebSocket events
  webSocketEvent: WebSocketEventSchema,
  batchProgress: QRBatchProgressEventSchema,
  scanRealtime: QRScanRealtimeEventSchema
} as const;