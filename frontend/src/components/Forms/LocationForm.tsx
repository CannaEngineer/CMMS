import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { locationsService } from '../../services/api';
import { geocodingService } from '../../services/geocoding.service';
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
  Chip,
  Button,
  CircularProgress,
} from '@mui/material';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import {
  LocationOn as LocationIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  Factory as FactoryIcon,
  MyLocation as MyLocationIcon,
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
  latitude?: number;
  longitude?: number;
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


// Location hierarchy is now built from real data fetched via React Query

const getLocationIcon = (type: string) => {
  switch (type?.toUpperCase()) {
    case 'BUILDING':
      return <ApartmentIcon />;
    case 'FLOOR':
      return <HomeIcon />;
    case 'AREA':
    case 'ZONE':
      return <FactoryIcon />;
    case 'ROOM':
      return <LocationIcon />;
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
    latitude: undefined,
    longitude: undefined,
    organizationId: 1,
    parentId: undefined,
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Fetch real locations data
  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: locationsService.getAll,
    enabled: open, // Only fetch when dialog is open
  });

  // Transform flat locations array into hierarchical structure
  const buildLocationHierarchy = (locations: any[] = []): any[] => {
    const locationMap = new Map();
    const roots: any[] = [];

    // First pass: create map of all locations
    locations.forEach(location => {
      locationMap.set(location.id, {
        ...location,
        children: []
      });
    });

    // Second pass: build hierarchy
    locations.forEach(location => {
      const locationNode = locationMap.get(location.id);
      if (location.parentId && locationMap.has(location.parentId)) {
        const parent = locationMap.get(location.parentId);
        parent.children.push(locationNode);
      } else {
        roots.push(locationNode);
      }
    });

    return roots;
  };

  const locationHierarchy = buildLocationHierarchy(locations || []);
  
  // Set initial expanded nodes based on real data
  useEffect(() => {
    if (locationHierarchy.length > 0 && expandedNodes.length === 0) {
      const topLevelIds = locationHierarchy.map(loc => String(loc.id));
      setExpandedNodes(topLevelIds);
    }
  }, [locationHierarchy]);

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

  const handleGeocode = async () => {
    if (!formData.address) {
      setErrors({ ...errors, address: 'Please enter an address first' });
      return;
    }

    setIsGeocoding(true);
    try {
      const result = await geocodingService.geocodeAddress(formData.address);
      if (result) {
        setFormData({
          ...formData,
          latitude: result.lat,
          longitude: result.lng,
        });
        // Clear any address error
        if (errors.address) {
          setErrors({ ...errors, address: '' });
        }
      } else {
        setErrors({ ...errors, address: 'Could not find coordinates for this address' });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setErrors({ ...errors, address: 'Error getting coordinates' });
    } finally {
      setIsGeocoding(false);
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
      itemId={String(node.id)}
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
          {getLocationIcon(node.type || 'LOCATION')}
          <Typography variant="body2">{node.name}</Typography>
          {node.type && (
            <Chip label={node.type} size="small" variant="outlined" />
          )}
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
              {(formData.latitude && formData.longitude) && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">GPS Coordinates</Typography>
                  <Typography variant="body1">
                    {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </Typography>
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
            {locationHierarchy.length > 0 ? (
              <SimpleTreeView
                expandedItems={expandedNodes}
                onExpandedItemsChange={(event, itemIds) => setExpandedNodes(itemIds)}
                selectedItems={formData.id ? String(formData.id) : ''}
              >
                {locationHierarchy.map(renderTreeItem)}
              </SimpleTreeView>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No locations found
              </Typography>
            )}
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
                ...flattenLocations(locationHierarchy),
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
              error={errors.address}
            />
          </Grid>
          {formData.address && mode !== 'view' && (
            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={isGeocoding ? <CircularProgress size={20} /> : <MyLocationIcon />}
                onClick={handleGeocode}
                disabled={isGeocoding || !formData.address}
                fullWidth
              >
                {isGeocoding ? 'Getting Coordinates...' : 'Get GPS Coordinates from Address'}
              </Button>
            </Grid>
          )}
          <Grid item xs={12} md={6}>
            <FormField
              type="number"
              name="latitude"
              label="Latitude"
              value={formData.latitude}
              onChange={handleFieldChange}
              disabled={mode === 'view'}
              inputProps={{ step: "any", min: -90, max: 90 }}
              helperText="GPS latitude coordinate (-90 to 90)"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              type="number"
              name="longitude"
              label="Longitude"
              value={formData.longitude}
              onChange={handleFieldChange}
              disabled={mode === 'view'}
              inputProps={{ step: "any", min: -180, max: 180 }}
              helperText="GPS longitude coordinate (-180 to 180)"
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
            {locationHierarchy.length > 0 ? (
              <SimpleTreeView
                expandedItems={expandedNodes}
                onExpandedItemsChange={(event, itemIds) => setExpandedNodes(itemIds)}
                selectedItems={formData.parentId ? String(formData.parentId) : ''}
                onSelectedItemsChange={(event, itemId) => handleFieldChange('parentId', itemId)}
              >
                {locationHierarchy.map(renderTreeItem)}
              </SimpleTreeView>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No locations available for selection
              </Typography>
            )}
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
      loading={loading || locationsLoading}
      maxWidth="lg"
      hideActions={mode === 'view'}
      submitDisabled={mode === 'view'}
    >
      {Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Please fix the errors below before saving.
        </Alert>
      )}

      {locationsLoading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <Typography variant="body2" color="text.secondary">
            Loading locations...
          </Typography>
        </Box>
      ) : (
        mode === 'view' ? renderViewMode() : renderFormMode()
      )}
    </FormDialog>
  );
}