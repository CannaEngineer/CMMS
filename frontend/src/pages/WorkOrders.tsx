import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Card,
  CardContent,
  Avatar,
  useTheme,
  useMediaQuery,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Stack,
  SwipeableDrawer,
  Divider,
  ButtonGroup,
  Badge,
  Container,
  Slide,
  Fade,
  Collapse,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  ViewList as ListViewIcon,
  ViewModule as CardViewIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Warning as PriorityIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  SwipeLeft as SwipeLeftIcon,
  SwipeRight as SwipeRightIcon,
  Close as CloseIcon,
  Tune as TuneIcon,
  Refresh as RefreshIcon,
  KeyboardArrowUp as UpIcon,
  KeyboardArrowDown as DownIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  CheckCircle as CompleteIcon,
  PlayArrow as StartIcon,
  Pause as HoldIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DataTable from '../components/Common/DataTable';
import WorkOrderForm from '../components/Forms/WorkOrderForm';
import { workOrdersService } from '../services/api';
import { statusColors } from '../theme/theme';

interface WorkOrder {
  id: number;
  legacyId?: number;
  title: string;
  description?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assetId?: number;
  assignedToId?: number;
  organizationId: number;
  createdAt: string;
  updatedAt: string;
  asset?: {
    id: number;
    name: string;
  };
  assignedTo?: {
    id: number;
    name: string;
  };
}

