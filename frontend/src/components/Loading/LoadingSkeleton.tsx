import React from 'react';
import {
  Skeleton,
  Box,
  Card,
  CardContent,
  Stack,
  Grid,
  useTheme,
  alpha,
} from '@mui/material';
import { LoadingSkeletonProps, SkeletonTemplates } from './types';

/**
 * LoadingSkeleton - Content placeholder component with CMMS-specific templates
 * 
 * Design Decisions:
 * - Provides pre-configured templates for common CMMS patterns
 * - Respects reduced motion preferences with pulse animation
 * - Uses subtle animations to indicate loading state
 * - Maintains consistent spacing and proportions
 */

// Template configurations for common CMMS components
export const skeletonTemplates: SkeletonTemplates = {
  workOrderCard: {
    variant: 'card',
    height: 200,
    animation: 'wave',
  },
  assetCard: {
    variant: 'card',
    height: 180,
    animation: 'wave',
  },
  dataTable: {
    variant: 'table',
    lines: 5,
    animation: 'pulse',
  },
  dashboard: {
    variant: 'rectangular',
    height: 400,
    animation: 'pulse',
  },
  form: {
    variant: 'form',
    lines: 6,
    animation: 'wave',
  },
  calendar: {
    variant: 'rectangular',
    height: 300,
    animation: 'pulse',
  },
};

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'rectangular',
  width = '100%',
  height = 40,
  lines = 3,
  animation = 'pulse',
  className,
}) => {
  const theme = useTheme();

  // Enhanced skeleton styling for professional appearance
  const skeletonSx = {
    backgroundColor: alpha(theme.palette.divider, 0.1),
    '&::after': {
      background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.common.white, 0.4)}, transparent)`,
    },
    // Respect reduced motion preferences
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
      '&::after': {
        animation: 'none',
      },
    },
  };

  // Render different skeleton patterns based on variant
  const renderSkeletonContent = () => {
    switch (variant) {
      case 'card':
        return (
          <Card className={className} sx={{ height }}>
            <CardContent>
              <Stack spacing={1.5}>
                {/* Header with icon and title */}
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Skeleton 
                    variant="circular" 
                    width={40} 
                    height={40} 
                    animation={animation}
                    sx={skeletonSx}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton 
                      variant="text" 
                      width="70%" 
                      height={24}
                      animation={animation}
                      sx={skeletonSx}
                    />
                    <Skeleton 
                      variant="text" 
                      width="50%" 
                      height={16}
                      animation={animation}
                      sx={skeletonSx}
                    />
                  </Box>
                </Stack>
                
                {/* Content area */}
                <Stack spacing={1}>
                  <Skeleton 
                    variant="rectangular" 
                    width="100%" 
                    height={60}
                    animation={animation}
                    sx={{ ...skeletonSx, borderRadius: 1 }}
                  />
                  <Stack direction="row" spacing={1}>
                    <Skeleton 
                      variant="rectangular" 
                      width="60%" 
                      height={20}
                      animation={animation}
                      sx={{ ...skeletonSx, borderRadius: 0.5 }}
                    />
                    <Skeleton 
                      variant="rectangular" 
                      width="30%" 
                      height={20}
                      animation={animation}
                      sx={{ ...skeletonSx, borderRadius: 0.5 }}
                    />
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        );

      case 'table':
        return (
          <Box className={className}>
            {/* Table header */}
            <Stack 
              direction="row" 
              spacing={2} 
              sx={{ 
                p: 2, 
                borderBottom: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.background.default,
              }}
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton 
                  key={index}
                  variant="text" 
                  width={index === 0 ? '30%' : '20%'} 
                  height={20}
                  animation={animation}
                  sx={skeletonSx}
                />
              ))}
            </Stack>
            
            {/* Table rows */}
            <Stack>
              {Array.from({ length: lines }).map((_, rowIndex) => (
                <Stack 
                  key={rowIndex}
                  direction="row" 
                  spacing={2} 
                  sx={{ 
                    p: 2, 
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  }}
                >
                  {Array.from({ length: 4 }).map((_, colIndex) => (
                    <Skeleton 
                      key={colIndex}
                      variant="text" 
                      width={colIndex === 0 ? '30%' : '20%'} 
                      height={16}
                      animation={animation}
                      sx={skeletonSx}
                    />
                  ))}
                </Stack>
              ))}
            </Stack>
          </Box>
        );

      case 'form':
        return (
          <Stack spacing={3} className={className}>
            {Array.from({ length: lines }).map((_, index) => (
              <Box key={index}>
                <Skeleton 
                  variant="text" 
                  width="25%" 
                  height={16}
                  animation={animation}
                  sx={{ ...skeletonSx, mb: 1 }}
                />
                <Skeleton 
                  variant="rectangular" 
                  width="100%" 
                  height={48}
                  animation={animation}
                  sx={{ ...skeletonSx, borderRadius: 1 }}
                />
              </Box>
            ))}
          </Stack>
        );

      case 'text':
        return (
          <Stack spacing={0.5} className={className}>
            {Array.from({ length: lines }).map((_, index) => (
              <Skeleton
                key={index}
                variant="text"
                width={index === lines - 1 ? '60%' : '100%'}
                height={height}
                animation={animation}
                sx={skeletonSx}
              />
            ))}
          </Stack>
        );

      case 'circular':
        return (
          <Skeleton
            variant="circular"
            width={width}
            height={height}
            animation={animation}
            className={className}
            sx={skeletonSx}
          />
        );

      case 'rectangular':
      default:
        return (
          <Skeleton
            variant="rectangular"
            width={width}
            height={height}
            animation={animation}
            className={className}
            sx={{ ...skeletonSx, borderRadius: 1 }}
          />
        );
    }
  };

  return renderSkeletonContent();
};

// Template-based skeleton for common CMMS patterns
export const TemplatedSkeleton: React.FC<{ template: keyof SkeletonTemplates; className?: string }> = ({ 
  template, 
  className 
}) => {
  const templateProps = skeletonTemplates[template];
  return <LoadingSkeleton {...templateProps} className={className} />;
};

export default LoadingSkeleton;