import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Switch,
  FormControl,
  FormControlLabel,
  FormGroup,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  Button,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Collapse,
  Divider
} from '@mui/material';
import { 
  Upload as ImportIcon,
  History as HistoryIcon,
  Settings as GeneralIcon,
  Notifications as NotificationIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Save as SaveIcon,
  Language as LanguageIcon,
  ColorLens as ThemeIcon,
  DeleteForever as DeleteIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import ImportManager from '../components/ImportManager';
import ImportHistory from '../components/ImportHistory';

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SettingsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  
  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    language: 'en',
    timezone: 'America/New_York',
    theme: 'light',
    companyName: 'Elevated Compliance',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h'
  });
  
  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    workOrderUpdates: true,
    maintenanceReminders: true,
    inventoryAlerts: true,
    systemAlerts: true,
    weeklyReports: false,
    assignmentNotifications: true
  });
  
  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 120,
    passwordRequirements: true,
    loginAttempts: 5,
    ipRestriction: false
  });

  // Clean Slate State
  const [cleanSlateOpen, setCleanSlateOpen] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [cleanSlateStep, setCleanSlateStep] = useState(0);
  const [isCleaningSlate, setIsCleaningSlate] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleGeneralSettingChange = (field: string, value: any) => {
    setGeneralSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSecurityChange = (field: string, value: any) => {
    setSecuritySettings(prev => ({ ...prev, [field]: value }));
  };

  const saveSettings = (type: string) => {
    // Here you would typically make an API call to save settings
    console.log(`Saving ${type} settings:`, 
      type === 'general' ? generalSettings : 
      type === 'notification' ? notificationSettings : 
      securitySettings
    );
    // Show success message or handle errors
  };

  const handleCleanSlate = async () => {
    if (cleanSlateStep === 0) {
      setCleanSlateStep(1);
      return;
    }
    
    if (cleanSlateStep === 1) {
      setCleanSlateStep(2);
      return;
    }

    // Final step - execute clean slate
    setIsCleaningSlate(true);
    try {
      const response = await fetch('/api/settings/clean-slate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ confirmationCode })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Clean slate completed successfully!\n\nDeleted records:\n${Object.entries(result.deletedCounts).map(([key, count]) => `• ${key}: ${count}`).join('\n')}`);
        setCleanSlateOpen(false);
        setCleanSlateStep(0);
        setConfirmationCode('');
      } else {
        alert(`Clean slate failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Clean slate error:', error);
      alert('Failed to execute clean slate. Please try again.');
    } finally {
      setIsCleaningSlate(false);
    }
  };

  const resetCleanSlateDialog = () => {
    setCleanSlateOpen(false);
    setCleanSlateStep(0);
    setConfirmationCode('');
    setIsCleaningSlate(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Paper elevation={1} sx={{ mt: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="settings tabs"
            sx={{ px: 2 }}
          >
            <Tab 
              icon={<ImportIcon />} 
              label="Import Data" 
              id="settings-tab-0"
              aria-controls="settings-tabpanel-0"
            />
            <Tab 
              icon={<HistoryIcon />} 
              label="Import History" 
              id="settings-tab-1"
              aria-controls="settings-tabpanel-1"
            />
            <Tab 
              icon={<GeneralIcon />} 
              label="General" 
              id="settings-tab-2"
              aria-controls="settings-tabpanel-2"
            />
            <Tab 
              icon={<NotificationIcon />} 
              label="Notifications" 
              id="settings-tab-3"
              aria-controls="settings-tabpanel-3"
            />
            <Tab 
              icon={<EmailIcon />} 
              label="Email" 
              id="settings-tab-4"
              aria-controls="settings-tabpanel-4"
            />
            <Tab 
              icon={<SecurityIcon />} 
              label="Security" 
              id="settings-tab-5"
              aria-controls="settings-tabpanel-5"
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <ImportManager />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <ImportHistory />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <GeneralIcon sx={{ mr: 1 }} />
              General Settings
            </Typography>
            
            <Grid container spacing={3}>
              {/* Company Information */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Company Information</Typography>
                    <TextField
                      fullWidth
                      label="Company Name"
                      value={generalSettings.companyName}
                      onChange={(e) => handleGeneralSettingChange('companyName', e.target.value)}
                      sx={{ mb: 2 }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Localization */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <LanguageIcon sx={{ mr: 1 }} />
                      Localization
                    </Typography>
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Language</InputLabel>
                      <Select
                        value={generalSettings.language}
                        onChange={(e) => handleGeneralSettingChange('language', e.target.value)}
                        label="Language"
                      >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="es">Spanish</MenuItem>
                        <MenuItem value="fr">French</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Timezone</InputLabel>
                      <Select
                        value={generalSettings.timezone}
                        onChange={(e) => handleGeneralSettingChange('timezone', e.target.value)}
                        label="Timezone"
                      >
                        <MenuItem value="America/New_York">Eastern Time</MenuItem>
                        <MenuItem value="America/Chicago">Central Time</MenuItem>
                        <MenuItem value="America/Denver">Mountain Time</MenuItem>
                        <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Date Format</InputLabel>
                      <Select
                        value={generalSettings.dateFormat}
                        onChange={(e) => handleGeneralSettingChange('dateFormat', e.target.value)}
                        label="Date Format"
                      >
                        <MenuItem value="MM/dd/yyyy">MM/DD/YYYY</MenuItem>
                        <MenuItem value="dd/MM/yyyy">DD/MM/YYYY</MenuItem>
                        <MenuItem value="yyyy-MM-dd">YYYY-MM-DD</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>Time Format</InputLabel>
                      <Select
                        value={generalSettings.timeFormat}
                        onChange={(e) => handleGeneralSettingChange('timeFormat', e.target.value)}
                        label="Time Format"
                      >
                        <MenuItem value="12h">12 Hour</MenuItem>
                        <MenuItem value="24h">24 Hour</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>

              {/* Appearance */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <ThemeIcon sx={{ mr: 1 }} />
                      Appearance
                    </Typography>
                    
                    <FormControl fullWidth>
                      <InputLabel>Theme</InputLabel>
                      <Select
                        value={generalSettings.theme}
                        onChange={(e) => handleGeneralSettingChange('theme', e.target.value)}
                        label="Theme"
                      >
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                        <MenuItem value="auto">Auto</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => saveSettings('general')}
              >
                Save General Settings
              </Button>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <NotificationIcon sx={{ mr: 1 }} />
              Notification Settings
            </Typography>
            
            <Grid container spacing={3}>
              {/* Delivery Methods */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Delivery Methods</Typography>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.emailNotifications}
                            onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                          />
                        }
                        label="Email Notifications"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.pushNotifications}
                            onChange={(e) => handleNotificationChange('pushNotifications', e.target.checked)}
                          />
                        }
                        label="Push Notifications"
                      />
                    </FormGroup>
                  </CardContent>
                </Card>
              </Grid>

              {/* Work Order Notifications */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Work Order Notifications</Typography>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.workOrderUpdates}
                            onChange={(e) => handleNotificationChange('workOrderUpdates', e.target.checked)}
                          />
                        }
                        label="Work Order Updates"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.assignmentNotifications}
                            onChange={(e) => handleNotificationChange('assignmentNotifications', e.target.checked)}
                          />
                        }
                        label="Assignment Notifications"
                      />
                    </FormGroup>
                  </CardContent>
                </Card>
              </Grid>

              {/* Maintenance Notifications */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Maintenance & Inventory</Typography>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.maintenanceReminders}
                            onChange={(e) => handleNotificationChange('maintenanceReminders', e.target.checked)}
                          />
                        }
                        label="Maintenance Reminders"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.inventoryAlerts}
                            onChange={(e) => handleNotificationChange('inventoryAlerts', e.target.checked)}
                          />
                        }
                        label="Inventory Alerts"
                      />
                    </FormGroup>
                  </CardContent>
                </Card>
              </Grid>

              {/* System Notifications */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>System & Reports</Typography>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.systemAlerts}
                            onChange={(e) => handleNotificationChange('systemAlerts', e.target.checked)}
                          />
                        }
                        label="System Alerts"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notificationSettings.weeklyReports}
                            onChange={(e) => handleNotificationChange('weeklyReports', e.target.checked)}
                          />
                        }
                        label="Weekly Reports"
                      />
                    </FormGroup>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                Changes to notification settings will take effect immediately. You can always update these preferences later.
              </Typography>
            </Alert>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => saveSettings('notification')}
              >
                Save Notification Settings
              </Button>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <EmailIcon sx={{ mr: 1 }} />
              Email System Test
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Use this section to test your email configuration and send test emails. 
                The email system uses MXroute SMTP integration with your domain.
              </Typography>
            </Alert>
            
            <Box sx={{ 
              p: 2, 
              border: '1px solid', 
              borderColor: 'primary.main', 
              borderRadius: 1,
              backgroundColor: 'primary.light',
              opacity: 0.1
            }}>
              <Typography variant="body1" sx={{ mb: 2, color: 'primary.dark' }}>
                For complete email testing functionality, visit the dedicated email test page:
              </Typography>
              
              <Button
                variant="contained"
                startIcon={<EmailIcon />}
                onClick={() => window.open('/settings/email-test', '_blank')}
                size="large"
              >
                Open Email Test Center
              </Button>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <SecurityIcon sx={{ mr: 1 }} />
              Security Settings
            </Typography>
            
            <Grid container spacing={3}>
              {/* Authentication */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Authentication</Typography>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={securitySettings.twoFactorAuth}
                            onChange={(e) => handleSecurityChange('twoFactorAuth', e.target.checked)}
                          />
                        }
                        label="Two-Factor Authentication"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={securitySettings.passwordRequirements}
                            onChange={(e) => handleSecurityChange('passwordRequirements', e.target.checked)}
                          />
                        }
                        label="Strong Password Requirements"
                      />
                    </FormGroup>
                    
                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <InputLabel>Session Timeout (minutes)</InputLabel>
                      <Select
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
                        label="Session Timeout (minutes)"
                      >
                        <MenuItem value={30}>30 minutes</MenuItem>
                        <MenuItem value={60}>1 hour</MenuItem>
                        <MenuItem value={120}>2 hours</MenuItem>
                        <MenuItem value={240}>4 hours</MenuItem>
                        <MenuItem value={480}>8 hours</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>

              {/* Access Control */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Access Control</Typography>
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Max Login Attempts</InputLabel>
                      <Select
                        value={securitySettings.loginAttempts}
                        onChange={(e) => handleSecurityChange('loginAttempts', e.target.value)}
                        label="Max Login Attempts"
                      >
                        <MenuItem value={3}>3 attempts</MenuItem>
                        <MenuItem value={5}>5 attempts</MenuItem>
                        <MenuItem value={10}>10 attempts</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={securitySettings.ipRestriction}
                          onChange={(e) => handleSecurityChange('ipRestriction', e.target.checked)}
                        />
                      }
                      label="IP Address Restrictions"
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Security Status */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Security Status</Typography>
                    <List>
                      <ListItem>
                        <ListItemText 
                          primary="Two-Factor Authentication" 
                          secondary={securitySettings.twoFactorAuth ? "Enabled for enhanced security" : "Disabled - consider enabling for better security"}
                        />
                        <ListItemSecondaryAction>
                          <Chip 
                            label={securitySettings.twoFactorAuth ? "Enabled" : "Disabled"} 
                            color={securitySettings.twoFactorAuth ? "success" : "warning"}
                            size="small"
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Password Requirements" 
                          secondary={securitySettings.passwordRequirements ? "Strong password policy active" : "Basic password requirements"}
                        />
                        <ListItemSecondaryAction>
                          <Chip 
                            label={securitySettings.passwordRequirements ? "Strong" : "Basic"} 
                            color={securitySettings.passwordRequirements ? "success" : "warning"}
                            size="small"
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Session Management" 
                          secondary={`Automatic logout after ${securitySettings.sessionTimeout} minutes of inactivity`}
                        />
                        <ListItemSecondaryAction>
                          <Chip 
                            label={`${securitySettings.sessionTimeout}min`} 
                            color="info"
                            size="small"
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Alert severity="warning" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Important:</strong> Changes to security settings may affect how users access the system. 
                Make sure to communicate changes to your team.
              </Typography>
            </Alert>

            {/* Danger Zone - Hidden by default */}
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { color: 'error.main' }
                  }}
                  onClick={() => setShowDangerZone(!showDangerZone)}
                >
                  {'⚠️ '.repeat(5)} Advanced System Options {'⚠️ '.repeat(5)}
                </Typography>
              </Box>
              
              <Collapse in={showDangerZone}>
                <Card sx={{ border: '2px solid', borderColor: 'error.main', backgroundColor: 'error.light', opacity: 0.9 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'error.dark' }}>
                      <WarningIcon sx={{ mr: 1 }} />
                      Danger Zone
                    </Typography>
                    
                    <Alert severity="error" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>WARNING:</strong> The actions in this section are irreversible and will permanently delete data.
                        Only system administrators should access these functions.
                      </Typography>
                    </Alert>

                    <Box sx={{ 
                      p: 2, 
                      border: '1px dashed', 
                      borderColor: 'error.main', 
                      borderRadius: 1,
                      backgroundColor: 'background.paper'
                    }}>
                      <Typography variant="subtitle1" gutterBottom sx={{ color: 'error.dark' }}>
                        Clean Slate - Reset All Data
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                        This will permanently delete ALL operational data including work orders, assets, locations, 
                        PM schedules, parts, and import history. User accounts and organization settings will be preserved.
                      </Typography>
                      
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => setCleanSlateOpen(true)}
                        sx={{
                          borderWidth: 2,
                          '&:hover': {
                            borderWidth: 2,
                            backgroundColor: 'error.main',
                            color: 'white'
                          }
                        }}
                      >
                        Initialize Clean Slate
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Collapse>
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => saveSettings('security')}
                color="primary"
              >
                Save Security Settings
              </Button>
            </Box>
          </Box>
        </TabPanel>
      </Paper>

      {/* Clean Slate Confirmation Dialog */}
      <Dialog 
        open={cleanSlateOpen} 
        onClose={resetCleanSlateDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { 
            border: '3px solid', 
            borderColor: 'error.main',
            backgroundColor: 'error.light'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'error.main', 
          color: 'white',
          display: 'flex',
          alignItems: 'center'
        }}>
          <WarningIcon sx={{ mr: 1 }} />
          {cleanSlateStep === 0 && 'Clean Slate Warning'}
          {cleanSlateStep === 1 && 'Final Confirmation Required'}
          {cleanSlateStep === 2 && 'Enter Confirmation Code'}
        </DialogTitle>
        
        <DialogContent sx={{ mt: 2 }}>
          {cleanSlateStep === 0 && (
            <Box>
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  ⚠️ DANGER: This action cannot be undone! ⚠️
                </Typography>
              </Alert>
              
              <Typography variant="body1" gutterBottom>
                You are about to permanently delete ALL operational data from your system:
              </Typography>
              
              <Box component="ul" sx={{ mt: 1, mb: 2 }}>
                <li>All work orders</li>
                <li>All assets and equipment</li>
                <li>All locations</li>
                <li>All PM schedules and tasks</li>
                <li>All parts and inventory</li>
                <li>All portals and submissions</li>
                <li>All import history</li>
                <li>All maintenance history</li>
              </Box>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>What will be preserved:</strong> User accounts, organization settings, and system configuration will remain intact.
                </Typography>
              </Alert>
              
              <Typography variant="body1" color="error" fontWeight="bold">
                This action is intended for testing environments or complete system resets only.
              </Typography>
            </Box>
          )}
          
          {cleanSlateStep === 1 && (
            <Box>
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Last chance to cancel!
                </Typography>
              </Alert>
              
              <Typography variant="body1" gutterBottom>
                Are you absolutely sure you want to proceed? This will immediately and permanently delete all data.
              </Typography>
              
              <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                Click "Proceed" only if you understand the consequences and have proper authorization.
              </Typography>
            </Box>
          )}
          
          {cleanSlateStep === 2 && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body1">
                  Enter the confirmation code to proceed:
                </Typography>
              </Alert>
              
              <Typography variant="body2" sx={{ mb: 2, fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                DELETE-ELEVATED-COMPLIANCE
              </Typography>
              
              <TextField
                fullWidth
                label="Confirmation Code"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                placeholder="DELETE-ELEVATED-COMPLIANCE"
                error={confirmationCode !== '' && confirmationCode !== 'DELETE-ELEVATED-COMPLIANCE'}
                helperText={confirmationCode !== '' && confirmationCode !== 'DELETE-ELEVATED-COMPLIANCE' ? 'Incorrect confirmation code' : ''}
                sx={{ mt: 1 }}
              />
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2, bgcolor: 'background.paper' }}>
          <Button 
            onClick={resetCleanSlateDialog}
            variant="outlined"
            disabled={isCleaningSlate}
          >
            Cancel
          </Button>
          
          {cleanSlateStep === 0 && (
            <Button 
              onClick={handleCleanSlate}
              color="error"
              variant="contained"
            >
              I Understand - Continue
            </Button>
          )}
          
          {cleanSlateStep === 1 && (
            <Button 
              onClick={handleCleanSlate}
              color="error"
              variant="contained"
            >
              Proceed with Clean Slate
            </Button>
          )}
          
          {cleanSlateStep === 2 && (
            <Button 
              onClick={handleCleanSlate}
              color="error"
              variant="contained"
              disabled={confirmationCode !== 'DELETE-ELEVATED-COMPLIANCE' || isCleaningSlate}
              startIcon={isCleaningSlate ? <DeleteIcon /> : <WarningIcon />}
            >
              {isCleaningSlate ? 'Deleting All Data...' : 'EXECUTE CLEAN SLATE'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;