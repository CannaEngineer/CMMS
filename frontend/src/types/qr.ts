// QR Code System Type Definitions
export interface QRCodeData {
  type: QRCodeType;
  id: string;
  organizationId: string;
  version: string;
  metadata?: Record<string, any>;
  timestamp: number;
  baseUrl?: string;
}

export type QRCodeType = 'asset' | 'work-order' | 'pm-schedule' | 'location' | 'user' | 'part' | 'portal';

export interface QRCodeGenerationOptions {
  size?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  includeLogo?: boolean;
  logoUrl?: string;
}

export interface QRLabel {
  id: string;
  title: string;
  subtitle?: string;
  qrCode: string;
  additionalInfo?: string[];
  template: QRLabelTemplate;
}

export interface QRLabelTemplate {
  id: string;
  name: string;
  description: string;
  dimensions: {
    width: number;
    height: number;
    unit: 'mm' | 'in';
  };
  qrSize: number;
  fontSize: {
    title: number;
    subtitle: number;
    info: number;
  };
  layout: 'horizontal' | 'vertical';
  includeQRBorder?: boolean;
  customCSS?: string;
}

export interface PrintableSheet {
  labels: QRLabel[];
  template: QRLabelTemplate;
  htmlContent: string;
  cssStyles: string;
  pageSettings: {
    orientation: 'portrait' | 'landscape';
    paperSize: 'A4' | 'Letter' | 'Custom';
    labelsPerRow: number;
    labelsPerColumn: number;
  };
}

