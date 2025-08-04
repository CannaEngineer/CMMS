import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Alert,
  Card,
  CardContent,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import {
  LocationOn as LocationIcon,
  Business as BuildingIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  Factory as FactoryIcon,
} from '@mui/icons-material';
import FormDialog from './FormDialog';
import FormField from './FormField';

// Aligned with Location model from database schema
interface LocationFormData {
  id?: number;
  legacyId?: number;
  name: string;
  description?: string;
  address?: string;
  organizationId: number;
  parentId?: number;
}

interface LocationFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LocationFormData) => void;
  initialData?: Partial<LocationFormData>;
  mode: 'create' | 'edit' | 'view';
  loading?: boolean;
}

const locationTypeOptions = [
  { value: 'BUILDING', label: 'Building' },
  { value: 'FLOOR', label: 'Floor' },
  { value: 'ROOM', label: 'Room' },
  { value: 'AREA', label: 'Area' },
  { value: 'ZONE', label: 'Zone' },
];

// Mock location hierarchy for parent selection
const mockLocationHierarchy = [
  {
    id: '1',
    name: 'Main Campus',
    type: 'AREA',
    children: [
      {
        id: '2',
        name: 'Building A',
        type: 'BUILDING',
        children: [
          { id: '3', name: 'Ground Floor', type: 'FLOOR', children: [] },
          { id: '4', name: '1st Floor', type: 'FLOOR', children: [] },
          { id: '5', name: 'Basement', type: 'FLOOR', children: [] },
        ],
      },
      {
        id: '6',
        name: 'Building B',
        type: 'BUILDING',
        children: [
          { id: '7', name: 'Ground Floor', type: 'FLOOR', children: [] },
          { id: '8', name: '1st Floor', type: 'FLOOR', children: [] },
          { id: '9', name: 'Roof', type: 'FLOOR', children: [] },
        ],
      },
    ],
  },
  {
    id: '10',
    name: 'Production Facility',
    type: 'AREA',
    children: [
      {
        id: '11',
        name: 'Production Floor',
        type: 'BUILDING',
        children: [
          { id: '12', name: 'Line 1', type: 'ZONE', children: [] },
          { id: '13', name: 'Line 2', type: 'ZONE', children: [] },
          { id: '14', name: 'Quality Control', type: 'ROOM', children: [] },
        ],
      },
      {
        id: '15',
        name: 'Warehouse',
        type: 'BUILDING',
        children: [
          { id: '16', name: 'Storage Area A', type: 'ZONE', children: [] },
          { id: '17', name: 'Storage Area B', type: 'ZONE', children: [] },
        ],
      },
    ],
  },
];

const getLocationIcon = (type: string) => {
  switch (type) {
    case 'BUILDING':
      return <ApartmentIcon />;
    case 'FLOOR':
      return <HomeIcon />;
    case 'AREA':
    case 'ZONE':
      return <FactoryIcon />;
    default:
      return <LocationIcon />;
  }
};

const flattenLocations = (locations: any[], prefix = ''): any[] => {
  const result: any[] = [];
  locations.forEach((location) => {
    const fullName = prefix ? `${prefix} > ${location.name}` : location.name;
    result.push({
      value: location.id,
      label: fullName,
    });
    if (location.children && location.children.length > 0) {
      result.push(...flattenLocations(location.children, fullName));
    }
  });
  return result;
};

export default function LocationForm({
  open,
  onClose,
  onSubmit,
  initialData = {},
  mode,
  loading = false,
}: LocationFormProps) {
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    description: '',
    address: '',
    organizationId: 1,
    parentId: undefined,
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedNodes, setExpandedNodes] = useState<string[]>(['1', '10']);

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

    if (!formData.name.trim()) newErrors.name = 'Location name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const renderTreeItem = (node: any) => (
    <TreeItem
      key={node.id}
      nodeId={node.id}
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
          {getLocationIcon(node.type)}
          <Typography variant="body2">{node.name}</Typography>
          <Chip label={node.type} size="small" variant="outlined" />
        </Box>
      }
    >
      {node.children && node.children.map((child: any) => renderTreeItem(child))}
    </TreeItem>
  );

  const renderViewMode = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <LocationIcon />
              <Typography variant="h6">{formData.name}</Typography>
            </Box>
            
            {formData.description && (
              <Typography variant="body1" sx={{ mb: 2 }}>
                {formData.description}
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              {formData.address && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                  <Typography variant="body1">{formData.address}</Typography>
                </Grid>
              )}
            </Grid>

          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Statistics</Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Assets" 
                  secondary={`${formData.assetCount || 0} assets in this location`}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Active Work Orders" 
                  secondary="3 active work orders"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Last Inspection" 
                  secondary="2024-07-15"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Location Hierarchy</Typography>
            <SimpleTreeView
              expandedItems={expandedNodes}
              onExpandedItemsChange={(event, itemIds) => setExpandedNodes(itemIds)}
              selectedItems={formData.id || ''}
            >
              {mockLocationHierarchy.map(renderTreeItem)}
            </SimpleTreeView>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderFormMode = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormField
              type="text"
              name="name"
              label="Location Name"
              value={formData.name}
              onChange={handleFieldChange}
              required
              error={errors.name}
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
          <Grid item xs={12}>
            <FormField
              type="select"
              name="parentId"
              label="Parent Location"
              value={formData.parentId}
              onChange={handleFieldChange}
              options={[
                { value: '', label: 'No Parent (Top Level)' },
                ...flattenLocations(mockLocationHierarchy),
              ]}
              disabled={mode === 'view'}
            />
          </Grid>
          <Grid item xs={12}>
            <FormField
              type="textarea"
              name="address"
              label="Address"
              value={formData.address}
              onChange={handleFieldChange}
              disabled={mode === 'view'}
              rows={2}
            />
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Location Hierarchy</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select a parent location to organize your locations hierarchically.
            </Typography>
            <SimpleTreeView
              expandedItems={expandedNodes}
              onExpandedItemsChange={(event, itemIds) => setExpandedNodes(itemIds)}
              selectedItems={formData.parentId}
              onSelectedItemsChange={(event, itemId) => handleFieldChange('parentId', itemId)}
            >
              {mockLocationHierarchy.map(renderTreeItem)}
            </SimpleTreeView>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={
        mode === 'create' ? 'Add New Location' :
        mode === 'edit' ? 'Edit Location' :
        `Location Details - ${formData.name}`
      }
      submitText={mode === 'view' ? undefined : mode === 'edit' ? 'Update Location' : 'Create Location'}
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