// Loading Components - Unified loading system for CMMS application
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as LoadingBar } from './LoadingBar';
export { default as LoadingSkeleton, TemplatedSkeleton, skeletonTemplates } from './LoadingSkeleton';
export { default as LoadingOverlay } from './LoadingOverlay';
export { default as LoadingButton } from './LoadingButton';

// Export types
export type {
  LoadingSize,
  LoadingVariant,
  LoadingContext,
  BaseLoadingProps,
  LoadingSpinnerProps,
  LoadingBarProps,
  LoadingSkeletonProps,
  LoadingOverlayProps,
  LoadingButtonProps,
  SkeletonTemplates,
} from './types';

// Re-export skeleton templates for easy access
export { skeletonTemplates as LoadingTemplates } from './LoadingSkeleton';