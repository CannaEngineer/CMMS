/**
 * Template Builder Dialog
 * Advanced template creation and editing interface
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Settings as SettingsIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  Assessment as ReportIcon,
  FilterList as FilterIcon,
  ViewColumn as ColumnIcon,
} from '@mui/icons-material';

import { ExportTemplate, exportService } from '../../services/exportService';

interface TemplateBuilderDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (template: Partial<ExportTemplate>) => void;
  template?: ExportTemplate | null;
}

interface StepData {
  basic: {
    name: string;
    description: string;
    templateType: string;
    dataSource: string;
    qualityLevel: string;
  };
  configuration: {
    columns: string[];
    filters: Record<string, any>;
    groupBy: string[];
    sortBy: Array<{ field: string; direction: 'asc' | 'desc' }>;
    includeCharts: boolean;
    includeImages: boolean;
    includeQRCodes: boolean;
    maxRecords: number;
  };
  scheduling: {
    isScheduled: boolean;
    frequency: string;
    cronExpression: string;
    timezone: string;
    startDate: string;
    endDate: string;
    executionTime: string;
    maxRetries: number;
    retryDelay: number;
  };
  email: {
    enableEmail: boolean;
    recipients: Array<{ email: string; name: string; role: string }>;
    ccRecipients: Array<{ email: string; name: string; role: string }>;
    subjectTemplate: string;
    bodyTemplate: string;
    includeAttachment: boolean;
    attachmentFormats: string[];
    onlyIfDataExists: boolean;
    minimumRecords: number;
  };
  permissions: {
    isPublic: boolean;
    allowedRoles: string[];
    allowedUsers: string[];
    rowLevelFilters: Record<string, any>;
    columnRestrictions: string[];
    maxRecordsPerUser: number;
  };
}

const steps = [
  'Basic Information',
  'Data Configuration',
  'Scheduling',
  'Email Settings',
  'Permissions',
];

const templateTypes = [
  { value: 'report', label: 'Report', description: 'Formatted report with charts and summaries' },
  { value: 'export', label: 'Data Export', description: 'Raw data export in various formats' },
  { value: 'compliance', label: 'Compliance Report', description: 'Audit-ready compliance documentation' },
  { value: 'dashboard', label: 'Dashboard Export', description: 'Dashboard snapshot with metrics' },
  { value: 'alert', label: 'Alert Report', description: 'Automated alerts based on conditions' },
];

const dataSourceOptions = [
  { value: 'work_orders', label: 'Work Orders' },
  { value: 'assets', label: 'Assets' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'locations', label: 'Locations' },
  { value: 'users', label: 'Users' },
];

const qualityLevels = [
  { value: 'basic', label: 'Basic', description: 'Standard data export' },
  { value: 'standard', label: 'Standard', description: 'Enhanced validation and formatting' },
  { value: 'enhanced', label: 'Enhanced', description: 'Advanced features and analytics' },
  { value: 'audit', label: 'Audit', description: 'Full compliance and audit trail' },
];

const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom (Cron)' },
];

const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

const roleOptions = [
  'admin',
  'manager',
  'technician',
  'auditor',
  'viewer',
  'operator',
];

export default function TemplateBuilderDialog({ open, onClose, onSave, template }: TemplateBuilderDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [activeStep, setActiveStep] = useState(0);
  const [data, setData] = useState<StepData>({
    basic: {
      name: '',
      description: '',
      templateType: 'report',
      dataSource: 'work_orders',
      qualityLevel: 'standard',
    },
    configuration: {
      columns: [],
      filters: {},
      groupBy: [],
      sortBy: [],
      includeCharts: false,
      includeImages: false,
      includeQRCodes: false,
      maxRecords: 10000,
    },
    scheduling: {
      isScheduled: false,
      frequency: 'daily',
      cronExpression: '0 8 * * *',
      timezone: 'UTC',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      executionTime: '08:00',
      maxRetries: 3,
      retryDelay: 300,
    },
    email: {
      enableEmail: false,
      recipients: [],
      ccRecipients: [],
      subjectTemplate: '{{templateName}} - {{date}}',
      bodyTemplate: 'Please find the attached {{templateName}} report generated on {{date}}.',
      includeAttachment: true,
      attachmentFormats: ['pdf'],
      onlyIfDataExists: true,
      minimumRecords: 1,
    },
    permissions: {
      isPublic: false,
      allowedRoles: [],
      allowedUsers: [],
      rowLevelFilters: {},
      columnRestrictions: [],
      maxRecordsPerUser: 10000,
    },
  });

  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Initialize form with template data
  useEffect(() => {
    if (template && open) {
      setData({
        basic: {
          name: template.name,
          description: template.description || '',
          templateType: template.templateType,
          dataSource: template.dataSource,
          qualityLevel: template.qualityLevel,
        },
        configuration: {
          columns: template.config.columns || [],
          filters: template.config.filters || {},
          groupBy: template.config.groupBy || [],
          sortBy: template.config.sortBy || [],
          includeCharts: template.config.includeCharts || false,
          includeImages: template.config.includeImages || false,
          includeQRCodes: template.config.includeQRCodes || false,
          maxRecords: template.config.maxRecords || 10000,
        },
        scheduling: {
          isScheduled: template.isScheduled,
          frequency: template.scheduleConfig?.frequency || 'daily',
          cronExpression: template.scheduleConfig?.cronExpression || '0 8 * * *',
          timezone: template.scheduleConfig?.timezone || 'UTC',
          startDate: template.scheduleConfig?.startDate || new Date().toISOString().split('T')[0],
          endDate: template.scheduleConfig?.endDate || '',
          executionTime: template.scheduleConfig?.executionTime || '08:00',
          maxRetries: template.scheduleConfig?.retryPolicy?.maxRetries || 3,
          retryDelay: template.scheduleConfig?.retryPolicy?.retryDelay || 300,
        },
        email: {
          enableEmail: !!template.emailConfig,
          recipients: template.emailConfig?.recipients || [],
          ccRecipients: template.emailConfig?.ccRecipients || [],
          subjectTemplate: template.emailConfig?.subjectTemplate || '{{templateName}} - {{date}}',
          bodyTemplate: template.emailConfig?.bodyTemplate || 'Please find the attached {{templateName}} report generated on {{date}}.',
          includeAttachment: template.emailConfig?.includeAttachment || true,
          attachmentFormats: template.emailConfig?.attachmentFormat || ['pdf'],
          onlyIfDataExists: template.emailConfig?.sendConditions?.onlyIfDataExists || true,
          minimumRecords: template.emailConfig?.sendConditions?.minimumRecords || 1,
        },
        permissions: {
          isPublic: template.isPublic,
          allowedRoles: template.allowedRoles || [],
          allowedUsers: template.allowedUsers || [],
          rowLevelFilters: {},
          columnRestrictions: [],
          maxRecordsPerUser: 10000,
        },
      });
    } else if (!template && open) {
      // Reset form for new template
      setActiveStep(0);
      setData({
        basic: {
          name: '',
          description: '',
          templateType: 'report',
          dataSource: 'work_orders',
          qualityLevel: 'standard',
        },
        configuration: {
          columns: [],
          filters: {},
          groupBy: [],
          sortBy: [],
          includeCharts: false,
          includeImages: false,
          includeQRCodes: false,
          maxRecords: 10000,
        },
        scheduling: {
          isScheduled: false,
          frequency: 'daily',
          cronExpression: '0 8 * * *',
          timezone: 'UTC',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          executionTime: '08:00',
          maxRetries: 3,
          retryDelay: 300,
        },
        email: {
          enableEmail: false,
          recipients: [],
          ccRecipients: [],
          subjectTemplate: '{{templateName}} - {{date}}',
          bodyTemplate: 'Please find the attached {{templateName}} report generated on {{date}}.',
          includeAttachment: true,
          attachmentFormats: ['pdf'],
          onlyIfDataExists: true,
          minimumRecords: 1,
        },
        permissions: {
          isPublic: false,
          allowedRoles: [],
          allowedUsers: [],
          rowLevelFilters: {},
          columnRestrictions: [],
          maxRecordsPerUser: 10000,
        },
      });
    }
  }, [template, open]);

  // Load available columns when data source changes
  useEffect(() => {
    if (data.basic.dataSource) {
      loadAvailableColumns();
    }
  }, [data.basic.dataSource]);

  const loadAvailableColumns = async () => {
    try {
      const schema = await exportService.getDataSourceSchema(data.basic.dataSource);
      const columns: string[] = [];
      
      schema.tables.forEach(table => {
        table.columns.forEach(column => {
          columns.push(`${table.name}.${column.name}`);
        });
      });
      
      setAvailableColumns(columns);
    } catch (err) {
      console.error('Failed to load columns:', err);
    }
  };

  const updateData = (section: keyof StepData, updates: Partial<StepData[keyof StepData]>) => {
    setData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates,
      },
    }));
  };

  const validateStep = (step: number): boolean => {
    const stepErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Basic Information
        if (!data.basic.name.trim()) {
          stepErrors.name = 'Template name is required';
        }
        if (!data.basic.dataSource) {
          stepErrors.dataSource = 'Data source is required';
        }
        break;

      case 1: // Configuration
        if (data.configuration.columns.length === 0) {
          stepErrors.columns = 'At least one column must be selected';
        }
        break;

      case 2: // Scheduling
        if (data.scheduling.isScheduled) {
          if (data.scheduling.frequency === 'custom' && !data.scheduling.cronExpression.trim()) {
            stepErrors.cronExpression = 'Cron expression is required for custom frequency';
          }
          if (!data.scheduling.startDate) {
            stepErrors.startDate = 'Start date is required for scheduled templates';
          }
        }
        break;

      case 3: // Email
        if (data.email.enableEmail) {
          if (data.email.recipients.length === 0) {
            stepErrors.emailRecipients = 'At least one recipient is required';
          }
        }
        break;

      case 4: // Permissions
        if (!data.permissions.isPublic && 
            data.permissions.allowedRoles.length === 0 && 
            data.permissions.allowedUsers.length === 0) {
          stepErrors.permissions = 'Private templates must have at least one allowed role or user';
        }
        break;
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  const handleSave = () => {
    // Validate all steps
    let isValid = true;
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(i)) {
        isValid = false;
        setActiveStep(i);
        break;
      }
    }

    if (!isValid) return;

    // Build template object
    const templateData: Partial<ExportTemplate> = {
      name: data.basic.name,
      description: data.basic.description,
      templateType: data.basic.templateType as any,
      dataSource: data.basic.dataSource,
      qualityLevel: data.basic.qualityLevel as any,
      config: {
        columns: data.configuration.columns,
        filters: data.configuration.filters,
        groupBy: data.configuration.groupBy,
        sortBy: data.configuration.sortBy,
        includeCharts: data.configuration.includeCharts,
        includeImages: data.configuration.includeImages,
        includeQRCodes: data.configuration.includeQRCodes,
        maxRecords: data.configuration.maxRecords,
      },
      formatSettings: {},
      layoutConfig: { sections: [] },
      chartConfigs: [],
      isScheduled: data.scheduling.isScheduled,
      scheduleConfig: data.scheduling.isScheduled ? {
        frequency: data.scheduling.frequency as any,
        cronExpression: data.scheduling.cronExpression,
        timezone: data.scheduling.timezone,
        startDate: data.scheduling.startDate,
        endDate: data.scheduling.endDate || undefined,
        executionTime: data.scheduling.executionTime,
        retryPolicy: {
          maxRetries: data.scheduling.maxRetries,
          retryDelay: data.scheduling.retryDelay,
        },
      } : undefined,
      emailConfig: data.email.enableEmail ? {
        recipients: data.email.recipients,
        ccRecipients: data.email.ccRecipients,
        bccRecipients: [],
        subjectTemplate: data.email.subjectTemplate,
        bodyTemplate: data.email.bodyTemplate,
        includeAttachment: data.email.includeAttachment,
        attachmentFormat: data.email.attachmentFormats,
        sendConditions: {
          onlyIfDataExists: data.email.onlyIfDataExists,
          minimumRecords: data.email.minimumRecords,
          includePreview: true,
        },
      } : undefined,
      isPublic: data.permissions.isPublic,
      allowedRoles: data.permissions.allowedRoles,
      allowedUsers: data.permissions.allowedUsers,
      isActive: true,
    };

    onSave(templateData);
  };

  const addRecipient = (type: 'recipients' | 'ccRecipients') => {
    const newRecipient = { email: '', name: '', role: '' };
    updateData('email', {
      [type]: [...data.email[type], newRecipient],
    });
  };

  const removeRecipient = (type: 'recipients' | 'ccRecipients', index: number) => {
    const updated = data.email[type].filter((_, i) => i !== index);
    updateData('email', { [type]: updated });
  };

  const updateRecipient = (type: 'recipients' | 'ccRecipients', index: number, field: string, value: string) => {
    const updated = data.email[type].map((recipient, i) => 
      i === index ? { ...recipient, [field]: value } : recipient
    );
    updateData('email', { [type]: updated });
  };

  const renderBasicStep = () => (
    <Grid container spacing={3}>
      <Grid xs={12}>
        <TextField
          fullWidth
          label="Template Name"
          value={data.basic.name}
          onChange={(e) => updateData('basic', { name: e.target.value })}
          error={!!errors.name}
          helperText={errors.name}
          required
        />
      </Grid>
      
      <Grid xs={12}>
        <TextField
          fullWidth
          label="Description"
          value={data.basic.description}
          onChange={(e) => updateData('basic', { description: e.target.value })}
          multiline
          rows={3}
        />
      </Grid>
      
      <Grid xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Template Type</InputLabel>
          <Select
            value={data.basic.templateType}
            onChange={(e) => updateData('basic', { templateType: e.target.value })}
            label="Template Type"
          >
            {templateTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                <Box>
                  <Typography variant="body1">{type.label}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {type.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Data Source</InputLabel>
          <Select
            value={data.basic.dataSource}
            onChange={(e) => updateData('basic', { dataSource: e.target.value })}
            label="Data Source"
            error={!!errors.dataSource}
          >
            {dataSourceOptions.map((source) => (
              <MenuItem key={source.value} value={source.value}>
                {source.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Quality Level</InputLabel>
          <Select
            value={data.basic.qualityLevel}
            onChange={(e) => updateData('basic', { qualityLevel: e.target.value })}
            label="Quality Level"
          >
            {qualityLevels.map((level) => (
              <MenuItem key={level.value} value={level.value}>
                <Box>
                  <Typography variant="body1">{level.label}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {level.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderConfigurationStep = () => (
    <Box>
      {errors.columns && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.columns}
        </Alert>
      )}
      
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <ColumnIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Columns</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControl fullWidth>
            <InputLabel>Select Columns</InputLabel>
            <Select
              multiple
              value={data.configuration.columns}
              onChange={(e) => updateData('configuration', { columns: e.target.value as string[] })}
              label="Select Columns"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {availableColumns.map((column) => (
                <MenuItem key={column} value={column}>
                  {column}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <FilterIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Advanced Options</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Records"
                type="number"
                value={data.configuration.maxRecords}
                onChange={(e) => updateData('configuration', { maxRecords: Number(e.target.value) })}
                inputProps={{ min: 1, max: 1000000 }}
              />
            </Grid>
            
            <Grid xs={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={data.configuration.includeCharts}
                      onChange={(e) => updateData('configuration', { includeCharts: e.target.checked })}
                    />
                  }
                  label="Include Charts"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={data.configuration.includeImages}
                      onChange={(e) => updateData('configuration', { includeImages: e.target.checked })}
                    />
                  }
                  label="Include Images"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={data.configuration.includeQRCodes}
                      onChange={(e) => updateData('configuration', { includeQRCodes: e.target.checked })}
                    />
                  }
                  label="Include QR Codes"
                />
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );

  const renderSchedulingStep = () => (
    <Box>
      <FormControlLabel
        control={
          <Switch
            checked={data.scheduling.isScheduled}
            onChange={(e) => updateData('scheduling', { isScheduled: e.target.checked })}
          />
        }
        label="Enable Scheduled Execution"
        sx={{ mb: 3 }}
      />
      
      {data.scheduling.isScheduled && (
        <Grid container spacing={3}>
          <Grid xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Frequency</InputLabel>
              <Select
                value={data.scheduling.frequency}
                onChange={(e) => updateData('scheduling', { frequency: e.target.value })}
                label="Frequency"
              >
                {frequencyOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid xs={12} md={6}>
            <TextField
              fullWidth
              label="Execution Time"
              type="time"
              value={data.scheduling.executionTime}
              onChange={(e) => updateData('scheduling', { executionTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          {data.scheduling.frequency === 'custom' && (
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Cron Expression"
                value={data.scheduling.cronExpression}
                onChange={(e) => updateData('scheduling', { cronExpression: e.target.value })}
                error={!!errors.cronExpression}
                helperText={errors.cronExpression || 'Format: minute hour day month weekday'}
                placeholder="0 8 * * *"
              />
            </Grid>
          )}
          
          <Grid xs={12} md={6}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={data.scheduling.startDate}
              onChange={(e) => updateData('scheduling', { startDate: e.target.value })}
              error={!!errors.startDate}
              helperText={errors.startDate}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid xs={12} md={6}>
            <TextField
              fullWidth
              label="End Date (Optional)"
              type="date"
              value={data.scheduling.endDate}
              onChange={(e) => updateData('scheduling', { endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Timezone</InputLabel>
              <Select
                value={data.scheduling.timezone}
                onChange={(e) => updateData('scheduling', { timezone: e.target.value })}
                label="Timezone"
              >
                {timezones.map((tz) => (
                  <MenuItem key={tz} value={tz}>
                    {tz}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid xs={12} md={3}>
            <TextField
              fullWidth
              label="Max Retries"
              type="number"
              value={data.scheduling.maxRetries}
              onChange={(e) => updateData('scheduling', { maxRetries: Number(e.target.value) })}
              inputProps={{ min: 0, max: 10 }}
            />
          </Grid>
          
          <Grid xs={12} md={3}>
            <TextField
              fullWidth
              label="Retry Delay (seconds)"
              type="number"
              value={data.scheduling.retryDelay}
              onChange={(e) => updateData('scheduling', { retryDelay: Number(e.target.value) })}
              inputProps={{ min: 30, max: 3600 }}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );

  const renderEmailStep = () => (
    <Box>
      <FormControlLabel
        control={
          <Switch
            checked={data.email.enableEmail}
            onChange={(e) => updateData('email', { enableEmail: e.target.checked })}
          />
        }
        label="Enable Email Delivery"
        sx={{ mb: 3 }}
      />
      
      {data.email.enableEmail && (
        <Box>
          {errors.emailRecipients && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.emailRecipients}
            </Alert>
          )}
          
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <EmailIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Recipients</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2 }}>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => addRecipient('recipients')}
                  variant="outlined"
                  size="small"
                >
                  Add Recipient
                </Button>
              </Box>
              
              {data.email.recipients.map((recipient, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={recipient.email}
                      onChange={(e) => updateRecipient('recipients', index, 'email', e.target.value)}
                    />
                  </Grid>
                  <Grid xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={recipient.name}
                      onChange={(e) => updateRecipient('recipients', index, 'name', e.target.value)}
                    />
                  </Grid>
                  <Grid xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Role"
                      value={recipient.role}
                      onChange={(e) => updateRecipient('recipients', index, 'role', e.target.value)}
                    />
                  </Grid>
                  <Grid xs={12} md={2}>
                    <IconButton
                      onClick={() => removeRecipient('recipients', index)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <SettingsIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Email Content</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid xs={12}>
                  <TextField
                    fullWidth
                    label="Subject Template"
                    value={data.email.subjectTemplate}
                    onChange={(e) => updateData('email', { subjectTemplate: e.target.value })}
                    helperText="Use {{templateName}}, {{date}}, {{recordCount}} placeholders"
                  />
                </Grid>
                
                <Grid xs={12}>
                  <TextField
                    fullWidth
                    label="Body Template"
                    value={data.email.bodyTemplate}
                    onChange={(e) => updateData('email', { bodyTemplate: e.target.value })}
                    multiline
                    rows={4}
                    helperText="Use {{templateName}}, {{date}}, {{recordCount}} placeholders"
                  />
                </Grid>
                
                <Grid xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={data.email.includeAttachment}
                        onChange={(e) => updateData('email', { includeAttachment: e.target.checked })}
                      />
                    }
                    label="Include Attachment"
                  />
                </Grid>
                
                <Grid xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={data.email.onlyIfDataExists}
                        onChange={(e) => updateData('email', { onlyIfDataExists: e.target.checked })}
                      />
                    }
                    label="Only send if data exists"
                  />
                </Grid>
                
                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Minimum Records"
                    type="number"
                    value={data.email.minimumRecords}
                    onChange={(e) => updateData('email', { minimumRecords: Number(e.target.value) })}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}
    </Box>
  );

  const renderPermissionsStep = () => (
    <Box>
      {errors.permissions && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.permissions}
        </Alert>
      )}
      
      <FormControlLabel
        control={
          <Switch
            checked={data.permissions.isPublic}
            onChange={(e) => updateData('permissions', { isPublic: e.target.checked })}
          />
        }
        label="Public Template (accessible to all users)"
        sx={{ mb: 3 }}
      />
      
      {!data.permissions.isPublic && (
        <Grid container spacing={3}>
          <Grid xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Allowed Roles</InputLabel>
              <Select
                multiple
                value={data.permissions.allowedRoles}
                onChange={(e) => updateData('permissions', { allowedRoles: e.target.value as string[] })}
                label="Allowed Roles"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {roleOptions.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid xs={12} md={6}>
            <TextField
              fullWidth
              label="Max Records Per User"
              type="number"
              value={data.permissions.maxRecordsPerUser}
              onChange={(e) => updateData('permissions', { maxRecordsPerUser: Number(e.target.value) })}
              inputProps={{ min: 1, max: 1000000 }}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderBasicStep();
      case 1:
        return renderConfigurationStep();
      case 2:
        return renderSchedulingStep();
      case 3:
        return renderEmailStep();
      case 4:
        return renderPermissionsStep();
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: { height: isMobile ? '100%' : '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReportIcon />
          <Typography variant="h6">
            {template ? 'Edit Template' : 'Create Template'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column' }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }} orientation={isMobile ? 'vertical' : 'horizontal'}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {renderStepContent(activeStep)}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
          >
            {template ? 'Update Template' : 'Create Template'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}