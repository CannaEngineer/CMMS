// Main exports for the Universal View Toggle System
export { default as ViewToggle } from './ViewToggle';
export type { ViewToggleProps, ViewType } from './ViewToggle';

export { default as UniversalCardView } from './UniversalCardView';
export type { 
  UniversalCardViewProps, 
  CardField, 
  CardAction 
} from './UniversalCardView';

export { default as UniversalTableView } from './UniversalTableView';
export type { 
  UniversalTableViewProps, 
  TableColumn, 
  TableAction, 
  SortDirection 
} from './UniversalTableView';

export { default as UniversalViewContainer } from './UniversalViewContainer';
export type { 
  UniversalViewContainerProps, 
  ViewMapping 
} from './UniversalViewContainer';

export { 
  ViewProvider, 
  useView, 
  useComponentView 
} from '../../contexts/ViewContext';
export type { 
  ViewContextType, 
  ViewPreference, 
  ViewState 
} from '../../contexts/ViewContext';

// Loading Components System
export * from '../Loading';

// File Upload Manager
export { default as FileUploadManager } from './FileUploadManager';
export type { FileAttachment } from './FileUploadManager';

// Re-export examples for documentation and development
export * as Examples from './examples';

// Mobile-first components
export * from './MobileComponents';
export * from './GestureComponents';
export * from './MobileNavigation';

// Enhanced DataTable component
export { default as DataTable } from './DataTable';
export * from './MobileComponents';

// Network and offline components
export { default as NetworkStatus } from './NetworkStatus';