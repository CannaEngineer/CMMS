import React, { useState, useEffect } from 'react';
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

// Aligned with Part model from database schema
interface PartFormData {
  id?: number;
  legacyId?: number;
  name: string;
  description?: string;
  sku?: string;
  stockLevel: number;
  reorderPoint: number;
  organizationId: number;
  supplierId?: number;
}

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
  const [formData, setFormData] = useState<PartFormData>({
    name: '',
    description: '',
    sku: '',
    stockLevel: 0,
    reorderPoint: 5,
    organizationId: 1,
    supplierId: undefined,
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Part name is required';
    if (formData.stockLevel < 0) newErrors.stockLevel = 'Stock level cannot be negative';
    if (formData.reorderPoint < 0) newErrors.reorderPoint = 'Reorder point cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const getStockStatus = () => {
    if (formData.stockLevel === 0) return { status: 'OUT_OF_STOCK', color: 'error' };
    if (formData.stockLevel <= formData.reorderPoint) return { status: 'LOW_STOCK', color: 'warning' };
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
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Avatar
              src={typeof formData.imageUrl === 'string' ? formData.imageUrl : undefined}
              sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
            >
              <PartIcon sx={{ fontSize: 60 }} />
            </Avatar>
            
            <Typography variant="h6" gutterBottom>
              {formData.name}
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
              <Chip
                icon={getStockIcon()}
                label={getStockStatus().status.replace('_', ' ')}
                color={getStockStatus().color as any}
                size="small"
              />
              <Chip
                label={formData.category}
                color="primary"
                size="small"
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              SKU: {formData.sku}
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Stock Level
              </Typography>
              <Typography variant="h4" fontWeight={700} color={getStockStatus().color}>
                {formData.stockLevel}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formData.unitOfMeasure} (Reorder at {formData.reorderPoint})
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(formData.stockLevel / formData.maxStock) * 100}
                color={getStockStatus().color as any}
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Part Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {formData.description}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Manufacturer</Typography>
                <Typography variant="body1">{formData.manufacturer}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Unit Cost</Typography>
                <Typography variant="body1">
                  ${formData.unitCost.toFixed(2)} per {formData.unitOfMeasure}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Lead Time</Typography>
                <Typography variant="body1">{formData.leadTime} days</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                <Typography variant="body1">{formData.location}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {formData.supplierIds && formData.supplierIds.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Suppliers</Typography>
              <List dense>
                {formData.supplierIds.map((supplierId) => {
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

        {formData.compatibleAssets && formData.compatibleAssets.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Compatible Assets</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.compatibleAssets.map((assetId) => {
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

        {(formData.safetyNotes || formData.storageRequirements) && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Safety & Storage</Typography>
              {formData.safetyNotes && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Safety Notes
                  </Typography>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {formData.safetyNotes}
                  </Alert>
                </>
              )}
              {formData.storageRequirements && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Storage Requirements
                  </Typography>
                  <Typography variant="body2">{formData.storageRequirements}</Typography>
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
        <FormField
          type="text"
          name="name"
          label="Part Name"
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
          name="sku"
          label="SKU / Part Number"
          value={formData.sku}
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
          type="number"
          name="stockLevel"
          label="Current Stock"
          value={formData.stockLevel}
          onChange={handleFieldChange}
          error={errors.stockLevel}
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormField
          type="number"
          name="reorderPoint"
          label="Reorder Point"
          value={formData.reorderPoint}
          onChange={handleFieldChange}
          error={errors.reorderPoint}
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid item xs={12}>
        <FormField
          type="select"
          name="supplierId"
          label="Supplier"
          value={formData.supplierId}
          onChange={handleFieldChange}
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
      onSubmit={handleSubmit}
      title={
        mode === 'create' ? 'Add New Part' :
        mode === 'edit' ? 'Edit Part' :
        `Part Details - ${formData.name}`
      }
      submitText={mode === 'view' ? undefined : mode === 'edit' ? 'Update Part' : 'Create Part'}
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