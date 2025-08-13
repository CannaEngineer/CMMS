import React, { useState, useMemo } from 'react';
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
  Slider,
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
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  Layers as LayersIcon,
  LocationOn as LocationIcon,
  Business as BuildingIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  Factory as FactoryIcon,
  Fullscreen as FullscreenIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

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
  const [zoom, setZoom] = useState(50);
  const [selectedLayer, setSelectedLayer] = useState<string>('all');
  const [showAssetCount, setShowAssetCount] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // Filter locations with coordinates (top-level locations)
  const mappableLocations = useMemo(() => {
    return locations.filter(loc => loc.coordinates);
  }, [locations]);

  // Calculate map bounds
  const mapBounds = useMemo(() => {
    if (mappableLocations.length === 0) return null;
    
    const lats = mappableLocations.map(loc => loc.coordinates!.lat);
    const lngs = mappableLocations.map(loc => loc.coordinates!.lng);
    
    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
      center: {
        lat: (Math.max(...lats) + Math.min(...lats)) / 2,
        lng: (Math.max(...lngs) + Math.min(...lngs)) / 2,
      }
    };
  }, [mappableLocations]);

  // Filter locations by layer
  const filteredLocations = useMemo(() => {
    if (selectedLayer === 'all') return mappableLocations;
    return mappableLocations.filter(loc => loc.type === selectedLayer);
  }, [mappableLocations, selectedLayer]);

  // SVG Map Component
  const SiteMapSVG = () => {
    if (!mapBounds) return null;

    const width = 800;
    const height = 600;
    const padding = 50;

    // Convert coordinates to SVG coordinates
    const coordToSVG = (lat: number, lng: number) => {
      const x = ((lng - mapBounds.west) / (mapBounds.east - mapBounds.west)) * (width - 2 * padding) + padding;
      const y = height - (((lat - mapBounds.south) / (mapBounds.north - mapBounds.south)) * (height - 2 * padding) + padding);
      return { x, y };
    };

    return (
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`}
        style={{ border: '1px solid #ddd', borderRadius: 8, background: '#f5f5f5' }}
      >
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Location markers */}
        {filteredLocations.map((location) => {
          const { x, y } = coordToSVG(location.coordinates!.lat, location.coordinates!.lng);
          const color = LOCATION_COLORS[location.type] || '#666';
          const size = Math.max(8, Math.min(30, (location.assetCount / 10) + 10));
          
          return (
            <g key={location.id}>
              {/* Location marker */}
              <circle
                cx={x}
                cy={y}
                r={size}
                fill={color}
                fillOpacity={0.7}
                stroke="#fff"
                strokeWidth={2}
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setSelectedLocation(location)}
                onMouseEnter={(e) => {
                  e.currentTarget.setAttribute('fill-opacity', '1');
                  e.currentTarget.setAttribute('r', (size + 3).toString());
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.setAttribute('fill-opacity', '0.7');
                  e.currentTarget.setAttribute('r', size.toString());
                }}
              />
              
              {/* Asset count bubble */}
              {showAssetCount && (
                <g>
                  <circle
                    cx={x + size - 5}
                    cy={y - size + 5}
                    r="12"
                    fill="#fff"
                    stroke={color}
                    strokeWidth={2}
                    style={{ pointerEvents: 'none' }}
                  />
                  <text
                    x={x + size - 5}
                    y={y - size + 9}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill={color}
                    style={{ pointerEvents: 'none' }}
                  >
                    {location.assetCount}
                  </text>
                </g>
              )}
              
              {/* Location label */}
              {showLabels && (
                <text
                  x={x}
                  y={y + size + 15}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="500"
                  fill="#333"
                  style={{ pointerEvents: 'none' }}
                >
                  {location.name}
                </text>
              )}
            </g>
          );
        })}
        
        {/* Compass */}
        <g transform="translate(50, 50)">
          <circle cx="0" cy="0" r="25" fill="#fff" fillOpacity="0.9" stroke="#333" strokeWidth="2"/>
          <path d="M 0,-20 L 5,0 L 0,20 L -5,0 Z" fill="#e53e3e"/>
          <text x="0" y="-30" textAnchor="middle" fontSize="12" fontWeight="bold">N</text>
        </g>
        
        {/* Scale */}
        <g transform="translate(50, 550)">
          <line x1="0" y1="0" x2="100" y2="0" stroke="#333" strokeWidth="2"/>
          <line x1="0" y1="-5" x2="0" y2="5" stroke="#333" strokeWidth="2"/>
          <line x1="100" y1="-5" x2="100" y2="5" stroke="#333" strokeWidth="2"/>
          <text x="50" y="20" textAnchor="middle" fontSize="10">Approximate Scale</text>
        </g>
      </svg>
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
                    <InputLabel>Layer</InputLabel>
                    <Select
                      value={selectedLayer}
                      onChange={(e) => setSelectedLayer(e.target.value)}
                      label="Layer"
                    >
                      {layerOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Zoom Control */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
                    <ZoomOutIcon />
                    <Slider
                      value={zoom}
                      onChange={(_, value) => setZoom(value as number)}
                      min={10}
                      max={200}
                      size="small"
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `${value}%`}
                    />
                    <ZoomInIcon />
                  </Box>

                  {/* Toggle Controls */}
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showAssetCount}
                        onChange={(e) => setShowAssetCount(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Asset counts"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showLabels}
                        onChange={(e) => setShowLabels(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Labels"
                  />

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                    <Tooltip title="Center view">
                      <IconButton size="small">
                        <CenterIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Fullscreen">
                      <IconButton size="small">
                        <FullscreenIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
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
                  <Box 
                    sx={{ 
                      height: 500, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <SiteMapSVG />
                  </Box>
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