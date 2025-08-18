import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import {
  LoadingSpinner,
  LoadingBar,
  LoadingSkeleton,
  LoadingOverlay,
  LoadingButton,
  TemplatedSkeleton,
  useLoading,
  useAsyncOperation,
} from './index';

/**
 * Test component to verify all loading states work correctly
 * This component can be imported in development to test loading consistency
 */
const LoadingTest: React.FC = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSpinnerVisible, setIsSpinnerVisible] = useState(false);
  
  // Test custom hooks
  const { loading, withLoading } = useLoading({ minLoadingTime: 1000 });
  const { execute: testAsyncOp, loading: asyncLoading } = useAsyncOperation();
  
  // Progress simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 10));
    }, 500);
    return () => clearInterval(timer);
  }, []);
  
  // Test functions
  const testSpinner = () => {
    setIsSpinnerVisible(true);
    setTimeout(() => setIsSpinnerVisible(false), 2000);
  };
  
  const testOverlay = () => {
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 3000);
  };
  
  const testCustomHook = async () => {
    await withLoading(async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
    });
  };
  
  const testAsyncOperation = () => {
    testAsyncOp(async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Loading Components Test Suite
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Test all standardized loading components to ensure consistency across the Elevated Compliance application.
      </Typography>

      <Grid container spacing={3}>
        {/* Spinner Tests */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Loading Spinners
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                <LoadingSpinner size="small" />
                <Typography variant="body2">Small (24px)</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                <LoadingSpinner size="medium" />
                <Typography variant="body2">Medium (40px)</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                <LoadingSpinner size="large" />
                <Typography variant="body2">Large (56px)</Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>With Message:</Typography>
              {isSpinnerVisible && (
                <LoadingSpinner size="medium" message="Testing spinner with message..." />
              )}
              <Button onClick={testSpinner} startIcon={<PlayIcon />} sx={{ mt: 1 }}>
                Test Spinner
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Progress Bar Tests */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Loading Bars
              </Typography>
              
              <Typography variant="body2" gutterBottom>Indeterminate:</Typography>
              <LoadingBar progress={undefined} sx={{ mb: 2 }} />
              
              <Typography variant="body2" gutterBottom>
                Determinate ({progress}%):
              </Typography>
              <LoadingBar progress={progress} sx={{ mb: 2 }} />
              
              <Typography variant="body2" gutterBottom>With Label:</Typography>
              <LoadingBar 
                progress={progress} 
                showLabel 
                sx={{ mb: 2 }} 
              />
              
              <Typography variant="body2" gutterBottom>Success Color:</Typography>
              <LoadingBar 
                progress={85} 
                color="success" 
                showLabel 
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Skeleton Tests */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Skeleton Components
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>Basic Skeleton:</Typography>
              <LoadingSkeleton variant="text" width="80%" height={24} sx={{ mb: 2 }} />
              <LoadingSkeleton variant="rectangular" width="100%" height={120} sx={{ mb: 2 }} />
              <LoadingSkeleton variant="circular" width={40} height={40} sx={{ mb: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>Work Order Card Template:</Typography>
              <TemplatedSkeleton template="workOrderCard" />
            </CardContent>
          </Card>
        </Grid>

        {/* Template Tests */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Template Skeletons
              </Typography>
              
              <Typography variant="body2" gutterBottom>Asset Card:</Typography>
              <TemplatedSkeleton template="assetCard" sx={{ mb: 2 }} />
              
              <Typography variant="body2" gutterBottom>Data Table (3 rows):</Typography>
              <TemplatedSkeleton template="dataTable" count={3} />
            </CardContent>
          </Card>
        </Grid>

        {/* Button Tests */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Loading Buttons
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <LoadingButton
                  variant="contained"
                  loading={loading}
                  onClick={testCustomHook}
                  startIcon={<SaveIcon />}
                >
                  Custom Hook Test
                </LoadingButton>
                
                <LoadingButton
                  variant="outlined"
                  loading={asyncLoading}
                  onClick={testAsyncOperation}
                  startIcon={<DownloadIcon />}
                >
                  Async Operation
                </LoadingButton>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Overlay Test */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Loading Overlay
              </Typography>
              
              <Button
                variant="contained"
                onClick={testOverlay}
                startIcon={<PlayIcon />}
                sx={{ mb: 2 }}
              >
                Test Overlay
              </Button>
              
              <Typography variant="body2" color="text.secondary">
                Click to show full-screen loading overlay for 3 seconds
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Accessibility Tests */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Accessibility Features
              </Typography>
              
              <FormControlLabel
                control={<Switch />}
                label="Reduced motion preference (simulated)"
                sx={{ mb: 2 }}
              />
              
              <Typography variant="body2" gutterBottom>
                Screen Reader Test - all components include proper ARIA labels:
              </Typography>
              <LoadingSpinner size="medium" aria-label="Loading content for screen reader test" />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Test Overlay */}
      <LoadingOverlay
        open={showOverlay}
        message="Testing overlay functionality..."
        context="data"
      />
    </Container>
  );
};

export default LoadingTest;