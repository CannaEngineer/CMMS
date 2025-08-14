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
  Grid
} from '@mui/material';
import { 
  Upload as ImportIcon,
  History as HistoryIcon,
  Settings as GeneralIcon,
  Notifications as NotificationIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
  Language as LanguageIcon,
  ColorLens as ThemeIcon
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
    companyName: 'Compass CMMS',
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
              icon={<SecurityIcon />} 
              label="Security" 
              id="settings-tab-4"
              aria-controls="settings-tabpanel-4"
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
    </Box>
  );
};

export default SettingsPage;