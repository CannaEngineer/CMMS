/**
 * CMMS Table Information Hierarchy Configuration
 * 
 * This file defines standardized information hierarchies for all CMMS table views
 * to ensure consistent mobile-first design and optimal user experience.
 */

export interface HierarchyRule {
  /** Column key identifier */
  key: string;
  /** Display label */
  label: string;
  /** Mobile alternative label (shorter) */
  mobileLabel?: string;
  /** Information priority level */
  priority: 'critical' | 'high' | 'medium' | 'low';
  /** Data category for semantic grouping */
  category: 'identity' | 'status' | 'date' | 'action' | 'assignment' | 'priority' | 'technical' | 'financial';
  /** Always visible on mobile regardless of space constraints */
  criticalInfo?: boolean;
  /** Screen sizes where this column should be hidden */
  hideOnBreakpoints?: ('xs' | 'sm' | 'md')[];
  /** Custom render function */
  render?: (value: any, item: any) => React.ReactNode;
  /** Sort configuration */
  sortable?: boolean;
  /** Column width specifications */
  width?: {
    mobile?: string | number;
    tablet?: string | number;
    desktop?: string | number;
  };
  /** Accessibility description */
  ariaDescription?: string;
  /** Touch optimization settings */
  touchOptimized?: boolean;
}

export interface TableHierarchyConfig {
  /** Unique identifier for this table configuration */
  tableType: 'workOrders' | 'assets' | 'parts' | 'pmSchedules' | 'portalSubmissions' | 'locations' | 'users';
  /** Human-readable table name */
  displayName: string;
  /** Hierarchy rules for columns */
  columns: HierarchyRule[];
  /** Default mobile columns (max 3 recommended) */
  mobileDefaults: string[];
  /** Status indicator configuration */
  statusConfig?: {
    columnKey: string;
    statusColors: Record<string, string>;
    statusIcons?: Record<string, React.ReactNode>;
  };
  /** Action button configuration */
  actionConfig?: {
    primary: string[]; // High priority actions (always visible on mobile)
    secondary: string[]; // Medium priority actions
    tertiary: string[]; // Low priority actions (desktop only)
  };
}

// Work Orders Hierarchy Configuration
export const workOrdersHierarchy: TableHierarchyConfig = {
  tableType: 'workOrders',
  displayName: 'Work Orders',
  mobileDefaults: ['id', 'title', 'status'],
  columns: [
    {
      key: 'id',
      label: 'WO#',
      mobileLabel: 'WO#',
      priority: 'critical',
      category: 'identity',
      criticalInfo: true,
      sortable: true,
      width: { mobile: 80, tablet: 100, desktop: 120 },
      ariaDescription: 'Work order identification number',
      touchOptimized: true,
    },
    {
      key: 'title',
      label: 'Work Order Title',
      mobileLabel: 'Title',
      priority: 'critical',
      category: 'identity',
      criticalInfo: true,
      sortable: true,
      ariaDescription: 'Work order title or description',
    },
    {
      key: 'status',
      label: 'Status',
      priority: 'critical',
      category: 'status',
      criticalInfo: true,
      sortable: true,
      width: { mobile: 100, tablet: 120, desktop: 140 },
      ariaDescription: 'Current work order status',
    },
    {
      key: 'priority',
      label: 'Priority',
      priority: 'high',
      category: 'priority',
      sortable: true,
      width: { mobile: 80, tablet: 100, desktop: 120 },
      hideOnBreakpoints: ['xs'],
      ariaDescription: 'Work order priority level',
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      mobileLabel: 'Assignee',
      priority: 'high',
      category: 'assignment',
      sortable: false,
      hideOnBreakpoints: ['xs'],
      ariaDescription: 'Person assigned to this work order',
    },
    {
      key: 'asset',
      label: 'Asset',
      priority: 'medium',
      category: 'technical',
      sortable: false,
      hideOnBreakpoints: ['xs', 'sm'],
      ariaDescription: 'Asset associated with this work order',
    },
    {
      key: 'createdAt',
      label: 'Created',
      priority: 'medium',
      category: 'date',
      sortable: true,
      width: { desktop: 120 },
      hideOnBreakpoints: ['xs', 'sm'],
      ariaDescription: 'Work order creation date',
    },
    {
      key: 'updatedAt',
      label: 'Last Updated',
      mobileLabel: 'Updated',
      priority: 'low',
      category: 'date',
      sortable: true,
      width: { desktop: 120 },
      hideOnBreakpoints: ['xs', 'sm', 'md'],
      ariaDescription: 'Last modification date',
    },
  ],
  statusConfig: {
    columnKey: 'status',
    statusColors: {
      OPEN: 'warning',
      IN_PROGRESS: 'info',
      ON_HOLD: 'default',
      COMPLETED: 'success',
      CANCELED: 'error',
    },
  },
  actionConfig: {
    primary: ['view', 'edit'],
    secondary: ['assign', 'updateStatus'],
    tertiary: ['duplicate', 'export', 'delete'],
  },
};

