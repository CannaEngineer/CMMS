import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Paper,
  Chip,
  useTheme,
  alpha,
  styled,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  PlayArrow as PlayIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { NotificationBell, FloatingNotificationBell } from './NotificationBell';
import { NotificationProvider, useNotificationContext } from './NotificationProvider';
import { notificationService, Notification } from '../../services/notification.service';

// Styled components
const DemoCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.main, 0.02)})`,
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 12px 32px ${alpha(theme.palette.common.black, 0.12)}`,
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  textTransform: 'none',
  fontWeight: 600,
  padding: '8px 16px',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
  },
}));

interface NotificationDemoProps {
  embedded?: boolean;
}

const NotificationDemoContent: React.FC<NotificationDemoProps> = ({ embedded = false }) => {
  const theme = useTheme();
  const { showPreferences } = useNotificationContext();
  
  const [demoSettings, setDemoSettings] = useState({
    type: 'INFO' as 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    category: 'WORK_ORDER' as 'WORK_ORDER' | 'ASSET' | 'MAINTENANCE' | 'INVENTORY' | 'USER' | 'SYSTEM' | 'PORTAL',
    hasAction: true,
    autoHide: true,
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INFO': return <InfoIcon />;
      case 'WARNING': return <WarningIcon />;
      case 'ALERT': return <ErrorIcon />;
      case 'SUCCESS': return <SuccessIcon />;
      default: return <InfoIcon />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INFO': return theme.palette.info.main;
      case 'WARNING': return theme.palette.warning.main;
      case 'ALERT': return theme.palette.error.main;
      case 'SUCCESS': return theme.palette.success.main;
      default: return theme.palette.info.main;
    }
  };

  const createTestNotification = async () => {
    try {
      await notificationService.createTestNotification();
    } catch (error) {
      console.error('Failed to create test notification:', error);
    }
  };

  const sampleNotifications = [
    {
      title: 'Work Order #1234 Assigned',
      message: 'HVAC maintenance scheduled for Building A',
      type: 'INFO' as const,
      priority: 'HIGH' as const,
      category: 'WORK_ORDER' as const,
    },
    {
      title: 'Equipment Alert',
      message: 'Generator #3 requires immediate attention',
      type: 'WARNING' as const,
      priority: 'URGENT' as const,
      category: 'ASSET' as const,
    },
    {
      title: 'System Update Complete',
      message: 'CMMS system has been updated to version 2.1.0',
      type: 'SUCCESS' as const,
      priority: 'LOW' as const,
      category: 'SYSTEM' as const,
    },
    {
      title: 'Critical System Error',
      message: 'Database connection lost - immediate action required',
      type: 'ALERT' as const,
      priority: 'URGENT' as const,
      category: 'SYSTEM' as const,
    },
  ];

  const triggerSampleNotification = (notification: any) => {
    // This would normally be triggered by the backend
    console.log('Triggering sample notification:', notification);
  };

  return (
    <Box sx={{ p: embedded ? 0 : 3 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={700} color="primary.main" sx={{ mb: 1 }}>
          Notification System Demo
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Experience the sleek, professional notification system with smooth animations
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Notification Bell Demo */}
        <Grid item xs={12} md={4}>
          <DemoCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationsIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Notification Bell
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Interactive notification bell with pulse animations and badge counter
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <NotificationBell onSettingsClick={showPreferences} />
              </Box>
              
              <ActionButton
                variant="contained"
                fullWidth
                onClick={createTestNotification}
                startIcon={<PlayIcon />}
              >
                Create Test Notification
              </ActionButton>
            </CardContent>
          </DemoCard>
        </Grid>

        {/* Toast Notification Demo */}
        <Grid item xs={12} md={4}>
          <DemoCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <InfoIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Toast Notifications
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Non-intrusive toast notifications with auto-dismiss and smooth transitions
              </Typography>

              <Box sx={{ mb: 3 }}>
                <FormControl size="small" fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Notification Type</InputLabel>
                  <Select
                    value={demoSettings.type}
                    label="Notification Type"
                    onChange={(e) => setDemoSettings(prev => ({ ...prev, type: e.target.value as any }))}
                  >
                    <MenuItem value="INFO">Info</MenuItem>
                    <MenuItem value="WARNING">Warning</MenuItem>
                    <MenuItem value="ALERT">Alert</MenuItem>
                    <MenuItem value="SUCCESS">Success</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={demoSettings.priority}
                    label="Priority"
                    onChange={(e) => setDemoSettings(prev => ({ ...prev, priority: e.target.value as any }))}
                  >
                    <MenuItem value="LOW">Low</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="URGENT">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <ActionButton
                variant="contained"
                fullWidth
                onClick={() => triggerSampleNotification(demoSettings)}
                startIcon={getTypeIcon(demoSettings.type)}
                sx={{ backgroundColor: getTypeColor(demoSettings.type) }}
              >
                Trigger Toast
              </ActionButton>
            </CardContent>
          </DemoCard>
        </Grid>

        {/* Preferences Demo */}
        <Grid item xs={12} md={4}>
          <DemoCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SettingsIcon sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Preferences
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Comprehensive notification preferences with channel-specific settings
              </Typography>

              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={demoSettings.hasAction}
                      onChange={(e) => setDemoSettings(prev => ({ ...prev, hasAction: e.target.checked }))}
                    />
                  }
                  label="Include Actions"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={demoSettings.autoHide}
                      onChange={(e) => setDemoSettings(prev => ({ ...prev, autoHide: e.target.checked }))}
                    />
                  }
                  label="Auto Hide"
                />
              </Box>

              <ActionButton
                variant="outlined"
                fullWidth
                onClick={showPreferences}
                startIcon={<SettingsIcon />}
              >
                Open Preferences
              </ActionButton>
            </CardContent>
          </DemoCard>
        </Grid>

        {/* Sample Notifications */}
        <Grid item xs={12}>
          <DemoCard>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                Sample Notifications
              </Typography>
              
              <Grid container spacing={2}>
                {sampleNotifications.map((notification, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Paper
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        border: `2px solid ${getTypeColor(notification.type)}`,
                        background: `linear-gradient(145deg, ${alpha(getTypeColor(notification.type), 0.05)}, ${alpha(getTypeColor(notification.type), 0.1)})`,
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 24px ${alpha(getTypeColor(notification.type), 0.3)}`,
                        }
                      }}
                      onClick={() => triggerSampleNotification(notification)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {getTypeIcon(notification.type)}
                        <Chip
                          size="small"
                          label={notification.priority}
                          sx={{ 
                            ml: 'auto',
                            backgroundColor: getTypeColor(notification.type),
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      </Box>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                        {notification.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {notification.message}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </DemoCard>
        </Grid>
      </Grid>

      {/* Feature Highlights */}
      <Box sx={{ mt: 4 }}>
        <DemoCard>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3, textAlign: 'center' }}>
              ✨ Key Features
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ 
                    display: 'inline-flex', 
                    p: 2, 
                    borderRadius: '50%', 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    mb: 1
                  }}>
                    <NotificationsIcon color="primary" />
                  </Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Real-time Updates
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Instant notifications via WebSocket
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ 
                    display: 'inline-flex', 
                    p: 2, 
                    borderRadius: '50%', 
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    mb: 1
                  }}>
                    <CheckCircle color="success" />
                  </Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Smooth Animations
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    60fps animations with CSS transitions
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ 
                    display: 'inline-flex', 
                    p: 2, 
                    borderRadius: '50%', 
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    mb: 1
                  }}>
                    <SettingsIcon color="warning" />
                  </Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Customizable
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Per-category notification preferences
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ 
                    display: 'inline-flex', 
                    p: 2, 
                    borderRadius: '50%', 
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    mb: 1
                  }}>
                    <InfoIcon color="info" />
                  </Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Accessible
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ARIA labels and keyboard navigation
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </DemoCard>
      </Box>
    </Box>
  );
};

export const NotificationDemo: React.FC<NotificationDemoProps> = (props) => {
  return (
    <NotificationProvider
      enableFloatingToasts={true}
      enableCriticalAlerts={true}
      enableSoundEffects={false}
      maxToasts={5}
      toastPosition="top-right"
    >
      <NotificationDemoContent {...props} />
    </NotificationProvider>
  );
};

export default NotificationDemo;