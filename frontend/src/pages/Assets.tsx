import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Breadcrumbs,
  Link,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Alert,
  CircularProgress,
  Fab,
  Drawer,
  AppBar,
  Toolbar,
  Container,
  Stack,
  Badge,
  Avatar,
  SwipeableDrawer,
  FormControl,
  Select,
  InputLabel,
  OutlinedInput,
  Skeleton,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  QrCode as QrCodeIcon,
  MoreVert as MoreVertIcon,
  Build as BuildIcon,
  CheckCircle as OnlineIcon,
  Cancel as OfflineIcon,
  Warning as WarningIcon,
  NavigateNext as NavigateNextIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Tune as TuneIcon,
  SwipeDown as SwipeDownIcon,
  SwipeUp as SwipeUpIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { statusColors } from '../theme/theme';
import AssetForm from '../components/Forms/AssetForm';
import { assetsService } from '../services/api';

interface Asset {
  id: number;
  legacyId?: number;
  name: string;
  description?: string;
  serialNumber?: string;
  modelNumber?: string;
  manufacturer?: string;
  year?: number;
  status: 'ONLINE' | 'OFFLINE';
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'IMPORTANT';
  barcode?: string;
  imageUrl?: string;
  attachments?: any;
  locationId: number;
  organizationId: number;
  parentId?: number;
  createdAt: string;
  updatedAt: string;
  location?: {
    id: number;
    name: string;
  };
  workOrders?: {
    id: number;
    status: string;
    createdAt: string;
  }[];
  pmSchedules?: {
    id: number;
    nextDue: string;
  }[];
}

