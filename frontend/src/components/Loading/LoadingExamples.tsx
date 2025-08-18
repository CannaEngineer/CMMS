import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Divider,
  Grid,
} from '@mui/material';
import {
  LoadingSpinner,
  LoadingBar,
  LoadingSkeleton,
  LoadingOverlay,
  LoadingButton,
  TemplatedSkeleton,
} from './index';

/**
 * LoadingExamples - Comprehensive examples of all loading components
 * Use this component for testing and demonstrating loading patterns
 */
const LoadingExamples: React.FC = () => {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [progressOverlayOpen, setProgressOverlayOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  // Simulate progress for demo
  const handleProgressDemo = () => {
    setProgressOverlayOpen(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setProgressOverlayOpen(false), 500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  // Simulate async action
  const handleAsyncAction = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Loading Components Showcase
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Standardized loading components for the CMMS application
      </Typography>

      <Stack spacing={4}>
        {/* Loading Spinners */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Loading Spinners
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Use for quick actions and indeterminate loading states
            </Typography>
            
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" display="block" gutterBottom>
                    Small Primary
                  </Typography>
                  <LoadingSpinner size="small" variant="primary" />
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" display="block" gutterBottom>
                    Medium Secondary
                  </Typography>
                  <LoadingSpinner size="medium" variant="secondary" />
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" display="block" gutterBottom>
                    Large Neutral
                  </Typography>
                  <LoadingSpinner size="large" variant="neutral" />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Loading Bars */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Loading Bars
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Use for processes with known progress or file operations
            </Typography>
            
            <Stack spacing={3}>
              <Box>
                <Typography variant="caption" display="block" gutterBottom>
                  Indeterminate Progress
                </Typography>
                <LoadingBar variant="primary" />
              </Box>
              
              <Box>
                <Typography variant="caption" display="block" gutterBottom>
                  Determinate with Label (65%)
                </Typography>
                <LoadingBar progress={65} showLabel variant="secondary" />
              </Box>
              
              <Box>
                <Typography variant="caption" display="block" gutterBottom>
                  With Buffer (Progress: 40%, Buffer: 60%)
                </Typography>
                <LoadingBar progress={40} buffer={60} showLabel variant="primary" />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Loading Skeletons */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Loading Skeletons
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Use for content placeholders while data loads
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Work Order Card Template
                </Typography>
                <TemplatedSkeleton template="workOrderCard" />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Asset Card Template
                </Typography>
                <TemplatedSkeleton template="assetCard" />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Data Table Template
                </Typography>
                <TemplatedSkeleton template="dataTable" />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Form Template
                </Typography>
                <TemplatedSkeleton template="form" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Loading Buttons */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Loading Buttons
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Use for form submissions and actions with processing time
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <LoadingButton
                  variant="contained"
                  fullWidth
                  onClick={handleAsyncAction}
                  loadingPosition="center"
                >
                  Save Changes
                </LoadingButton>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <LoadingButton
                  variant="outlined"
                  fullWidth
                  onClick={handleAsyncAction}
                  loadingPosition="start"
                >
                  Generate Report
                </LoadingButton>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <LoadingButton
                  variant="text"
                  fullWidth
                  onClick={handleAsyncAction}
                  loadingPosition="end"
                >
                  Sync Data
                </LoadingButton>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Loading Overlays */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Loading Overlays
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Use for full-screen or section loading states
            </Typography>
            
            <Stack direction="row" spacing={2}>
              <Button 
                variant="outlined" 
                onClick={() => setOverlayOpen(true)}
              >
                Show Basic Overlay
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={handleProgressDemo}
              >
                Show Progress Overlay
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Usage Guidelines */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Usage Guidelines
            </Typography>
            
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="primary">
                  Loading Spinners
                </Typography>
                <Typography variant="body2">
                  • Quick actions ({"<"} 3 seconds)<br/>
                  • API calls with unknown duration<br/>
                  • Button loading states
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="primary">
                  Loading Bars  
                </Typography>
                <Typography variant="body2">
                  • File uploads/downloads<br/>
                  • Data processing with known progress<br/>
                  • Multi-step operations
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="primary">
                  Loading Skeletons
                </Typography>
                <Typography variant="body2">
                  • Initial page loads<br/>
                  • Table data fetching<br/>
                  • Content that will have specific layout
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="primary">
                  Loading Overlays
                </Typography>
                <Typography variant="body2">
                  • Long-running operations ({">"}5 seconds)<br/>
                  • Critical processes that block UI<br/>
                  • Data synchronization
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      {/* Overlay Demos */}
      <LoadingOverlay
        open={overlayOpen}
        message="Processing your request..."
        context="page"
        onClose={() => setOverlayOpen(false)}
      />

      <LoadingOverlay
        open={progressOverlayOpen}
        message="Synchronizing data"
        progress={progress}
        context="data"
        disableEscapeKeyDown
      />
    </Box>
  );
};

export default LoadingExamples;