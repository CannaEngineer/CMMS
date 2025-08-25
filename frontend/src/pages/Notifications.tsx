import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Chip,
  Divider,
  Alert,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Fade,
  Collapse,
  Stack
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  MarkEmailRead as MarkReadIcon,
  MarkEmailUnread as MarkUnreadIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Done as DoneIcon,
  DoneAll as DoneAllIcon,
  DeleteSweep as DeleteSweepIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/Loading';
import { notificationService, NotificationData, NotificationStats } from '../services/notificationService';
import { formatDistanceToNow } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [filters, setFilters] = useState({
    category: null as string | null,
    priority: null as string | null,
    type: null as string | null
  });

  useEffect(() => {
    loadNotifications();
    loadStats();
  }, [tabValue, filters]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = { limit: 100 };
      if (tabValue === 1) params.isRead = false; // Unread tab
      if (tabValue === 2) params.isArchived = true; // Archived tab
      if (filters.category) params.category = filters.category;
      if (filters.priority) params.priority = filters.priority;
      if (filters.type) params.type = filters.type;

      const response = await notificationService.getNotifications(params);
      setNotifications(response.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await notificationService.getNotificationStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load notification stats:', err);
    }
  };

  const handleNotificationClick = async (notification: NotificationData) => {
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification.id);
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, isRead: true } : n
        ));
        loadStats();
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleAcknowledge = async (notificationId: string, archive: boolean = false) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/acknowledge`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ archive })
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId 
            ? { ...n, isRead: true, isArchived: archive } 
            : n
        ));
        loadStats();
      }
    } catch (err) {
      console.error('Failed to acknowledge notification:', err);
    }
  };

  const handleClear = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        loadStats();
      }
    } catch (err) {
      console.error('Failed to clear notification:', err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/notifications/all/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setNotifications([]);
        loadStats();
      }
    } catch (err) {
      console.error('Failed to clear all notifications:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      loadStats();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleBulkAction = async (action: 'read' | 'archive' | 'delete') => {
    const selectedIds = Array.from(selectedNotifications);
    if (selectedIds.length === 0) return;

    try {
      switch (action) {
        case 'read':
          await notificationService.markMultipleAsRead(selectedIds);
          setNotifications(prev => prev.map(n => 
            selectedIds.includes(n.id) ? { ...n, isRead: true } : n
          ));
          break;
        case 'archive':
          for (const id of selectedIds) {
            await handleAcknowledge(id, true);
          }
          break;
        case 'delete':
          for (const id of selectedIds) {
            await handleClear(id);
          }
          break;
      }
      setSelectedNotifications(new Set());
      loadStats();
    } catch (err) {
      console.error(`Failed to ${action} notifications:`, err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ALERT':
        return <ErrorIcon sx={{ color: '#f44336' }} />;
      case 'WARNING':
        return <WarningIcon sx={{ color: '#ff9800' }} />;
      case 'SUCCESS':
        return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
      case 'INFO':
      default:
        return <InfoIcon sx={{ color: '#2196f3' }} />;
    }
  };

  const getPriorityColor = (priority: string): 'default' | 'error' | 'warning' | 'info' => {
    switch (priority) {
      case 'URGENT':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
      default:
        return 'default';
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const renderNotificationItem = (notification: NotificationData) => (
    <ListItem
      key={notification.id}
      sx={{
        bgcolor: notification.isRead ? 'transparent' : 'action.hover',
        borderRadius: 1,
        mb: 1,
        '&:hover': {
          bgcolor: 'action.selected'
        },
        cursor: notification.actionUrl ? 'pointer' : 'default'
      }}
      onClick={() => notification.actionUrl && handleNotificationClick(notification)}
    >
      <FormControlLabel
        control={
          <Checkbox
            checked={selectedNotifications.has(notification.id)}
            onChange={(e) => {
              const newSelected = new Set(selectedNotifications);
              if (e.target.checked) {
                newSelected.add(notification.id);
              } else {
                newSelected.delete(notification.id);
              }
              setSelectedNotifications(newSelected);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        }
        label=""
        sx={{ mr: 1 }}
      />
      
      <ListItemIcon>
        {getNotificationIcon(notification.type)}
      </ListItemIcon>
      
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: notification.isRead ? 400 : 600 }}>
              {notification.title}
            </Typography>
            {notification.priority && (
              <Chip 
                label={notification.priority} 
                size="small" 
                color={getPriorityColor(notification.priority)}
              />
            )}
            {notification.category && (
              <Chip 
                label={notification.category} 
                size="small" 
                variant="outlined"
              />
            )}
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary">
              {notification.message}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {formatTimeAgo(notification.createdAt)}
            </Typography>
          </Box>
        }
      />
      
      <ListItemSecondaryAction>
        <Stack direction="row" spacing={1}>
          {!notification.isRead && (
            <Tooltip title="Mark as read">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAcknowledge(notification.id);
                }}
              >
                <MarkReadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {!notification.isArchived && (
            <Tooltip title="Archive">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAcknowledge(notification.id, true);
                }}
              >
                <ArchiveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title="Clear">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleClear(notification.id);
              }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </ListItemSecondaryAction>
    </ListItem>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsIcon />
          Notifications
        </Typography>
        
        <Stack direction="row" spacing={2}>
          {selectedNotifications.size > 0 && (
            <>
              <Button
                startIcon={<MarkReadIcon />}
                onClick={() => handleBulkAction('read')}
                size="small"
              >
                Mark Selected as Read
              </Button>
              <Button
                startIcon={<ArchiveIcon />}
                onClick={() => handleBulkAction('archive')}
                size="small"
              >
                Archive Selected
              </Button>
              <Button
                startIcon={<DeleteIcon />}
                onClick={() => handleBulkAction('delete')}
                size="small"
                color="error"
              >
                Delete Selected
              </Button>
            </>
          )}
          
          <Button
            startIcon={<DoneAllIcon />}
            onClick={handleMarkAllAsRead}
            disabled={stats?.unread === 0}
          >
            Mark All as Read
          </Button>
          
          <Button
            startIcon={<DeleteSweepIcon />}
            onClick={handleClearAll}
            color="error"
            disabled={notifications.length === 0}
          >
            Clear All
          </Button>
          
          <IconButton onClick={() => navigate('/settings?tab=notifications')}>
            <SettingsIcon />
          </IconButton>
        </Stack>
      </Box>

      {stats && (
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Chip label={`${stats.total} Total`} />
          <Chip label={`${stats.unread} Unread`} color="primary" />
          <Chip label={`${stats.byCategory?.WORK_ORDER || 0} Work Orders`} variant="outlined" />
          <Chip label={`${stats.byCategory?.MAINTENANCE || 0} Maintenance`} variant="outlined" />
          <Chip label={`${stats.byCategory?.SYSTEM || 0} System`} variant="outlined" />
        </Stack>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={
              <Badge badgeContent={notifications.length} color="default">
                All
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={stats?.unread || 0} color="primary">
                Unread
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={notifications.filter(n => n.isArchived).length} color="default">
                Archived
              </Badge>
            } 
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : notifications.length === 0 ? (
            <Alert severity="info">
              No notifications to display
            </Alert>
          ) : (
            <List>
              {notifications.map(renderNotificationItem)}
            </List>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {loading ? (
            <LoadingSpinner />
          ) : notifications.filter(n => !n.isRead).length === 0 ? (
            <Alert severity="info">
              No unread notifications
            </Alert>
          ) : (
            <List>
              {notifications.filter(n => !n.isRead).map(renderNotificationItem)}
            </List>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {loading ? (
            <LoadingSpinner />
          ) : notifications.filter(n => n.isArchived).length === 0 ? (
            <Alert severity="info">
              No archived notifications
            </Alert>
          ) : (
            <List>
              {notifications.filter(n => n.isArchived).map(renderNotificationItem)}
            </List>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Notifications;