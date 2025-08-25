import React, { useState, useEffect } from 'react';
import {
  Box,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Assignment as WorkOrderIcon,
  Build as AssetIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Warning as PriorityIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import FormDialog from './FormDialog';
import FormField from './FormField';
import { statusColors } from '../../theme/theme';
import { assetsService, usersService } from '../../services/api';

// Aligned with WorkOrder model from database schema
interface WorkOrderFormData {
  id?: number;
  legacyId?: number;
  title: string;
  description?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assetId?: number;
  assignedToId?: number;
  organizationId: number;
}

interface WorkOrderFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: WorkOrderFormData) => void;
  initialData: Partial<WorkOrderFormData>;
  mode: 'create' | 'edit' | 'view';
  loading?: boolean;
}

const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const statusOptions = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELED', label: 'Canceled' },
];

const categoryOptions = [
  { value: 'PREVENTIVE', label: 'Preventive Maintenance' },
  { value: 'CORRECTIVE', label: 'Corrective Maintenance' },
  { value: 'EMERGENCY', label: 'Emergency Repair' },
  { value: 'INSPECTION', label: 'Inspection' },
  { value: 'CALIBRATION', label: 'Calibration' },
  { value: 'CLEANING', label: 'Cleaning' },
];

// Remove hardcoded options - will be loaded from API

const steps = ['Basic Information', 'Assignment & Scheduling', 'Additional Details'];

