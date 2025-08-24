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
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom icons for different location types
const createLocationIcon = (type: string, assetCount?: number) => {
  const color = LOCATION_COLORS[type as keyof typeof LOCATION_COLORS] || '#666';
  const size = Math.max(25, Math.min(40, (assetCount || 0) / 5 + 25));
  
  return new L.DivIcon({
    html: `
      <div style="
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        ${assetCount || 0}
      </div>
    `,
    className: 'custom-location-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
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

  // Filter locations with coordinates (mappable locations)
  const mappableLocations = useMemo(() => {
    return locations.filter(loc => loc.coordinates);
  }, [locations]);

  // Calculate map center and zoom
  const mapCenter = useMemo((): [number, number] => {
    if (mappableLocations.length === 0) return [40.7128, -74.0060]; // Default to New York
    
    const lats = mappableLocations.map(loc => loc.coordinates!.lat);
    const lngs = mappableLocations.map(loc => loc.coordinates!.lng);
    
    const centerLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length;
    const centerLng = lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length;
    
    return [centerLat, centerLng];
  }, [mappableLocations]);

  // Filter locations by layer
  const filteredLocations = useMemo(() => {
    if (selectedLayer === 'all') return mappableLocations;
    return mappableLocations.filter(loc => loc.type === selectedLayer);
  }, [mappableLocations, selectedLayer]);

  // Real Map Component using Leaflet
  const RealSiteMap = () => {
    if (mappableLocations.length === 0) return null;

    return (
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '500px', width: '100%', borderRadius: '8px' }}
        whenReady={() => {
          // Map is ready
        }}
      >
        <LayersControl position="topright">
          {/* Base Layers */}
          <LayersControl.BaseLayer checked name="Streets">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community'
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Terrain">
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://opentopomap.org/">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Dark">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Location Markers */}
        {filteredLocations.map((location) => (
          <Marker
            key={location.id}
            position={[location.coordinates!.lat, location.coordinates!.lng]}
            icon={createLocationIcon(location.type, location.assetCount)}
            eventHandlers={{
              click: () => setSelectedLocation(location),
            }}
          >
            <Popup>
              <Box sx={{ minWidth: 200 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {location.name}
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getLocationIcon(location.type)}
                    <Chip 
                      label={location.type} 
                      size="small" 
                      color="primary" 
                    />
                  </Box>
                  {location.description && (
                    <Typography variant="body2" color="text.secondary">
                      {location.description}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    <strong>Assets:</strong> {location.assetCount}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Coordinates:</strong> {location.coordinates!.lat.toFixed(4)}, {location.coordinates!.lng.toFixed(4)}
                  </Typography>
                </Stack>
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    );
  };

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
          <Grid xs={12}>
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
          <Grid xs={12} md={8}>
            {mappableLocations.length === 0 ? (
              <Alert severity="info" sx={{ height: 400, display: 'flex', alignItems: 'center' }}>
                <Typography>
                  No location coordinates available. Add GPS coordinates to locations to view them on the site map.
                </Typography>
              </Alert>
            ) : (
              <Card>
                <CardContent sx={{ p: 1 }}>
                  <RealSiteMap />
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Location Details & Legend */}
          <Grid xs={12} md={4}>
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
              bounds: mapBounds,
              settings: { zoom, selectedLayer, showAssetCount, showLabels },
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