// Assets Hierarchy Configuration
export const assetsHierarchy: TableHierarchyConfig = {
  tableType: 'assets',
  displayName: 'Assets',
  mobileDefaults: ['name', 'status', 'location'],
  columns: [
    {
      key: 'name',
      label: 'Asset Name',
      mobileLabel: 'Name',
      priority: 'critical',
      category: 'identity',
      criticalInfo: true,
      sortable: true,
      ariaDescription: 'Asset name or identifier',
    },
    {
      key: 'status',
      label: 'Status',
      priority: 'critical',
      category: 'status',
      criticalInfo: true,
      sortable: true,
      width: { mobile: 100, tablet: 120, desktop: 140 },
      ariaDescription: 'Current asset operational status',
    },
    {
      key: 'location',
      label: 'Location',
      priority: 'high',
      category: 'technical',
      sortable: true,
      ariaDescription: 'Physical location of the asset',
    },
    {
      key: 'serialNumber',
      label: 'Serial Number',
      mobileLabel: 'Serial#',
      priority: 'high',
      category: 'technical',
      sortable: true,
      hideOnBreakpoints: ['xs'],
      ariaDescription: 'Manufacturer serial number',
    },
    {
      key: 'manufacturer',
      label: 'Manufacturer',
      mobileLabel: 'Mfg',
      priority: 'medium',
      category: 'technical',
      sortable: true,
      hideOnBreakpoints: ['xs', 'sm'],
      ariaDescription: 'Asset manufacturer',
    },
    {
      key: 'model',
      label: 'Model',
      priority: 'medium',
      category: 'technical',
      sortable: true,
      hideOnBreakpoints: ['xs', 'sm'],
      ariaDescription: 'Asset model number',
    },
    {
      key: 'lastMaintenance',
      label: 'Last Maintenance',
      mobileLabel: 'Last PM',
      priority: 'medium',
      category: 'date',
      sortable: true,
      width: { desktop: 140 },
      hideOnBreakpoints: ['xs', 'sm'],
      ariaDescription: 'Date of last maintenance',
    },
    {
      key: 'nextMaintenance',
      label: 'Next Maintenance',
      mobileLabel: 'Next PM',
      priority: 'low',
      category: 'date',
      sortable: true,
      width: { desktop: 140 },
      hideOnBreakpoints: ['xs', 'sm', 'md'],
      ariaDescription: 'Scheduled next maintenance date',
    },
  ],
  statusConfig: {
    columnKey: 'status',
    statusColors: {
      OPERATIONAL: 'success',
      MAINTENANCE: 'warning',
      DOWN: 'error',
      RETIRED: 'default',
    },
  },
  actionConfig: {
    primary: ['view', 'edit'],
    secondary: ['maintenance', 'qr'],
    tertiary: ['history', 'export', 'delete'],
  },
};

