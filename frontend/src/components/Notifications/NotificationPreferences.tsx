import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Alert,
  Chip,
  Divider,
  Grid,
  CircularProgress,
  Paper,
  Card,
  CardContent,
  Fade,
  Grow,
  useTheme,
  alpha,
  styled,
  keyframes,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  PhoneAndroid as PushIcon
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNotificationPreferences } from '../../hooks/useNotifications';
import { NotificationPreference } from '../../services/notification.service';

// Animation keyframes
const slideInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
`;

// Styled components
const EnhancedDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 20,
    background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.main, 0.02)})`,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.12)}`,
  },
}));

const HeaderContainer = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.secondary.main, 0.08)})`,
  borderRadius: '20px 20px 0 0',
  padding: theme.spacing(3),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
}));

const CategoryCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.main, 0.01)})`,
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.05)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.1)}`,
  },
}));

const ChannelCard = styled(Paper)(({ theme }) => ({
  borderRadius: 12,
  padding: theme.spacing(2),
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.8)}, ${alpha(theme.palette.background.default, 0.4)})`,
  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    opacity: 0,
    transition: 'opacity 0.3s ease-in-out',
  },
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`,
    '&::before': {
      opacity: 1,
    },
  },
}));

const EnhancedAccordion = styled(Accordion)(({ theme }) => ({
  borderRadius: '16px !important',
  background: 'transparent',
  boxShadow: 'none',
  border: 'none',
  '&:before': {
    display: 'none',
  },
  '& .MuiAccordionSummary-root': {
    borderRadius: 16,
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)}, ${alpha(theme.palette.secondary.main, 0.04)})`,
    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    minHeight: 72,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.secondary.main, 0.08)})`,
      transform: 'translateY(-1px)',
    },
    '&.Mui-expanded': {
      borderRadius: '16px 16px 0 0',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
    },
  },
  '& .MuiAccordionDetails-root': {
    background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.main, 0.01)})`,
    borderRadius: '0 0 16px 16px',
    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    borderTop: 'none',
  },
}));

const StatusChip = styled(Chip)(({ theme, enabled }: { enabled: boolean }) => ({
  height: 24,
  fontSize: '0.7rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  background: enabled 
    ? `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.light})`
    : `linear-gradient(45deg, ${theme.palette.grey[400]}, ${theme.palette.grey[300]})`,
  color: enabled ? theme.palette.success.contrastText : theme.palette.text.secondary,
  border: `1px solid ${enabled ? theme.palette.success.main : theme.palette.grey[400]}`,
  animation: enabled ? `${float} 3s ease-in-out infinite` : 'none',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  textTransform: 'none',
  fontWeight: 600,
  padding: theme.spacing(1, 3),
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
  },
}));

interface NotificationPreferencesDialogProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { key: 'WORK_ORDER', label: 'Work Orders', description: 'New assignments, status changes, and overdue items' },
  { key: 'ASSET', label: 'Assets', description: 'Status changes and maintenance alerts' },
  { key: 'MAINTENANCE', label: 'Maintenance', description: 'Scheduled maintenance and overdue tasks' },
  { key: 'INVENTORY', label: 'Inventory', description: 'Low stock alerts and reorder notifications' },
  { key: 'USER', label: 'User', description: 'Account updates and mentions' },
  { key: 'SYSTEM', label: 'System', description: 'System maintenance and important updates' },
  { key: 'PORTAL', label: 'Portal', description: 'New submissions and portal activities' }
];

const CHANNELS = [
  { key: 'IN_APP', label: 'In-App', icon: <NotificationsIcon />, available: true },
  { key: 'EMAIL', label: 'Email', icon: <EmailIcon />, available: true },
  { key: 'SMS', label: 'SMS', icon: <SmsIcon />, available: false },
  { key: 'PUSH', label: 'Push', icon: <PushIcon />, available: false }
];

const FREQUENCIES = [
  { key: 'IMMEDIATE', label: 'Immediate' },
  { key: 'DIGEST', label: 'Daily Digest' },
  { key: 'DISABLED', label: 'Disabled' }
];

const PRIORITIES = [
  { key: 'LOW', label: 'Low' },
  { key: 'MEDIUM', label: 'Medium' },
  { key: 'HIGH', label: 'High' },
  { key: 'URGENT', label: 'Urgent' }
];

export const NotificationPreferencesDialog: React.FC<NotificationPreferencesDialogProps> = ({
  open,
  onClose
}) => {
  const { preferences, loading, error, updatePreferences } = useNotificationPreferences();
  const theme = useTheme();
  const [localPreferences, setLocalPreferences] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string>('WORK_ORDER'); // Default to first category
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local preferences from loaded preferences
  useEffect(() => {
    if (preferences.length > 0) {
      const prefMap: Record<string, any> = {};
      
      // Initialize with default values
      CATEGORIES.forEach(category => {
        CHANNELS.filter(c => c.available).forEach(channel => {
          const key = `${category.key}_${channel.key}`;
          const existing = preferences.find(p => 
            p.category === category.key && p.channel === channel.key
          );
          
          prefMap[key] = {
            enabled: existing?.enabled ?? (channel.key === 'IN_APP'),
            frequency: existing?.frequency ?? 'IMMEDIATE',
            minimumPriority: existing?.minimumPriority ?? 'LOW',
            quietHoursStart: existing?.quietHoursStart ?? '',
            quietHoursEnd: existing?.quietHoursEnd ?? '',
            weekdaysOnly: existing?.weekdaysOnly ?? false
          };
        });
      });
      
      setLocalPreferences(prefMap);
    }
  }, [preferences]);

  const handlePreferenceChange = (category: string, channel: string, field: string, value: any) => {
    const key = `${category}_${channel}`;
    setLocalPreferences(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const preferencesToSave: Partial<NotificationPreference>[] = [];
      
      CATEGORIES.forEach(category => {
        CHANNELS.filter(c => c.available).forEach(channel => {
          const key = `${category.key}_${channel.key}`;
          const pref = localPreferences[key];
          
          if (pref) {
            preferencesToSave.push({
              category: category.key as any,
              channel: channel.key as any,
              enabled: pref.enabled,
              frequency: pref.frequency,
              minimumPriority: pref.minimumPriority,
              quietHoursStart: pref.quietHoursStart || null,
              quietHoursEnd: pref.quietHoursEnd || null,
              weekdaysOnly: pref.weekdaysOnly
            });
          }
        });
      });
      
      await updatePreferences(preferencesToSave);
      setHasChanges(false);
      onClose();
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      // You might want to show a confirmation dialog here
      // For now, we'll just close
    }
    setHasChanges(false);
    onClose();
  };

  const handleCategoryExpand = (category: string) => {
    setExpandedCategory(expandedCategory === category ? '' : category);
  };

  // Initialize with first category expanded
  useEffect(() => {
    if (CATEGORIES.length > 0 && !expandedCategory) {
      setExpandedCategory(CATEGORIES[0].key);
    }
  }, [expandedCategory]);

  if (loading && Object.keys(localPreferences).length === 0) {
    return (
      <EnhancedDialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
            <CircularProgress size={48} thickness={4} sx={{ mb: 3 }} />
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
              Loading notification preferences...
            </Typography>
          </Box>
        </DialogContent>
      </EnhancedDialog>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <EnhancedDialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <HeaderContainer>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <NotificationsIcon sx={{ fontSize: 28, color: 'primary.main' }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} color="primary.main">
                Notification Preferences
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Customize how and when you receive notifications
              </Typography>
            </Box>
          </Box>
        </HeaderContainer>
        
        <DialogContent sx={{ p: 3 }}>
          {error && (
            <Fade in={!!error}>
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 3,
                  '& .MuiAlert-icon': {
                    fontSize: '1.5rem'
                  }
                }}
              >
                <Typography variant="body1" fontWeight={600}>
                  {error}
                </Typography>
              </Alert>
            </Fade>
          )}

          <Box sx={{ mt: 2 }}>
            {CATEGORIES.map((category, categoryIndex) => (
              <Grow in={true} timeout={400 + categoryIndex * 100} key={category.key}>
                <Box sx={{ mb: 2 }}>
                  <EnhancedAccordion
                    expanded={expandedCategory === category.key}
                    onChange={() => handleCategoryExpand(category.key)}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            }}
                          >
                            <NotificationsIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={700}>
                              {category.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.8 }}>
                              {category.description}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {CHANNELS.filter(c => c.available).map(channel => {
                            const key = `${category.key}_${channel.key}`;
                            const pref = localPreferences[key];
                            return (
                              <StatusChip
                                key={channel.key}
                                size="small"
                                label={channel.label}
                                enabled={!!pref?.enabled}
                              />
                            );
                          })}
                        </Box>
                      </Box>
                    </AccordionSummary>
                    
                    <AccordionDetails sx={{ p: 3 }}>
                      <Grid container spacing={3}>
                        {CHANNELS.filter(c => c.available).map((channel, channelIndex) => {
                          const key = `${category.key}_${channel.key}`;
                          const pref = localPreferences[key] || {};
                          
                          return (
                            <Grid item xs={12} md={6} key={channel.key}>
                              <Fade in={true} timeout={300 + channelIndex * 150}>
                                <ChannelCard>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ mr: 2, color: 'primary.main' }}>
                                      {channel.icon}
                                    </Box>
                                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                                      {channel.label}
                                    </Typography>
                                    <Tooltip title={pref.enabled ? 'Disable notifications' : 'Enable notifications'} arrow>
                                      <Switch
                                        checked={pref.enabled || false}
                                        onChange={(e) => handlePreferenceChange(category.key, channel.key, 'enabled', e.target.checked)}
                                        sx={{
                                          '& .MuiSwitch-thumb': {
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                          },
                                          '&:hover .MuiSwitch-thumb': {
                                            transform: 'scale(1.1)',
                                          },
                                        }}
                                      />
                                    </Tooltip>
                                  </Box>
                                  
                                  {pref.enabled && (
                                    <Fade in={pref.enabled} timeout={300}>
                                      <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                          <FormControl fullWidth size="small">
                                            <InputLabel>Frequency</InputLabel>
                                            <Select
                                              value={pref.frequency || 'IMMEDIATE'}
                                              label="Frequency"
                                              onChange={(e) => handlePreferenceChange(category.key, channel.key, 'frequency', e.target.value)}
                                              sx={{ borderRadius: 2 }}
                                            >
                                              {FREQUENCIES.map(freq => (
                                                <MenuItem key={freq.key} value={freq.key}>
                                                  {freq.label}
                                                </MenuItem>
                                              ))}
                                            </Select>
                                          </FormControl>
                                        </Grid>
                                        
                                        <Grid item xs={12} sm={6}>
                                          <FormControl fullWidth size="small">
                                            <InputLabel>Min Priority</InputLabel>
                                            <Select
                                              value={pref.minimumPriority || 'LOW'}
                                              label="Min Priority"
                                              onChange={(e) => handlePreferenceChange(category.key, channel.key, 'minimumPriority', e.target.value)}
                                              sx={{ borderRadius: 2 }}
                                            >
                                              {PRIORITIES.map(priority => (
                                                <MenuItem key={priority.key} value={priority.key}>
                                                  {priority.label}
                                                </MenuItem>
                                              ))}
                                            </Select>
                                          </FormControl>
                                        </Grid>
                                        
                                        {channel.key === 'EMAIL' && (
                                          <>
                                            <Grid item xs={12}>
                                              <FormControlLabel
                                                control={
                                                  <Switch
                                                    checked={pref.weekdaysOnly || false}
                                                    onChange={(e) => handlePreferenceChange(category.key, channel.key, 'weekdaysOnly', e.target.checked)}
                                                    size="small"
                                                  />
                                                }
                                                label="Weekdays only"
                                                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                                              />
                                            </Grid>
                                            
                                            <Grid item xs={6}>
                                              <TextField
                                                fullWidth
                                                size="small"
                                                label="Quiet Start"
                                                type="time"
                                                value={pref.quietHoursStart || ''}
                                                onChange={(e) => handlePreferenceChange(category.key, channel.key, 'quietHoursStart', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                              />
                                            </Grid>
                                            
                                            <Grid item xs={6}>
                                              <TextField
                                                fullWidth
                                                size="small"
                                                label="Quiet End"
                                                type="time"
                                                value={pref.quietHoursEnd || ''}
                                                onChange={(e) => handlePreferenceChange(category.key, channel.key, 'quietHoursEnd', e.target.value)}
                                                InputLabelProps={{ shrink: true }}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                              />
                                            </Grid>
                                          </>
                                        )}
                                      </Grid>
                                    </Fade>
                                  )}
                                </ChannelCard>
                              </Fade>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </AccordionDetails>
                  </EnhancedAccordion>
                </Box>
              </Grow>
            ))}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <ActionButton 
            onClick={handleClose}
            variant="outlined"
            sx={{ 
              borderColor: alpha(theme.palette.divider, 0.3),
              '&:hover': {
                borderColor: theme.palette.divider,
                backgroundColor: alpha(theme.palette.action.hover, 0.1),
              }
            }}
          >
            Cancel
          </ActionButton>
          <ActionButton 
            variant="contained" 
            onClick={handleSave}
            disabled={saving || !hasChanges}
            startIcon={saving ? <CircularProgress size={18} /> : <NotificationsIcon />}
            sx={{
              background: hasChanges 
                ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                : theme.palette.action.disabledBackground,
              '&:hover': {
                background: hasChanges 
                  ? `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
                  : theme.palette.action.disabledBackground,
              },
              '&:disabled': {
                color: theme.palette.action.disabled,
              }
            }}
          >
            {saving ? 'Saving Changes...' : hasChanges ? 'Save Preferences' : 'No Changes'}
          </ActionButton>
        </DialogActions>
      </EnhancedDialog>
    </LocalizationProvider>
  );
};