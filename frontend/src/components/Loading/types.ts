// Loading component types and interfaces
export type LoadingSize = 'small' | 'medium' | 'large';
export type LoadingVariant = 'primary' | 'secondary' | 'neutral';
export type LoadingContext = 'page' | 'section' | 'form' | 'button' | 'data';

export interface BaseLoadingProps {
  size?: LoadingSize;
  variant?: LoadingVariant;
  className?: string;
  'aria-label'?: string;
}

export interface LoadingSpinnerProps extends BaseLoadingProps {
  thickness?: number;
  disableShrink?: boolean;
}

export interface LoadingBarProps extends BaseLoadingProps {
  progress?: number;
  buffer?: number;
  showLabel?: boolean;
  label?: string;
}

export interface LoadingSkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular' | 'card' | 'table' | 'form';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animation?: 'pulse' | 'wave' | false;
  className?: string;
}

export interface LoadingOverlayProps {
  open: boolean;
  message?: string;
  progress?: number;
  backdrop?: boolean;
  disableEscapeKeyDown?: boolean;
  context?: LoadingContext;
  onClose?: () => void;
}

export interface LoadingButtonProps {
  loading?: boolean;
  disabled?: boolean;
  loadingPosition?: 'start' | 'end' | 'center';
  loadingIndicator?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  className?: string;
}

// Skeleton template configurations for common CMMS patterns
export interface SkeletonTemplates {
  workOrderCard: LoadingSkeletonProps;
  assetCard: LoadingSkeletonProps;
  dataTable: LoadingSkeletonProps;
  dashboard: LoadingSkeletonProps;
  form: LoadingSkeletonProps;
  calendar: LoadingSkeletonProps;
}