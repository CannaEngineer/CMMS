import React, { useState } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Typography,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Divider,
  Card,
  CardContent,
  useTheme,
  Fade,
  Collapse,
} from '@mui/material';
import {
  CloudOff as OfflineIcon,
  Cloud as OnlineIcon,
  Sync as SyncIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as PendingIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useOffline } from '../../hooks/useOffline';

interface NetworkStatusProps {
  position?: 'fixed' | 'static';
  showDetails?: boolean;
}

export default function NetworkStatus({ 
  position = 'fixed', 
  showDetails = true 
}: NetworkStatusProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [showStorageStats, setShowStorageStats] = useState(false);
  const [storageStats, setStorageStats] = useState<any>(null);

  const {
    isOnline,
    isBackgroundSyncing,
    pendingOperations,
    lastSyncTime,
    syncProgress,
    offlineCapabilities,
    operations,
  } = useOffline();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleForceSync = () => {
    operations.forceSync();
    handleClose();
  };

  const handleShowStorage = async () => {
    const stats = await operations.getStorageStats();
    setStorageStats(stats);
    setShowStorageStats(true);
  };

  const getStatusColor = () => {
    if (!isOnline) return 'error';
    if (pendingOperations > 0) return 'warning';
    return 'success';
  };

  const getStatusIcon = () => {
    if (isBackgroundSyncing) return <SyncIcon />;
    if (!isOnline) return <OfflineIcon />;
    if (pendingOperations > 0) return <WarningIcon />;
    return <OnlineIcon />;
  };

  const getStatusLabel = () => {
    if (isBackgroundSyncing) return 'Syncing...';
    if (!isOnline) return 'Offline';
    if (pendingOperations > 0) return `${pendingOperations} pending`;
    return 'Online';
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Box
        sx={{
          position: position,
          top: position === 'fixed' ? 16 : 'auto',
          right: position === 'fixed' ? 16 : 'auto',
          zIndex: theme.zIndex.tooltip,
        }}
      >
        <Tooltip title={`Network status: ${getStatusLabel()}`}>
          <Chip
            icon={getStatusIcon()}
            label={showDetails ? getStatusLabel() : ''}
            color={getStatusColor()}
            variant={isOnline ? 'filled' : 'outlined'}
            onClick={handleClick}
            sx={{
              cursor: 'pointer',
              minWidth: showDetails ? 'auto' : 40,
              animation: isBackgroundSyncing ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.7 },
                '100%': { opacity: 1 },
              },
              '&:hover': {
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
            }}
          />
        </Tooltip>

        {/* Sync Progress Bar */}
        {isBackgroundSyncing && (
          <Fade in>
            <Box sx={{ width: '100%', mt: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={syncProgress} 
                sx={{ borderRadius: 1 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Syncing {Math.round(syncProgress)}%
              </Typography>
            </Box>
          </Fade>
        )}
      </Box>

      {/* Status Details Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { minWidth: 280, maxWidth: 400 }
        }}
      >
        <Card elevation={0}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              {getStatusIcon()}
              <Typography variant="h6" fontWeight={600}>
                Network Status
              </Typography>
            </Box>

            <List dense>
              <ListItem>
                <ListItemIcon>
                  {isOnline ? <CheckIcon color="success" /> : <OfflineIcon color="error" />}
                </ListItemIcon>
                <ListItemText
                  primary="Connection"
                  secondary={isOnline ? 'Connected to server' : 'Working offline'}
                />
              </ListItem>

              {pendingOperations > 0 && (
                <ListItem>
                  <ListItemIcon>
                    <PendingIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Pending Operations"
                    secondary={`${pendingOperations} operations waiting to sync`}
                  />
                </ListItem>
              )}

              {lastSyncTime && (
                <ListItem>
                  <ListItemIcon>
                    <SyncIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Last Sync"
                    secondary={lastSyncTime.toLocaleString()}
                  />
                </ListItem>
              )}
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Offline Capabilities
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {Object.entries(offlineCapabilities).map(([key, enabled]) => (
                <Chip
                  key={key}
                  label={key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                  size="small"
                  color={enabled ? 'success' : 'default'}
                  variant={enabled ? 'filled' : 'outlined'}
                />
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {isOnline && pendingOperations > 0 && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={handleForceSync}
                  disabled={isBackgroundSyncing}
                  fullWidth
                >
                  Force Sync
                </Button>
              )}

              <Button
                size="small"
                variant="outlined"
                startIcon={<StorageIcon />}
                onClick={handleShowStorage}
                fullWidth
              >
                Storage Info
              </Button>
            </Box>

            {/* Storage Statistics */}
            <Collapse in={showStorageStats}>
              {storageStats && (
                <Box sx={{ mt: 2, p: 2, bgcolor: theme.palette.grey[50], borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Offline Storage
                  </Typography>
                  <List dense>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText
                        primary="Work Orders"
                        secondary={`${storageStats.workOrders} cached`}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText
                        primary="Assets"
                        secondary={`${storageStats.assets} cached`}
                      />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemText
                        primary="Media Files"
                        secondary={`${storageStats.mediaFiles} cached`}
                      />
                    </ListItem>
                  </List>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => {
                      operations.clearOfflineData();
                      setShowStorageStats(false);
                      handleClose();
                    }}
                    sx={{ mt: 1 }}
                  >
                    Clear Cache
                  </Button>
                </Box>
              )}
            </Collapse>
          </CardContent>
        </Card>
      </Popover>
    </>
  );
}