export interface QRScanResult {
  data: string;
  isValid: boolean;
  qrCodeData?: QRCodeData;
  error?: string;
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface QRAction {
  id: string;
  label: string;
  icon: string;
  description: string;
  requiresAuth?: boolean;
  requiresOnline?: boolean;
  category: 'view' | 'edit' | 'create' | 'complete' | 'schedule';
}

export interface QRActionContext {
  qrData: QRCodeData;
  availableActions: QRAction[];
  userPermissions: string[];
  isOnline: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface OfflineQRAction {
  id: string;
  qrData: QRCodeData;
  action: QRAction;
  data: any;
  timestamp: number;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
}

export interface QRBatchOperation {
  id: string;
  type: 'generate' | 'print';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total: number;
  processed: number;
  items: Array<{
    id: string;
    data: QRCodeData;
    status: 'pending' | 'completed' | 'failed';
    result?: string; // QR code data URL or error message
  }>;
  createdAt: number;
  completedAt?: number;
  error?: string;
}

export interface QRGenerationRequest {
  items: Array<{
    type: QRCodeType;
    id: string;
    title: string;
    subtitle?: string;
    additionalInfo?: string[];
    metadata?: Record<string, any>;
  }>;
  options: QRCodeGenerationOptions;
  template: QRLabelTemplate;
  organizationId: string;
}

export interface QRCodeMetrics {
  totalScans: number;
  uniqueScans: number;
  scansByType: Record<QRCodeType, number>;
  scansByHour: Record<string, number>;
  topScannedItems: Array<{
    type: QRCodeType;
    id: string;
    title: string;
    scanCount: number;
  }>;
  offlineActions: {
    pending: number;
    completed: number;
    failed: number;
  };
}

// Predefined QR Label Templates
export const QR_LABEL_TEMPLATES: Record<string, QRLabelTemplate> = {
  SMALL_ASSET_TAG: {
    id: 'small-asset-tag',
    name: 'Small Asset Tag',
    description: 'Compact tag for small equipment (25mm x 15mm)',
    dimensions: { width: 25, height: 15, unit: 'mm' },
    qrSize: 10,
    fontSize: { title: 6, subtitle: 4, info: 3 },
    layout: 'horizontal',
    includeQRBorder: true,
  },
  MEDIUM_EQUIPMENT_LABEL: {
    id: 'medium-equipment-label',
    name: 'Medium Equipment Label',
    description: 'Standard equipment label (50mm x 30mm)',
    dimensions: { width: 50, height: 30, unit: 'mm' },
    qrSize: 20,
    fontSize: { title: 8, subtitle: 6, info: 5 },
    layout: 'horizontal',
    includeQRBorder: true,
  },
  LARGE_EQUIPMENT_SIGN: {
    id: 'large-equipment-sign',
    name: 'Large Equipment Sign',
    description: 'Large equipment signage (100mm x 70mm)',
    dimensions: { width: 100, height: 70, unit: 'mm' },
    qrSize: 40,
    fontSize: { title: 12, subtitle: 10, info: 8 },
    layout: 'horizontal',
    includeQRBorder: false,
  },
  WORK_ORDER_TAG: {
    id: 'work-order-tag',
    name: 'Work Order Tag',
    description: 'Work order documentation tag (50mm x 30mm)',
    dimensions: { width: 50, height: 30, unit: 'mm' },
    qrSize: 18,
    fontSize: { title: 7, subtitle: 5, info: 4 },
    layout: 'vertical',
    includeQRBorder: true,
  },
  PM_SCHEDULE_LABEL: {
    id: 'pm-schedule-label',
    name: 'PM Schedule Label',
    description: 'Preventive maintenance schedule label (60mm x 40mm)',
    dimensions: { width: 60, height: 40, unit: 'mm' },
    qrSize: 25,
    fontSize: { title: 9, subtitle: 7, info: 6 },
    layout: 'vertical',
    includeQRBorder: true,
  },
};

// QR Actions by Type
export const QR_ACTIONS_BY_TYPE: Record<QRCodeType, QRAction[]> = {
  asset: [
    {
      id: 'view-asset',
      label: 'View Asset Details',
      icon: 'visibility',
      description: 'View complete asset information',
      category: 'view',
    },
    {
      id: 'edit-asset',
      label: 'Edit Asset',
      icon: 'edit',
      description: 'Modify asset information',
      requiresAuth: true,
      category: 'edit',
    },
    {
      id: 'create-work-order',
      label: 'Create Work Order',
      icon: 'add_task',
      description: 'Create new work order for this asset',
      requiresAuth: true,
      category: 'create',
    },
    {
      id: 'check-in',
      label: 'Check In',
      icon: 'check_circle',
      description: 'Record asset check-in',
      requiresAuth: true,
      category: 'complete',
    },
    {
      id: 'schedule-pm',
      label: 'Schedule Maintenance',
      icon: 'schedule',
      description: 'Schedule preventive maintenance',
      requiresAuth: true,
      requiresOnline: true,
      category: 'schedule',
    },
  ],
  'work-order': [
    {
      id: 'view-work-order',
      label: 'View Work Order',
      icon: 'assignment',
      description: 'View work order details',
      category: 'view',
    },
    {
      id: 'update-status',
      label: 'Update Status',
      icon: 'sync',
      description: 'Update work order status',
      requiresAuth: true,
      category: 'edit',
    },
    {
      id: 'mark-complete',
      label: 'Mark Complete',
      icon: 'check',
      description: 'Complete work order',
      requiresAuth: true,
      category: 'complete',
    },
    {
      id: 'add-notes',
      label: 'Add Notes',
      icon: 'note_add',
      description: 'Add work notes or comments',
      requiresAuth: true,
      category: 'edit',
    },
  ],
  'pm-schedule': [
    {
      id: 'view-pm-schedule',
      label: 'View PM Schedule',
      icon: 'schedule',
      description: 'View preventive maintenance schedule',
      category: 'view',
    },
    {
      id: 'complete-pm',
      label: 'Complete PM Task',
      icon: 'task_alt',
      description: 'Mark PM task as completed',
      requiresAuth: true,
      category: 'complete',
    },
    {
      id: 'reschedule-pm',
      label: 'Reschedule',
      icon: 'event_available',
      description: 'Reschedule maintenance task',
      requiresAuth: true,
      requiresOnline: true,
      category: 'schedule',
    },
    {
      id: 'update-pm-status',
      label: 'Update Status',
      icon: 'sync',
      description: 'Update PM task status',
      requiresAuth: true,
      category: 'edit',
    },
  ],
  location: [
    {
      id: 'view-location',
      label: 'View Location',
      icon: 'place',
      description: 'View location details and assets',
      category: 'view',
    },
    {
      id: 'view-location-assets',
      label: 'View Assets',
      icon: 'inventory',
      description: 'View all assets in this location',
      category: 'view',
    },
    {
      id: 'create-location-work-order',
      label: 'Create Work Order',
      icon: 'add_task',
      description: 'Create work order for this location',
      requiresAuth: true,
      category: 'create',
    },
  ],
  user: [
    {
      id: 'view-user',
      label: 'View Profile',
      icon: 'person',
      description: 'View user profile and assignments',
      category: 'view',
    },
    {
      id: 'view-user-tasks',
      label: 'View Tasks',
      icon: 'assignment_ind',
      description: 'View assigned tasks and work orders',
      category: 'view',
    },
  ],
  part: [
    {
      id: 'view-part',
      label: 'View Part Details',
      icon: 'visibility',
      description: 'View complete part information and stock levels',
      category: 'view',
    },
    {
      id: 'update-stock',
      label: 'Update Stock',
      icon: 'inventory',
      description: 'Update part stock levels',
      requiresAuth: true,
      category: 'edit',
    },
    {
      id: 'create-purchase-order',
      label: 'Create Purchase Order',
      icon: 'shopping_cart',
      description: 'Create purchase order for this part',
      requiresAuth: true,
      category: 'create',
    },
    {
      id: 'check-location',
      label: 'Check Location',
      icon: 'place',
      description: 'Find part location in warehouse',
      category: 'view',
    },
  ],
};