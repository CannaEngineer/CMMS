import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';

interface CalendarSkeletonProps {
  viewType: 'day' | 'week' | 'month';
}

const CalendarSkeleton: React.FC<CalendarSkeletonProps> = ({ viewType }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const SkeletonCard = ({ height = 140 }: { height?: number }) => (
    <Card>
      <CardContent sx={{ p: 1.5 }}>
        <Stack spacing={1}>
          {/* Date */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Skeleton variant="text" width={30} height={24} />
            <Skeleton variant="circular" width={20} height={20} />
          </Stack>
          
          {/* Items */}
          <Stack spacing={0.5}>
            <Skeleton 
              variant="rectangular" 
              width="100%" 
              height={24} 
              sx={{ borderRadius: 4 }}
            />
            <Skeleton 
              variant="rectangular" 
              width="80%" 
              height={24} 
              sx={{ borderRadius: 4 }}
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );

  const HeaderSkeleton = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        {/* Hero section */}
        <Stack 
          direction={isMobile ? "column" : "row"} 
          alignItems="center" 
          spacing={3}
          sx={{ mb: 3 }}
        >
          <Skeleton variant="circular" width={isMobile ? 56 : 64} height={isMobile ? 56 : 64} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={40} />
            <Skeleton variant="text" width="40%" height={24} />
          </Box>
          <Stack direction="row" spacing={1}>
            <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
            <Skeleton variant="circular" width={40} height={40} />
          </Stack>
        </Stack>

        {/* Stats cards */}
        <Grid container spacing={2}>
          {Array.from({ length: isMobile ? 2 : 3 }).map((_, index) => (
            <Grid key={index} xs={6} sm={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Skeleton variant="text" width="60%" height={24} sx={{ mx: 'auto' }} />
                  <Skeleton variant="text" width="40%" height={32} sx={{ mx: 'auto' }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  const CalendarHeaderSkeleton = () => (
    <Box sx={{ 
      p: 3,
      background: `linear-gradient(135deg, ${theme.palette.primary.main}10 0%, ${theme.palette.secondary.main}05 100%)`,
      borderBottom: `1px solid ${theme.palette.divider}`,
    }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        {/* Title section */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <Skeleton variant="circular" width={48} height={48} />
          <Box>
            <Skeleton variant="text" width={200} height={32} />
            <Skeleton variant="text" width={150} height={20} />
          </Box>
        </Stack>

        {/* Controls */}
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 2 }} />
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="circular" width={40} height={40} />
        </Stack>
      </Stack>
    </Box>
  );

  const NavigationSkeleton = () => (
    <Stack 
      direction="row" 
      justifyContent="space-between" 
      alignItems="center" 
      sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
    >
      <Skeleton variant="circular" width={40} height={40} />
      <Skeleton variant="text" width={200} height={28} />
      <Skeleton variant="circular" width={40} height={40} />
    </Stack>
  );

  const WeekHeadersSkeleton = () => (
    <Grid container sx={{ borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.default }}>
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
        <Grid key={index} xs={12/7}>
          <Box sx={{ p: isMobile ? 1 : 2, textAlign: 'center' }}>
            <Skeleton variant="text" width={30} height={24} sx={{ mx: 'auto' }} />
          </Box>
        </Grid>
      ))}
    </Grid>
  );

  const getGridCount = () => {
    switch (viewType) {
      case 'day': return 1;
      case 'week': return 7;
      case 'month': return 42;
      default: return 42;
    }
  };

  const getGridProps = () => {
    switch (viewType) {
      case 'day': return { xs: 12 };
      case 'week': return { xs: 12/7 };
      case 'month': return { xs: 12/7 };
      default: return { xs: 12/7 };
    }
  };

  return (
    <Box>
      {/* Animated header with shimmer effect */}
      <HeaderSkeleton />
      
      {/* Calendar container */}
      <Card>
        {/* Calendar header */}
        <CalendarHeaderSkeleton />
        
        {/* Navigation (for mobile or non-day view) */}
        {(viewType !== 'day' || isMobile) && <NavigationSkeleton />}
        
        {/* Week headers for month view */}
        {viewType === 'month' && <WeekHeadersSkeleton />}
        
        {/* Calendar grid with staggered animation */}
        <Box sx={{ p: viewType === 'month' ? 0 : 2 }}>
          <Grid container spacing={viewType === 'month' ? 0 : 1}>
            {Array.from({ length: getGridCount() }).map((_, index) => {
              const delay = index * 50; // Stagger the animations
              
              return (
                <Grid key={index} {...getGridProps()}>
                  <Box
                    sx={{
                      animation: `skeleton-pulse 2s ease-in-out infinite`,
                      animationDelay: `${delay}ms`,
                      '@keyframes skeleton-pulse': {
                        '0%': { opacity: 1 },
                        '50%': { opacity: 0.4 },
                        '100%': { opacity: 1 },
                      },
                    }}
                  >
                    <SkeletonCard 
                      height={
                        isMobile 
                          ? viewType === 'day' ? 300 : viewType === 'week' ? 150 : 100
                          : viewType === 'day' ? 400 : viewType === 'week' ? 200 : 140
                      } 
                    />
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Card>

      {/* Additional skeleton for contextual panel on desktop */}
      {!isMobile && (
        <Box sx={{ 
          position: 'fixed',
          right: 24,
          top: 200,
          width: 320,
          zIndex: 1,
        }}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Skeleton variant="text" width={120} height={28} />
                  <Skeleton variant="circular" width={32} height={32} />
                </Stack>
                
                <Divider />
                
                <Stack spacing={1}>
                  <Skeleton variant="text" width="100%" height={24} />
                  <Skeleton variant="text" width="80%" height={20} />
                  <Skeleton variant="text" width="60%" height={20} />
                </Stack>
                
                <Stack direction="row" spacing={1}>
                  <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" width={60} height={32} sx={{ borderRadius: 1 }} />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Floating Action Button skeleton */}
      <Box sx={{ 
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1,
      }}>
        <Skeleton variant="circular" width={56} height={56} />
      </Box>
    </Box>
  );
};

export default CalendarSkeleton;