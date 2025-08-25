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
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Inventory as PartIcon,
  Business as SupplierIcon,
  AttachMoney as PriceIcon,
  Numbers as SKUIcon,
  Warning as LowStockIcon,
  CheckCircle as InStockIcon,
} from '@mui/icons-material';
import FormDialog from './FormDialog';
import FormField from './FormField';
import HookFormField from './HookFormField';
import { partSchema, PartFormData } from '../../utils/validationSchemas';
import FormErrorDisplay from '../Common/FormErrorDisplay';

interface PartFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PartFormData) => void;
  initialData?: Partial<PartFormData>;
  mode: 'create' | 'edit' | 'view';
  loading?: boolean;
}

const categoryOptions = [
  { value: 'ELECTRICAL', label: 'Electrical Components' },
  { value: 'MECHANICAL', label: 'Mechanical Parts' },
  { value: 'FLUIDS', label: 'Fluids & Lubricants' },
  { value: 'FILTERS', label: 'Filters' },
  { value: 'SEALS', label: 'Seals & Gaskets' },
  { value: 'BEARINGS', label: 'Bearings' },
  { value: 'BELTS', label: 'Belts & Chains' },
  { value: 'FASTENERS', label: 'Fasteners' },
  { value: 'TOOLS', label: 'Tools & Equipment' },
  { value: 'SAFETY', label: 'Safety Equipment' },
];

const unitOptions = [
  { value: 'EACH', label: 'Each' },
  { value: 'METERS', label: 'Meters' },
  { value: 'FEET', label: 'Feet' },
  { value: 'LITERS', label: 'Liters' },
  { value: 'GALLONS', label: 'Gallons' },
  { value: 'KILOGRAMS', label: 'Kilograms' },
  { value: 'POUNDS', label: 'Pounds' },
  { value: 'BOXES', label: 'Boxes' },
  { value: 'ROLLS', label: 'Rolls' },
];

const supplierOptions = [
  { value: '1', label: 'Industrial Supply Co.' },
  { value: '2', label: 'MRO Parts Direct' },
  { value: '3', label: 'Bearing & Power Solutions' },
  { value: '4', label: 'Electrical Components Inc.' },
  { value: '5', label: 'Maintenance Supply Plus' },
];

const assetOptions = [
  { value: '1', label: 'Water Pump #3' },
  { value: '2', label: 'HVAC Unit #5' },
  { value: '3', label: 'Conveyor System C' },
  { value: '4', label: 'Generator #2' },
  { value: '5', label: 'Air Compressor #4' },
];