export default function WorkOrderForm({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  loading = false,
}: WorkOrderFormProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<WorkOrderFormData>(() => ({
    title: '',
    description: '',
    status: 'OPEN',
    priority: 'MEDIUM',
    assetId: undefined,
    assignedToId: undefined,
    organizationId: 1,
    ...initialData,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch assets for the dropdown
  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: assetsService.getAll,
    enabled: open, // Only fetch when dialog is open
  });

  // Fetch users for assignment dropdown
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersService.getAll,
    enabled: open, // Only fetch when dialog is open
  });

  // Transform API data to dropdown options
  const assetOptions = assets?.map(asset => ({
    value: asset.id?.toString() || '',
    label: `${asset.name} - ${asset.location?.name || 'Unknown Location'}`,
  })) || [];

  const userOptions = [
    { value: '', label: 'Unassigned' },
    ...(users?.map(user => ({
      value: user.id?.toString() || '',
      label: `${user.name} - ${user.role || 'Technician'}`,
    })) || [])
  ];

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prevData => ({ ...prevData, ...initialData }));
    }
  }, [initialData]);

  const handleFieldChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0:
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.description && formData.description?.trim() === '') newErrors.description = 'Description is required';
        break;
      case 1:
        if (!formData.priority) newErrors.priority = 'Priority is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = () => {
    console.log('WorkOrderForm handleSubmit called, mode:', mode);
    console.log('Form data:', formData);
    
    // For edit mode, validate all required fields at once
    if (mode === 'edit') {
      const newErrors: Record<string, string> = {};
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      // Don't require description for edit mode
      if (!formData.priority) newErrors.priority = 'Priority is required';
      
      setErrors(newErrors);
      console.log('Edit mode validation errors:', newErrors);
      
      if (Object.keys(newErrors).length === 0) {
        console.log('Validation passed, calling onSubmit with data:', formData);
        onSubmit(formData);
      } else {
        console.log('Validation failed with errors:', newErrors);
      }
    } else {
      // For create mode, use step validation
      if (validateStep(activeStep)) {
        console.log('Step validation passed, calling onSubmit');
        onSubmit(formData);
      } else {
        console.log('Step validation failed');
      }
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid xs={12}>
              <FormField
                type="text"
                name="title"
                label="Work Order Title"
                value={formData.title}
                onChange={handleFieldChange}
                required
                error={errors.title}
                disabled={mode === 'view'}
                placeholder="Brief description of the work needed"
              />
            </Grid>
            <Grid xs={12}>
              <FormField
                type="textarea"
                name="description"
                label="Detailed Description"
                value={formData.description}
                onChange={handleFieldChange}
                required
                error={errors.description}
                disabled={mode === 'view'}
                placeholder="Provide detailed information about the issue or work required"
                rows={4}
              />
            </Grid>
            <Grid xs={12} md={6}>
              <FormField
                type="select"
                name="assetId"
                label="Asset"
                value={formData.assetId?.toString() || ''}
                onChange={(name, value) => handleFieldChange(name, value ? parseInt(value) : undefined)}
                options={assetOptions}
                disabled={mode === 'view' || assetsLoading}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid xs={12} md={6}>
              <FormField
                type="select"
                name="priority"
                label="Priority"
                value={formData.priority}
                onChange={handleFieldChange}
                options={priorityOptions}
                required
                error={errors.priority}
                disabled={mode === 'view'}
              />
            </Grid>
            <Grid xs={12} md={6}>
              <FormField
                type="select"
                name="status"
                label="Status"
                value={formData.status}
                onChange={handleFieldChange}
                options={statusOptions}
                disabled={mode === 'view' || mode === 'create'}
              />
            </Grid>
            <Grid xs={12} md={6}>
              <FormField
                type="select"
                name="assignedToId"
                label="Assign To"
                value={formData.assignedToId?.toString() || ''}
                onChange={(name, value) => handleFieldChange(name, value ? parseInt(value) : undefined)}
                options={userOptions}
                disabled={mode === 'view' || usersLoading}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid xs={12}>
              <Typography variant="h6">Review Work Order</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Please review the work order details before creating.
              </Typography>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  const renderViewMode = () => (
    <Grid container spacing={3}>
      <Grid xs={12} md={8}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <WorkOrderIcon color="primary" />
              <Typography variant="h6">{formData.title}</Typography>
              <Chip
                label={formData.priority}
                size="small"
                sx={{
                  backgroundColor: statusColors[formData.priority] + '20',
                  color: statusColors[formData.priority],
                  fontWeight: 600,
                }}
              />
              <Chip
                label={formData.status?.replace('_', ' ')}
                size="small"
                sx={{
                  backgroundColor: statusColors[formData.status || 'OPEN'] + '20',
                  color: statusColors[formData.status || 'OPEN'],
                  fontWeight: 600,
                }}
              />
            </Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {formData.description}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <List dense>
              <ListItem>
                <ListItemIcon><AssetIcon /></ListItemIcon>
                <ListItemText 
                  primary="Asset" 
                  secondary={assetOptions.find(a => a.value === formData.assetId?.toString())?.label || 'Not selected'} 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><PersonIcon /></ListItemIcon>
                <ListItemText 
                  primary="Assigned To" 
                  secondary={userOptions.find(u => u.value === formData.assignedToId?.toString())?.label || 'Unassigned'} 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><ScheduleIcon /></ListItemIcon>
                <ListItemText 
                  primary="Due Date" 
                  secondary={formData.dueDate || 'Not set'} 
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
      <Grid xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Details</Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Category" secondary={formData.category} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Estimated Hours" secondary={`${formData.estimatedHours} hrs`} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Requested By" secondary={formData.requestedBy || 'Not specified'} />
              </ListItem>
            </List>
            {formData.tags && formData.tags.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Tags</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {formData.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" />
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // For edit mode, show all fields in one step
  const renderEditMode = () => (
    <Grid container spacing={3}>
      <Grid xs={12}>
        <FormField
          type="text"
          name="title"
          label="Work Order Title"
          value={formData.title}
          onChange={handleFieldChange}
          required
          error={errors.title}
          disabled={mode === 'view'}
          placeholder="Brief description of the work needed"
        />
      </Grid>
      <Grid xs={12}>
        <FormField
          type="textarea"
          name="description"
          label="Detailed Description"
          value={formData.description || ''}
          onChange={handleFieldChange}
          error={errors.description}
          disabled={mode === 'view'}
          placeholder="Provide detailed information about the issue or work required"
          rows={4}
        />
      </Grid>
      <Grid xs={12} md={6}>
        <FormField
          type="select"
          name="priority"
          label="Priority"
          value={formData.priority}
          onChange={handleFieldChange}
          options={priorityOptions}
          required
          error={errors.priority}
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid xs={12} md={6}>
        <FormField
          type="select"
          name="status"
          label="Status"
          value={formData.status}
          onChange={handleFieldChange}
          options={statusOptions}
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid xs={12} md={6}>
        <FormField
          type="select"
          name="assetId"
          label="Asset"
          value={formData.assetId?.toString() || ''}
          onChange={(name, value) => handleFieldChange(name, value ? parseInt(value) : undefined)}
          options={assetOptions}
          disabled={mode === 'view' || assetsLoading}
        />
      </Grid>
      <Grid xs={12} md={6}>
        <FormField
          type="select"
          name="assignedToId"
          label="Assign To"
          value={formData.assignedToId?.toString() || ''}
          onChange={(name, value) => handleFieldChange(name, value ? parseInt(value) : undefined)}
          options={userOptions}
          disabled={mode === 'view' || usersLoading}
        />
      </Grid>
    </Grid>
  );

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={
        mode === 'create' ? 'Create Work Order' :
        mode === 'edit' ? 'Edit Work Order' :
        `Work Order #${formData.id || 'New'}`
      }
      submitText={mode === 'view' ? undefined : mode === 'edit' ? 'Update Work Order' : (activeStep === steps.length - 1 ? 'Create Work Order' : 'Next')}
      loading={loading}
      maxWidth="md"
      hideActions={mode === 'view'}
      submitDisabled={mode === 'view'}
    >
      {Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Please fix the errors below before continuing.
        </Alert>
      )}

      {mode === 'view' ? (
        renderViewMode()
      ) : mode === 'edit' ? (
        renderEditMode()
      ) : (
        <>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            <Box>
              {activeStep < steps.length - 1 ? (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                  Create Work Order
                </Button>
              )}
            </Box>
          </Box>
        </>
      )}
    </FormDialog>
  );
}