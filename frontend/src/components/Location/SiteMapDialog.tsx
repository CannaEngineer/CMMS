import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Grid,
} from '@mui/material';
import {
  Map as MapIcon,
  CenterFocusStrong as CenterIcon,
  Layers as LayersIcon,
  LocationOn as LocationIcon,
  Business as BuildingIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  Factory as FactoryIcon,
  Fullscreen as FullscreenIcon,
  Download as DownloadIcon,
  Satellite as SatelliteIcon,
  Terrain as TerrainIcon,
} from '@mui/icons-material';
import SimpleMap from './SimpleMap';

interface Location {
  id: number;
  name: string;
  type: 'BUILDING' | 'FLOOR' | 'ROOM' | 'AREA' | 'ZONE';
  description?: string;
  parentId?: number;
  assetCount: number;
  coordinates?: { lat: number; lng: number };
  children?: Location[];
}

interface SiteMapDialogProps {
  open: boolean;
  onClose: () => void;
  locations: Location[];
}

const LOCATION_COLORS = {
  AREA: '#1976d2',
  BUILDING: '#9c27b0',
  FLOOR: '#2196f3',
  ZONE: '#ff9800',
  ROOM: '#4caf50',
};

const getLocationIcon = (type: string) => {
  switch (type) {
    case 'BUILDING':
      return <ApartmentIcon />;
    case 'FLOOR':
      return <HomeIcon />;
    case 'AREA':
      return <FactoryIcon />;
    case 'ZONE':
      return <FactoryIcon />;
    case 'ROOM':
      return <LocationIcon />;
    default:
      return <LocationIcon />;
  }
};

export default function SiteMapDialog({
  open,
  onClose,
  locations,
}: SiteMapDialogProps) {
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const [showAssetCount, setShowAssetCount] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  

  console.log('🗺️ SiteMapDialog render:', { open, locationsCount: locations.length, locations });

  // Filter locations with coordinates (mappable locations)
  const mappableLocations = useMemo(() => {
    const filtered = locations.filter(loc => loc.coordinates);
    console.log('🗺️ Mappable locations:', { 
      totalLocations: locations.length, 
      mappableCount: filtered.length,
      mappableLocations: filtered 
    });
    return filtered;
  }, [locations]);


  // Filter locations by layer
  const filteredLocations = useMemo(() => {
    if (selectedLayer === 'all') return mappableLocations;
    return mappableLocations.filter(loc => loc.type === selectedLayer);
  }, [mappableLocations, selectedLayer]);


  const layerOptions = [
    { value: 'all', label: 'All Locations' },
    { value: 'AREA', label: 'Areas' },
    { value: 'BUILDING', label: 'Buildings' },
    { value: 'ZONE', label: 'Zones' },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MapIcon />
          <Typography variant="h6">Site Map</Typography>
          <Chip 
            label={`${filteredLocations.length} locations`} 
            color="primary" 
            size="small" 
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Map Controls */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
                  {/* Layer Selection */}
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Filter</InputLabel>
                    <Select
                      value={selectedLayer}
                      onChange={(e) => setSelectedLayer(e.target.value)}
                      label="Filter"
                    >
                      {layerOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Info */}
                  <Typography variant="body2" color="text.secondary">
                    📍 {filteredLocations.length} locations • 🗺️ Use layer control on map for different views
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Map View */}
          <Grid item xs={12} md={8}>
            {mappableLocations.length === 0 ? (
              <Alert severity="info" sx={{ height: 400, display: 'flex', alignItems: 'center' }}>
                <Typography>
                  No location coordinates available. Add GPS coordinates to locations to view them on the site map.
                </Typography>
              </Alert>
            ) : (
              <Card sx={{ height: '540px' }}>
                <CardContent sx={{ p: 1, height: '100%' }}>
                  <SimpleMap 
                    locations={filteredLocations} 
                    height="100%" 
                  />
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Location Details & Legend */}
          <Grid item xs={12} md={4}>
            {/* Selected Location Details */}
            {selectedLocation && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {selectedLocation.name}
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getLocationIcon(selectedLocation.type)}
                      <Chip 
                        label={selectedLocation.type} 
                        size="small" 
                        color="primary" 
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {selectedLocation.description}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Assets:</strong> {selectedLocation.assetCount}
                    </Typography>
                    {selectedLocation.coordinates && (
                      <Typography variant="body2">
                        <strong>Coordinates:</strong> {selectedLocation.coordinates.lat.toFixed(4)}, {selectedLocation.coordinates.lng.toFixed(4)}
                      </Typography>
                    )}
                  </Stack>
                  <Button
                    size="small"
                    onClick={() => setSelectedLocation(null)}
                    sx={{ mt: 2 }}
                  >
                    Clear Selection
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Legend */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Legend
                </Typography>
                <List dense>
                  {Object.entries(LOCATION_COLORS).map(([type, color]) => (
                    <ListItem key={type} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: color,
                            border: '2px solid #fff',
                            boxShadow: 1,
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={type}
                        secondary={`${mappableLocations.filter(loc => loc.type === type).length} locations`}
                      />
                    </ListItem>
                  ))}
                </List>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  • Circle size represents asset count
                  • Click locations for details
                  • Use controls to filter and zoom
                </Typography>
              </CardContent>
            </Card>

            {/* Location List */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Locations ({filteredLocations.length})
                </Typography>
                <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {filteredLocations.map((location) => (
                    <ListItem
                      key={location.id}
                      sx={{ 
                        px: 0,
                        cursor: 'pointer',
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'action.hover' },
                        bgcolor: selectedLocation?.id === location.id ? 'action.selected' : 'transparent',
                      }}
                      onClick={() => setSelectedLocation(location)}
                    >
                      <ListItemIcon>
                        {getLocationIcon(location.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={location.name}
                        secondary={`${location.assetCount} assets • ${location.type}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => {
            // Export map data
            const mapData = {
              locations: filteredLocations,
              center: mapCenter,
              settings: { selectedLayer, showAssetCount },
              exportedAt: new Date().toISOString(),
            };
            const blob = new Blob([JSON.stringify(mapData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `site-map-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            window.URL.revokeObjectURL(url);
          }}
        >
          Export Map
        </Button>
      </DialogActions>
    </Dialog>
  );
}