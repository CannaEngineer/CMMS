import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  AddTask as CreateIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
  Assignment as WorkOrderIcon,
  Build as AssetIcon,
  Person as PersonIcon,
  Place as LocationIcon,
  EventAvailable as PMIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { 
  QRScanResult, 
  QRActionContext, 
  QRAction, 
  QR_ACTIONS_BY_TYPE 
} from '../../types/qr';
import { useNetworkStatus } from '../../hooks/useData';

interface QRActionHandlerProps {
  scanResult: QRScanResult | null;
  onClose: () => void;
  onActionExecute?: (action: QRAction, data: any) => void;
}

export default function QRActionHandler({ 
  scanResult, 
  onClose, 
  onActionExecute 
}: QRActionHandlerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { isOnline } = useNetworkStatus();
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const open = !!scanResult?.isValid;

  // Get available actions based on QR type
  const availableActions = scanResult?.qrCodeData 
    ? QR_ACTIONS_BY_TYPE[scanResult.qrCodeData.type] || []
    : [];

  // Filter actions based on permissions and online status
  const filteredActions = availableActions.filter(action => {
    if (action.requiresOnline && !isOnline) return false;
    // TODO: Add permission checks based on user role
    return true;
  });

  // Group actions by category
  const actionsByCategory = {
    view: filteredActions.filter(a => a.category === 'view'),
    edit: filteredActions.filter(a => a.category === 'edit'),
    create: filteredActions.filter(a => a.category === 'create'),
    complete: filteredActions.filter(a => a.category === 'complete'),
    schedule: filteredActions.filter(a => a.category === 'schedule'),
  };

  // Execute action
  const executeAction = useCallback(async (action: QRAction) => {
    if (!scanResult?.qrCodeData) return;

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const result = await handleAction(action, scanResult.qrCodeData);
      
      if (result.success) {
        setExecutionResult({ success: true, message: result.message });
        
        // Auto-close for navigation actions
        if (['view-asset', 'view-work-order', 'view-pm-schedule'].includes(action.id)) {
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      } else {
        setExecutionResult({ success: false, message: result.message });
      }

      if (onActionExecute) {
        onActionExecute(action, scanResult.qrCodeData);
      }
    } catch (error) {
      setExecutionResult({
        success: false,
        message: error instanceof Error ? error.message : 'Action failed'
      });
    } finally {
      setIsExecuting(false);
    }
  }, [scanResult, onActionExecute, onClose]);

  // Handle specific actions
  const handleAction = useCallback(async (action: QRAction, qrData: any) => {
    switch (action.id) {
      case 'view-asset':
        navigate(`/assets/${qrData.id}`);
        return { success: true, message: 'Navigating to asset details...' };
      
      case 'edit-asset':
        navigate(`/assets/${qrData.id}/edit`);
        return { success: true, message: 'Opening asset editor...' };
      
      case 'create-work-order':
        navigate(`/work-orders/new?assetId=${qrData.id}`);
        return { success: true, message: 'Creating new work order...' };
      
      case 'view-work-order':
        navigate(`/work-orders/${qrData.id}`);
        return { success: true, message: 'Navigating to work order...' };
      
      case 'view-pm-schedule':
        navigate(`/maintenance/schedules/${qrData.id}`);
        return { success: true, message: 'Navigating to maintenance schedule...' };
      
      case 'complete-pm':
        // TODO: Implement PM completion logic
        return { success: true, message: 'PM task marked as complete' };
      
      case 'check-in':
        // TODO: Implement asset check-in logic
        return { success: true, message: 'Asset check-in recorded' };
      
      case 'view-location':
        navigate(`/locations/${qrData.id}`);
        return { success: true, message: 'Navigating to location...' };
      
      case 'view-user':
        navigate(`/users/${qrData.id}`);
        return { success: true, message: 'Navigating to user profile...' };
      
      default:
        return { success: false, message: 'Action not implemented' };
    }
  }, [navigate]);

  // Get icon for QR type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'asset':
        return <AssetIcon />;
      case 'work-order':
        return <WorkOrderIcon />;
      case 'pm-schedule':
        return <PMIcon />;
      case 'location':
        return <LocationIcon />;
      case 'user':
        return <PersonIcon />;
      default:
        return <AssetIcon />;
    }
  };

  // Get action icon
  const getActionIcon = (iconName: string) => {
    switch (iconName) {
      case 'visibility':
        return <ViewIcon />;
      case 'edit':
        return <EditIcon />;
      case 'add_task':
        return <CreateIcon />;
      case 'check_circle':
        return <CompleteIcon />;
      case 'schedule':
        return <ScheduleIcon />;
      case 'assignment':
        return <WorkOrderIcon />;
      case 'place':
        return <LocationIcon />;
      case 'person':
        return <PersonIcon />;
      default:
        return <ArrowIcon />;
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'view':
        return 'primary';
      case 'edit':
        return 'warning';
      case 'create':
        return 'success';
      case 'complete':
        return 'info';
      case 'schedule':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (!scanResult || !scanResult.isValid) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          minHeight: isMobile ? '100vh' : 500,
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getTypeIcon(scanResult.qrCodeData?.type || '')}
            QR Code Scanned
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* QR Code Information */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'grey.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1,
                }}
              >
                {getTypeIcon(scanResult.qrCodeData?.type || '')}
              </Box>
            </Grid>
            <Grid item xs>
              <Typography variant="h6" gutterBottom>
                {scanResult.qrCodeData?.type.replace('-', ' ').toUpperCase()} {scanResult.qrCodeData?.id}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <Chip 
                  label={scanResult.qrCodeData?.type || 'Unknown'} 
                  size="small" 
                  color="primary"
                />
                <Chip 
                  label={`Org: ${scanResult.qrCodeData?.organizationId}`} 
                  size="small" 
                  variant="outlined"
                />
                <Chip 
                  label={`v${scanResult.qrCodeData?.version}`} 
                  size="small" 
                  variant="outlined"
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Scanned: {new Date(scanResult.timestamp).toLocaleString()}
              </Typography>
              {!isOnline && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  You're offline. Some actions may not be available.
                </Alert>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Execution Result */}
        {executionResult && (
          <Alert 
            severity={executionResult.success ? 'success' : 'error'} 
            sx={{ mb: 3 }}
            onClose={() => setExecutionResult(null)}
          >
            {executionResult.message}
          </Alert>
        )}

        {/* Available Actions */}
        <Typography variant="h6" gutterBottom>
          Available Actions
        </Typography>

        {filteredActions.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No actions available for this QR code
            </Typography>
          </Paper>
        ) : (
          <Box>
            {/* Quick Primary Actions */}
            {actionsByCategory.view.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  {actionsByCategory.view.slice(0, 2).map((action) => (
                    <Grid item xs={12} sm={6} key={action.id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { 
                            boxShadow: theme.shadows[4],
                            transform: 'translateY(-2px)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => executeAction(action)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: '50%',
                                bgcolor: `${getCategoryColor(action.category)}.light`,
                                color: `${getCategoryColor(action.category)}.contrastText`,
                              }}
                            >
                              {getActionIcon(action.icon)}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                                {action.label}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {action.description}
                              </Typography>
                            </Box>
                            <ArrowIcon color="action" />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* All Actions List */}
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              All Actions
            </Typography>
            
            <List>
              {filteredActions.map((action, index) => (
                <React.Fragment key={action.id}>
                  <ListItem
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                    onClick={() => executeAction(action)}
                    disabled={isExecuting}
                  >
                    <ListItemIcon>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: '50%',
                          bgcolor: `${getCategoryColor(action.category)}.light`,
                          color: `${getCategoryColor(action.category)}.contrastText`,
                          width: 40,
                          height: 40,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {getActionIcon(action.icon)}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={action.label}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {action.description}
                          </Typography>
                          {action.requiresOnline && !isOnline && (
                            <Chip
                              label="Requires Online"
                              size="small"
                              color="warning"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                      }
                    />
                    {isExecuting ? (
                      <CircularProgress size={24} />
                    ) : (
                      <ArrowIcon color="action" />
                    )}
                  </ListItem>
                  {index < filteredActions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}