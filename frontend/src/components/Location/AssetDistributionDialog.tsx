import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Stack,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Paper,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  LocationOn as LocationIcon,
  Business as BuildingIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  Factory as FactoryIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';

interface Location {
  id: number;
  name: string;
  type: 'BUILDING' | 'FLOOR' | 'ROOM' | 'AREA' | 'ZONE';
  description?: string;
  parentId?: number;
  assetCount: number;
  children?: Location[];
}

interface AssetDistributionDialogProps {
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

export default function AssetDistributionDialog({
  open,
  onClose,
  locations,
}: AssetDistributionDialogProps) {
  const [viewMode, setViewMode] = useState<'hierarchy' | 'type' | 'density'>('hierarchy');
  const [showPercentages, setShowPercentages] = useState(true);

  // Flatten locations for analysis
  const flattenLocations = (locs: Location[]): Location[] => {
    const result: Location[] = [];
    locs.forEach((location) => {
      result.push(location);
      if (location.children && location.children.length > 0) {
        result.push(...flattenLocations(location.children));
      }
    });
    return result;
  };

  const allLocations = useMemo(() => flattenLocations(locations), [locations]);
  const totalAssets = useMemo(() => allLocations.reduce((sum, loc) => sum + loc.assetCount, 0), [allLocations]);

  // Distribution by location type
  const typeDistribution = useMemo(() => {
    const distribution = allLocations.reduce((acc, location) => {
      acc[location.type] = (acc[location.type] || 0) + location.assetCount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / totalAssets) * 100).toFixed(1),
      color: LOCATION_COLORS[type as keyof typeof LOCATION_COLORS] || '#666',
    }));
  }, [allLocations, totalAssets]);

  // Top locations by asset count
  const topLocations = useMemo(() => {
    return allLocations
      .sort((a, b) => b.assetCount - a.assetCount)
      .slice(0, 10)
      .map(location => ({
        ...location,
        percentage: ((location.assetCount / totalAssets) * 100).toFixed(1),
      }));
  }, [allLocations, totalAssets]);

  // Asset density analysis
  const densityAnalysis = useMemo(() => {
    const parentLocations = allLocations.filter(loc => 
      allLocations.some(child => child.parentId === loc.id)
    );

    return parentLocations.map(parent => {
      const children = allLocations.filter(loc => loc.parentId === parent.id);
      const childAssets = children.reduce((sum, child) => sum + child.assetCount, 0);
      const avgAssetsPerChild = children.length > 0 ? childAssets / children.length : 0;

      return {
        name: parent.name,
        type: parent.type,
        totalAssets: parent.assetCount,
        childCount: children.length,
        avgAssetsPerChild: parseFloat(avgAssetsPerChild.toFixed(1)),
        efficiency: parseFloat(((childAssets / parent.assetCount) * 100).toFixed(1)),
      };
    }).sort((a, b) => b.avgAssetsPerChild - a.avgAssetsPerChild);
  }, [allLocations]);

  // Hierarchical data for visualization
  const hierarchicalData = useMemo(() => {
    const topLevelLocations = locations.filter(loc => !loc.parentId);
    return topLevelLocations.map(location => ({
      name: location.name,
      assets: location.assetCount,
      type: location.type,
      percentage: ((location.assetCount / totalAssets) * 100).toFixed(1),
    }));
  }, [locations, totalAssets]);

  const renderHierarchyView = () => (
    <Grid container spacing={3}>
      <Grid xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Asset Distribution by Top-Level Locations
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hierarchicalData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload[0]) {
                        const data = payload[0].payload;
                        return (
                          <Paper sx={{ p: 1 }}>
                            <Typography variant="body2" fontWeight="bold">
                              {data.name}
                            </Typography>
                            <Typography variant="caption" display="block">
                              {data.assets} assets ({data.percentage}%)
                            </Typography>
                            <Typography variant="caption">
                              Type: {data.type}
                            </Typography>
                          </Paper>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="assets" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Locations
            </Typography>
            <List dense>
              {topLocations.slice(0, 8).map((location, index) => (
                <ListItem key={location.id} sx={{ px: 0 }}>
                  <ListItemIcon>
                    {getLocationIcon(location.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                          {location.name}
                        </Typography>
                        <Chip
                          label={location.type}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption">
                            {location.assetCount} assets
                          </Typography>
                          <Typography variant="caption">
                            {location.percentage}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={parseFloat(location.percentage)}
                          sx={{ height: 4, borderRadius: 2 }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTypeView = () => (
    <Grid container spacing={3}>
      <Grid xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Distribution by Location Type
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percentage }) => `${type} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {typeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Asset Count by Type
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Type Summary
            </Typography>
            <Grid container spacing={2}>
              {typeDistribution.map((type) => (
                <Grid xs={12} sm={6} md={4} key={type.type}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: type.color + '20',
                      border: `2px solid ${type.color}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {getLocationIcon(type.type)}
                      <Typography variant="h6" color={type.color}>
                        {type.type}
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color={type.color}>
                      {type.count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {type.percentage}% of total assets
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderDensityView = () => (
    <Grid container spacing={3}>
      <Grid xs={12}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Asset density analysis shows how efficiently assets are distributed across parent locations.
        </Alert>
      </Grid>
      <Grid xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Average Assets per Child Location
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={densityAnalysis} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="avgAssetsPerChild" fill="#ff9800" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Density Metrics
            </Typography>
            <List dense>
              {densityAnalysis.slice(0, 6).map((item, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon>
                    {getLocationIcon(item.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.name}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {item.avgAssetsPerChild} avg assets/child
                        </Typography>
                        <Typography variant="caption" display="block">
                          {item.childCount} child locations
                        </Typography>
                        <Typography variant="caption" display="block">
                          {item.efficiency}% distribution efficiency
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

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
          <AssessmentIcon />
          <Typography variant="h6">Asset Distribution Analysis</Typography>
          <Chip 
            label={`${totalAssets} total assets`} 
            color="primary" 
            size="small" 
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="body2">View Mode:</Typography>
            <Button
              variant={viewMode === 'hierarchy' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('hierarchy')}
              startIcon={<TrendingUpIcon />}
            >
              Hierarchy
            </Button>
            <Button
              variant={viewMode === 'type' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('type')}
              startIcon={<InventoryIcon />}
            >
              By Type
            </Button>
            <Button
              variant={viewMode === 'density' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('density')}
              startIcon={<AssessmentIcon />}
            >
              Density
            </Button>
            <Divider orientation="vertical" flexItem />
            <FormControlLabel
              control={
                <Switch
                  checked={showPercentages}
                  onChange={(e) => setShowPercentages(e.target.checked)}
                  size="small"
                />
              }
              label="Show percentages"
            />
          </Stack>
        </Box>

        {viewMode === 'hierarchy' && renderHierarchyView()}
        {viewMode === 'type' && renderTypeView()}
        {viewMode === 'density' && renderDensityView()}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="outlined"
          onClick={() => {
            // Export functionality
            const data = {
              totalAssets,
              typeDistribution,
              topLocations,
              densityAnalysis,
              generatedAt: new Date().toISOString(),
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `asset-distribution-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            window.URL.revokeObjectURL(url);
          }}
        >
          Export Data
        </Button>
      </DialogActions>
    </Dialog>
  );
}