export interface CalendarItem {
  id: number;
  title: string;
  type: 'PM_SCHEDULE' | 'WORK_ORDER';
  scheduledDate: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: string;
  assetName?: string;
  assetId?: number;
  location?: string;
  assignedTechnician?: string;
  description?: string;
  isOverdue: boolean;
  estimatedDuration?: number;
  originalData: any; // Store original PM or WO data for reference
}

export interface CalendarStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  overdue: number;
  byType: {
    pmSchedules: number;
    workOrders: number;
  };
  byPriority: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    URGENT: number;
  };
}

export interface CalendarFilters {
  type?: 'PM_SCHEDULE' | 'WORK_ORDER' | 'ALL';
  assetId?: number;
  locationId?: number;
  assignedToId?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface MonthData {
  year: number;
  month: number;
  startDate: Date;
  endDate: Date;
  itemsByDate: Record<string, CalendarItem[]>;
  totalItems: number;
  overdueItems: number;
}

export interface UnifiedCalendarProps {
  filters?: CalendarFilters;
  onFiltersChange?: (filters: CalendarFilters) => void;
  onItemClick?: (item: CalendarItem) => void;
  onDateClick?: (date: Date) => void;
  onItemReschedule?: (itemId: number, itemType: 'PM_SCHEDULE' | 'WORK_ORDER', newDate: Date) => void;
  loading?: boolean;
  height?: number | string;
}

// For backward compatibility with existing PMScheduleItem interface
export interface PMScheduleItem {
  id: number;
  title: string;
  assetName: string;
  assetId: number;
  scheduledDate: Date;
  estimatedDuration: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'IMPORTANT';
  taskType: 'INSPECTION' | 'CLEANING' | 'LUBRICATION' | 'REPLACEMENT' | 'CALIBRATION' | 'TESTING';
  assignedTechnician?: string;
  location: string;
  isOverdue: boolean;
  description?: string;
  workOrderId?: number;
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

// Helper function to convert CalendarItem to PMScheduleItem for backward compatibility
export function calendarItemToPMScheduleItem(item: CalendarItem): PMScheduleItem | null {
  if (item.type !== 'PM_SCHEDULE') return null;
  
  return {
    id: item.id,
    title: item.title,
    assetName: item.assetName || 'Unknown Asset',
    assetId: item.assetId || 0,
    scheduledDate: item.scheduledDate,
    estimatedDuration: item.estimatedDuration || 60,
    priority: item.priority,
    criticality: 'MEDIUM', // Default since we don't have this in CalendarItem
    taskType: 'INSPECTION', // Default since we don't have this in CalendarItem
    assignedTechnician: item.assignedTechnician,
    location: item.location || 'Unknown Location',
    isOverdue: item.isOverdue,
    description: item.description,
    status: item.status === 'OVERDUE' ? 'SCHEDULED' : 'SCHEDULED',
  };
}

// Helper function to convert multiple CalendarItems to PMScheduleItems
export function calendarItemsToPMScheduleItems(items: CalendarItem[]): PMScheduleItem[] {
  return items
    .map(calendarItemToPMScheduleItem)
    .filter((item): item is PMScheduleItem => item !== null);
}