import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
} from '@mui/material';
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
 * MigrationExample - Shows how to replace existing loading patterns
 * with the new standardized loading components
 */

// Simulated API calls
const mockAPI = {
  fetchWorkOrders: () => new Promise(resolve => setTimeout(() => resolve([
    { id: 1, title: 'Repair Generator', priority: 'HIGH' },
    { id: 2, title: 'Check HVAC System', priority: 'MEDIUM' },
  ]), 2000)),

  submitWorkOrder: () => new Promise(resolve => setTimeout(resolve, 1500)),

  syncData: () => new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      if (progress >= 100) {
        clearInterval(interval);
        resolve('sync-complete');
      }
    }, 500);
  }),
};

// Example 1: Before/After Dashboard Loading
const DashboardExample = () => {
  const [workOrders, setWorkOrders] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await mockAPI.fetchWorkOrders();
        setWorkOrders(data);
      } catch (error) {
        console.error('Failed to load work orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Work Orders Dashboard
        </Typography>

        {/* NEW: Skeleton loading instead of spinner */}
        {loading ? (
          <TemplatedSkeleton template="dataTable" />
        ) : (
          <Stack spacing={1}>
            {workOrders?.map(order => (
              <Box
                key={order.id}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body1">{order.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Priority: {order.priority}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

// Example 2: Form with Loading Button  
const FormExample = () => {
  const { execute, isLoading, error } = useAsyncOperation({
    minLoadingTime: 500, // Prevent flash loading
  });

  const handleSubmit = () => {
    execute(async () => {
      await mockAPI.submitWorkOrder();
    });
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Create Work Order
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to create work order: {error.message}
          </Alert>
        )}

        <Stack spacing={2}>
          {/* Form fields would go here */}
          <Box sx={{ height: 100, bgcolor: 'grey.100', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">Form fields...</Typography>
          </Box>

          {/* NEW: LoadingButton with automatic state management */}
          <LoadingButton
            onClick={handleSubmit}
            loading={isLoading}
            variant="contained"
            fullWidth
            loadingPosition="center"
          >
            Create Work Order
          </LoadingButton>
        </Stack>
      </CardContent>
    </Card>
  );
};

// Example 3: Data Sync with Progress
const DataSyncExample = () => {
  const { loading, withLoading, setProgress } = useLoading({
    minLoadingTime: 1000,
  });

  const handleSync = async () => {
    await withLoading(async () => {
      // Simulate progress updates
      for (let i = 0; i <= 100; i += 20) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    });
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Data Synchronization
        </Typography>
        
        <Button 
          variant="outlined" 
          onClick={handleSync}
          disabled={loading.isLoading}
          fullWidth
        >
          Start Sync
        </Button>

        {/* NEW: LoadingOverlay with progress */}
        <LoadingOverlay
          open={loading.isLoading}
          message="Synchronizing maintenance data..."
          progress={loading.progress}
          context="data"
        />
      </CardContent>
    </Card>
  );
};

// Example 4: Quick Action Loading
const QuickActionsExample = () => {
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const handleAction = async (actionId: string) => {
    setActionLoading(prev => ({ ...prev, [actionId]: true }));
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setActionLoading(prev => ({ ...prev, [actionId]: false }));
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        
        <Stack direction="row" spacing={1}>
          <LoadingButton
            size="small"
            loading={actionLoading.refresh}
            onClick={() => handleAction('refresh')}
            loadingPosition="start"
          >
            Refresh
          </LoadingButton>
          
          <LoadingButton
            size="small"
            variant="outlined"
            loading={actionLoading.export}
            onClick={() => handleAction('export')}
            loadingPosition="end"
          >
            Export
          </LoadingButton>
          
          {/* Simple spinner for inline loading */}
          {actionLoading.inline && <LoadingSpinner size="small" />}
          <Button 
            size="small" 
            variant="text"
            onClick={() => handleAction('inline')}
          >
            Process
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

// Main migration example component
const MigrationExample: React.FC = () => {
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Loading Components Migration Examples
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        These examples show how to replace existing loading patterns with the new standardized components.
        Each example demonstrates different use cases and best practices.
      </Alert>

      <Stack spacing={3}>
        <DashboardExample />
        <FormExample />
        <DataSyncExample />
        <QuickActionsExample />
      </Stack>

      <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Migration Checklist
        </Typography>
        <Typography variant="body2" component="div">
          <ul>
            <li>Replace CircularProgress with LoadingSpinner</li>
            <li>Replace LinearProgress with LoadingBar</li>
            <li>Use LoadingSkeleton for content placeholders</li>
            <li>Implement LoadingButton for form submissions</li>
            <li>Add LoadingOverlay for long-running operations</li>
            <li>Use useLoading hook for state management</li>
            <li>Ensure accessibility compliance</li>
            <li>Test with reduced motion preferences</li>
          </ul>
        </Typography>
      </Box>
    </Box>
  );
};

export default MigrationExample;