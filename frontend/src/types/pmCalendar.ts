export interface PMScheduleItem {
  id: number;
  title: string;
  assetName: string;
  assetId: number;
  scheduledDate: Date;
  estimatedDuration: number; // minutes
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

export interface CalendarFilters {
  assetTypes: string[];
  technicians: string[];
  locations: string[];
  taskTypes: string[];
  priorities: string[];
  showOverdueOnly: boolean;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  pmItems: PMScheduleItem[];
}

export interface CalendarMonth {
  year: number;
  month: number; // 0-11
  weeks: CalendarDay[][];
}

export interface DragItem {
  pmId: number;
  originalDate: Date;
}

export interface PMCalendarProps {
  pmSchedules?: PMScheduleItem[];
  onPMClick?: (pm: PMScheduleItem) => void;
  onPMReschedule?: (pmId: number, newDate: Date) => void;
  onDateClick?: (date: Date) => void;
  filters?: CalendarFilters;
  onFiltersChange?: (filters: CalendarFilters) => void;
  loading?: boolean;
}