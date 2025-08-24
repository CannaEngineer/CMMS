import React, { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  TextField,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Fab,
  CircularProgress,
  Alert,
} from '@mui/material';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import {
  Add as AddIcon,
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Business as BuildingIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  Factory as FactoryIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Map as MapIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import StatCard from '../components/Common/StatCard';
import StatusIndicator from '../components/Common/StatusIndicator';
import PageLayout from '../components/Layout/PageLayout';
import LocationForm from '../components/Forms/LocationForm';
import AssetDistributionDialog from '../components/Location/AssetDistributionDialog';
import SiteMapDialog from '../components/Location/SiteMapDialog';
import { locationsService } from '../services/api';

interface Location {
  id: number;
  name: string;
  type: 'BUILDING' | 'FLOOR' | 'ROOM' | 'AREA' | 'ZONE';
  description?: string;
  parentId?: number;
  assetCount: number;
  address?: string;
  coordinates?: { lat: number; lng: number };
  createdAt?: string;
  updatedAt?: string;
  children?: Location[];
}


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

const getLocationColor = (type: string) => {
  switch (type) {
    case 'AREA':
      return 'primary';
    case 'BUILDING':
      return 'secondary';
    case 'FLOOR':
      return 'info';
    case 'ZONE':
      return 'warning';
    case 'ROOM':
      return 'success';
    default:
      return 'default';
  }
};

const flattenLocations = (locations: Location[]): Location[] => {
  const result: Location[] = [];
  locations.forEach((location) => {
    result.push(location);
    if (location.children && location.children.length > 0) {
      result.push(...flattenLocations(location.children));
    }
  });
  return result;
};

export default function Locations() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [assetDistributionOpen, setAssetDistributionOpen] = useState(false);
  const [siteMapOpen, setSiteMapOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch locations data
  const { data: locations = [], isLoading, error } = useQuery({
    queryKey: ['locations'],
    queryFn: locationsService.getAll,
  });

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: locationsService.create,
    onSuccess: (data) => {
      console.log('✅ Location created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setOpenDialog(false);
      setSelectedLocation(null);
    },
    onError: (error: any) => {
      console.error('❌ Failed to create location:', error);
    },
  });

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => locationsService.update(id, data),
    onSuccess: (data) => {
      console.log('✅ Location updated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setOpenDialog(false);
      setSelectedLocation(null);
    },
    onError: (error: any) => {
      console.error('❌ Failed to update location:', error);
    },
  });

  // Delete location mutation
  const deleteLocationMutation = useMutation({
    mutationFn: locationsService.delete,
    onSuccess: () => {
      console.log('✅ Location deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: (error: any) => {
      console.error('❌ Failed to delete location:', error);
    },
  });

  const handleNodeToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpandedNodes(nodeIds);
  };

  const handleNodeSelect = (event: React.SyntheticEvent, nodeId: string) => {
    const allLocations = flattenLocations(locations);
    const location = allLocations.find(loc => loc.id.toString() === nodeId);
    if (location) {
      setSelectedLocation(location);
      setFormMode('view');
      setOpenDialog(true);
    }
  };

  const handleCreateLocation = () => {
    setSelectedLocation(null);
    setFormMode('create');
    setOpenDialog(true);
  };

  const handleEditLocation = (location: Location) => {
    setSelectedLocation(location);
    setFormMode('edit');
    setOpenDialog(true);
  };

  const handleSubmitLocation = (data: any) => {
    if (selectedLocation) {
      updateLocationMutation.mutate({ id: selectedLocation.id.toString(), data });
    } else {
      createLocationMutation.mutate(data);
    }
  };

  const handleDeleteLocation = (location: Location) => {
    if (confirm(`Are you sure you want to delete "${location.name}"? This action cannot be undone.`)) {
      deleteLocationMutation.mutate(location.id.toString());
    }
  };

  const renderTreeItem = (node: Location) => {
    if (!node?.id) {
      console.warn('TreeItem node missing ID:', node);
      return null;
    }

    return (
      <TreeItem
        key={node.id}
        itemId={node.id.toString()}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
            {getLocationIcon(node.type)}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" component="span">
                {node.name}
              </Typography>
            </Box>
            <Chip 
              label={node.type} 
              size="small" 
              color={getLocationColor(node.type) as any}
              variant="outlined"
            />
            <Chip 
              label={`${node.assetCount} assets`} 
              size="small" 
              variant="outlined"
            />
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEditLocation(node);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteLocation(node);
              }}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        }
      >
        {node.children && node.children.filter(child => child?.id).map((child) => renderTreeItem(child))}
      </TreeItem>
    );
  };

  // Calculate statistics from real API data
  const allLocations = flattenLocations(locations);
  const totalAssets = allLocations.reduce((sum, loc) => sum + loc.assetCount, 0);
  const buildingCount = allLocations.filter(loc => loc.type === 'BUILDING').length;
  const floorCount = allLocations.filter(loc => loc.type === 'FLOOR').length;
  const roomCount = allLocations.filter(loc => loc.type === 'ROOM').length;

  // Loading state
  if (isLoading) {
    return (
      <PageLayout title="Locations" subtitle="Loading location data...">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <PageLayout title="Locations" subtitle="Error loading locations">
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load location data. Please try again later.
        </Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Locations"
      subtitle="Manage your facility locations and hierarchies"
      actions={
        <Box sx={{ display: 'flex', gap: 2 }}>
          {!isMobile && (
            <>
              <Button
                variant="outlined"
                startIcon={<MapIcon />}
                onClick={() => setSiteMapOpen(true)}
              >
                View Map
              </Button>
              <Button
                variant="outlined"
                startIcon={<AssessmentIcon />}
                onClick={() => setAssetDistributionOpen(true)}
              >
                Asset Distribution
              </Button>
            </>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateLocation}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            Add Location
          </Button>
        </Box>
      }
    >

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Total Locations"
            value={allLocations.length}
            subtitle="All location types"
            icon={<LocationIcon />}
            color="primary"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Buildings"
            value={buildingCount}
            subtitle={`${floorCount} floors total`}
            icon={<ApartmentIcon />}
            color="secondary"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Rooms & Zones"
            value={roomCount + allLocations.filter(loc => loc.type === 'ZONE').length}
            subtitle="Detailed locations"
            icon={<HomeIcon />}
            color="info"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Total Assets"
            value={totalAssets}
            subtitle="Across all locations"
            icon={<FactoryIcon />}
            color="success"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Location Tree */}
        <Grid xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <TextField
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Location Hierarchy
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setExpandedNodes(allLocations.map(loc => loc.id.toString()))}
              >
                Expand All
              </Button>
            </Box>
            
            <SimpleTreeView
              expandedItems={expandedNodes}
              onExpandedItemsChange={handleNodeToggle}
              onSelectedItemsChange={(event, itemId) => handleNodeSelect(event, itemId as string)}
              sx={{ flexGrow: 1, maxWidth: '100%', overflowY: 'auto' }}
            >
              {locations.filter(location => location?.id).map((location) => renderTreeItem(location))}
            </SimpleTreeView>
          </Paper>
        </Grid>

        {/* Location Stats */}
        <Grid xs={12} md={4}>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Location Types</Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <FactoryIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Areas"
                    secondary={`${allLocations.filter(loc => loc.type === 'AREA').length} locations`}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <ApartmentIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Buildings"
                    secondary={`${buildingCount} locations`}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <HomeIcon color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Floors"
                    secondary={`${floorCount} locations`}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <LocationIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Rooms & Zones"
                    secondary={`${roomCount + allLocations.filter(loc => loc.type === 'ZONE').length} locations`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Top Locations by Assets</Typography>
              <List dense>
                {allLocations
                  .sort((a, b) => b.assetCount - a.assetCount)
                  .slice(0, 5)
                  .map((location) => (
                    <ListItem key={location.id} sx={{ px: 0 }}>
                      <ListItemIcon>
                        {getLocationIcon(location.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={location.name}
                        secondary={`${location.assetCount} assets`}
                      />
                    </ListItem>
                  ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleCreateLocation}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Location Form Dialog */}
      <LocationForm
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSubmit={handleSubmitLocation}
        initialData={selectedLocation || {}}
        mode={formMode}
      />

      {/* Asset Distribution Dialog */}
      <AssetDistributionDialog
        open={assetDistributionOpen}
        onClose={() => setAssetDistributionOpen(false)}
        locations={locations}
      />

      {/* Site Map Dialog */}
      <SiteMapDialog
        open={siteMapOpen}
        onClose={() => setSiteMapOpen(false)}
        locations={locations}
      />
    </PageLayout>
  );
}