// Parts/Inventory Hierarchy Configuration
export const partsHierarchy: TableHierarchyConfig = {
  tableType: 'parts',
  displayName: 'Parts & Inventory',
  mobileDefaults: ['name', 'stockLevel', 'status'],
  columns: [
    {
      key: 'sku',
      label: 'SKU',
      priority: 'high',
      category: 'identity',
      sortable: true,
      width: { mobile: 80, tablet: 100, desktop: 120 },
      ariaDescription: 'Stock keeping unit identifier',
      touchOptimized: true,
    },
    {
      key: 'name',
      label: 'Part Name',
      mobileLabel: 'Name',
      priority: 'critical',
      category: 'identity',
      criticalInfo: true,
      sortable: true,
      ariaDescription: 'Part name or description',
    },
    {
      key: 'stockLevel',
      label: 'Current Stock',
      mobileLabel: 'Stock',
      priority: 'critical',
      category: 'status',
      criticalInfo: true,
      sortable: true,
      width: { mobile: 80, tablet: 100, desktop: 120 },
      ariaDescription: 'Current stock quantity',
    },
    {
      key: 'reorderPoint',
      label: 'Reorder Level',
      mobileLabel: 'Reorder',
      priority: 'high',
      category: 'technical',
      sortable: true,
      width: { desktop: 120 },
      hideOnBreakpoints: ['xs'],
      ariaDescription: 'Minimum stock level before reordering',
    },
    {
      key: 'supplier',
      label: 'Supplier',
      priority: 'medium',
      category: 'technical',
      sortable: false,
      hideOnBreakpoints: ['xs', 'sm'],
      ariaDescription: 'Primary supplier for this part',
    },
    {
      key: 'unitCost',
      label: 'Unit Cost',
      priority: 'medium',
      category: 'financial',
      sortable: true,
      width: { desktop: 100 },
      hideOnBreakpoints: ['xs', 'sm'],
      ariaDescription: 'Cost per unit',
    },
    {
      key: 'lastOrdered',
      label: 'Last Ordered',
      priority: 'low',
      category: 'date',
      sortable: true,
      width: { desktop: 120 },
      hideOnBreakpoints: ['xs', 'sm', 'md'],
      ariaDescription: 'Date of last purchase order',
    },
  ],
  statusConfig: {
    columnKey: 'stockLevel',
    statusColors: {
      IN_STOCK: 'success',
      LOW_STOCK: 'warning',
      OUT_OF_STOCK: 'error',
    },
  },
  actionConfig: {
    primary: ['view', 'edit'],
    secondary: ['reorder', 'adjustStock'],
    tertiary: ['history', 'suppliers', 'delete'],
  },
};

// PM Schedules Hierarchy Configuration
export const pmSchedulesHierarchy: TableHierarchyConfig = {
  tableType: 'pmSchedules',
  displayName: 'Preventive Maintenance Schedules',
  mobileDefaults: ['title', 'nextDue', 'frequency'],
  columns: [
    {
      key: 'title',
      label: 'PM Title',
      mobileLabel: 'Title',
      priority: 'critical',
      category: 'identity',
      criticalInfo: true,
      sortable: true,
      ariaDescription: 'Preventive maintenance task title',
    },
    {
      key: 'asset',
      label: 'Asset',
      priority: 'critical',
      category: 'technical',
      criticalInfo: true,
      sortable: true,
      ariaDescription: 'Asset associated with this PM schedule',
    },
    {
      key: 'nextDue',
      label: 'Next Due',
      mobileLabel: 'Due',
      priority: 'critical',
      category: 'date',
      criticalInfo: true,
      sortable: true,
      width: { mobile: 100, tablet: 120, desktop: 140 },
      ariaDescription: 'Next scheduled maintenance date',
    },
    {
      key: 'frequency',
      label: 'Frequency',
      priority: 'high',
      category: 'technical',
      sortable: true,
      width: { desktop: 120 },
      ariaDescription: 'Maintenance frequency schedule',
    },
    {
      key: 'priority',
      label: 'Priority',
      priority: 'high',
      category: 'priority',
      sortable: true,
      width: { desktop: 100 },
      hideOnBreakpoints: ['xs'],
      ariaDescription: 'PM schedule priority level',
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      mobileLabel: 'Assignee',
      priority: 'medium',
      category: 'assignment',
      sortable: false,
      hideOnBreakpoints: ['xs', 'sm'],
      ariaDescription: 'Person responsible for this PM',
    },
    {
      key: 'lastCompleted',
      label: 'Last Completed',
      mobileLabel: 'Last Done',
      priority: 'medium',
      category: 'date',
      sortable: true,
      width: { desktop: 140 },
      hideOnBreakpoints: ['xs', 'sm'],
      ariaDescription: 'Date of last completion',
    },
    {
      key: 'estimatedDuration',
      label: 'Duration',
      priority: 'low',
      category: 'technical',
      sortable: false,
      width: { desktop: 100 },
      hideOnBreakpoints: ['xs', 'sm', 'md'],
      ariaDescription: 'Estimated time to complete',
    },
  ],
  statusConfig: {
    columnKey: 'nextDue',
    statusColors: {
      OVERDUE: 'error',
      DUE_SOON: 'warning',
      SCHEDULED: 'success',
    },
  },
  actionConfig: {
    primary: ['view', 'complete'],
    secondary: ['edit', 'reschedule'],
    tertiary: ['history', 'duplicate', 'delete'],
  },
};