export default function PartForm({
  open,
  onClose,
  onSubmit,
  initialData = {},
  mode,
  loading = false,
}: PartFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
    watch,
  } = useForm<PartFormData>({
    resolver: zodResolver(partSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      sku: '',
      stockLevel: 0,
      reorderPoint: 5,
      unitCost: undefined,
      unitOfMeasure: 'EACH',
      category: '',
      manufacturer: '',
      location: '',
      leadTime: undefined,
      organizationId: 1,
      supplierId: undefined,
      ...initialData,
    },
  });

  const watchedData = watch();

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      reset({
        name: '',
        description: '',
        sku: '',
        stockLevel: 0,
        reorderPoint: 5,
        unitCost: undefined,
        unitOfMeasure: 'EACH',
        category: '',
        manufacturer: '',
        location: '',
        leadTime: undefined,
        organizationId: 1,
        supplierId: undefined,
        ...initialData,
      });
    }
  }, [initialData, reset]);

  const onFormSubmit = (data: PartFormData) => {
    console.log('Form submitted with data:', data);
    console.log('Form errors:', errors);
    console.log('Is form valid:', isValid);
    
    // Clean and transform the data before submission
    const cleanedData = {
      ...data,
      // Ensure numeric fields are properly typed
      stockLevel: Number(data.stockLevel) || 0,
      reorderPoint: Number(data.reorderPoint) || 0,
      unitCost: data.unitCost ? Number(data.unitCost) : undefined,
      leadTime: data.leadTime ? Number(data.leadTime) : undefined,
      // Clean up empty strings
      sku: data.sku?.trim() || undefined,
      description: data.description?.trim() || undefined,
      category: data.category?.trim() || undefined,
      manufacturer: data.manufacturer?.trim() || undefined,
      location: data.location?.trim() || undefined,
      unitOfMeasure: data.unitOfMeasure?.trim() || 'EACH',
      // Handle supplier ID
      supplierId: data.supplierId ? Number(data.supplierId) : undefined,
      organizationId: data.organizationId ? Number(data.organizationId) : 1,
      // Remove any undefined or null fields to prevent validation issues
    };
    
    // Remove undefined fields to prevent backend issues
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key as keyof typeof cleanedData] === undefined || cleanedData[key as keyof typeof cleanedData] === null) {
        delete cleanedData[key as keyof typeof cleanedData];
      }
    });
    
    console.log('Cleaned data for submission:', cleanedData);
    onSubmit(cleanedData);
  };

  const getStockStatus = () => {
    if (watchedData.stockLevel === 0) return { status: 'OUT_OF_STOCK', color: 'error' };
    if (watchedData.stockLevel <= watchedData.reorderPoint) return { status: 'LOW_STOCK', color: 'warning' };
    return { status: 'IN_STOCK', color: 'success' };
  };

  const getStockIcon = () => {
    const status = getStockStatus();
    if (status.status === 'OUT_OF_STOCK' || status.status === 'LOW_STOCK') {
      return <LowStockIcon color={status.color as any} />;
    }
    return <InStockIcon color={status.color as any} />;
  };

  const renderViewMode = () => (
    <Grid container spacing={3}>
      <Grid xs={12} md={4}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar
              src={typeof watchedData.imageUrl === 'string' ? watchedData.imageUrl : undefined}
              sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
            >
              <PartIcon sx={{ fontSize: 60 }} />
            </Avatar>
            
            <Typography variant="h6" gutterBottom>
              {watchedData.name}
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
              <Chip
                icon={getStockIcon()}
                label={getStockStatus().status.replace('_', ' ')}
                color={getStockStatus().color as any}
                size="small"
              />
              <Chip
                label={watchedData.category}
                color="primary"
                size="small"
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              SKU: {watchedData.sku}
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Stock Level
              </Typography>
              <Typography variant="h4" fontWeight={700} color={getStockStatus().color}>
                {watchedData.stockLevel}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {watchedData.unitOfMeasure} (Reorder at {watchedData.reorderPoint})
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(watchedData.stockLevel / watchedData.maxStock) * 100}
                color={getStockStatus().color as any}
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid xs={12} md={8}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Part Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {watchedData.description}
                </Typography>
              </Grid>
              <Grid xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Manufacturer</Typography>
                <Typography variant="body1">{watchedData.manufacturer}</Typography>
              </Grid>
              <Grid xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Unit Cost</Typography>
                <Typography variant="body1">
                  ${watchedData.unitCost?.toFixed(2)} per {watchedData.unitOfMeasure}
                </Typography>
              </Grid>
              <Grid xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Lead Time</Typography>
                <Typography variant="body1">{watchedData.leadTime} days</Typography>
              </Grid>
              <Grid xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                <Typography variant="body1">{watchedData.location}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {watchedData.supplierIds && watchedData.supplierIds.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Suppliers</Typography>
              <List dense>
                {watchedData.supplierIds.map((supplierId) => {
                  const supplier = supplierOptions.find(s => s.value === supplierId);
                  return (
                    <ListItem key={supplierId}>
                      <ListItemIcon><SupplierIcon /></ListItemIcon>
                      <ListItemText primary={supplier?.label} />
                    </ListItem>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        )}

        {watchedData.compatibleAssets && watchedData.compatibleAssets.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Compatible Assets</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {watchedData.compatibleAssets.map((assetId) => {
                  const asset = assetOptions.find(a => a.value === assetId);
                  return (
                    <Chip
                      key={assetId}
                      label={asset?.label}
                      size="small"
                      variant="outlined"
                    />
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        )}

        {(watchedData.safetyNotes || watchedData.storageRequirements) && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Safety & Storage</Typography>
              {watchedData.safetyNotes && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Safety Notes
                  </Typography>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {watchedData.safetyNotes}
                  </Alert>
                </>
              )}
              {watchedData.storageRequirements && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Storage Requirements
                  </Typography>
                  <Typography variant="body2">{watchedData.storageRequirements}</Typography>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  );

  const renderFormMode = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <HookFormField
          name="name"
          control={control}
          label="Part Name"
          type="text"
          required
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <HookFormField
          name="sku"
          control={control}
          label="SKU / Part Number"
          type="text"
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid item xs={12}>
        <HookFormField
          name="description"
          control={control}
          label="Description"
          type="textarea"
          disabled={mode === 'view'}
          rows={3}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <HookFormField
          name="stockLevel"
          control={control}
          label="Current Stock"
          type="number"
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <HookFormField
          name="reorderPoint"
          control={control}
          label="Reorder Point"
          type="number"
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <HookFormField
          name="unitCost"
          control={control}
          label="Unit Cost ($)"
          type="number"
          disabled={mode === 'view'}
          InputProps={{ startAdornment: '$' }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <HookFormField
          name="unitOfMeasure"
          control={control}
          label="Unit of Measure"
          type="select"
          options={unitOptions}
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <HookFormField
          name="category"
          control={control}
          label="Category"
          type="select"
          options={[
            { value: '', label: 'No Category' },
            ...categoryOptions,
          ]}
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <HookFormField
          name="manufacturer"
          control={control}
          label="Manufacturer"
          type="text"
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <HookFormField
          name="location"
          control={control}
          label="Storage Location"
          type="text"
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <HookFormField
          name="leadTime"
          control={control}
          label="Lead Time (days)"
          type="number"
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <HookFormField
          name="supplierId"
          control={control}
          label="Supplier"
          type="select"
          options={[
            { value: '', label: 'No Supplier' },
            ...supplierOptions,
          ]}
          disabled={mode === 'view'}
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
        mode === 'create' ? 'Add New Part' :
        mode === 'edit' ? 'Edit Part' :
        `Part Details - ${watchedData.name || 'Part'}`
      }
      submitText={mode === 'view' ? undefined : mode === 'edit' ? 'Update Part' : 'Create Part'}
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