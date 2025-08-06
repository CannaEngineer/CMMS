/**
 * Export Queue View
 * Real-time monitoring of export job queue and processing status
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Button,
  IconButton,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  FormControlLabel,
  Switch,
  Paper,
  Alert,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Queue as QueueIcon,
  PlayArrow as ProcessingIcon,
  Schedule as PendingIcon,
  CheckCircle as CompletedIcon,
  Error as ErrorIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Pause as PauseIcon,
  Timer as TimerIcon,
  Speed as SpeedIcon,
  Layers as LayersIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';

import { ExportQueue } from '../../services/exportService';

interface ExportQueueProps {
  queue: ExportQueue[];
  onRefresh: () => void;
  autoRefresh: boolean;
  onAutoRefreshChange: (enabled: boolean) => void;
  loading: boolean;
}

interface QueueStatsProps {
  queue: ExportQueue[];
}

function QueueStats({ queue }: QueueStatsProps) {
  const theme = useTheme();

  const stats = {
    total: queue.length,
    queued: queue.filter(q => q.status === 'queued').length,
    processing: queue.filter(q => q.status === 'processing').length,
    completed: queue.filter(q => q.status === 'completed').length,
    failed: queue.filter(q => q.status === 'failed').length,
    averageWaitTime: queue.length > 0 ? 
      queue.reduce((sum, q) => sum + (q.estimatedDurationMs || 0), 0) / queue.length / 1000 : 0,
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={6} md={3}>
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              {stats.total}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Jobs
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={6} md={3}>
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="warning.main" fontWeight="bold">
              {stats.queued}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              In Queue
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={6} md={3}>
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="info.main" fontWeight="bold">
              {stats.processing}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Processing
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={6} md={3}>
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="secondary.main" fontWeight="bold">
              {formatTime(stats.averageWaitTime)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Avg. Duration
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

interface QueueItemProps {
  item: ExportQueue;
  position: number;
}

function QueueItem({ item, position }: QueueItemProps) {
  const theme = useTheme();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued': return <PendingIcon sx={{ color: 'warning.main' }} />;
      case 'processing': return <ProcessingIcon sx={{ color: 'primary.main' }} />;
      case 'completed': return <CompletedIcon sx={{ color: 'success.main' }} />;
      case 'failed': return <ErrorIcon sx={{ color: 'error.main' }} />;
      case 'cancelled': return <CancelIcon sx={{ color: 'action.disabled' }} />;
      default: return <QueueIcon />;
    }
  };

  const getStatusColor = (status: string): 'warning' | 'primary' | 'success' | 'error' | 'default' => {
    switch (status) {
      case 'queued': return 'warning';
      case 'processing': return 'primary';
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: number): string => {
    if (priority >= 8) return theme.palette.error.main;
    if (priority >= 6) return theme.palette.warning.main;
    if (priority >= 4) return theme.palette.info.main;
    return theme.palette.success.main;
  };

  const formatDuration = (ms?: number): string => {
    if (!ms) return 'Unknown';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 1,
        '&:hover': {
          boxShadow: theme.shadows[4],
        },
        border: item.status === 'processing' ? `2px solid ${theme.palette.primary.main}` : undefined,
      }}
    >
      <CardContent sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Position & Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 80 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'text.secondary',
                fontFamily: 'monospace',
                minWidth: 24,
                textAlign: 'center',
              }}
            >
              #{position}
            </Typography>
            {getStatusIcon(item.status)}
          </Box>

          {/* Main Content */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body1" noWrap sx={{ fontWeight: 'medium' }}>
                Export Job
              </Typography>
              
              <Chip
                label={item.status.toUpperCase()}
                size="small"
                color={getStatusColor(item.status)}
                variant="outlined"
              />

              <Chip
                label={`Priority ${item.priority}`}
                size="small"
                sx={{ 
                  color: getPriorityColor(item.priority),
                  borderColor: getPriorityColor(item.priority),
                }}
                variant="outlined"
              />
            </Box>

            {/* Progress Bar for Processing Items */}
            {item.status === 'processing' && (
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="textSecondary">
                    {item.currentStep || 'Processing...'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {item.progressPercentage}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={item.progressPercentage} 
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            )}

            {/* Metadata */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimerIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="textSecondary">
                  Est. {formatDuration(item.estimatedDurationMs)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <SpeedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="textSecondary">
                  {item.maxRetries} retries
                </Typography>
              </Box>

              <Typography variant="caption" color="textSecondary">
                Created {formatTimeAgo(item.createdAt)}
              </Typography>

              {item.processingStartedAt && (
                <Typography variant="caption" color="textSecondary">
                  Started {formatTimeAgo(item.processingStartedAt)}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {item.status === 'queued' && (
              <Tooltip title="Cancel">
                <IconButton size="small" color="error">
                  <CancelIcon />
                </IconButton>
              </Tooltip>
            )}
            
            {item.status === 'processing' && (
              <Tooltip title="Processing">
                <IconButton size="small" disabled>
                  <ProcessingIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function ExportQueueView({ 
  queue, 
  onRefresh, 
  autoRefresh, 
  onAutoRefreshChange, 
  loading 
}: ExportQueueProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [showCompletedItems, setShowCompletedItems] = useState(false);

  const filteredQueue = showCompletedItems 
    ? queue 
    : queue.filter(item => !['completed', 'failed', 'cancelled'].includes(item.status));

  const sortedQueue = [...filteredQueue].sort((a, b) => {
    // Sort by priority (higher first), then by creation time (older first)
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <Typography>Loading queue...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Stats */}
      <Box sx={{ mb: 3 }}>
        <QueueStats queue={queue} />
      </Box>

      {/* Controls */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => onAutoRefreshChange(e.target.checked)}
                color="primary"
              />
            }
            label="Auto-refresh"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={showCompletedItems}
                onChange={(e) => setShowCompletedItems(e.target.checked)}
              />
            }
            label="Show completed"
          />
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          disabled={loading}
        >
          Refresh Queue
        </Button>
      </Box>

      {/* Queue Status */}
      {queue.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <QueueIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, mx: 'auto' }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Queue is Empty
          </Typography>
          <Typography variant="body2" color="textSecondary">
            No export jobs are currently queued or processing
          </Typography>
        </Paper>
      ) : filteredQueue.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <CompletedIcon sx={{ fontSize: 64, color: 'success.main', mb: 2, mx: 'auto' }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            All Jobs Completed
          </Typography>
          <Typography variant="body2" color="textSecondary">
            No active jobs in queue. Toggle "Show completed" to see finished jobs.
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Active Processing Jobs */}
          {sortedQueue.filter(item => item.status === 'processing').length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ProcessingIcon color="primary" />
                Currently Processing
              </Typography>
              
              {sortedQueue
                .filter(item => item.status === 'processing')
                .map((item, index) => (
                  <QueueItem
                    key={item.id}
                    item={item}
                    position={index + 1}
                  />
                ))}
            </Box>
          )}

          {/* Queued Jobs */}
          {sortedQueue.filter(item => item.status === 'queued').length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PendingIcon color="warning" />
                Queued Jobs ({sortedQueue.filter(item => item.status === 'queued').length})
              </Typography>
              
              {sortedQueue
                .filter(item => item.status === 'queued')
                .map((item, index) => (
                  <QueueItem
                    key={item.id}
                    item={item}
                    position={index + 1}
                  />
                ))}
            </Box>
          )}

          {/* Completed/Failed Jobs (if enabled) */}
          {showCompletedItems && 
           sortedQueue.filter(item => ['completed', 'failed', 'cancelled'].includes(item.status)).length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LayersIcon />
                Recent Jobs
              </Typography>
              
              {sortedQueue
                .filter(item => ['completed', 'failed', 'cancelled'].includes(item.status))
                .slice(0, 10) // Show only last 10 completed items
                .map((item, index) => (
                  <QueueItem
                    key={item.id}
                    item={item}
                    position={index + 1}
                  />
                ))}
            </Box>
          )}

          {/* Performance Info */}
          {autoRefresh && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Queue is refreshing automatically every 5 seconds. 
                {sortedQueue.filter(item => item.status === 'processing').length > 0 && 
                  ' Processing jobs will update progress in real-time.'
                }
              </Typography>
            </Alert>
          )}
        </>
      )}
    </Box>
  );
}