// Portal Submissions Hierarchy Configuration
export const portalSubmissionsHierarchy: TableHierarchyConfig = {
  tableType: 'portalSubmissions',
  displayName: 'Portal Submissions',
  mobileDefaults: ['title', 'status', 'submittedAt'],
  columns: [
    {
      key: 'id',
      label: 'Submission#',
      mobileLabel: 'Sub#',
      priority: 'high',
      category: 'identity',
      sortable: true,
      width: { mobile: 80, tablet: 100, desktop: 120 },
      ariaDescription: 'Submission identification number',
      touchOptimized: true,
    },
    {
      key: 'title',
      label: 'Title/Description',
      mobileLabel: 'Title',
      priority: 'critical',
      category: 'identity',
      criticalInfo: true,
      sortable: true,
      ariaDescription: 'Submission title or description',
    },
    {
      key: 'status',
      label: 'Status',
      priority: 'critical',
      category: 'status',
      criticalInfo: true,
      sortable: true,
      width: { mobile: 100, tablet: 120, desktop: 140 },
      ariaDescription: 'Current submission status',
    },
    {
      key: 'priority',
      label: 'Priority',
      priority: 'high',
      category: 'priority',
      sortable: true,
      width: { desktop: 100 },
      hideOnBreakpoints: ['xs'],
      ariaDescription: 'Submission priority level',
    },
    {
      key: 'submittedBy',
      label: 'Submitted By',
      mobileLabel: 'Submitter',
      priority: 'medium',
      category: 'identity',
      sortable: false,
      hideOnBreakpoints: ['xs'],
      ariaDescription: 'Person who submitted the request',
    },
    {
      key: 'submittedAt',
      label: 'Submitted',
      mobileLabel: 'Date',
      priority: 'high',
      category: 'date',
      sortable: true,
      width: { desktop: 140 },
      ariaDescription: 'Submission date and time',
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      mobileLabel: 'Assignee',
      priority: 'medium',
      category: 'assignment',
      sortable: false,
      hideOnBreakpoints: ['xs', 'sm'],
      ariaDescription: 'Person assigned to handle this submission',
    },
    {
      key: 'location',
      label: 'Location',
      priority: 'low',
      category: 'technical',
      sortable: true,
      hideOnBreakpoints: ['xs', 'sm', 'md'],
      ariaDescription: 'Location associated with the submission',
    },
  ],
  statusConfig: {
    columnKey: 'status',
    statusColors: {
      NEW: 'info',
      IN_REVIEW: 'warning',
      IN_PROGRESS: 'primary',
      RESOLVED: 'success',
      REJECTED: 'error',
    },
  },
  actionConfig: {
    primary: ['view', 'assign'],
    secondary: ['edit', 'updateStatus'],
    tertiary: ['convert', 'export', 'delete'],
  },
};

// Collection of all hierarchy configurations
export const tableHierarchies: Record<string, TableHierarchyConfig> = {
  workOrders: workOrdersHierarchy,
  assets: assetsHierarchy,
  parts: partsHierarchy,
  pmSchedules: pmSchedulesHierarchy,
  portalSubmissions: portalSubmissionsHierarchy,
};

// Helper function to get hierarchy config by table type
export const getTableHierarchy = (tableType: string): TableHierarchyConfig | null => {
  return tableHierarchies[tableType] || null;
};

// Helper function to generate column configuration for UniversalTableView
export const generateTableColumns = (
  hierarchyConfig: TableHierarchyConfig,
  breakpoint: 'mobile' | 'tablet' | 'desktop' = 'mobile'
) => {
  return hierarchyConfig.columns
    .filter(column => {
      // Filter based on breakpoint visibility
      if (breakpoint === 'mobile') {
        return !column.hideOnBreakpoints?.includes('xs') && !column.hideOnBreakpoints?.includes('sm');
      } else if (breakpoint === 'tablet') {
        return !column.hideOnBreakpoints?.includes('md');
      }
      return true; // Desktop shows all columns
    })
    .map(column => ({
      key: column.key,
      label: breakpoint === 'mobile' && column.mobileLabel ? column.mobileLabel : column.label,
      sortable: column.sortable || false,
      width: column.width?.[breakpoint] || column.width?.desktop || 'auto',
      priority: column.priority === 'critical' ? 'high' : column.priority as 'high' | 'medium' | 'low',
      render: column.render,
      hideOnMobile: column.hideOnBreakpoints?.includes('xs') || column.hideOnBreakpoints?.includes('sm'),
      sticky: column.key === hierarchyConfig.mobileDefaults[0], // Make first mobile default sticky
      // Enhanced mobile and accessibility features
      description: column.ariaDescription,
      touchOptimized: column.touchOptimized || false,
      criticalInfo: column.criticalInfo || false,
      mobileLabel: column.mobileLabel,
      category: column.category,
    }));
};