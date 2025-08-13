/**
 * QR SYSTEM TYPESCRIPT INTERFACES AND TYPE DEFINITIONS
 * Comprehensive type system for the QR code management system
 */

import { z } from 'zod';

// =====================================================
// ENUMS
// =====================================================

export enum QREntityType {
  ASSET = 'ASSET',
  LOCATION = 'LOCATION',
  WORK_ORDER = 'WORK_ORDER',
  PM_SCHEDULE = 'PM_SCHEDULE',
  PART = 'PART',
  USER = 'USER',
  PORTAL = 'PORTAL'
}

export enum QRStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED'
}

export enum QRBatchStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum QRScanAction {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  CREATE_WORK_ORDER = 'CREATE_WORK_ORDER',
  UPDATE_STATUS = 'UPDATE_STATUS',
  LOG_METER = 'LOG_METER',
  INSPECT = 'INSPECT',
  DOWNLOAD = 'DOWNLOAD'
}

export enum QRFormat {
  PNG = 'PNG',
  SVG = 'SVG',
  PDF = 'PDF'
}

export enum QRBatchOperationType {
  GENERATE = 'GENERATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT'
}

// =====================================================
// CORE INTERFACES
// =====================================================

export interface QRCode {
  id: number;
  uniqueId: string;
  organizationId: number;
  
  // Entity Association
  entityType: QREntityType;
  entityId: number;
  entityUniqueId?: string;
  
  // QR Code Properties
  qrData: string;
  qrHash: string;
  qrImageUrl?: string;
  shortUrl?: string;
  
  // Metadata
  title?: string;
  description?: string;
  customData: Record<string, any>;
  
  // Configuration
  status: QRStatus;
  expiresAt?: Date;
  maxScans?: number;
  currentScans: number;
  
  // Security & Access Control
  isPublic: boolean;
  requiresAuth: boolean;
  allowedRoles: string[];
  accessPermissions: Record<string, boolean>;
  
  // Format & Display Options
  format: QRFormat;
  size: number;
  color: string;
  backgroundColor: string;
  logoUrl?: string;
  
  // Audit Fields
  createdBy?: number;
  updatedBy?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QRCodeWithRelations extends QRCode {
  organization: {
    id: number;
    name: string;
  };
  createdByUser?: {
    id: number;
    name: string;
    email: string;
  };
  scanLogs: QRScanLog[];
  entity?: Asset | Location | WorkOrder | PMSchedule | Part | User;
}

export interface QRCodeWithStats extends QRCode {
  scanCount: number;
  uniqueScanners: number;
  lastScanned?: Date;
  averageResponseTime: number;
  errorRate: number;
}

export interface QRCodePublic {
  id: number;
  entityType: QREntityType;
  entityId: number;
  title?: string;
  description?: string;
  qrImageUrl?: string;
  isPublic: boolean;
  status: QRStatus;
  expiresAt?: Date;
  customData: Record<string, any>;
}

export interface QRScanLog {
  id: string;
  qrCodeId: number;
  organizationId: number;
  
  // Scan Details
  scanAction: QRScanAction;
  scanResult: string;
  errorMessage?: string;
  
  // User Information
  scannedBy?: number;
  userRole?: string;
  sessionId?: string;
  
  // Technical Details
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  browser?: string;
  platform?: string;
  
  // Location & Context
  scanLocation?: {
    latitude: number;
    longitude: number;
  };
  scanContext: Record<string, any>;
  referrerUrl?: string;
  
  // Performance Metrics
  responseTimeMs?: number;
  dataTransferredBytes?: number;
  
  // Timestamp
  scannedAt: Date;
}

export interface QRBatchOperation {
  id: number;
  batchId: string;
  organizationId: number;
  
  // Operation Details
  operationType: QRBatchOperationType;
  entityType: QREntityType;
  status: QRBatchStatus;
  
  // Batch Configuration
  batchName?: string;
  description?: string;
  filters: Record<string, any>;
  templateConfig: Record<string, any>;
  
  // Progress Tracking
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  
  // Results & Errors
  results: any[];
  errors: any[];
  outputFiles: string[];
  
  // Timing
  startedAt?: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;
  
