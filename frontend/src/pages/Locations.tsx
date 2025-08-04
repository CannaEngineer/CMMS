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
  MoreVert as MoreVertIcon,
  Map as MapIcon,
} from '@mui/icons-material';
import StatCard from '../components/Common/StatCard';
import StatusIndicator from '../components/Common/StatusIndicator';
import PageLayout from '../components/Layout/PageLayout';
import LocationForm from '../components/Forms/LocationForm';

interface Location {
  id: string;
  name: string;
  type: 'BUILDING' | 'FLOOR' | 'ROOM' | 'AREA' | 'ZONE';
  description?: string;
  parentId?: string;
  assetCount: number;
  children?: Location[];
}

const mockLocations: Location[] = [
  {
    id: '1',
    name: 'Main Campus',
    type: 'AREA',
    description: 'Primary manufacturing facility',
    assetCount: 89,
    children: [
      {
        id: '2',
        name: 'Building A',
        type: 'BUILDING',
        parentId: '1',
        assetCount: 45,
        children: [
          {
            id: '3',
            name: 'Ground Floor',
            type: 'FLOOR',
            parentId: '2',
            assetCount: 25,
            children: [
              { id: '4', name: 'Reception Area', type: 'ROOM', parentId: '3', assetCount: 5 },
              { id: '5', name: 'Main Hall', type: 'ROOM', parentId: '3', assetCount: 8 },
              { id: '6', name: 'Conference Room', type: 'ROOM', parentId: '3', assetCount: 12 },
            ],
          },
          {
            id: '7',
            name: '1st Floor',
            type: 'FLOOR',
            parentId: '2',
            assetCount: 15,
            children: [
              { id: '8', name: 'Office Area', type: 'ROOM', parentId: '7', assetCount: 10 },
              { id: '9', name: 'Server Room', type: 'ROOM', parentId: '7', assetCount: 5 },
            ],
          },
          {
            id: '10',
            name: 'Basement',
            type: 'FLOOR',
            parentId: '2',
            assetCount: 5,
            children: [
              { id: '11', name: 'Utility Room', type: 'ROOM', parentId: '10', assetCount: 3 },
              { id: '12', name: 'Storage', type: 'ROOM', parentId: '10', assetCount: 2 },
            ],
          },
        ],
      },
      {
        id: '13',
        name: 'Building B',
        type: 'BUILDING',
        parentId: '1',
        assetCount: 44,
        children: [
          {
            id: '14',
            name: 'Ground Floor',
            type: 'FLOOR',
            parentId: '13',
            assetCount: 20,
          },
          {
            id: '15',
            name: '1st Floor',
            type: 'FLOOR',
            parentId: '13',
            assetCount: 18,
          },
          {
            id: '16',
            name: 'Roof',
            type: 'FLOOR',
            parentId: '13',
            assetCount: 6,
          },
        ],
      },
    ],
  },
  {
    id: '17',
    name: 'Production Facility',
    type: 'AREA',
    description: 'Main production and manufacturing area',
    assetCount: 128,
    children: [
      {
        id: '18',
        name: 'Production Floor',
        type: 'BUILDING',
        parentId: '17',
        assetCount: 95,
        children: [
          { id: '19', name: 'Line 1', type: 'ZONE', parentId: '18', assetCount: 35 },
          { id: '20', name: 'Line 2', type: 'ZONE', parentId: '18', assetCount: 30 },
          { id: '21', name: 'Line 3', type: 'ZONE', parentId: '18', assetCount: 25 },
          { id: '22', name: 'Quality Control', type: 'ROOM', parentId: '18', assetCount: 5 },
        ],
      },
      {
        id: '23',
        name: 'Warehouse',
        type: 'BUILDING',
        parentId: '17',
        assetCount: 33,
        children: [
          { id: '24', name: 'Storage Area A', type: 'ZONE', parentId: '23', assetCount: 15 },
          { id: '25', name: 'Storage Area B', type: 'ZONE', parentId: '23', assetCount: 12 },
          { id: '26', name: 'Shipping Dock', type: 'ZONE', parentId: '23', assetCount: 6 },
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
  const [expandedNodes, setExpandedNodes] = useState<string[]>(['1', '17']);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

  const handleNodeToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpandedNodes(nodeIds);
  };

  const handleNodeSelect = (event: React.SyntheticEvent, nodeId: string) => {
    const allLocations = flattenLocations(mockLocations);
    const location = allLocations.find(loc => loc.id === nodeId);
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
    console.log('Location Data:', data);
    // Here you would call your API
    setOpenDialog(false);
    setSelectedLocation(null);
  };

  const renderTreeItem = (node: Location) => {
    if (!node?.id) {
      console.warn('TreeItem node missing ID:', node);
      return null;
    }

    return (
      <TreeItem
        key={node.id}
        itemId={node.id}
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
          </Box>
        }
      >
        {node.children && node.children.filter(child => child?.id).map((child) => renderTreeItem(child))}
      </TreeItem>
    );
  };

  const allLocations = flattenLocations(mockLocations);
  const totalAssets = allLocations.reduce((sum, loc) => sum + loc.assetCount, 0);
  const buildingCount = allLocations.filter(loc => loc.type === 'BUILDING').length;
  const floorCount = allLocations.filter(loc => loc.type === 'FLOOR').length;
  const roomCount = allLocations.filter(loc => loc.type === 'ROOM').length;

  return (
    <PageLayout
      title="Locations"
      subtitle="Manage your facility locations and hierarchies"
      actions={
        <Box sx={{ display: 'flex', gap: 2 }}>
          {!isMobile && (
            <Button
              variant="outlined"
              startIcon={<MapIcon />}
            >
              View Map
            </Button>
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
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Locations"
            value={allLocations.length}
            subtitle="All location types"
            icon={<LocationIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Buildings"
            value={buildingCount}
            subtitle={`${floorCount} floors total`}
            icon={<ApartmentIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Rooms & Zones"
            value={roomCount + allLocations.filter(loc => loc.type === 'ZONE').length}
            subtitle="Detailed locations"
            icon={<HomeIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} md={8}>
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
                onClick={() => setExpandedNodes(hierarchicalLocations.map(loc => loc.id))}
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
              {mockLocations.filter(location => location?.id).map((location) => renderTreeItem(location))}
            </SimpleTreeView>
          </Paper>
        </Grid>

        {/* Location Stats and Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Quick Actions</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  fullWidth
                  onClick={handleCreateLocation}
                >
                  Add Location
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<MapIcon />}
                  fullWidth
                >
                  View Site Map
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FactoryIcon />}
                  fullWidth
                >
                  Asset Distribution
                </Button>
              </Box>
            </CardContent>
          </Card>

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
    </PageLayout>
  );
}