export default function WorkOrders() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Form and modal states
  const [workOrderFormOpen, setWorkOrderFormOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  
  // View and filter states
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  // Mobile-specific states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Refs for touch interactions
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Query for work orders data with refresh capabilities
  const { 
    data: workOrders = [], 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['work-orders'],
    queryFn: workOrdersService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Mutations
  const createWorkOrderMutation = useMutation({
    mutationFn: workOrdersService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      setWorkOrderFormOpen(false);
      setSelectedWorkOrder(null);
    },
  });

  const updateWorkOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => workOrdersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      setWorkOrderFormOpen(false);
      setSelectedWorkOrder(null);
    },
  });

  const deleteWorkOrderMutation = useMutation({
    mutationFn: workOrdersService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });

  // Pull-to-refresh functionality
  const handlePullToRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      setSnackbarMessage('Work orders refreshed');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to refresh');
      setSnackbarOpen(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // Work order actions
  const handleCreateWorkOrder = useCallback(() => {
    setSelectedWorkOrder(null);
    setFormMode('create');
    setWorkOrderFormOpen(true);
  }, []);

  const handleEditWorkOrder = useCallback((workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setFormMode('edit');
    setWorkOrderFormOpen(true);
    setAnchorEl(null);
    setQuickActionOpen(false);
  }, []);

  const handleViewWorkOrder = useCallback((workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setFormMode('view');
    setWorkOrderFormOpen(true);
    setAnchorEl(null);
    setQuickActionOpen(false);
  }, []);

  const handleDeleteWorkOrder = useCallback((workOrder: WorkOrder) => {
    if (window.confirm(`Are you sure you want to delete work order "${workOrder.title}"?`)) {
      deleteWorkOrderMutation.mutate(workOrder.id.toString());
      setSnackbarMessage('Work order deleted');
      setSnackbarOpen(true);
    }
    setAnchorEl(null);
    setQuickActionOpen(false);
  }, [deleteWorkOrderMutation]);

  const handleQuickStatusUpdate = useCallback((workOrder: WorkOrder, newStatus: WorkOrder['status']) => {
    updateWorkOrderMutation.mutate({ 
      id: workOrder.id.toString(), 
      data: { ...workOrder, status: newStatus } 
    });
    setSnackbarMessage(`Status updated to ${newStatus.replace('_', ' ')}`);
    setSnackbarOpen(true);
    setQuickActionOpen(false);
  }, [updateWorkOrderMutation]);

  const handleWorkOrderSubmit = useCallback((data: any) => {
    if (formMode === 'create') {
      createWorkOrderMutation.mutate(data);
    } else if (formMode === 'edit' && selectedWorkOrder) {
      updateWorkOrderMutation.mutate({ id: selectedWorkOrder.id.toString(), data });
    }
  }, [formMode, selectedWorkOrder, createWorkOrderMutation, updateWorkOrderMutation]);

  const handleCardAction = useCallback((event: React.MouseEvent<HTMLElement>, workOrder: WorkOrder) => {
    event.stopPropagation();
    setSelectedWorkOrder(workOrder);
    setSelectedCardId(workOrder.id);
    if (isMobile) {
      setQuickActionOpen(true);
    } else {
      setAnchorEl(event.currentTarget);
    }
  }, [isMobile]);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedCardId(null);
    setQuickActionOpen(false);
  }, []);

  // Touch handlers for swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent, workOrder: WorkOrder) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setSelectedWorkOrder(workOrder);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !selectedWorkOrder) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > 100 && deltaY < 50) {
      if (deltaX > 0) {
        // Swipe right - mark as complete
        if (selectedWorkOrder.status !== 'COMPLETED') {
          handleQuickStatusUpdate(selectedWorkOrder, 'COMPLETED');
          setSwipeDirection('right');
        }
      } else {
        // Swipe left - mark as in progress
        if (selectedWorkOrder.status !== 'IN_PROGRESS') {
          handleQuickStatusUpdate(selectedWorkOrder, 'IN_PROGRESS');
          setSwipeDirection('left');
        }
      }
      
      // Reset swipe animation after short delay
      setTimeout(() => setSwipeDirection(null), 300);
    }
    
    touchStartRef.current = null;
  }, [selectedWorkOrder, handleQuickStatusUpdate]);

  // Enhanced filtering with active filter support
  const filteredWorkOrders = workOrders.filter((workOrder: WorkOrder) => {
    const matchesSearch = searchTerm === '' || 
      workOrder.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workOrder.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workOrder.asset?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workOrder.assignedTo?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = currentTab === 0 || // All
                      (currentTab === 1 && workOrder.status === 'OPEN') ||
                      (currentTab === 2 && workOrder.status === 'IN_PROGRESS') ||
                      (currentTab === 3 && workOrder.status === 'COMPLETED');
    
    const matchesFilters = activeFilters.length === 0 || 
      activeFilters.some(filter => {
        switch (filter) {
          case 'urgent': return workOrder.priority === 'URGENT';
          case 'high': return workOrder.priority === 'HIGH';
          case 'unassigned': return !workOrder.assignedToId;
          case 'overdue': return new Date(workOrder.createdAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          default: return true;
        }
      });
    
    return matchesSearch && matchesTab && matchesFilters;
  });

  // Enhanced stats calculation
  const workOrderStats = {
    total: workOrders.length,
    open: workOrders.filter((wo: WorkOrder) => wo.status === 'OPEN').length,
    inProgress: workOrders.filter((wo: WorkOrder) => wo.status === 'IN_PROGRESS').length,
    completed: workOrders.filter((wo: WorkOrder) => wo.status === 'COMPLETED').length,
    urgent: workOrders.filter((wo: WorkOrder) => wo.priority === 'URGENT').length,
    overdue: workOrders.filter((wo: WorkOrder) => 
      (wo.status === 'OPEN' || wo.status === 'IN_PROGRESS') &&
      new Date(wo.createdAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length,
  };

  // Enhanced color and icon helpers
  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'OPEN': return 'warning';
      case 'IN_PROGRESS': return 'info';
      case 'COMPLETED': return 'success';
      case 'ON_HOLD': return 'error';
      case 'CANCELED': return 'default';
      default: return 'default';
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'OPEN': return <ScheduleIcon />;
      case 'IN_PROGRESS': return <StartIcon />;
      case 'COMPLETED': return <CompleteIcon />;
      case 'ON_HOLD': return <HoldIcon />;
      default: return <ScheduleIcon />;
    }
  }, []);

  const getPriorityIcon = useCallback((priority: string) => {
    return <PriorityIcon />;
  }, []);

  // Mobile-optimized work order card component
  const WorkOrderCard = React.memo(({ workOrder, index }: { workOrder: WorkOrder; index: number }) => {
    const isSwipingLeft = swipeDirection === 'left' && selectedWorkOrder?.id === workOrder.id;
    const isSwipingRight = swipeDirection === 'right' && selectedWorkOrder?.id === workOrder.id;
    
    return (
      <Slide direction="up" in={true} timeout={200 + index * 50}>
        <Card
          sx={{
            mb: 2,
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transform: isSwipingLeft ? 'translateX(-10px)' : isSwipingRight ? 'translateX(10px)' : 'none',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[4],
            },
            '&:active': {
              transform: 'scale(0.98)',
            },
          }}
          onTouchStart={(e) => handleTouchStart(e, workOrder)}
          onTouchEnd={handleTouchEnd}
          onClick={() => handleViewWorkOrder(workOrder)}
        >
          {/* Priority indicator bar */}
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              bgcolor: `${getPriorityColor(workOrder.priority)}.main`,
            }}
          />
          
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    WO-{workOrder.id}
                  </Typography>
                  <Chip
                    label={workOrder.priority}
                    color={getPriorityColor(workOrder.priority) as any}
                    size="small"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
                
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1, lineHeight: 1.2 }}>
                  {workOrder.title}
                </Typography>
                
                {workOrder.description && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {workOrder.description}
                  </Typography>
                )}
                
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  {workOrder.asset && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {workOrder.asset.name}
                      </Typography>
                    </Box>
                  )}
                  
                  {workOrder.assignedTo && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Avatar sx={{ width: 16, height: 16, fontSize: '0.7rem' }}>
                        {workOrder.assignedTo.name.charAt(0)}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary">
                        {workOrder.assignedTo.name}
                      </Typography>
                    </Box>
                  )}
                  
                  <Typography variant="caption" color="text.secondary">
                    {new Date(workOrder.createdAt).toLocaleDateString()}
                  </Typography>
                </Stack>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={workOrder.status.replace('_', ' ')}
                  color={getStatusColor(workOrder.status) as any}
                  size="small"
                  icon={getStatusIcon(workOrder.status)}
                  sx={{ minWidth: 100 }}
                />
                
                <IconButton
                  onClick={(e) => handleCardAction(e, workOrder)}
                  sx={{ 
                    minWidth: 48, 
                    minHeight: 48,
                    '&:hover': {
                      bgcolor: 'action.hover',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <MoreIcon />
                </IconButton>
              </Box>
            </Box>
            
            {/* Swipe hints */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              opacity: 0.6,
              fontSize: '0.75rem',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <SwipeRightIcon fontSize="small" />
                <Typography variant="caption">Complete</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption">In Progress</Typography>
                <SwipeLeftIcon fontSize="small" />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Slide>
    );
  });

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading work orders: {error.message}
          <Button onClick={() => refetch()} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Mobile Header with Breadcrumbs */}
      {isMobile && (
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar sx={{ px: 2, minHeight: { xs: 56, sm: 64 } }}>
            <Box sx={{ flexGrow: 1 }}>
              <Breadcrumbs separator="›" sx={{ mb: 1 }}>
                <Link
                  color="inherit"
                  href="#"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem' }}
                >
                  <HomeIcon fontSize="small" />
                  Home
                </Link>
                <Link
                  color="inherit"
                  href="#"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem' }}
                >
                  <BusinessIcon fontSize="small" />
                  CMMS
                </Link>
                <Typography color="text.primary" sx={{ fontSize: '0.875rem' }}>
                  Work Orders
                </Typography>
              </Breadcrumbs>
              
              <Typography 
                variant="h5" 
                component="h1" 
                sx={{ fontSize: '1.5rem', fontWeight: 600, color: 'text.primary' }}
              >
                Work Orders
              </Typography>
            </Box>
            
            <IconButton 
              onClick={() => setShowSearch(!showSearch)}
              sx={{ minWidth: 48, minHeight: 48 }}
            >
              <SearchIcon />
            </IconButton>
            
            <IconButton 
              onClick={handlePullToRefresh}
              disabled={isRefreshing}
              sx={{ minWidth: 48, minHeight: 48, ml: 1 }}
            >
              {isRefreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Toolbar>
          
          {/* Mobile Search Bar */}
          <Collapse in={showSearch}>
            <Box sx={{ p: 2, bgcolor: 'background.default' }}>
              <TextField
                fullWidth
                placeholder="Search work orders..."
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
                      <IconButton
                        onClick={() => setSearchTerm('')}
                        size="small"
                      >
                        <CloseIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  '& .MuiInputBase-root': {
                    height: 48,
                    borderRadius: 3,
                  }
                }}
              />
            </Box>
          </Collapse>
        </AppBar>
      )}
      
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        {/* Desktop Header */}
        {!isMobile && (
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center"
            mb={4}
          >
            <Box>
              <Breadcrumbs separator="›" sx={{ mb: 1 }}>
                <Link
                  color="inherit"
                  href="#"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  <HomeIcon fontSize="small" />
                  Home
                </Link>
                <Link
                  color="inherit"
                  href="#"
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  <BusinessIcon fontSize="small" />
                  CMMS
                </Link>
                <Typography color="text.primary">
                  Work Orders
                </Typography>
              </Breadcrumbs>
              
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom
                sx={{ fontSize: '2.125rem', fontWeight: 600 }}
              >
                Work Orders
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage and track maintenance work orders
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateWorkOrder}
              disabled={createWorkOrderMutation.isPending}
              sx={{ 
                minHeight: 48,
                px: 3,
                borderRadius: 3,
                boxShadow: 2,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
                transition: 'all 0.2s ease',
              }}
            >
              Create Work Order
            </Button>
          </Box>
        )}

        {/* Mobile-First Stats Section */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
            {/* Mobile: 2x2 grid */}
            <Grid item xs={6} sm={4} md={2.4}>
              <Card sx={{ 
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': { 
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <CardContent sx={{ 
                  p: { xs: 2, sm: 2.5, md: 3 }, 
                  '&:last-child': { pb: { xs: 2, sm: 2.5, md: 3 } },
                  textAlign: 'center',
                  position: 'relative',
                }}>
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    bgcolor: 'primary.main',
                  }} />
                  <Typography 
                    variant="h3" 
                    color="primary.main"
                    sx={{ 
                      fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
                      fontWeight: 700,
                      mb: 1,
                    }}
                  >
                    {workOrderStats.total}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      fontWeight: 500,
                    }}
                  >
                    Total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} sm={4} md={2.4}>
              <Card sx={{ 
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': { 
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <CardContent sx={{ 
                  p: { xs: 2, sm: 2.5, md: 3 }, 
                  '&:last-child': { pb: { xs: 2, sm: 2.5, md: 3 } },
                  textAlign: 'center',
                  position: 'relative',
                }}>
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    bgcolor: 'warning.main',
                  }} />
                  <Typography 
                    variant="h3" 
                    color="warning.main"
                    sx={{ 
                      fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
                      fontWeight: 700,
                      mb: 1,
                    }}
                  >
                    {workOrderStats.open}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      fontWeight: 500,
                    }}
                  >
                    Open
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} sm={4} md={2.4}>
              <Card sx={{ 
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': { 
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <CardContent sx={{ 
                  p: { xs: 2, sm: 2.5, md: 3 }, 
                  '&:last-child': { pb: { xs: 2, sm: 2.5, md: 3 } },
                  textAlign: 'center',
                  position: 'relative',
                }}>
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    bgcolor: 'info.main',
                  }} />
                  <Typography 
                    variant="h3" 
                    color="info.main"
                    sx={{ 
                      fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
                      fontWeight: 700,
                      mb: 1,
                    }}
                  >
                    {workOrderStats.inProgress}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      fontWeight: 500,
                    }}
                  >
                    Active
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} sm={4} md={2.4}>
              <Card sx={{ 
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': { 
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <CardContent sx={{ 
                  p: { xs: 2, sm: 2.5, md: 3 }, 
                  '&:last-child': { pb: { xs: 2, sm: 2.5, md: 3 } },
                  textAlign: 'center',
                  position: 'relative',
                }}>
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    bgcolor: 'success.main',
                  }} />
                  <Typography 
                    variant="h3" 
                    color="success.main"
                    sx={{ 
                      fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
                      fontWeight: 700,
                      mb: 1,
                    }}
                  >
                    {workOrderStats.completed}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      fontWeight: 500,
                    }}
                  >
                    Done
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={8} md={2.4}>
              <Card sx={{ 
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': { 
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <CardContent sx={{ 
                  p: { xs: 2, sm: 2.5, md: 3 }, 
                  '&:last-child': { pb: { xs: 2, sm: 2.5, md: 3 } },
                  textAlign: 'center',
                  position: 'relative',
                }}>
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    bgcolor: 'error.main',
                  }} />
                  <Typography 
                    variant="h3" 
                    color="error.main"
                    sx={{ 
                      fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
                      fontWeight: 700,
                      mb: 1,
                    }}
                  >
                    {workOrderStats.urgent}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      fontWeight: 500,
                    }}
                  >
                    Urgent
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Mobile-First Filters and Navigation */}
        <Paper sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
          {/* Status Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={currentTab} 
              onChange={(e, newValue) => setCurrentTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  minHeight: { xs: 48, sm: 56 },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  minWidth: { xs: 80, sm: 120 },
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                }
              }}
            >
              <Tab 
                label={`All (${workOrderStats.total})`} 
              />
              <Tab 
                label={`Open (${workOrderStats.open})`}
              />
              <Tab 
                label={`Active (${workOrderStats.inProgress})`}
              />
              <Tab 
                label={`Done (${workOrderStats.completed})`}
              />
            </Tabs>
          </Box>
          
          {/* Desktop Search and Filters */}
          {!isMobile && (
            <Box sx={{ 
              p: 2, 
              display: 'flex', 
              gap: 2, 
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <TextField
                placeholder="Search work orders..."
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
                      <IconButton
                        onClick={() => setSearchTerm('')}
                        size="small"
                      >
                        <CloseIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  flexGrow: 1, 
                  minWidth: 300,
                  '& .MuiInputBase-root': {
                    height: 48,
                    borderRadius: 3,
                  }
                }}
              />
              
              <ButtonGroup variant="outlined" sx={{ height: 48 }}>
                <Button
                  startIcon={<TuneIcon />}
                  onClick={() => setFiltersOpen(true)}
                  sx={{ px: 3, borderRadius: '24px 0 0 24px' }}
                >
                  Filters
                  {activeFilters.length > 0 && (
                    <Chip 
                      label={activeFilters.length} 
                      size="small" 
                      color="primary" 
                      sx={{ ml: 1, minWidth: 20, height: 20 }}
                    />
                  )}
                </Button>
                
                <Button
                  onClick={handlePullToRefresh}
                  disabled={isRefreshing}
                  sx={{ px: 2, borderRadius: '0 24px 24px 0' }}
                >
                  {isRefreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
                </Button>
              </ButtonGroup>
            </Box>
          )}
          
          {/* Mobile Filter Chips */}
          {isMobile && (
            <Box sx={{ p: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip
                icon={<TuneIcon />}
                label="Filters"
                onClick={() => setFiltersOpen(true)}
                variant={activeFilters.length > 0 ? "filled" : "outlined"}
                color={activeFilters.length > 0 ? "primary" : "default"}
                sx={{ 
                  minHeight: 36,
                  '& .MuiChip-label': { px: 1 },
                }}
              />
              
              {activeFilters.map((filter) => (
                <Chip
                  key={filter}
                  label={filter.charAt(0).toUpperCase() + filter.slice(1)}
                  onDelete={() => setActiveFilters(prev => prev.filter(f => f !== filter))}
                  size="small"
                  color="primary"
                  variant="filled"
                  sx={{ minHeight: 32 }}
                />
              ))}
              
              {activeFilters.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  Swipe cards left/right to change status
                </Typography>
              )}
            </Box>
          )}
        </Paper>

        {/* Mobile-First Work Orders List */}
        <Box sx={{ mb: { xs: 10, sm: 4 } }}>
          {/* Results Header */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2,
            px: { xs: 1, sm: 0 }
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                fontWeight: 600,
              }}
            >
              {filteredWorkOrders.length} Work Orders
            </Typography>
            
            {!isMobile && filteredWorkOrders.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                {currentTab === 0 ? 'All work orders' : 
                 currentTab === 1 ? 'Open work orders' :
                 currentTab === 2 ? 'In progress work orders' :
                 'Completed work orders'}
              </Typography>
            )}
          </Box>
          
          {/* Loading State */}
          {isLoading && (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress size={40} thickness={4} />
            </Box>
          )}
          
          {/* Empty State */}
          {!isLoading && filteredWorkOrders.length === 0 && (
            <Card sx={{ textAlign: 'center', py: 6, borderRadius: 3 }}>
              <CardContent>
                <ScheduleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No work orders found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {searchTerm || activeFilters.length > 0 
                    ? 'Try adjusting your search or filters'
                    : 'Create your first work order to get started'
                  }
                </Typography>
                {(!searchTerm && activeFilters.length === 0) && (
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={handleCreateWorkOrder}
                    sx={{ borderRadius: 3 }}
                  >
                    Create Work Order
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Mobile Card View */}
          {!isLoading && isMobile && filteredWorkOrders.length > 0 && (
            <Box 
              ref={scrollContainerRef}
              sx={{ 
                pb: 2,
                '&::-webkit-scrollbar': { display: 'none' },
                scrollbarWidth: 'none',
              }}
            >
              {filteredWorkOrders.map((workOrder, index) => (
                <WorkOrderCard 
                  key={workOrder.id} 
                  workOrder={workOrder} 
                  index={index}
                />
              ))}
            </Box>
          )}
          
          {/* Desktop Table View */}
          {!isLoading && !isMobile && filteredWorkOrders.length > 0 && (
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <CardContent sx={{ p: 0 }}>
                <DataTable
                  data={filteredWorkOrders}
                  columns={[
                    {
                      key: 'id',
                      label: 'ID',
                      sortable: true,
                      priority: 'high' as const,
                      render: (value: any, row: WorkOrder) => (
                        <Typography variant="body2" fontWeight="600">
                          WO-{row.id}
                        </Typography>
                      ),
                    },
                    {
                      key: 'title',
                      label: 'Title',
                      sortable: true,
                      priority: 'high' as const,
                      render: (value: string, row: WorkOrder) => (
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {value}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {row.description?.substring(0, 50)}{row.description && row.description.length > 50 ? '...' : ''}
                          </Typography>
                        </Box>
                      ),
                    },
                    {
                      key: 'asset',
                      label: 'Asset',
                      priority: 'medium' as const,
                      render: (value: any, row: WorkOrder) => (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {row.asset?.name || 'No Asset'}
                          </Typography>
                        </Box>
                      ),
                    },
                    {
                      key: 'assignedTo',
                      label: 'Assigned To',
                      priority: 'medium' as const,
                      render: (value: any, row: WorkOrder) => (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                            {row.assignedTo?.name?.charAt(0) || 'U'}
                          </Avatar>
                          <Typography variant="body2">
                            {row.assignedTo?.name || 'Unassigned'}
                          </Typography>
                        </Box>
                      ),
                    },
                    {
                      key: 'priority',
                      label: 'Priority',
                      sortable: true,
                      priority: 'high' as const,
                      render: (value: string) => (
                        <Chip
                          label={value}
                          color={getPriorityColor(value) as any}
                          size="small"
                          icon={getPriorityIcon(value)}
                        />
                      ),
                    },
                    {
                      key: 'status',
                      label: 'Status',
                      sortable: true,
                      priority: 'high' as const,
                      render: (value: string) => (
                        <Chip
                          label={value.replace('_', ' ')}
                          color={getStatusColor(value) as any}
                          size="small"
                          icon={getStatusIcon(value)}
                        />
                      ),
                    },
                    {
                      key: 'createdAt',
                      label: 'Created',
                      sortable: true,
                      priority: 'low' as const,
                      render: (value: string) => (
                        <Typography variant="body2">
                          {new Date(value).toLocaleDateString()}
                        </Typography>
                      ),
                    },
                    {
                      key: 'actions',
                      label: 'Actions',
                      priority: 'high' as const,
                      render: (value: any, row: WorkOrder) => (
                        <IconButton
                          onClick={(e) => handleCardAction(e, row)}
                          size="small"
                          sx={{ minWidth: 48, minHeight: 48 }}
                        >
                          <MoreIcon />
                        </IconButton>
                      ),
                    },
                  ]}
                  loading={isLoading}
                  emptyMessage="No work orders found"
                  searchable={false}
                  mobileCardView={false}
                />
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Desktop Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl) && !isMobile}
          onClose={handleMenuClose}
          PaperProps={{
            sx: { 
              borderRadius: 3,
              boxShadow: theme.shadows[8],
              minWidth: 200,
            }
          }}
        >
          <MenuItem
            onClick={() => selectedWorkOrder && handleViewWorkOrder(selectedWorkOrder)}
            sx={{ py: 1.5, minHeight: 48 }}
          >
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => selectedWorkOrder && handleEditWorkOrder(selectedWorkOrder)}
            sx={{ py: 1.5, minHeight: 48 }}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Work Order</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => selectedWorkOrder && handleDeleteWorkOrder(selectedWorkOrder)}
            sx={{ py: 1.5, minHeight: 48, color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Work Order</ListItemText>
          </MenuItem>
        </Menu>
        
        {/* Mobile Bottom Sheet for Actions */}
        <SwipeableDrawer
          anchor="bottom"
          open={quickActionOpen}
          onClose={handleMenuClose}
          onOpen={() => setQuickActionOpen(true)}
          disableSwipeToOpen
          PaperProps={{
            sx: {
              borderRadius: '16px 16px 0 0',
              maxHeight: '50vh',
            }
          }}
        >
          <Box sx={{ p: 2 }}>
            {/* Handle bar */}
            <Box sx={{
              width: 40,
              height: 4,
              bgcolor: 'divider',
              borderRadius: 2,
              mx: 'auto',
              mb: 2,
            }} />
            
            {selectedWorkOrder && (
              <>
                <Typography variant="h6" sx={{ mb: 3, textAlign: 'center' }}>
                  {selectedWorkOrder.title}
                </Typography>
                
                {/* Quick Status Actions */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Quick Actions
                </Typography>
                
                <Stack spacing={1} sx={{ mb: 3 }}>
                  {selectedWorkOrder.status !== 'IN_PROGRESS' && (
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<StartIcon />}
                      onClick={() => handleQuickStatusUpdate(selectedWorkOrder, 'IN_PROGRESS')}
                      sx={{ 
                        minHeight: 56,
                        justifyContent: 'flex-start',
                        borderRadius: 3,
                      }}
                    >
                      Start Work
                    </Button>
                  )}
                  
                  {selectedWorkOrder.status !== 'COMPLETED' && (
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<CompleteIcon />}
                      onClick={() => handleQuickStatusUpdate(selectedWorkOrder, 'COMPLETED')}
                      sx={{ 
                        minHeight: 56,
                        justifyContent: 'flex-start',
                        borderRadius: 3,
                      }}
                    >
                      Mark Complete
                    </Button>
                  )}
                  
                  {selectedWorkOrder.status !== 'ON_HOLD' && (
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<HoldIcon />}
                      onClick={() => handleQuickStatusUpdate(selectedWorkOrder, 'ON_HOLD')}
                      sx={{ 
                        minHeight: 56,
                        justifyContent: 'flex-start',
                        borderRadius: 3,
                      }}
                    >
                      Put on Hold
                    </Button>
                  )}
                </Stack>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Standard Actions */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  More Options
                </Typography>
                
                <Stack spacing={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ViewIcon />}
                    onClick={() => handleViewWorkOrder(selectedWorkOrder)}
                    sx={{ 
                      minHeight: 56,
                      justifyContent: 'flex-start',
                      borderRadius: 3,
                    }}
                  >
                    View Details
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditWorkOrder(selectedWorkOrder)}
                    sx={{ 
                      minHeight: 56,
                      justifyContent: 'flex-start',
                      borderRadius: 3,
                    }}
                  >
                    Edit Work Order
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteWorkOrder(selectedWorkOrder)}
                    color="error"
                    sx={{ 
                      minHeight: 56,
                      justifyContent: 'flex-start',
                      borderRadius: 3,
                    }}
                  >
                    Delete Work Order
                  </Button>
                </Stack>
              </>
            )}
          </Box>
        </SwipeableDrawer>
        
        {/* Filter Bottom Sheet */}
        <SwipeableDrawer
          anchor="bottom"
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          onOpen={() => setFiltersOpen(true)}
          disableSwipeToOpen
          PaperProps={{
            sx: {
              borderRadius: '16px 16px 0 0',
              maxHeight: '70vh',
            }
          }}
        >
          <Box sx={{ p: 3 }}>
            {/* Handle bar */}
            <Box sx={{
              width: 40,
              height: 4,
              bgcolor: 'divider',
              borderRadius: 2,
              mx: 'auto',
              mb: 3,
            }} />
            
            <Typography variant="h6" sx={{ mb: 3 }}>
              Filter Work Orders
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Priority
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              {['urgent', 'high'].map((filter) => (
                <Chip
                  key={filter}
                  label={filter.charAt(0).toUpperCase() + filter.slice(1)}
                  onClick={() => {
                    setActiveFilters(prev => 
                      prev.includes(filter) 
                        ? prev.filter(f => f !== filter)
                        : [...prev, filter]
                    );
                  }}
                  color={activeFilters.includes(filter) ? "primary" : "default"}
                  variant={activeFilters.includes(filter) ? "filled" : "outlined"}
                  sx={{ minHeight: 36 }}
                />
              ))}
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Assignment
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              <Chip
                label="Unassigned"
                onClick={() => {
                  setActiveFilters(prev => 
                    prev.includes('unassigned') 
                      ? prev.filter(f => f !== 'unassigned')
                      : [...prev, 'unassigned']
                  );
                }}
                color={activeFilters.includes('unassigned') ? "primary" : "default"}
                variant={activeFilters.includes('unassigned') ? "filled" : "outlined"}
                sx={{ minHeight: 36 }}
              />
              
              <Chip
                label="Overdue"
                onClick={() => {
                  setActiveFilters(prev => 
                    prev.includes('overdue') 
                      ? prev.filter(f => f !== 'overdue')
                      : [...prev, 'overdue']
                  );
                }}
                color={activeFilters.includes('overdue') ? "primary" : "default"}
                variant={activeFilters.includes('overdue') ? "filled" : "outlined"}
                sx={{ minHeight: 36 }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setActiveFilters([]);
                  setFiltersOpen(false);
                }}
                sx={{ minHeight: 48, borderRadius: 3 }}
              >
                Clear All
              </Button>
              
              <Button
                fullWidth
                variant="contained"
                onClick={() => setFiltersOpen(false)}
                sx={{ minHeight: 48, borderRadius: 3 }}
              >
                Apply Filters
              </Button>
            </Box>
          </Box>
        </SwipeableDrawer>

        {/* Work Order Form */}
        <WorkOrderForm
          open={workOrderFormOpen}
          onClose={() => {
            setWorkOrderFormOpen(false);
            setSelectedWorkOrder(null);
          }}
          onSubmit={handleWorkOrderSubmit}
          initialData={selectedWorkOrder || {}}
          mode={formMode}
          loading={createWorkOrderMutation.isPending || updateWorkOrderMutation.isPending}
        />
        
        {/* Notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{
            bottom: { xs: 80, sm: 24 },
          }}
        />
      </Container>
      
      {/* Mobile FAB */}
      {isMobile && (
        <Fade in={!isRefreshing}>
          <Fab
            color="primary"
            onClick={handleCreateWorkOrder}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              width: 64,
              height: 64,
              zIndex: 1000,
              boxShadow: theme.shadows[8],
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: theme.shadows[12],
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <AddIcon sx={{ fontSize: 28 }} />
          </Fab>
        </Fade>
      )}
    </Box>
  );
}