  // User & Audit
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QRTemplate {
  id: number;
  organizationId: number;
  
  // Template Identity
  name: string;
  description?: string;
  entityType: QREntityType;
  
  // Template Configuration
  config: QRCodeConfig;
  isDefault: boolean;
  isActive: boolean;
  
  // Usage Tracking
  usageCount: number;
  lastUsedAt?: Date;
  
  // Audit
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// CONFIGURATION INTERFACES
// =====================================================

export interface QRCodeConfig {
  format?: QRFormat;
  size?: number;
  color?: string;
  backgroundColor?: string;
  logoUrl?: string;
  expiresAt?: Date;
  maxScans?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
}

export interface QRCodeSecurity {
  isPublic?: boolean;
  requiresAuth?: boolean;
  allowedRoles?: string[];
  accessPermissions?: Record<string, boolean>;
  ipWhitelist?: string[];
  timeRestrictions?: {
    startTime: string; // HH:MM
    endTime: string;   // HH:MM
    timezone: string;
  };
}

export interface QRLabelConfig {
  includeTitle: boolean;
  includeDescription: boolean;
  includeEntityInfo: boolean;
  includeQRCode: boolean;
  fontSize: number;
  fontFamily: string;
  layout: 'horizontal' | 'vertical';
  paperSize: 'A4' | 'Letter' | 'Label';
  margin: number;
}

// =====================================================
// REQUEST/RESPONSE INTERFACES
// =====================================================

export interface CreateQRCodeRequest {
  entityType: QREntityType;
  entityId: number;
  title?: string;
  description?: string;
  customData?: Record<string, any>;
  config?: QRCodeConfig;
  security?: QRCodeSecurity;
  templateId?: number;
}

export interface UpdateQRCodeRequest {
  title?: string;
  description?: string;
  status?: QRStatus;
  customData?: Record<string, any>;
  config?: Partial<QRCodeConfig>;
  security?: Partial<QRCodeSecurity>;
}

export interface QRScanRequest {
  qrData: string;
  scanAction?: QRScanAction;
  location?: {
    latitude: number;
    longitude: number;
  };
  context?: Record<string, any>;
}

export interface QRScanResponse {
  success: boolean;
  data?: {
    entity: any; // Asset | Location | WorkOrder | etc.
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

export interface QRBatchGenerateRequest {
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
    organizationMode: 'individual' | 'sheet';
  };
}

// =====================================================
// ANALYTICS INTERFACES
// =====================================================

export interface QRAnalyticsOverview {
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

export interface QRScanAnalytics {
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

// =====================================================
// UTILITY INTERFACES
// =====================================================

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: PaginationMeta;
    filters?: Record<string, any>;
    timestamp: string;
    correlationId: string;
  };
}

export interface WebSocketEvent<T = any> {
  event: string;
  data: T;
  timestamp: string;
  organizationId: number;
  userId?: number;
}

// =====================================================
// ENTITY REFERENCE INTERFACES (for relationships)
// =====================================================

export interface Asset {
  id: number;
  name: string;
  description?: string;
  serialNumber?: string;
  modelNumber?: string;
  manufacturer?: string;
  status: string;
  locationId: number;
  location?: {
    id: number;
    name: string;
  };
}

export interface Location {
  id: number;
  name: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface WorkOrder {
  id: number;
  uniqueId?: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assetId?: number;
  asset?: Asset;
}

export interface PMSchedule {
  id: number;
  uniqueId?: string;
  title: string;
  description?: string;
  frequency: string;
  nextDue: Date;
  assetId: number;
  asset?: Asset;
}

export interface Part {
  id: number;
  name: string;
  description?: string;
  sku?: string;
  stockLevel: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

// =====================================================
// ERROR INTERFACES
// =====================================================

export interface QRError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  correlationId: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// =====================================================
// WEBSOCKET EVENT INTERFACES
// =====================================================

export interface QRBatchProgressEvent {
  batchId: string;
  progress: number;
  currentItem: string;
  itemsCompleted: number;
  totalItems: number;
  errors: any[];
  estimatedCompletion: Date;
}

export interface QRScanRealtimeEvent {
  qrCodeId: number;
  entityType: QREntityType;
  entityId: number;
  scanAction: QRScanAction;
  location?: string;
  timestamp: Date;
  userId?: number;
  deviceType?: string;
}

export interface QRCodeStatusChangeEvent {
  qrCodeId: number;
  oldStatus: QRStatus;
  newStatus: QRStatus;
  reason?: string;
  timestamp: Date;
  changedBy: number;
}