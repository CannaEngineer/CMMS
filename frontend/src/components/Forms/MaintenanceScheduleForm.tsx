import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import HookFormField from './HookFormField';
import FormErrorDisplay from '../Common/FormErrorDisplay';
import { assetsService } from '../../services/api';
import { pmScheduleSchema, PMScheduleFormData } from '../../utils/validationSchemas';

interface MaintenanceScheduleFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PMScheduleFormData) => void;
  initialData?: Partial<PMScheduleFormData>;
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
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
    watch,
  } = useForm<PMScheduleFormData>({
    resolver: zodResolver(pmScheduleSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      frequency: 'monthly',
      nextDue: '',
      assetId: 0,
      priority: 'MEDIUM',
      estimatedHours: 1,
      assignedToId: undefined,
      organizationId: 1,
      ...initialData,
    },
  });

  const [assets, setAssets] = useState<{ value: string; label: string }[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const watchedData = watch();

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      reset({
        title: '',
        description: '',
        frequency: 'monthly',
        nextDue: '',
        assetId: 0,
        priority: 'MEDIUM',
        estimatedHours: 1,
        assignedToId: undefined,
        organizationId: 1,
        ...initialData,
      });
    }
  }, [initialData, reset]);

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

  const onFormSubmit = (data: PMScheduleFormData) => {
    console.log('PM Schedule form submitted with data:', data);
    console.log('Form errors:', errors);
    console.log('Is form valid:', isValid);
    
    // Clean and transform the data before submission
    const cleanedData = {
      ...data,
      // Ensure numeric fields are properly typed
      assetId: Number(data.assetId) || 0,
      estimatedHours: data.estimatedHours ? Number(data.estimatedHours) : undefined,
      assignedToId: data.assignedToId ? Number(data.assignedToId) : undefined,
      organizationId: data.organizationId ? Number(data.organizationId) : 1,
      // Clean up empty strings
      title: data.title?.trim(),
      description: data.description?.trim() || undefined,
      frequency: data.frequency?.trim(),
      nextDue: data.nextDue?.trim(),
    };
    
    // Remove undefined fields to prevent backend issues
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key as keyof typeof cleanedData] === undefined || cleanedData[key as keyof typeof cleanedData] === null) {
        delete cleanedData[key as keyof typeof cleanedData];
      }
    });
    
    console.log('Cleaned PM schedule data for submission:', cleanedData);
    onSubmit(cleanedData);
  };

  const renderViewMode = () => (
    <Grid container spacing={3}>
      <Grid xs={12}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <ScheduleIcon color="primary" />
              <Typography variant="h6">{watchedData.title}</Typography>
            </Box>
            
            <Typography variant="body1" sx={{ mb: 2 }}>
              {watchedData.description}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Asset</Typography>
                <Typography variant="body1">
                  {assets.find(a => a.value.toString() === watchedData.assetId?.toString())?.label || 'Loading...'}
                </Typography>
              </Grid>
              <Grid xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Frequency</Typography>
                <Typography variant="body1">
                  {frequencyOptions.find(opt => opt.value === watchedData.frequency)?.label || watchedData.frequency}
                </Typography>
              </Grid>
              <Grid xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Next Due</Typography>
                <Typography variant="body1">{watchedData.nextDue}</Typography>
              </Grid>
              <Grid xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                <Typography variant="body1">
                  {priorityOptions.find(opt => opt.value === watchedData.priority)?.label || watchedData.priority}
                </Typography>
              </Grid>
              <Grid xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Estimated Hours</Typography>
                <Typography variant="body1">{watchedData.estimatedHours || 'Not specified'}</Typography>
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
        <HookFormField
          name="title"
          control={control}
          label="Schedule Title"
          type="text"
          required
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid xs={12}>
        <HookFormField
          name="description"
          control={control}
          label="Description"
          type="textarea"
          disabled={mode === 'view'}
          rows={3}
        />
      </Grid>
      <Grid xs={12} md={6}>
        <HookFormField
          name="assetId"
          control={control}
          label="Asset"
          type="select"
          options={assets}
          required
          disabled={mode === 'view' || loadingAssets}
          helperText={loadingAssets ? 'Loading assets...' : 'Select the asset for this maintenance schedule'}
        />
      </Grid>
      <Grid xs={12} md={6}>
        <HookFormField
          name="frequency"
          control={control}
          label="Frequency"
          type="select"
          options={frequencyOptions}
          required
          disabled={mode === 'view'}
          helperText="How often should this maintenance be performed"
        />
      </Grid>
      <Grid xs={12} md={6}>
        <HookFormField
          name="nextDue"
          control={control}
          label="Next Due Date"
          type="date"
          required
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid xs={12} md={6}>
        <HookFormField
          name="priority"
          control={control}
          label="Priority"
          type="select"
          options={priorityOptions}
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid xs={12} md={6}>
        <HookFormField
          name="estimatedHours"
          control={control}
          label="Estimated Hours"
          type="number"
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
      onSubmit={handleSubmit(onFormSubmit)}
      title={
        mode === 'create' ? 'Schedule Maintenance' :
        mode === 'edit' ? 'Edit Maintenance Schedule' :
        `Maintenance Schedule - ${watchedData.title || 'Schedule'}`
      }
      submitText={mode === 'view' ? undefined : mode === 'edit' ? 'Update Schedule' : 'Create Schedule'}
      loading={loading || isSubmitting}
      maxWidth="lg"
      hideActions={mode === 'view'}
      submitDisabled={mode === 'view' || isSubmitting}
    >
      <FormErrorDisplay errors={errors} />

      {mode === 'view' ? renderViewMode() : renderFormMode()}
    </FormDialog>
  );
}