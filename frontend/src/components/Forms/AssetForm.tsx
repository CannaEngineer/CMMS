import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Grid2,
  Alert,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  Avatar,
} from '@mui/material';
import {
  Build as AssetIcon,
  LocationOn as LocationIcon,
  Business as ManufacturerIcon,
  Inventory as SerialIcon,
  CalendarToday as DateIcon,
  Assessment as HealthIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import FormDialog from './FormDialog';
import FormField from './FormField';
import HookFormField from './HookFormField';
import { statusColors } from '../../theme/theme';
import { locationsService } from '../../services/api';
import { assetSchema, AssetFormData } from '../../utils/validationSchemas';
import FormErrorDisplay from '../Common/FormErrorDisplay';

interface AssetFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AssetFormData) => void;
  initialData?: Partial<AssetFormData>;
  mode: 'create' | 'edit' | 'view';
  loading?: boolean;
}

const statusOptions = [
  { value: 'ONLINE', label: 'Online' },
  { value: 'OFFLINE', label: 'Offline' },
];

const criticalityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'IMPORTANT', label: 'Important' },
];

// Remove hardcoded location options - will be loaded from API

const categoryOptions = [
  { value: 'PUMP', label: 'Pumps & Compressors' },
  { value: 'HVAC', label: 'HVAC Systems' },
  { value: 'ELECTRICAL', label: 'Electrical Equipment' },
  { value: 'MECHANICAL', label: 'Mechanical Equipment' },
  { value: 'CONVEYOR', label: 'Conveyor Systems' },
  { value: 'SAFETY', label: 'Safety Equipment' },
  { value: 'MEASURING', label: 'Measuring Instruments' },
];

const manufacturerOptions = [
  { value: 'GE', label: 'General Electric' },
  { value: 'SIEMENS', label: 'Siemens' },
  { value: 'ABB', label: 'ABB' },
  { value: 'SCHNEIDER', label: 'Schneider Electric' },
  { value: 'HONEYWELL', label: 'Honeywell' },
  { value: 'JOHNSON', label: 'Johnson Controls' },
  { value: 'OTHER', label: 'Other' },
];

