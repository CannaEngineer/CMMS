// Portal Configuration Editor - Configure portal settings and permissions
import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Alert,
  Divider
} from '@mui/material';
import { PortalConfiguration } from '../../types/portal';

interface PortalConfigurationEditorProps {
  configuration: PortalConfiguration;
  onChange: (updates: Partial<PortalConfiguration>) => void;
  errors?: Record<string, string>;
}

const PortalConfigurationEditor: React.FC<PortalConfigurationEditorProps> = ({
  configuration,
  onChange,
  errors
}) => {
  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h6" gutterBottom>
        Portal Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure submission settings, permissions, and integrations
      </Typography>

      <Grid container spacing={3}>
        {/* Submission Settings */}
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Submission Settings
              </Typography>
              
              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configuration.allowAnonymous}
                        onChange={(e) => onChange({ allowAnonymous: e.target.checked })}
                      />
                    }
                    label="Allow Anonymous Submissions"
                  />
                </Grid>
                
                <Grid xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configuration.autoCreateWorkOrder}
                        onChange={(e) => onChange({ autoCreateWorkOrder: e.target.checked })}
                      />
                    }
                    label="Auto-create Work Orders"
                  />
                </Grid>
                
                <Grid xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Default Priority</InputLabel>
                    <Select
                      value={configuration.defaultPriority}
                      onChange={(e) => onChange({ defaultPriority: e.target.value as any })}
                      label="Default Priority"
                    >
                      <MenuItem value="LOW">Low</MenuItem>
                      <MenuItem value="MEDIUM">Medium</MenuItem>
                      <MenuItem value="HIGH">High</MenuItem>
                      <MenuItem value="URGENT">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Rate Limit (per hour)"
                    type="number"
                    value={configuration.rateLimitPerHour}
                    onChange={(e) => onChange({ rateLimitPerHour: Number(e.target.value) })}
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* File Upload Settings */}
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                File Upload Settings
              </Typography>
              
              <Grid container spacing={2}>
                <Grid xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configuration.allowFileUploads}
                        onChange={(e) => onChange({ allowFileUploads: e.target.checked })}
                      />
                    }
                    label="Allow File Uploads"
                  />
                </Grid>
                
                {configuration.allowFileUploads && (
                  <>
                    <Grid xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Max File Size (MB)"
                        type="number"
                        value={configuration.maxFileSize}
                        onChange={(e) => onChange({ maxFileSize: Number(e.target.value) })}
                        inputProps={{ min: 1, max: 100 }}
                      />
                    </Grid>
                    
                    <Grid xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Max Files"
                        type="number"
                        value={configuration.maxFiles}
                        onChange={(e) => onChange({ maxFiles: Number(e.target.value) })}
                        inputProps={{ min: 1, max: 20 }}
                      />
                    </Grid>
                    
                    <Grid xs={12} md={4}>
                      <Typography variant="body2" gutterBottom>
                        Allowed File Types
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {configuration.allowedFileTypes.map((type) => (
                          <Chip key={type} label={type} size="small" />
                        ))}
                      </Box>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Email Notifications */}
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Email Notifications
              </Typography>
              
              <Grid container spacing={2}>
                <Grid xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configuration.emailNotifications.notifySubmitter}
                        onChange={(e) => onChange({
                          emailNotifications: {
                            ...configuration.emailNotifications,
                            notifySubmitter: e.target.checked
                          }
                        })}
                      />
                    }
                    label="Notify Submitter"
                  />
                </Grid>
                
                <Grid xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configuration.emailNotifications.notifyAdmins}
                        onChange={(e) => onChange({
                          emailNotifications: {
                            ...configuration.emailNotifications,
                            notifyAdmins: e.target.checked
                          }
                        })}
                      />
                    }
                    label="Notify Admins"
                  />
                </Grid>
                
                <Grid xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configuration.emailNotifications.notifyAssignee}
                        onChange={(e) => onChange({
                          emailNotifications: {
                            ...configuration.emailNotifications,
                            notifyAssignee: e.target.checked
                          }
                        })}
                      />
                    }
                    label="Notify Assignee"
                  />
                </Grid>
                
                {configuration.emailNotifications.notifyAdmins && (
                  <Grid xs={12}>
                    <TextField
                      fullWidth
                      label="Admin Email Addresses"
                      value={configuration.emailNotifications.adminEmails.join(', ')}
                      onChange={(e) => onChange({
                        emailNotifications: {
                          ...configuration.emailNotifications,
                          adminEmails: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                        }
                      })}
                      placeholder="admin1@example.com, admin2@example.com"
                      helperText="Separate multiple emails with commas"
                      error={Boolean(errors?.adminEmails)}
                    />
                    {errors?.adminEmails && (
                      <Typography variant="caption" color="error">
                        {errors.adminEmails}
                      </Typography>
                    )}
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Security & Access
              </Typography>
              
              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configuration.requireCaptcha}
                        onChange={(e) => onChange({ requireCaptcha: e.target.checked })}
                      />
                    }
                    label="Require CAPTCHA"
                  />
                </Grid>
                
                <Grid xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configuration.requireApproval}
                        onChange={(e) => onChange({ requireApproval: e.target.checked })}
                      />
                    }
                    label="Require Admin Approval"
                  />
                </Grid>
              </Grid>

              {(configuration.requireCaptcha || configuration.requireApproval) && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {configuration.requireCaptcha && "CAPTCHA will help prevent spam submissions. "}
                  {configuration.requireApproval && "Admin approval means submissions won't create work orders automatically."}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PortalConfigurationEditor;