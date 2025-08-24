import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Alert,
  Card,
  CardContent,
  Typography,
  Chip,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Build as AssetIcon,
  Person as PersonIcon,
  Repeat as RecurrenceIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import FormDialog from './FormDialog';
import FormField from './FormField';
import { assetsService } from '../../services/api';

// Aligned with PMSchedule model from database schema
interface MaintenanceScheduleFormData {
  id?: number;
  legacyId?: number;
  title: string;
  description: string;
  frequency: string; // matches database string field
  nextDue: string;
  assetId: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedHours?: number;
  assignedToId?: number;
}

interface MaintenanceScheduleFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MaintenanceScheduleFormData) => void;
  initialData?: Partial<MaintenanceScheduleFormData>;
  mode: 'create' | 'edit' | 'view';
  loading?: boolean;
}

const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const typeOptions = [
  { value: 'PREVENTIVE', label: 'Preventive Maintenance' },
  { value: 'PREDICTIVE', label: 'Predictive Maintenance' },
  { value: 'ROUTINE', label: 'Routine Inspection' },
  { value: 'INSPECTION', label: 'Safety Inspection' },
];

const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly (Every 3 Months)' },
  { value: 'yearly', label: 'Yearly' },
];

const customFrequencyUnitOptions = [
  { value: 'DAYS', label: 'Days' },
  { value: 'WEEKS', label: 'Weeks' },
  { value: 'MONTHS', label: 'Months' },
];

// Asset options will be fetched dynamically

const userOptions = [
  { value: '1', label: 'John Doe - Senior Technician' },
  { value: '2', label: 'Jane Smith - Maintenance Specialist' },
  { value: '3', label: 'Mike Johnson - Electrician' },
  { value: '4', label: 'Sarah Wilson - HVAC Technician' },
];

const partOptions = [
  { value: '1', label: 'Motor Bearing 6205' },
  { value: '2', label: 'Hydraulic Oil ISO 46' },
  { value: '3', label: 'V-Belt A43' },
  { value: '4', label: 'Air Filter Element' },
];

const toolOptions = [
  { value: '1', label: 'Torque Wrench' },
  { value: '2', label: 'Multimeter' },
  { value: '3', label: 'Vibration Analyzer' },
  { value: '4', label: 'Thermal Camera' },
];

export default function MaintenanceScheduleForm({
  open,
  onClose,
  onSubmit,
  initialData = {},
  mode,
  loading = false,
}: MaintenanceScheduleFormProps) {
  const [formData, setFormData] = useState<MaintenanceScheduleFormData>({
    title: '',
    description: '',
    frequency: 'monthly',
    nextDue: '',
    assetId: 0,
    priority: 'MEDIUM',
    estimatedHours: 1,
    assignedToId: undefined,
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [assets, setAssets] = useState<{ value: string; label: string }[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prevData => ({ ...prevData, ...initialData }));
    }
  }, [initialData]);

  // Fetch assets when component mounts
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoadingAssets(true);
        const assets = await assetsService.getAll();
        const assetOptions = assets.map((asset: any) => ({
          value: asset.id.toString(),
          label: `${asset.name}${asset.description ? ` - ${asset.description}` : ''}`
        }));
        setAssets(assetOptions);
      } catch (error) {
        console.error('Error fetching assets:', error);
        setAssets([]);
      } finally {
        setLoadingAssets(false);
      }
    };

    fetchAssets();
  }, []);

  const handleFieldChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.assetId) newErrors.assetId = 'Asset is required';
    if (!formData.frequency) newErrors.frequency = 'Frequency is required';
    if (!formData.nextDue) newErrors.nextDue = 'Next due date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const renderViewMode = () => (
    <Grid container spacing={3}>
      <Grid xs={12}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <ScheduleIcon color="primary" />
              <Typography variant="h6">{formData.title}</Typography>
            </Box>
            
            <Typography variant="body1" sx={{ mb: 2 }}>
              {formData.description}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Asset</Typography>
                <Typography variant="body1">
                  {assets.find(a => a.value.toString() === formData.assetId.toString())?.label || 'Loading...'}
                </Typography>
              </Grid>
              <Grid xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Frequency</Typography>
                <Typography variant="body1">
                  {frequencyOptions.find(opt => opt.value === formData.frequency)?.label || formData.frequency}
                </Typography>
              </Grid>
              <Grid xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Next Due</Typography>
                <Typography variant="body1">{formData.nextDue}</Typography>
              </Grid>
              <Grid xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                <Typography variant="body1">
                  {priorityOptions.find(opt => opt.value === formData.priority)?.label || formData.priority}
                </Typography>
              </Grid>
              <Grid xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Estimated Hours</Typography>
                <Typography variant="body1">{formData.estimatedHours || 'Not specified'}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderFormMode = () => (
    <Grid container spacing={3}>
      <Grid xs={12}>
        <FormField
          type="text"
          name="title"
          label="Schedule Title"
          value={formData.title}
          onChange={handleFieldChange}
          required
          error={errors.title}
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid xs={12}>
        <FormField
          type="textarea"
          name="description"
          label="Description"
          value={formData.description}
          onChange={handleFieldChange}
          disabled={mode === 'view'}
          rows={3}
        />
      </Grid>
      <Grid xs={12} md={6}>
        <FormField
          type="select"
          name="assetId"
          label="Asset"
          value={formData.assetId.toString()}
          onChange={(name, value) => handleFieldChange(name, parseInt(value) || 0)}
          options={assets}
          required
          error={errors.assetId}
          disabled={mode === 'view' || loadingAssets}
          helperText={loadingAssets ? 'Loading assets...' : (formData.assetId && assets.length > 0 && !loadingAssets) ? 'Asset pre-selected from context' : undefined}
        />
      </Grid>
      <Grid xs={12} md={6}>
        <FormField
          type="select"
          name="frequency"
          label="Frequency"
          value={formData.frequency}
          onChange={handleFieldChange}
          options={frequencyOptions}
          required
          error={errors.frequency}
          disabled={mode === 'view'}
          helperText="Standardized frequencies enable automatic schedule generation"
        />
      </Grid>
      <Grid xs={12} md={6}>
        <FormField
          type="date"
          name="nextDue"
          label="Next Due Date"
          value={formData.nextDue}
          onChange={handleFieldChange}
          required
          error={errors.nextDue}
          disabled={mode === 'view'}
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
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid xs={12} md={6}>
        <FormField
          type="number"
          name="estimatedHours"
          label="Estimated Hours"
          value={formData.estimatedHours}
          onChange={handleFieldChange}
          disabled={mode === 'view'}
          helperText="Estimated time to complete this maintenance"
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
        mode === 'create' ? 'Schedule Maintenance' :
        mode === 'edit' ? 'Edit Maintenance Schedule' :
        `Maintenance Schedule - ${formData.title}`
      }
      submitText={mode === 'view' ? undefined : mode === 'edit' ? 'Update Schedule' : 'Create Schedule'}
      loading={loading}
      maxWidth="lg"
      hideActions={mode === 'view'}
      submitDisabled={mode === 'view'}
    >
      {Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Please fix the errors below before saving.
        </Alert>
      )}

      {mode === 'view' ? renderViewMode() : renderFormMode()}
    </FormDialog>
  );
}