export default function Assets() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const queryClient = useQueryClient();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  
  // Mobile-specific state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Refs for swipe functionality
  const containerRef = useRef<HTMLElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);

  // Query for assets data
  const { 
    data: assets = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['assets'],
    queryFn: assetsService.getAll,
  });

  // Mutations
  const createAssetMutation = useMutation({
    mutationFn: assetsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setOpenDialog(false);
      setSelectedAsset(null);
    },
  });

  const updateAssetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => assetsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setOpenDialog(false);
      setSelectedAsset(null);
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: assetsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });

  // Pull to refresh functionality
  const handlePullToRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [refetch, isRefreshing]);

  // Touch handlers for pull to refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    
    currentY.current = e.touches[0].clientY;
    const scrollTop = containerRef.current.scrollTop;
    
    if (scrollTop === 0 && currentY.current > startY.current + 50) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!containerRef.current) return;
    
    const scrollTop = containerRef.current.scrollTop;
    const pullDistance = currentY.current - startY.current;
    
    if (scrollTop === 0 && pullDistance > 80) {
      handlePullToRefresh();
    }
  };

  // Filter management
  const handleFilterToggle = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setSearchTerm('');
  };

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setFormMode('view');
    setOpenDialog(true);
  };

  const handleCreateAsset = () => {
    setSelectedAsset(null);
    setFormMode('create');
    setOpenDialog(true);
  };

  const handleSubmitAsset = (data: any) => {
    if (formMode === 'create') {
      createAssetMutation.mutate(data);
    } else if (formMode === 'edit' && selectedAsset) {
      updateAssetMutation.mutate({ id: selectedAsset.id.toString(), data });
    }
  };

  const handleEditAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setFormMode('edit');
    setOpenDialog(true);
    setAnchorEl(null);
  };

  const handleViewAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setFormMode('view');
    setOpenDialog(true);
    setAnchorEl(null);
  };

  const handleDeleteAsset = (asset: Asset) => {
    if (window.confirm(`Are you sure you want to delete asset "${asset.name}"?`)) {
      deleteAssetMutation.mutate(asset.id.toString());
    }
    setAnchorEl(null);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, asset: Asset) => {
    setAnchorEl(event.currentTarget);
    setSelectedAssetId(asset.id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAssetId(null);
  };

  // Calculate health score based on work orders and maintenance schedule
  const calculateHealthScore = (asset: Asset): number => {
    let score = 100;
    
    // Reduce score based on recent work orders
    if (asset.workOrders) {
      const recentWorkOrders = asset.workOrders.filter(wo => {
        const workOrderDate = new Date(wo.createdAt);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return workOrderDate > thirtyDaysAgo;
      });
      score -= recentWorkOrders.length * 15;
    }
    
    // Reduce score if asset is offline
    if (asset.status === 'OFFLINE') {
      score -= 50;
    }
    
    // Reduce score if maintenance is overdue
    if (asset.pmSchedules && asset.pmSchedules.length > 0) {
      const nextDue = new Date(asset.pmSchedules[0].nextDue);
      const now = new Date();
      if (nextDue < now) {
        const daysOverdue = Math.floor((now.getTime() - nextDue.getTime()) / (1000 * 60 * 60 * 24));
        score -= Math.min(daysOverdue * 2, 30);
      }
    }
    
    return Math.max(0, Math.min(100, score));
  };

  // Enhanced filter logic
  const filteredAssets = assets.filter((asset: Asset) => {
    const matchesSearch = searchTerm === '' || 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Apply active filters
    if (activeFilters.length === 0) return true;
    
    return activeFilters.some(filter => {
      switch (filter) {
        case 'online':
          return asset.status === 'ONLINE';
        case 'offline':
          return asset.status === 'OFFLINE';
        case 'critical':
          return asset.criticality === 'HIGH' || asset.criticality === 'IMPORTANT';
        case 'maintenance-due':
          if (!asset.pmSchedules || asset.pmSchedules.length === 0) return false;
          const nextDue = new Date(asset.pmSchedules[0].nextDue);
          const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          return nextDue <= oneWeekFromNow;
        case 'low-health':
          return calculateHealthScore(asset) < 60;
        default:
          return false;
      }
    });
  });

  // Enhanced stats calculation
  const assetStats = {
    total: assets.length,
    online: assets.filter((asset: Asset) => asset.status === 'ONLINE').length,
    offline: assets.filter((asset: Asset) => asset.status === 'OFFLINE').length,
    maintenanceDue: assets.filter((asset: Asset) => {
      if (!asset.pmSchedules || asset.pmSchedules.length === 0) return false;
      const nextDue = new Date(asset.pmSchedules[0].nextDue);
      const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      return nextDue <= oneWeekFromNow;
    }).length,
    critical: assets.filter((asset: Asset) => 
      asset.criticality === 'HIGH' || asset.criticality === 'IMPORTANT'
    ).length,
    lowHealth: assets.filter((asset: Asset) => calculateHealthScore(asset) < 60).length,
  };

  // Stats cards data for mobile
  const statsCards = [
    {
      id: 'total',
      label: 'Total Assets',
      value: assetStats.total,
      icon: BuildIcon,
      color: theme.palette.primary.main,
      bgColor: alpha(theme.palette.primary.main, 0.1),
    },
    {
      id: 'online',
      label: 'Online',
      value: assetStats.online,
      icon: OnlineIcon,
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, 0.1),
      filter: 'online',
    },
    {
      id: 'offline',
      label: 'Offline',
      value: assetStats.offline,
      icon: OfflineIcon,
      color: theme.palette.error.main,
      bgColor: alpha(theme.palette.error.main, 0.1),
      filter: 'offline',
    },
    {
      id: 'maintenance',
      label: 'Maintenance Due',
      value: assetStats.maintenanceDue,
      icon: WarningIcon,
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.main, 0.1),
      filter: 'maintenance-due',
    },
    {
      id: 'critical',
      label: 'Critical',
      value: assetStats.critical,
      icon: WarningIcon,
      color: theme.palette.secondary.main,
      bgColor: alpha(theme.palette.secondary.main, 0.1),
      filter: 'critical',
    },
    {
      id: 'lowHealth',
      label: 'Low Health',
      value: assetStats.lowHealth,
      icon: WarningIcon,
      color: theme.palette.error.dark,
      bgColor: alpha(theme.palette.error.main, 0.1),
      filter: 'low-health',
    },
  ];

  const getHealthColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Error loading assets: {error.message}
        </Alert>
      </Container>
    );
  }

  // Enhanced mobile-first asset card component
  const AssetCard = ({ asset }: { asset: Asset }) => {
    const healthScore = calculateHealthScore(asset);
    const isLowHealth = healthScore < 60;
    const isMaintenanceDue = asset.pmSchedules && asset.pmSchedules.length > 0 && 
      new Date(asset.pmSchedules[0].nextDue) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return (
      <Card 
        sx={{ 
          height: '100%', 
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          borderLeft: `4px solid ${asset.status === 'ONLINE' ? theme.palette.success.main : theme.palette.error.main}`,
          minHeight: { xs: 280, sm: 320 },
          '&:hover': { 
            transform: isMobile ? 'none' : 'translateY(-4px)',
            boxShadow: isMobile ? theme.shadows[2] : theme.shadows[8],
          },
          '&:active': {
            transform: isMobile ? 'scale(0.98)' : 'none',
          },
          // Status indicator background
          backgroundColor: isLowHealth || isMaintenanceDue ? 
            alpha(theme.palette.warning.main, 0.02) : 'background.paper',
        }}
        onClick={() => handleAssetClick(asset)}
      >
        {/* Urgent status indicator */}
        {(isLowHealth || isMaintenanceDue) && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 1,
              backgroundColor: theme.palette.warning.main,
              borderRadius: '50%',
              p: 0.5,
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 1, transform: 'scale(1)' },
                '50%': { opacity: 0.7, transform: 'scale(1.1)' },
                '100%': { opacity: 1, transform: 'scale(1)' },
              },
            }}
          >
            <WarningIcon sx={{ fontSize: 16, color: 'white' }} />
          </Box>
        )}

        <CardMedia
          component="div"
          sx={{
            height: { xs: 120, sm: 140 },
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            backgroundImage: asset.imageUrl ? `url(${asset.imageUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {!asset.imageUrl && (
            <Avatar
              sx={{
                width: { xs: 48, sm: 60 },
                height: { xs: 48, sm: 60 },
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              }}
            >
              <BuildIcon sx={{ 
                fontSize: { xs: 24, sm: 30 }, 
                color: theme.palette.primary.main 
              }} />
            </Avatar>
          )}
        </CardMedia>

        <CardContent sx={{ p: { xs: 2, sm: 2 }, '&:last-child': { pb: { xs: 2, sm: 2 } } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1rem', sm: '1.125rem' },
                lineHeight: 1.3,
                flex: 1,
                pr: 1,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {asset.name}
            </Typography>
            <IconButton 
              size={isMobile ? 'medium' : 'small'}
              sx={{
                minWidth: { xs: 44, sm: 32 },
                minHeight: { xs: 44, sm: 32 },
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClick(e, asset);
              }}
            >
              <MoreVertIcon sx={{ fontSize: { xs: 20, sm: 18 } }} />
            </IconButton>
          </Box>

          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '2.5em',
              lineHeight: 1.25,
            }}
          >
            {asset.description || 'No description available'}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
            <Chip
              icon={asset.status === 'ONLINE' ? 
                <OnlineIcon sx={{ fontSize: { xs: 16, sm: 14 } }} /> : 
                <OfflineIcon sx={{ fontSize: { xs: 16, sm: 14 } }} />
              }
              label={asset.status}
              size={isMobile ? 'medium' : 'small'}
              color={asset.status === 'ONLINE' ? 'success' : 'error'}
              sx={{
                height: { xs: 32, sm: 24 },
                '& .MuiChip-label': {
                  fontSize: { xs: '0.75rem', sm: '0.6875rem' },
                  fontWeight: 600,
                },
              }}
            />
            <Chip
              label={asset.criticality}
              size={isMobile ? 'medium' : 'small'}
              sx={{
                backgroundColor: statusColors[asset.criticality] + '20',
                color: statusColors[asset.criticality],
                fontWeight: 600,
                height: { xs: 32, sm: 24 },
                '& .MuiChip-label': {
                  fontSize: { xs: '0.75rem', sm: '0.6875rem' },
                  fontWeight: 600,
                },
              }}
            />
          </Stack>

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.6875rem' } }}
              >
                Health Score
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography 
                  variant="caption" 
                  fontWeight={700}
                  sx={{
                    color: getHealthColor(healthScore),
                    fontSize: { xs: '0.875rem', sm: '0.75rem' },
                  }}
                >
                  {healthScore}%
                </Typography>
                {healthScore < 60 && (
                  <WarningIcon 
                    sx={{ 
                      fontSize: 12, 
                      color: theme.palette.warning.main,
                      ml: 0.5,
                    }} 
                  />
                )}
              </Box>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={healthScore} 
              sx={{
                height: { xs: 8, sm: 6 },
                borderRadius: 4,
                backgroundColor: alpha(theme.palette.grey[400], 0.2),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getHealthColor(healthScore),
                  borderRadius: 4,
                  transition: 'all 0.3s ease',
                },
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.6875rem' } }}
            >
              Location: {asset.location?.name || 'Unknown'}
            </Typography>
            {asset.pmSchedules && asset.pmSchedules.length > 0 && (
              <Typography 
                variant="caption" 
                sx={{
                  color: isMaintenanceDue ? theme.palette.warning.main : 'text.secondary',
                  fontWeight: isMaintenanceDue ? 600 : 400,
                  fontSize: { xs: '0.75rem', sm: '0.6875rem' },
                }}
              >
                Next maintenance: {new Date(asset.pmSchedules[0].nextDue).toLocaleDateString()}
                {isMaintenanceDue && ' (Due Soon!)'}
              </Typography>
            )}
            {asset.serialNumber && (
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.6875rem' } }}
              >
                S/N: {asset.serialNumber}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Mobile stats card component
  const StatsCard = ({ stat, onClick }: { stat: any; onClick: () => void }) => {
    const IconComponent = stat.icon;
    const isActive = activeFilters.includes(stat.filter);
    
    return (
      <Card
        onClick={onClick}
        sx={{
          minWidth: { xs: 120, sm: 140 },
          cursor: stat.filter ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          backgroundColor: isActive ? stat.bgColor : 'background.paper',
          borderColor: isActive ? stat.color : 'transparent',
          borderWidth: 2,
          borderStyle: 'solid',
          '&:hover': {
            transform: stat.filter ? 'translateY(-2px)' : 'none',
            boxShadow: stat.filter ? theme.shadows[4] : theme.shadows[1],
          },
          '&:active': {
            transform: stat.filter ? 'scale(0.95)' : 'none',
          },
        }}
      >
        <CardContent sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center', '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1,
              p: 1,
              borderRadius: '50%',
              backgroundColor: stat.bgColor,
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
              mx: 'auto',
            }}
          >
            <IconComponent sx={{ fontSize: { xs: 24, sm: 28 }, color: stat.color }} />
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              color: stat.color,
              fontSize: { xs: '1.25rem', sm: '1.375rem' },
              mb: 0.5,
            }}
          >
            {isLoading ? '-' : stat.value}
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.6875rem', sm: '0.75rem' },
              fontWeight: 500,
              lineHeight: 1.2,
            }}
          >
            {stat.label}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  // Filter drawer for mobile
  const FilterDrawer = () => (
    <SwipeableDrawer
      anchor="bottom"
      open={filterDrawerOpen}
      onClose={() => setFilterDrawerOpen(false)}
      onOpen={() => setFilterDrawerOpen(true)}
      sx={{
        '& .MuiDrawer-paper': {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '80vh',
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" fontWeight={600}>
            Filter Assets
          </Typography>
          <IconButton onClick={() => setFilterDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {[
            { id: 'online', label: 'Online', icon: OnlineIcon, color: 'success' },
            { id: 'offline', label: 'Offline', icon: OfflineIcon, color: 'error' },
            { id: 'critical', label: 'Critical', icon: WarningIcon, color: 'secondary' },
            { id: 'maintenance-due', label: 'Maintenance Due', icon: WarningIcon, color: 'warning' },
            { id: 'low-health', label: 'Low Health', icon: WarningIcon, color: 'error' },
          ].map((filter) => {
            const IconComponent = filter.icon;
            const isActive = activeFilters.includes(filter.id);
            
            return (
              <Chip
                key={filter.id}
                icon={<IconComponent />}
                label={filter.label}
                onClick={() => handleFilterToggle(filter.id)}
                color={isActive ? filter.color as any : 'default'}
                variant={isActive ? 'filled' : 'outlined'}
                sx={{
                  height: 40,
                  '& .MuiChip-label': { fontWeight: 500 },
                }}
              />
            );
          })}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={clearAllFilters}
            startIcon={<ClearIcon />}
            fullWidth
          >
            Clear All
          </Button>
          <Button
            variant="contained"
            onClick={() => setFilterDrawerOpen(false)}
            fullWidth
          >
            Apply Filters
          </Button>
        </Box>
      </Box>
    </SwipeableDrawer>
  );

  return (
    <Box
      ref={containerRef}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        pb: { xs: 10, md: 4 }, // Extra padding for mobile FAB
      }}
    >
      {/* Pull to refresh indicator */}
      {isRefreshing && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1300,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            p: 1,
            textAlign: 'center',
          }}
        >
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="caption">Refreshing...</Typography>
        </Box>
      )}
      
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
        {/* Header Section */}
        <Box sx={{ mb: { xs: 2, md: 3 } }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 },
            mb: 2
          }}>
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 1,
                  fontSize: { xs: '1.75rem', sm: '2.125rem' },
                  color: 'text.primary',
                }}
              >
                Assets
              </Typography>
              <Breadcrumbs 
                separator={<NavigateNextIcon fontSize="small" />}
                sx={{ 
                  '& .MuiBreadcrumbs-li': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              > 
                <Link href="#" color="inherit">
                  All Assets
                </Link>
                <Typography color="text.primary">Production Equipment</Typography>
              </Breadcrumbs>
            </Box>
            
            {/* Desktop Action Buttons */}
            <Box sx={{ 
              display: { xs: 'none', md: 'flex' },
              gap: 2,
            }}>
              <Button
                variant="outlined"
                startIcon={<QrCodeIcon />}
                sx={{ minHeight: 48 }}
              >
                Scan QR
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateAsset}
                sx={{ minHeight: 48 }}
              >
                Add Asset
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Search and Filter Section */}
        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            mb: 3,
            backgroundColor: 'background.paper',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Stack spacing={2}>
            {/* Search Bar */}
            <TextField
              placeholder="Search assets by name, description, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              size={isMobile ? 'medium' : 'small'}
              sx={{
                '& .MuiInputBase-root': {
                  height: { xs: 48, sm: 44 },
                  borderRadius: 2,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchTerm('')}
                      sx={{ mr: -1 }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            {/* Filter Controls */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {/* Desktop Filter Chips */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, flexWrap: 'wrap' }}>
                  {[
                    { id: 'online', label: 'Online', icon: OnlineIcon, color: 'success' },
                    { id: 'offline', label: 'Offline', icon: OfflineIcon, color: 'error' },
                    { id: 'critical', label: 'Critical', icon: WarningIcon, color: 'secondary' },
                    { id: 'maintenance-due', label: 'Maintenance Due', icon: WarningIcon, color: 'warning' },
                  ].map((filter) => {
                    const IconComponent = filter.icon;
                    const isActive = activeFilters.includes(filter.id);
                    
                    return (
                      <Chip
                        key={filter.id}
                        icon={<IconComponent sx={{ fontSize: 16 }} />}
                        label={filter.label}
                        onClick={() => handleFilterToggle(filter.id)}
                        color={isActive ? filter.color as any : 'default'}
                        variant={isActive ? 'filled' : 'outlined'}
                        size="small"
                        sx={{
                          '& .MuiChip-label': { 
                            fontWeight: isActive ? 600 : 400,
                            fontSize: '0.75rem',
                          },
                        }}
                      />
                    );
                  })}
                </Box>
                
                {/* Mobile Filter Button */}
                <Button
                  variant="outlined"
                  startIcon={<TuneIcon />}
                  onClick={() => setFilterDrawerOpen(true)}
                  sx={{ 
                    display: { xs: 'flex', md: 'none' },
                    minHeight: 40,
                  }}
                  endIcon={
                    activeFilters.length > 0 ? (
                      <Badge 
                        badgeContent={activeFilters.length} 
                        color="primary"
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.6875rem',
                            minWidth: 16,
                            height: 16,
                          },
                        }}
                      />
                    ) : null
                  }
                >
                  Filters
                </Button>
              </Box>
              
              {/* Clear Filters */}
              {(activeFilters.length > 0 || searchTerm) && (
                <Button
                  size="small"
                  onClick={clearAllFilters}
                  startIcon={<ClearIcon />}
                  sx={{ color: 'text.secondary' }}
                >
                  Clear
                </Button>
              )}
            </Box>
          </Stack>
        </Paper>

        {/* Stats Section */}
        <Box sx={{ mb: 3 }}>
          {/* Mobile Horizontal Scrollable Stats */}
          <Box 
            sx={{ 
              display: { xs: 'block', md: 'none' },
              overflowX: 'auto',
              pb: 1,
              '&::-webkit-scrollbar': {
                height: 4,
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: alpha(theme.palette.grey[300], 0.5),
                borderRadius: 2,
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.primary.main,
                borderRadius: 2,
              },
            }}
          >
            <Stack 
              direction="row" 
              spacing={2} 
              sx={{ 
                minWidth: 'fit-content',
                px: 0.5,
              }}
            >
              {statsCards.map((stat) => (
                <StatsCard
                  key={stat.id}
                  stat={stat}
                  onClick={() => stat.filter && handleFilterToggle(stat.filter)}
                />
              ))}
            </Stack>
          </Box>
        </Box>
        
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* Desktop Sidebar Stats */}
          <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                backgroundColor: 'background.paper',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Quick Stats
              </Typography>
              {isLoading ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <Stack spacing={2}>
                  {statsCards.slice(0, 5).map((stat) => {
                    const IconComponent = stat.icon;
                    const isActive = activeFilters.includes(stat.filter);
                    
                    return (
                      <Box
                        key={stat.id}
                        onClick={() => stat.filter && handleFilterToggle(stat.filter)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 2,
                          borderRadius: 2,
                          cursor: stat.filter ? 'pointer' : 'default',
                          backgroundColor: isActive ? stat.bgColor : 'transparent',
                          border: `1px solid ${isActive ? stat.color : 'transparent'}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: stat.filter ? stat.bgColor : 'transparent',
                            transform: stat.filter ? 'translateX(4px)' : 'none',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: stat.bgColor,
                            mr: 2,
                          }}
                        >
                          <IconComponent sx={{ fontSize: 20, color: stat.color }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                            {stat.label}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: stat.color, fontSize: '1.25rem' }}>
                            {stat.value}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Paper>
          </Grid>

          {/* Assets Grid */}
          <Grid item xs={12} md={9}>
            {/* Results Summary */}
            {!isLoading && (
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''} found
                  {activeFilters.length > 0 && ` (${activeFilters.length} filter${activeFilters.length !== 1 ? 's' : ''} active)`}
                </Typography>
                {filteredAssets.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    Updated {new Date().toLocaleTimeString()}
                  </Typography>
                )}
              </Box>
            )}

            {isLoading ? (
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                {Array.from({ length: isMobile ? 2 : 6 }).map((_, index) => (
                  <Grid item xs={12} sm={6} lg={4} key={index}>
                    <Card sx={{ height: { xs: 280, sm: 320 } }}>
                      <Skeleton variant="rectangular" height={isMobile ? 120 : 140} />
                      <CardContent>
                        <Skeleton variant="text" height={32} width="80%" sx={{ mb: 1 }} />
                        <Skeleton variant="text" height={20} width="100%" sx={{ mb: 2 }} />
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <Skeleton variant="rounded" width={60} height={24} />
                          <Skeleton variant="rounded" width={80} height={24} />
                        </Box>
                        <Skeleton variant="rounded" height={8} width="100%" sx={{ mb: 2 }} />
                        <Skeleton variant="text" height={16} width="60%" />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : filteredAssets.length === 0 ? (
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  py: 8,
                  px: 3,
                }}
              >
                <BuildIcon 
                  sx={{ 
                    fontSize: 80, 
                    color: 'text.disabled',
                    mb: 2,
                  }} 
                />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No assets found
                </Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
                  {searchTerm || activeFilters.length > 0 
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding your first asset'
                  }
                </Typography>
                {(!searchTerm && activeFilters.length === 0) && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateAsset}
                    size="large"
                  >
                    Add First Asset
                  </Button>
                )}
              </Box>
            ) : (
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                {filteredAssets.map((asset) => (
                  <Grid 
                    item 
                    xs={12} 
                    sm={isTablet ? 12 : 6} 
                    md={12}
                    lg={4} 
                    key={asset.id}
                  >
                    <AssetCard asset={asset} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>
      </Container>
      
      {/* Filter Drawer for Mobile */}
      <FilterDrawer />

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            const asset = assets.find((a: Asset) => a.id === selectedAssetId);
            if (asset) handleViewAsset(asset);
          }}
        >
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            const asset = assets.find((a: Asset) => a.id === selectedAssetId);
            if (asset) handleEditAsset(asset);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Asset</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            const asset = assets.find((a: Asset) => a.id === selectedAssetId);
            if (asset) handleDeleteAsset(asset);
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Asset</ListItemText>
        </MenuItem>
      </Menu>

      {/* Asset Form Dialog */}
      <AssetForm
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSubmit={handleSubmitAsset}
        initialData={selectedAsset || {}}
        mode={formMode}
        loading={createAssetMutation.isPending || updateAssetMutation.isPending}
      />

      {/* Enhanced FAB for mobile */}
      {isMobile && (
        <Fab
          color="primary"
          onClick={handleCreateAsset}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 64,
            height: 64,
            zIndex: 1200,
            boxShadow: theme.shadows[8],
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: theme.shadows[12],
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: '50%',
              background: 'inherit',
              opacity: 0,
              transform: 'scale(0.8)',
              transition: 'all 0.3s ease',
            },
            '&:hover::before': {
              opacity: 0.1,
              transform: 'scale(1.2)',
            },
          }}
        >
          <AddIcon sx={{ fontSize: 28, color: 'white' }} />
        </Fab>
      )}
    </Box>
  );
}