export default function AssetForm({
  open,
  onClose,
  onSubmit,
  initialData = {},
  mode,
  loading = false,
}: AssetFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
    setValue,
    watch,
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      serialNumber: '',
      modelNumber: '',
      manufacturer: '',
      year: new Date().getFullYear(),
      status: 'ONLINE',
      criticality: 'MEDIUM',
      barcode: '',
      imageUrl: '',
      attachments: null,
      locationId: 1, // Default location - will be overridden by user selection
      organizationId: 1,
      parentId: undefined,
      ...initialData,
    },
  });

  const watchedData = watch();

  // Fetch locations for the dropdown
  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: locationsService.getAll,
    enabled: open, // Only fetch when dialog is open
  });

  // Transform API data to dropdown options
  const locationOptions = locations?.map(location => ({
    value: location.id?.toString() || '',
    label: location.name || 'Unknown Location',
  })) || [];

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      reset({ 
        name: '',
        description: '',
        serialNumber: '',
        modelNumber: '',
        manufacturer: '',
        year: new Date().getFullYear(),
        status: 'ONLINE',
        criticality: 'MEDIUM',
        barcode: '',
        imageUrl: '',
        attachments: null,
        locationId: 1,
        organizationId: 1,
        parentId: undefined,
        ...initialData 
      });
    }
  }, [initialData, reset]);

  const onFormSubmit = (data: AssetFormData) => {
    onSubmit(data);
  };

  const getHealthScore = () => {
    // Mock health score calculation
    const age = new Date().getFullYear() - (watchedData.year || new Date().getFullYear());
    const baseScore = 100;
    const ageDeduction = age * 2;
    const statusDeduction = watchedData.status === 'OFFLINE' ? 30 : 0;
    const criticalityDeduction = 
      watchedData.criticality === 'IMPORTANT' ? 20 :
      watchedData.criticality === 'HIGH' ? 10 : 0;
    
    return Math.max(0, baseScore - ageDeduction - statusDeduction - criticalityDeduction);
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const renderViewMode = () => (
    <Grid container spacing={3}>
      <Grid xs={12} md={4}>
        <Card>
          <CardMedia
            component="div"
            sx={{
              height: 200,
              backgroundColor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: watchedData.imageUrl && typeof watchedData.imageUrl === 'string' 
                ? `url(${watchedData.imageUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {!watchedData.imageUrl && <AssetIcon sx={{ fontSize: 60, color: 'grey.400' }} />}
          </CardMedia>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">{watchedData.name}</Typography>
              <Chip
                icon={formData.status === 'ONLINE' ? undefined : undefined}
                label={watchedData.status}
                color={watchedData.status === 'ONLINE' ? 'success' : 'error'}
                size="small"
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {watchedData.description}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Health Score</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={getHealthScore()}
                  color={getHealthColor(getHealthScore())}
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" fontWeight={600}>
                  {getHealthScore()}%
                </Typography>
              </Box>
            </Box>
            <Chip
              label={watchedData.criticality}
              size="small"
              sx={{
                backgroundColor: statusColors[watchedData.criticality] + '20',
                color: statusColors[watchedData.criticality],
                fontWeight: 600,
              }}
            />
          </CardContent>
        </Card>
      </Grid2>
      
      <Grid>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Asset Information</Typography>
            <Grid2 container spacing={2}>
              <Grid>
                <Typography variant="subtitle2" color="text.secondary">Serial Number</Typography>
                <Typography variant="body1">{watchedData.serialNumber}</Typography>
              </Grid2>
              <Grid>
                <Typography variant="subtitle2" color="text.secondary">Model Number</Typography>
                <Typography variant="body1">{watchedData.modelNumber}</Typography>
              </Grid2>
              <Grid>
                <Typography variant="subtitle2" color="text.secondary">Manufacturer</Typography>
                <Typography variant="body1">{watchedData.manufacturer}</Typography>
              </Grid2>
              <Grid>
                <Typography variant="subtitle2" color="text.secondary">Year</Typography>
                <Typography variant="body1">{watchedData.year}</Typography>
              </Grid2>
              <Grid>
                <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                <Typography variant="body1">
                  {categoryOptions.find(c => c.value === watchedData.category)?.label}
                </Typography>
              </Grid2>
              <Grid>
                <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                <Typography variant="body1">
                  {locationOptions.find(l => l.value === watchedData.locationId?.toString())?.label}
                </Typography>
              </Grid2>
            </Grid2>
          </CardContent>
        </Card>

        {watchedData.purchaseDate && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Financial Information</Typography>
              <Grid2 container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Purchase Date</Typography>
                  <Typography variant="body1">{watchedData.purchaseDate}</Typography>
                </Grid2>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Purchase Cost</Typography>
                  <Typography variant="body1">
                    {watchedData.purchaseCost ? `$${watchedData.purchaseCost.toLocaleString()}` : 'Not specified'}
                  </Typography>
                </Grid2>
                {watchedData.warrantyExpiry && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Warranty Expiry</Typography>
                    <Typography variant="body1">{watchedData.warrantyExpiry}</Typography>
                  </Grid2>
                )}
              </Grid2>
            </CardContent>
          </Card>
        )}
      </Grid2>
    </Grid2>
  );

  const renderFormMode = () => (
    <Grid container spacing={3}>
      <Grid2 xs={12} md={6}>
        <HookFormField
          name="name"
          control={control}
          label="Asset Name"
          type="text"
          required
          disabled={mode === 'view'}
        />
      </Grid2>
      <Grid2 xs={12} md={6}>
        <HookFormField
          name="serialNumber"
          control={control}
          label="Serial Number"
          type="text"
          disabled={mode === 'view'}
        />
      </Grid2>
      <Grid2 xs={12}>
        <HookFormField
          name="description"
          control={control}
          label="Description"
          type="textarea"
          disabled={mode === 'view'}
          rows={3}
        />
      </Grid2>
      <Grid2 xs={12} md={6}>
        <HookFormField
          name="modelNumber"
          control={control}
          label="Model Number"
          type="text"
          disabled={mode === 'view'}
        />
      </Grid2>
      <Grid2 xs={12} md={6}>
        <HookFormField
          name="manufacturer"
          control={control}
          label="Manufacturer"
          type="text"
          disabled={mode === 'view'}
        />
      </Grid2>
      <Grid2 xs={12} md={6}>
        <HookFormField
          name="year"
          control={control}
          label="Year"
          type="number"
          disabled={mode === 'view'}
        />
      </Grid2>
      <Grid2 xs={12} md={6}>
        <HookFormField
          name="locationId"
          control={control}
          label="Location"
          type="select"
          options={locationOptions}
          required
          disabled={mode === 'view' || locationsLoading}
        />
      </Grid2>
      <Grid2 xs={12} md={6}>
        <HookFormField
          name="criticality"
          control={control}
          label="Criticality"
          type="select"
          options={criticalityOptions}
          disabled={mode === 'view'}
        />
      </Grid2>
      <Grid2 xs={12} md={6}>
        <HookFormField
          name="status"
          control={control}
          label="Status"
          type="select"
          options={statusOptions}
          disabled={mode === 'view'}
        />
      </Grid2>
      <Grid2 xs={12}>
        <HookFormField
          name="imageUrl"
          control={control}
          label="Asset Image URL"
          type="url"
          disabled={mode === 'view'}
        />
      </Grid2>
    </Grid2>
  );

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit(onFormSubmit)}
      title={
        mode === 'create' ? 'Add New Asset' :
        mode === 'edit' ? 'Edit Asset' :
        `Asset Details - ${watchedData.name || 'Asset'}`
      }
      submitText={mode === 'view' ? undefined : mode === 'edit' ? 'Update Asset' : 'Create Asset'}
      loading={loading || isSubmitting}
      maxWidth="lg"
      hideActions={mode === 'view'}
      submitDisabled={mode === 'view' || !isValid || isSubmitting}
    >
      <FormErrorDisplay errors={errors} />

      {mode === 'view' ? renderViewMode() : renderFormMode()}
    </FormDialog>
  );
}