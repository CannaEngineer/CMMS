import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
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
import { statusColors } from '../../theme/theme';
import { locationsService } from '../../services/api';

// Aligned with Asset model from database schema
interface AssetFormData {
  id?: number;
  legacyId?: number;
  name: string;
  description?: string;
  serialNumber?: string;
  modelNumber?: string;
  manufacturer?: string;
  year?: number;
  status: 'ONLINE' | 'OFFLINE';
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'IMPORTANT';
  barcode?: string;
  imageUrl?: string;
  attachments?: any; // JSON field
  locationId: number;
  organizationId: number;
  parentId?: number;
}

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
  const [formData, setFormData] = useState<AssetFormData>({
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
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (initialData) {
      setFormData({ ...formData, ...initialData });
    }
  }, [initialData]);

  const handleFieldChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSpecificationChange = (key: string, value: string) => {
    setFormData({
      ...formData,
      specifications: {
        ...formData.specifications,
        [key]: value,
      },
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Asset name is required';
    if (!formData.locationId) newErrors.locationId = 'Location is required';
    if (formData.year && (formData.year < 1900 || formData.year > new Date().getFullYear() + 1)) {
      newErrors.year = 'Please enter a valid year';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const getHealthScore = () => {
    // Mock health score calculation
    const age = new Date().getFullYear() - formData.year;
    const baseScore = 100;
    const ageDeduction = age * 2;
    const statusDeduction = formData.status === 'OFFLINE' ? 30 : 0;
    const criticalityDeduction = 
      formData.criticality === 'CRITICAL' ? 20 :
      formData.criticality === 'HIGH' ? 10 : 0;
    
    return Math.max(0, baseScore - ageDeduction - statusDeduction - criticalityDeduction);
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const renderViewMode = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardMedia
            component="div"
            sx={{
              height: 200,
              backgroundColor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: formData.imageUrl && typeof formData.imageUrl === 'string' 
                ? `url(${formData.imageUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {!formData.imageUrl && <AssetIcon sx={{ fontSize: 60, color: 'grey.400' }} />}
          </CardMedia>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">{formData.name}</Typography>
              <Chip
                icon={formData.status === 'ONLINE' ? undefined : undefined}
                label={formData.status}
                color={formData.status === 'ONLINE' ? 'success' : 'error'}
                size="small"
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {formData.description}
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
              label={formData.criticality}
              size="small"
              sx={{
                backgroundColor: statusColors[formData.criticality] + '20',
                color: statusColors[formData.criticality],
                fontWeight: 600,
              }}
            />
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={8}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Asset Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Serial Number</Typography>
                <Typography variant="body1">{formData.serialNumber}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Model Number</Typography>
                <Typography variant="body1">{formData.modelNumber}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Manufacturer</Typography>
                <Typography variant="body1">{formData.manufacturer}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Year</Typography>
                <Typography variant="body1">{formData.year}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                <Typography variant="body1">
                  {categoryOptions.find(c => c.value === formData.category)?.label}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                <Typography variant="body1">
                  {locationOptions.find(l => l.value === formData.locationId?.toString())?.label}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {formData.purchaseDate && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Financial Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Purchase Date</Typography>
                  <Typography variant="body1">{formData.purchaseDate}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Purchase Cost</Typography>
                  <Typography variant="body1">
                    {formData.purchaseCost ? `$${formData.purchaseCost.toLocaleString()}` : 'Not specified'}
                  </Typography>
                </Grid>
                {formData.warrantyExpiry && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Warranty Expiry</Typography>
                    <Typography variant="body1">{formData.warrantyExpiry}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  );

  const renderFormMode = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <FormField
          type="text"
          name="name"
          label="Asset Name"
          value={formData.name}
          onChange={handleFieldChange}
          required
          error={errors.name}
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormField
          type="text"
          name="serialNumber"
          label="Serial Number"
          value={formData.serialNumber}
          onChange={handleFieldChange}
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid item xs={12}>
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
      <Grid item xs={12} md={6}>
        <FormField
          type="text"
          name="modelNumber"
          label="Model Number"
          value={formData.modelNumber}
          onChange={handleFieldChange}
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormField
          type="text"
          name="manufacturer"
          label="Manufacturer"
          value={formData.manufacturer}
          onChange={handleFieldChange}
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormField
          type="number"
          name="year"
          label="Year"
          value={formData.year}
          onChange={handleFieldChange}
          error={errors.year}
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormField
          type="select"
          name="locationId"
          label="Location"
          value={formData.locationId?.toString() || ''}
          onChange={(name, value) => handleFieldChange(name, value ? parseInt(value) : 1)}
          options={locationOptions}
          required
          error={errors.locationId}
          disabled={mode === 'view' || locationsLoading}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormField
          type="select"
          name="criticality"
          label="Criticality"
          value={formData.criticality}
          onChange={handleFieldChange}
          options={criticalityOptions}
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid item xs={12} md={6}>
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
      <Grid item xs={12} md={6}>
        <FormField
          type="text"
          name="barcode"
          label="Barcode/QR Code"
          value={formData.barcode}
          onChange={handleFieldChange}
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid item xs={12}>
        <FormField
          type="text"
          name="imageUrl"
          label="Asset Image URL"
          value={formData.imageUrl}
          onChange={handleFieldChange}
          disabled={mode === 'view'}
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
        mode === 'create' ? 'Add New Asset' :
        mode === 'edit' ? 'Edit Asset' :
        `Asset Details - ${formData.name}`
      }
      submitText={mode === 'view' ? undefined : mode === 'edit' ? 'Update Asset' : 'Create Asset'}
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