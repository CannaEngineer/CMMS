import React, { useState, useCallback, useRef } from 'react';
import { LoadingSpinner, TemplatedSkeleton, LoadingOverlay } from '../components/Loading';
import {
  Box,
  Button,
  Paper,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Alert,
  Fab,
  AppBar,
  Toolbar,
  Container,
  Stack,
  Badge,
  SwipeableDrawer,
  FormControl,
  Select,
  InputLabel,
  Skeleton,
  alpha,
  Collapse,
  Tabs,
  Tab,
  Breadcrumbs,
  Link,
  Slide,
  Fade,
  Avatar,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  QrCodeScanner as QrScannerIcon,
  Build as BuildIcon,
  CheckCircle as OnlineIcon,
  Cancel as OfflineIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Assignment as WorkOrderIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxBlankIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AssetForm from '../components/Forms/AssetForm';
import UniversalExportButton from '../components/Common/UniversalExportButton';
import DataTable from '../components/Common/DataTable';
import { assetsService } from '../services/api';
import { useSwipeable } from 'react-swipeable';
import QRScanner from '../components/QR/QRScanner';
import QRActionHandler from '../components/QR/QRActionHandler';
import type { QRScanResult } from '../types/qr';
import { qrService } from '../services/qrService';
import { useNavigate } from 'react-router-dom';

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
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // State management
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  
  // Mobile-specific state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    status: string[];
    criticality: string[];
    location: string[];
  }>({
    status: [],
    criticality: [],
    location: [],
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [selectedDetailAsset, setSelectedDetailAsset] = useState<Asset | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'criticality' | 'created'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [quickActionMenuOpen, setQuickActionMenuOpen] = useState(false);
  
  // QR-related state
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [qrScanResult, setQrScanResult] = useState<QRScanResult | null>(null);
  
  // Refs for scroll and touch functionality
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pullIndicatorRef = useRef<HTMLDivElement>(null);

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

  // Helper function to generate QR code for asset
  const generateAssetQRCode = useCallback(async (assetData: any) => {
    try {
      const qrData = qrService.createQRCodeData('asset', assetData.id?.toString() || 'temp', {
        name: assetData.name,
        location: assetData.location?.name,
        serialNumber: assetData.serialNumber,
      });
      const qrCodeUrl = qrService.generateQRCodeUrl(qrData);
      return qrCodeUrl;
    } catch (error) {
      console.error('Failed to generate QR code for asset:', error);
      return null;
    }
  }, []);

  // Mutations
  const createAssetMutation = useMutation({
    mutationFn: async (assetData: any) => {
      // Create the asset first
      const createdAsset = await assetsService.create(assetData);
      
      // TODO: Re-enable QR code generation after fixing the update issue
      // // Generate QR code with the actual asset ID
      // const qrCodeUrl = await generateAssetQRCode({ ...assetData, id: createdAsset.id });
      // 
      // // Update the asset with the QR code if generation succeeded
      // if (qrCodeUrl && createdAsset.id) {
      //   await assetsService.update(createdAsset.id.toString(), {
      //     ...createdAsset,
      //     barcode: qrCodeUrl
      //   });
      // }
      
      return createdAsset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setOpenDialog(false);
      setSelectedAsset(null);
    },
  });

  const updateAssetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      // If the asset doesn't have a QR code (barcode), generate one
      if (!data.barcode) {
        const qrCodeUrl = await generateAssetQRCode({ ...data, id });
        data = { ...data, barcode: qrCodeUrl };
      }
      
      return assetsService.update(id, data);
    },
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

  // Pull to refresh with visual indicator
  const handlePullToRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [refetch, isRefreshing]);

  // Swipe handlers using react-swipeable
  const swipeHandlers = useSwipeable({
    onSwipedDown: (event) => {
      if (scrollContainerRef.current?.scrollTop === 0) {
        handlePullToRefresh();
      }
    },
    onSwipedLeft: (event) => {
      // Handle swipe left for quick actions
      const assetCard = event.event.target as HTMLElement;
      const assetId = assetCard.closest('[data-asset-id]')?.getAttribute('data-asset-id');
      if (assetId && !multiSelectMode) {
        const asset = assets.find(a => a.id === parseInt(assetId));
        if (asset) {
          handleQuickEdit(asset);
        }
      }
    },
    onSwipedRight: (event) => {
      // Handle swipe right for details
      const assetCard = event.event.target as HTMLElement;
      const assetId = assetCard.closest('[data-asset-id]')?.getAttribute('data-asset-id');
      if (assetId && !multiSelectMode) {
        const asset = assets.find(a => a.id === parseInt(assetId));
        if (asset) {
          handleShowDetails(asset);
        }
      }
    },
    trackMouse: false,
    trackTouch: true,
  });

  // Base filtering for search and filters
  const baseFilteredAssets = (assets || []).filter((asset: Asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = activeFilters.status.length === 0 || 
                         activeFilters.status.includes(asset.status);
    
    const matchesCriticality = activeFilters.criticality.length === 0 || 
                              activeFilters.criticality.includes(asset.criticality);
    
    const matchesLocation = activeFilters.location.length === 0 || 
                           (asset.location && activeFilters.location.includes(asset.location.name));
    
    return matchesSearch && matchesStatus && matchesCriticality && matchesLocation;
  });

  // Tab-based filtering
  const filteredAssets = baseFilteredAssets.filter((asset: Asset) => {
    const matchesTab = currentTab === 0 || // All
                      (currentTab === 1 && asset.status === 'ONLINE') ||
                      (currentTab === 2 && asset.status === 'OFFLINE') ||
                      (currentTab === 3 && asset.criticality === 'HIGH') ||
                      (currentTab === 4 && asset.criticality === 'IMPORTANT');
    
    return matchesTab;
  });

  // Calculate filtered tab counts
  const filteredTabCounts = {
    all: baseFilteredAssets.length,
    online: baseFilteredAssets.filter((a: Asset) => a.status === 'ONLINE').length,
    offline: baseFilteredAssets.filter((a: Asset) => a.status === 'OFFLINE').length,
    high: baseFilteredAssets.filter((a: Asset) => a.criticality === 'HIGH').length,
    critical: baseFilteredAssets.filter((a: Asset) => a.criticality === 'IMPORTANT').length,
  };

  // Enhanced stats calculation
  const assetStats = {
    total: assets.length,
    online: assets.filter((a: Asset) => a.status === 'ONLINE').length,
    offline: assets.filter((a: Asset) => a.status === 'OFFLINE').length,
    high: assets.filter((a: Asset) => a.criticality === 'HIGH').length,
    critical: assets.filter((a: Asset) => a.criticality === 'IMPORTANT').length,
  };

  // Sort filtered assets
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'status':
        return a.status.localeCompare(b.status);
      case 'criticality':
        const criticalityOrder = { 'IMPORTANT': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        return criticalityOrder[a.criticality] - criticalityOrder[b.criticality];
      case 'updated':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      default:
        return 0;
    }
  });

  // Get unique locations for filter
  const uniqueLocations = Array.from(new Set((assets || []).map((a: Asset) => a.location?.name).filter(Boolean)));

  // Enhanced handlers
  const handleShowDetails = (asset: Asset) => {
    navigate(`/assets/${asset.id}`);
  };

  const handleQuickEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setFormMode('edit');
    setOpenDialog(true);
  };

  const handleCardClick = (asset: Asset) => {
    if (multiSelectMode) {
      handleSelectCard(asset.id);
    } else {
      handleShowDetails(asset);
    }
  };

  const handleSelectCard = (assetId: number) => {
    setSelectedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
        if (newSet.size === 0) {
          setMultiSelectMode(false);
        }
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  const handleLongPress = useCallback((assetId: number) => {
    if (!multiSelectMode) {
      setMultiSelectMode(true);
      setSelectedCards(new Set([assetId]));
      // Haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  }, [multiSelectMode]);

  const exitMultiSelectMode = () => {
    setMultiSelectMode(false);
    setSelectedCards(new Set());
  };

  const handleBatchDelete = async () => {
    const selectedIds = Array.from(selectedCards);
    // Implementation for batch delete
    console.log('Batch delete:', selectedIds);
    exitMultiSelectMode();
  };

  const handleCreateAsset = () => {
    setSelectedAsset(null);
    setFormMode('create');
    setOpenDialog(true);
  };

  const handleSubmitAsset = (data: any) => {
    if (formMode === 'create') {
      // Remove id field when creating a new asset to avoid confusion with update
      const { id, ...createData } = data;
      createAssetMutation.mutate(createData);
    } else if (formMode === 'edit' && selectedAsset) {
      updateAssetMutation.mutate({ id: selectedAsset.id.toString(), data });
    }
  };

  const handleDeleteAsset = (asset: Asset) => {
    if (window.confirm(`Are you sure you want to delete ${asset.name}?`)) {
      deleteAssetMutation.mutate(asset.id.toString());
    }
  };

  // QR-related handlers
  const handleQRScan = useCallback((result: QRScanResult) => {
    setQrScanResult(result);
    setQrScannerOpen(false);
  }, []);


  const handleQRActionClose = useCallback(() => {
    setQrScanResult(null);
  }, []);

  // Mobile-optimized Asset Card Component
  const MobileAssetCard = ({ asset }: { asset: Asset }) => {
    const isExpanded = expandedCards.has(asset.id);
    const isSelected = selectedCards.has(asset.id);
    const [touchTimer, setTouchTimer] = useState<NodeJS.Timeout | null>(null);
    
    const handleTouchStart = () => {
      const timer = setTimeout(() => {
        handleLongPress(asset.id);
      }, 500);
      setTouchTimer(timer);
    };
    
    const handleTouchEnd = () => {
      if (touchTimer) {
        clearTimeout(touchTimer);
        setTouchTimer(null);
      }
    };

    const getStatusIcon = () => {
      switch (asset.status) {
        case 'ONLINE':
          return <OnlineIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />;
        case 'OFFLINE':
          return <OfflineIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />;
        default:
          return <WarningIcon sx={{ color: theme.palette.warning.main, fontSize: 20 }} />;
      }
    };

    const getCriticalityColor = () => {
      switch (asset.criticality) {
        case 'IMPORTANT':
          return theme.palette.error.main;
        case 'HIGH':
          return theme.palette.warning.main;
        case 'MEDIUM':
          return theme.palette.info.main;
        case 'LOW':
          return theme.palette.success.main;
        default:
          return theme.palette.grey[500];
      }
    };

    return (
      <Card
        data-asset-id={asset.id}
        sx={{
          mb: 1.5,
          position: 'relative',
          transition: 'all 0.3s ease',
          transform: isSelected ? 'scale(0.95)' : 'scale(1)',
          boxShadow: isSelected ? theme.shadows[8] : theme.shadows[1],
          border: isSelected ? `2px solid ${theme.palette.primary.main}` : 'none',
          '&:active': {
            transform: 'scale(0.98)',
          },
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => handleCardClick(asset)}
      >
        {/* Selection checkbox for multi-select mode - only show if no image */}
        {multiSelectMode && !(asset.imageUrl || (asset.attachments && asset.attachments.length > 0)) && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 2,
            }}
          >
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectCard(asset.id);
              }}
            >
              {isSelected ? <CheckBoxIcon color="primary" /> : <CheckBoxBlankIcon />}
            </IconButton>
          </Box>
        )}

        {/* Asset Image */}
        {(asset.imageUrl || (asset.attachments && asset.attachments.length > 0)) && (
          <CardMedia
            sx={{
              height: 120,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
            }}
            image={
              asset.imageUrl || 
              (asset.attachments && asset.attachments.find((att: any) => 
                att.url && (att.url.includes('.png') || att.url.includes('.jpg') || att.url.includes('.jpeg') || att.url.includes('.gif'))
              )?.url)
            }
          >
            {multiSelectMode && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  zIndex: 2,
                }}
              >
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectCard(asset.id);
                  }}
                  sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.paper' } }}
                >
                  {isSelected ? <CheckBoxIcon color="primary" /> : <CheckBoxBlankIcon />}
                </IconButton>
              </Box>
            )}
          </CardMedia>
        )}
        
        <CardContent sx={{ pb: 1.5, pt: multiSelectMode && !(asset.imageUrl || (asset.attachments && asset.attachments.length > 0)) ? 4 : 2 }}>
          {/* Primary info - always visible */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  mb: 0.5,
                }}
              >
                {asset.name}
              </Typography>
              
              {/* Status and criticality chips */}
              <Stack direction="row" spacing={0.5} sx={{ mb: 1 }}>
                <Chip
                  icon={getStatusIcon()}
                  label={asset.status}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}
                />
                <Chip
                  label={asset.criticality}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    bgcolor: alpha(getCriticalityColor(), 0.1),
                    color: getCriticalityColor(),
                    border: `1px solid ${alpha(getCriticalityColor(), 0.3)}`,
                  }}
                />
              </Stack>

              {/* Location info */}
              {asset.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    {asset.location.name}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Expand/collapse button */}
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedCards(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(asset.id)) {
                    newSet.delete(asset.id);
                  } else {
                    newSet.add(asset.id);
                  }
                  return newSet;
                });
              }}
              sx={{
                ml: 1,
                transition: 'transform 0.3s',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>

          {/* Collapsible details */}
          <Collapse in={isExpanded} timeout="auto">
            <Divider sx={{ my: 1 }} />
            <Box sx={{ pt: 1 }}>
              {asset.serialNumber && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Serial:</strong> {asset.serialNumber}
                </Typography>
              )}
              {asset.manufacturer && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Manufacturer:</strong> {asset.manufacturer}
                </Typography>
              )}
              
              {/* Quick stats */}
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <WorkOrderIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {asset.workOrders?.length || 0} WOs
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {asset.pmSchedules?.length || 0} PMs
                  </Typography>
                </Box>
              </Stack>

              {/* Quick actions */}
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickEdit(asset);
                  }}
                  sx={{ flex: 1 }}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ViewIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowDetails(asset);
                  }}
                  sx={{ flex: 1 }}
                >
                  Details
                </Button>
              </Stack>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  // Filter Drawer Component
  const FilterDrawer = () => (
    <SwipeableDrawer
      anchor="bottom"
      open={filterDrawerOpen}
      onClose={() => setFilterDrawerOpen(false)}
      onOpen={() => setFilterDrawerOpen(true)}
      swipeAreaWidth={20}
      disableSwipeToOpen={false}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '80vh',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* Drag handle */}
        <Box
          sx={{
            width: 40,
            height: 4,
            bgcolor: 'grey.300',
            borderRadius: 2,
            mx: 'auto',
            mb: 2,
          }}
        />

        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Filter Assets
        </Typography>

        {/* Sort options */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            label="Sort By"
          >
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="status">Status</MenuItem>
            <MenuItem value="criticality">Criticality</MenuItem>
            <MenuItem value="updated">Recently Updated</MenuItem>
          </Select>
        </FormControl>

        {/* Status filters */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Status
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {['ONLINE', 'OFFLINE'].map(status => (
              <Chip
                key={status}
                label={status}
                onClick={() => {
                  setActiveFilters(prev => ({
                    ...prev,
                    status: prev.status.includes(status)
                      ? prev.status.filter(s => s !== status)
                      : [...prev.status, status]
                  }));
                }}
                color={activeFilters.status.includes(status) ? 'primary' : 'default'}
                variant={activeFilters.status.includes(status) ? 'filled' : 'outlined'}
              />
            ))}
          </Stack>
        </Box>

        {/* Criticality filters */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Criticality
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {['IMPORTANT', 'HIGH', 'MEDIUM', 'LOW'].map(criticality => (
              <Chip
                key={criticality}
                label={criticality}
                onClick={() => {
                  setActiveFilters(prev => ({
                    ...prev,
                    criticality: prev.criticality.includes(criticality)
                      ? prev.criticality.filter(c => c !== criticality)
                      : [...prev.criticality, criticality]
                  }));
                }}
                color={activeFilters.criticality.includes(criticality) ? 'primary' : 'default'}
                variant={activeFilters.criticality.includes(criticality) ? 'filled' : 'outlined'}
              />
            ))}
          </Stack>
        </Box>

        {/* Location filters */}
        {uniqueLocations.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Location
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {uniqueLocations.map(location => (
                <Chip
                  key={location}
                  label={location}
                  onClick={() => {
                    setActiveFilters(prev => ({
                      ...prev,
                      location: prev.location.includes(location)
                        ? prev.location.filter(l => l !== location)
                        : [...prev.location, location]
                    }));
                  }}
                  color={activeFilters.location.includes(location) ? 'primary' : 'default'}
                  variant={activeFilters.location.includes(location) ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Action buttons */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              setActiveFilters({ status: [], criticality: [], location: [] });
              setSortBy('name');
            }}
          >
            Clear All
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={() => setFilterDrawerOpen(false)}
          >
            Apply
          </Button>
        </Stack>
      </Box>
    </SwipeableDrawer>
  );

  // Asset Details Bottom Sheet
  const AssetDetailsDrawer = () => (
    <SwipeableDrawer
      anchor="bottom"
      open={detailsDrawerOpen}
      onClose={() => setDetailsDrawerOpen(false)}
      onOpen={() => setDetailsDrawerOpen(true)}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '90vh',
        },
      }}
    >
      {selectedDetailAsset && (
        <Box sx={{ pb: 2 }}>
          {/* Header with close button */}
          <AppBar position="sticky" color="default" elevation={0}>
            <Toolbar>
              <Typography variant="h6" sx={{ flex: 1 }}>
                {selectedDetailAsset.name}
              </Typography>
              <IconButton edge="end" onClick={() => setDetailsDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </AppBar>

          <Box sx={{ p: 2 }}>
            {/* Asset image placeholder */}
            {selectedDetailAsset.imageUrl || (selectedDetailAsset.attachments && selectedDetailAsset.attachments.length > 0) ? (
              <CardMedia
                component="img"
                height="200"
                image={
                  selectedDetailAsset.imageUrl || 
                  (selectedDetailAsset.attachments && selectedDetailAsset.attachments.find((att: any) => 
                    att.url && (att.url.includes('.png') || att.url.includes('.jpg') || att.url.includes('.jpeg') || att.url.includes('.gif'))
                  )?.url)
                }
                alt={selectedDetailAsset.name}
                sx={{ borderRadius: 2, mb: 2 }}
              />
            ) : (
              <Box
                sx={{
                  height: 200,
                  bgcolor: 'grey.200',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                <BuildIcon sx={{ fontSize: 64, color: 'grey.400' }} />
              </Box>
            )}

            {/* Status and criticality */}
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip
                icon={selectedDetailAsset.status === 'ONLINE' ? <OnlineIcon /> : <OfflineIcon />}
                label={selectedDetailAsset.status}
                color={selectedDetailAsset.status === 'ONLINE' ? 'success' : 'error'}
              />
              <Chip
                label={selectedDetailAsset.criticality}
                variant="outlined"
              />
            </Stack>

            {/* Details sections */}
            <List>
              {selectedDetailAsset.serialNumber && (
                <ListItem>
                  <ListItemText
                    primary="Serial Number"
                    secondary={selectedDetailAsset.serialNumber}
                  />
                </ListItem>
              )}
              {selectedDetailAsset.manufacturer && (
                <ListItem>
                  <ListItemText
                    primary="Manufacturer"
                    secondary={selectedDetailAsset.manufacturer}
                  />
                </ListItem>
              )}
              {selectedDetailAsset.modelNumber && (
                <ListItem>
                  <ListItemText
                    primary="Model"
                    secondary={selectedDetailAsset.modelNumber}
                  />
                </ListItem>
              )}
              {selectedDetailAsset.location && (
                <ListItem>
                  <ListItemIcon>
                    <LocationIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Location"
                    secondary={selectedDetailAsset.location.name}
                  />
                </ListItem>
              )}
            </List>

            {/* Action buttons */}
            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<EditIcon />}
                onClick={() => {
                  setDetailsDrawerOpen(false);
                  handleQuickEdit(selectedDetailAsset);
                }}
              >
                Edit Asset
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<WorkOrderIcon />}
                onClick={() => {
                  // Navigate to work orders for this asset
                  console.log('View work orders for', selectedDetailAsset.id);
                }}
              >
                View WOs
              </Button>
            </Stack>
          </Box>
        </Box>
      )}
    </SwipeableDrawer>
  );

  // Mobile Header Component
  const MobileHeader = () => (
    <AppBar 
      position="sticky" 
      color="default" 
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar sx={{ px: 2 }}>
        <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>
          Assets
        </Typography>
        
        {multiSelectMode ? (
          <>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {selectedCards.size} selected
            </Typography>
            <IconButton onClick={exitMultiSelectMode}>
              <CloseIcon />
            </IconButton>
          </>
        ) : (
          <Stack direction="row" spacing={1}>
            <IconButton onClick={() => setQrScannerOpen(true)} title="Scan QR Code">
              <QrScannerIcon />
            </IconButton>
            <IconButton onClick={() => setViewMode(viewMode === 'card' ? 'list' : 'card')}>
              {viewMode === 'card' ? <ViewListIcon /> : <GridViewIcon />}
            </IconButton>
            <IconButton onClick={() => setFilterDrawerOpen(true)}>
              <Badge
                badgeContent={
                  activeFilters.status.length + 
                  activeFilters.criticality.length + 
                  activeFilters.location.length
                }
                color="primary"
              >
                <FilterIcon />
              </Badge>
            </IconButton>
          </Stack>
        )}
      </Toolbar>
    </AppBar>
  );

  // Search Bar Component
  const SearchBar = () => (
    <Box
      sx={{
        p: 2,
        pb: 1,
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 56,
        zIndex: 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <TextField
        ref={searchInputRef}
        fullWidth
        placeholder="Search assets..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setSearchTerm('')}>
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          },
        }}
      />
      
      {/* Active filters display */}
      {(activeFilters.status.length > 0 || 
        activeFilters.criticality.length > 0 || 
        activeFilters.location.length > 0) && (
        <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {[...activeFilters.status, ...activeFilters.criticality, ...activeFilters.location].map((filter, index) => (
            <Chip
              key={`${filter}-${index}`}
              label={filter}
              size="small"
              onDelete={() => {
                // Remove specific filter
                setActiveFilters(prev => ({
                  status: prev.status.filter(f => f !== filter),
                  criticality: prev.criticality.filter(f => f !== filter),
                  location: prev.location.filter(f => f !== filter),
                }));
              }}
            />
          ))}
          <Chip
            label="Clear all"
            size="small"
            onClick={() => setActiveFilters({ status: [], criticality: [], location: [] })}
            variant="outlined"
          />
        </Box>
      )}
    </Box>
  );

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ height: '100vh', bgcolor: 'background.default' }}>
        {isMobile && <MobileHeader />}
        <Box sx={{ p: 2 }}>
          {[1, 2, 3, 4].map((item) => (
            <Card key={item} sx={{ mb: 2 }}>
              <CardContent>
                <Skeleton variant="text" width="60%" height={28} />
                <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Skeleton variant="rounded" width={60} height={24} />
                  <Skeleton variant="rounded" width={80} height={24} />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          Failed to load assets. Please try again.
        </Alert>
      </Box>
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        <MobileHeader />
        <SearchBar />
        
        {/* Pull to refresh indicator */}
        {isRefreshing && (
          <LinearProgress 
            sx={{ 
              position: 'absolute',
              top: 56,
              left: 0,
              right: 0,
              zIndex: 2,
            }}
          />
        )}

        {/* Assets list */}
        <Box
          ref={scrollContainerRef}
          {...swipeHandlers}
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 2,
            pt: 2,
            pb: 10, // Space for FAB and bottom nav
          }}
        >
          {filteredAssets.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <BuildIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No assets found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {searchTerm || activeFilters.status.length > 0 || activeFilters.criticality.length > 0
                  ? 'Try adjusting your filters'
                  : 'Add your first asset to get started'}
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {filteredAssets.length} assets found
              </Typography>
              
              {viewMode === 'card' ? (
                <Box>
                  {[...filteredAssets].sort((a, b) => {
                    // Apply the same sorting logic as sortedAssets
                    switch (sortBy) {
                      case 'name':
                        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
                      case 'status':
                        const statusOrder = { 'ONLINE': 0, 'OFFLINE': 1, 'MAINTENANCE': 2 };
                        const aStatus = (statusOrder as any)[a.status] ?? 999;
                        const bStatus = (statusOrder as any)[b.status] ?? 999;
                        return sortOrder === 'asc' ? aStatus - bStatus : bStatus - aStatus;
                      case 'criticality':
                        const criticalityOrder = { 'LOW': 0, 'MEDIUM': 1, 'HIGH': 2, 'IMPORTANT': 3 };
                        const aCrit = (criticalityOrder as any)[a.criticality] ?? 999;
                        const bCrit = (criticalityOrder as any)[b.criticality] ?? 999;
                        return sortOrder === 'asc' ? aCrit - bCrit : bCrit - aCrit;
                      case 'created':
                        const aDate = new Date(a.createdAt || 0).getTime();
                        const bDate = new Date(b.createdAt || 0).getTime();
                        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
                      default:
                        return 0;
                    }
                  }).map((asset) => (
                    <MobileAssetCard key={asset.id} asset={asset} />
                  ))}
                </Box>
              ) : (
                <List>
                  {[...filteredAssets].sort((a, b) => {
                    // Apply the same sorting logic as sortedAssets
                    switch (sortBy) {
                      case 'name':
                        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
                      case 'status':
                        const statusOrder = { 'ONLINE': 0, 'OFFLINE': 1, 'MAINTENANCE': 2 };
                        const aStatus = (statusOrder as any)[a.status] ?? 999;
                        const bStatus = (statusOrder as any)[b.status] ?? 999;
                        return sortOrder === 'asc' ? aStatus - bStatus : bStatus - aStatus;
                      case 'criticality':
                        const criticalityOrder = { 'LOW': 0, 'MEDIUM': 1, 'HIGH': 2, 'IMPORTANT': 3 };
                        const aCrit = (criticalityOrder as any)[a.criticality] ?? 999;
                        const bCrit = (criticalityOrder as any)[b.criticality] ?? 999;
                        return sortOrder === 'asc' ? aCrit - bCrit : bCrit - aCrit;
                      case 'created':
                        const aDate = new Date(a.createdAt || 0).getTime();
                        const bDate = new Date(b.createdAt || 0).getTime();
                        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
                      default:
                        return 0;
                    }
                  }).map((asset, index) => [
                    <ListItem
                      key={asset.id}
                      onClick={() => handleCardClick(asset)}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        '&:active': {
                          bgcolor: 'action.selected',
                        },
                      }}
                    >
                      {multiSelectMode && (
                        <ListItemIcon>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCard(asset.id);
                            }}
                          >
                            {selectedCards.has(asset.id) ? 
                              <CheckBoxIcon color="primary" /> : 
                              <CheckBoxBlankIcon />
                            }
                          </IconButton>
                        </ListItemIcon>
                      )}
                      <ListItemText
                        primary={asset.name}
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {asset.location?.name || 'No location'}
                            </Typography>
                            <Box sx={{ mt: 0.5 }}>
                              <Chip
                                label={asset.status}
                                size="small"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                                color={asset.status === 'ONLINE' ? 'success' : 'error'}
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>,
                    index < filteredAssets.length - 1 && <Divider key={`divider-${asset.id}`} />
                  ]).flat().filter(Boolean)}
                </List>
              )}
            </Box>
          )}
        </Box>

        {/* Floating Action Button */}
        {!multiSelectMode && (
          <Fab
            color="primary"
            onClick={handleCreateAsset}
            sx={{
              position: 'fixed',
              bottom: 80,
              right: 16,
              zIndex: 10,
            }}
          >
            <AddIcon />
          </Fab>
        )}

        {/* Multi-select actions */}
        {multiSelectMode && (
          <Paper
            elevation={8}
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              p: 2,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }}
          >
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                fullWidth
                onClick={exitMultiSelectMode}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                fullWidth
                color="error"
                onClick={handleBatchDelete}
                disabled={selectedCards.size === 0}
              >
                Delete ({selectedCards.size})
              </Button>
            </Stack>
          </Paper>
        )}

        {/* Drawers */}
        <FilterDrawer />
        <AssetDetailsDrawer />

        {/* Asset Form Dialog */}
        <AssetForm
          open={openDialog}
          onClose={() => {
            setOpenDialog(false);
            setSelectedAsset(null);
          }}
          onSubmit={handleSubmitAsset}
          initialData={selectedAsset}
          mode={formMode}
          loading={createAssetMutation.isPending || updateAssetMutation.isPending}
        />

        {/* QR Components */}
        <QRScanner
          open={qrScannerOpen}
          onClose={() => setQrScannerOpen(false)}
          onScan={handleQRScan}
        />


        <QRActionHandler
          scanResult={qrScanResult}
          onClose={handleQRActionClose}
        />
      </Box>
    );
  }

  // Desktop/Tablet Layout (updated to match WorkOrders pattern)
  return (
    <Fade in timeout={400}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header with breadcrumbs */}
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
            <Link color="inherit" href="/">
              Dashboard
            </Link>
            <Typography color="text.primary">Assets</Typography>
          </Breadcrumbs>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                Assets
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage and track your equipment and resources
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<QrScannerIcon />}
                onClick={() => setQrScannerOpen(true)}
              >
                Scan QR
              </Button>
              <UniversalExportButton
                data={filteredAssets}
                dataSource="assets"
                entityType="assets"
                showBadge={filteredAssets.length > 0}
                badgeContent={filteredAssets.length}
                buttonText="Export"
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateAsset}
              >
                Add Asset
              </Button>
            </Box>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {assetStats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Assets
                </Typography>
              </Paper>
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {assetStats.online}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Online
                </Typography>
              </Paper>
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                  {assetStats.offline}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Offline
                </Typography>
              </Paper>
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                  {assetStats.critical}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Critical
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Search and Filters */}
          <Box sx={{ mb: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ maxWidth: { sm: 400 } }}
              />
              
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setFilterDrawerOpen(true)}
                sx={{ minWidth: 120 }}
              >
                Filters
              </Button>
            </Stack>

            {/* Tabs */}
            <Tabs
              value={currentTab}
              onChange={(event, newValue) => setCurrentTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    All
                    <Chip label={filteredTabCounts.all} size="small" />
                  </Box>
                }
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Online
                    <Chip label={filteredTabCounts.online} size="small" color="success" />
                  </Box>
                }
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Offline
                    <Chip label={filteredTabCounts.offline} size="small" color="error" />
                  </Box>
                }
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    High Priority
                    <Chip label={filteredTabCounts.high} size="small" color="warning" />
                  </Box>
                }
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Critical
                    <Chip label={filteredTabCounts.critical} size="small" color="error" />
                  </Box>
                }
              />
            </Tabs>
          </Box>
        </Box>

        {/* DataTable with responsive design */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <DataTable
              data={filteredAssets}
              onRowClick={(row: any) => handleCardClick(row)}
              onView={(row: any) => handleCardClick(row)}
              onEdit={(row: any) => handleQuickEdit(row)}
              onDelete={(row: any) => handleDeleteAsset(row)}
              columns={[
                {
                  key: 'name',
                  label: 'Asset Name',
                  sortable: true,
                  priority: 'high' as const,
                  render: (value: string, row: any) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {(row.imageUrl || (row.attachments && row.attachments.length > 0)) && (
                        <Avatar
                          src={
                            row.imageUrl || 
                            (row.attachments && row.attachments.find((att: any) => 
                              att.url && (att.url.includes('.png') || att.url.includes('.jpg') || att.url.includes('.jpeg') || att.url.includes('.gif'))
                            )?.url)
                          }
                          sx={{ width: 40, height: 40 }}
                        >
                          <BuildIcon />
                        </Avatar>
                      )}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {row.name}
                        </Typography>
                        {row.location && (
                          <Typography variant="caption" color="text.secondary">
                            {row.location.name}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ),
                },
                {
                  key: 'status',
                  label: 'Status',
                  sortable: true,
                  priority: 'high' as const,
                  render: (value: string, row: any) => (
                    <Chip
                      label={row.status}
                      size="small"
                      color={row.status === 'ONLINE' ? 'success' : 'error'}
                    />
                  ),
                },
                {
                  key: 'criticality',
                  label: 'Criticality',
                  sortable: true,
                  priority: 'medium' as const,
                  render: (value: string, row: any) => (
                    <Chip
                      label={row.criticality}
                      size="small"
                      variant="outlined"
                      color={
                        row.criticality === 'HIGH' ? 'error' :
                        row.criticality === 'IMPORTANT' ? 'warning' : 'default'
                      }
                    />
                  ),
                },
                {
                  key: 'model',
                  label: 'Model',
                  sortable: true,
                  priority: 'low' as const,
                  render: (value: string, row: any) => (
                    <Typography variant="body2">
                      {row.model || '-'}
                    </Typography>
                  ),
                },
                {
                  key: 'serialNumber',
                  label: 'Serial Number',
                  sortable: true,
                  priority: 'low' as const,
                  render: (value: string, row: any) => (
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {row.serialNumber || '-'}
                    </Typography>
                  ),
                },
              ]}
              emptyMessage={
                filteredAssets.length === 0 && (searchTerm || activeFilters.status.length > 0 || activeFilters.criticality.length > 0) 
                  ? 'No assets match your search or filters'
                  : 'No assets found. Add your first asset to get started.'
              }
              hideToolbar={true}
            />
          </CardContent>
        </Card>

        {/* Desktop filter drawer */}
        <FilterDrawer />

        {/* Asset Form Dialog */}
        <AssetForm
          open={openDialog}
          onClose={() => {
            setOpenDialog(false);
            setSelectedAsset(null);
          }}
          onSubmit={handleSubmitAsset}
          initialData={selectedAsset}
          mode={formMode}
          loading={createAssetMutation.isPending || updateAssetMutation.isPending}
        />

        {/* QR Scanner */}
        <QRScanner
          open={qrScannerOpen}
          onClose={() => setQrScannerOpen(false)}
          onScan={handleQRScan}
          title="Scan Asset QR Code"
        />

        {/* QR Action Handler */}
        <QRActionHandler
          scanResult={qrScanResult}
          onClose={() => {
            setQrScanResult(null);
          }}
        />
      </Container>
    </Fade>
  );
}