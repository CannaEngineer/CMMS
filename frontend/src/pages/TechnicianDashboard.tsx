import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Badge,
  Divider,
  Stack,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Tooltip,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  ListItemAvatar,
  Skeleton,
  CardHeader,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
  Schedule as TimeIcon,
  Assignment as WorkOrderIcon,
  Comment as CommentIcon,
  Person as PersonIcon,
  Build as AssetIcon,
  AccessTime as ClockIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Timer as TimerIcon,
  Flag as PriorityIcon,
  ExpandMore as ExpandMoreIcon,
  QrCodeScanner as QrIcon,
  Notifications as NotificationIcon,
  FilterList as FilterIcon,
  Inventory2 as InventoryIcon,
  Engineering as MaintenanceIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
  ShoppingCart as CartIcon,
  CheckBox as CheckBoxIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  CategoryOutlined as CategoryIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  FileUpload as FileUploadIcon,
  Folder as FolderIcon,
  Camera as CameraIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workOrdersService, authService, assetsService, partsService } from '../services/api';
import { UploadService } from '../services/uploadService';
import { statusColors } from '../theme/theme';
import { useComments, useCreateComment } from '../hooks/useComments';
import { LoadingSpinner, LoadingBar, TemplatedSkeleton, LoadingButton } from '../components/Loading';

interface WorkOrder {
  id: number;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTo?: string;
  assetName?: string;
  assetId?: number;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  estimatedHours?: number;
}

interface TimeEntry {
  id?: number;
  hours: number;
  description: string;
  workOrderId: number;
  date: string;
}

interface QuickAction {
  label: string;
  icon: React.ReactElement;
  action: () => void;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  disabled?: boolean;
}

export default function TechnicianDashboard() {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();
  
  // Get active tab from URL params
  const getActiveTab = () => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    
    switch (tab) {
      case 'my-work': return 0;
      case 'available-work': return 1;
      case 'inventory': return 2;
      case 'assets': return 3;
      default: return 0;
    }
  };

  // State management
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false);
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [timeEntry, setTimeEntry] = useState({ hours: '', description: '' });
  const [comment, setComment] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const activeTab = getActiveTab();
  
  // Get current section title
  const getCurrentSectionTitle = () => {
    switch (activeTab) {
      case 0: return 'My Work';
      case 1: return 'Available Work';
      case 2: return 'Inventory';
      case 3: return 'Assets';
      default: return 'My Work';
    }
  };
  const [fileUploadDialogOpen, setFileUploadDialogOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<{type: 'asset' | 'workOrder', id: number} | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileDescription, setFileDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [assetFiles, setAssetFiles] = useState<any[]>([]);
  const [workOrderFiles, setWorkOrderFiles] = useState<{[key: number]: any[]}>({});
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [checkoutReason, setCheckoutReason] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');

  // Get current user
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  // Comprehensive refresh function to update all dashboard data
  const refreshAllData = async () => {
    console.log('🔄 Manual refresh triggered - updating all dashboard data...');
    try {
      // Invalidate all queries to force fresh data fetch
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['all-work-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['technician-parts'] }),
        queryClient.invalidateQueries({ queryKey: ['technician-assets'] }),
        queryClient.invalidateQueries({ queryKey: ['work-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['technician-work-orders'] })
      ]);
      console.log('✅ All dashboard data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing dashboard data:', error);
    }
  };

  // Fetch all work orders and separate them
  const { data: allWorkOrders = [], isLoading, refetch } = useQuery({
    queryKey: ['all-work-orders'],
    queryFn: async () => {
      try {
        const workOrders = await workOrdersService.getAll();
        console.log(`Found ${workOrders.length} total work orders`);
        return workOrders;
      } catch (error) {
        console.error('Work orders API error:', error);
        return [];
      }
    },
    refetchInterval: 15000, // Refresh every 15 seconds to keep data current
    refetchIntervalInBackground: true, // Continue refetching when tab is in background
    refetchOnWindowFocus: true, // Refetch when user returns to the tab
    refetchOnReconnect: true, // Refetch when network reconnects
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  // Separate assigned and unassigned work orders
  const assignedWorkOrders = allWorkOrders.filter(wo => {
    // Check if assignedTo is a user object with id or email
    if (wo.assignedTo && typeof wo.assignedTo === 'object') {
      return wo.assignedTo.id === currentUser?.id || wo.assignedTo.email === currentUser?.email;
    }
    // Check assignedToId directly
    return wo.assignedToId === currentUser?.id;
  });

  const unassignedWorkOrders = allWorkOrders.filter(wo => {
    // Show unassigned work orders that technicians can claim
    return !wo.assignedTo && !wo.assignedToId;
  });

  // Current work orders based on active tab
  const workOrders = activeTab === 0 ? assignedWorkOrders : activeTab === 1 ? unassignedWorkOrders : [];

  // Fetch inventory/parts data
  const { data: parts = [], isLoading: partsLoading } = useQuery({
    queryKey: ['technician-parts'],
    queryFn: async () => {
      try {
        const allParts = await partsService.getAll();
        return allParts || [];
      } catch (error) {
        console.error('Parts API error:', error);
        return [];
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds for inventory updates
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Fetch assets data
  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ['technician-assets'],
    queryFn: async () => {
      try {
        const allAssets = await assetsService.getAll();
        return allAssets || [];
      } catch (error) {
        console.error('Assets API error:', error);
        return [];
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds for asset updates
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 10000, // Consider data stale after 10 seconds
  });


  // Filter work orders based on selected filter
  const filteredWorkOrders = workOrders.filter(wo => {
    if (filterStatus === 'ALL') return true;
    return wo.status === filterStatus;
  });

  // Status update mutation with optimistic updates
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => {
      return workOrdersService.updateStatus(id.toString(), status);
    },
    // Optimistic update - immediately update the UI before API call completes
    onMutate: async ({ id, status }) => {
      console.log(`🚀 Optimistically updating work order ${id} status to ${status}`);
      
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['all-work-orders'] });
      
      // Snapshot the previous value
      const previousWorkOrders = queryClient.getQueryData(['all-work-orders']);
      
      // Optimistically update the cache
      queryClient.setQueryData(['all-work-orders'], (old: any[]) => {
        if (!old) return old;
        return old.map(wo => 
          wo.id === id ? { ...wo, status, updatedAt: new Date().toISOString() } : wo
        );
      });
      
      // Return a context object with the snapshotted value
      return { previousWorkOrders };
    },
    onSuccess: () => {
      // Invalidate all work order related queries to refresh with real data
      queryClient.invalidateQueries({ queryKey: ['all-work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['technician-work-orders'] });
      setStatusDialogOpen(false);
      setSelectedWorkOrder(null);
      console.log('✅ Work order status updated successfully, syncing with server...');
    },
    onError: (error, variables, context) => {
      console.error('❌ Status update failed, reverting optimistic update:', error);
      
      // Revert the optimistic update on error
      if (context?.previousWorkOrders) {
        queryClient.setQueryData(['all-work-orders'], context.previousWorkOrders);
      }
    },
  });

  // Work order claim mutation
  const claimWorkOrderMutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      // This would assign the work order to the current user
      return workOrdersService.assignWorkOrder(id.toString(), currentUser.id);
    },
    onSuccess: () => {
      // Invalidate all work order related queries to refresh the entire dashboard
      queryClient.invalidateQueries({ queryKey: ['all-work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['technician-work-orders'] });
      console.log('🔄 Work order claimed, refreshing dashboard data...');
    },
    onError: (error) => {
      console.error('Claim work order failed:', error);
    },
  });

  // Time logging mutation
  const logTimeMutation = useMutation({
    mutationFn: ({ workOrderId, hours, description }: { workOrderId: number; hours: number; description: string }) => {
      return workOrdersService.logTime(workOrderId.toString(), hours, description, 'LABOR', true);
    },
    onSuccess: () => {
      // Invalidate all work order related queries to refresh the entire dashboard
      queryClient.invalidateQueries({ queryKey: ['all-work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['technician-work-orders'] });
      setTimeDialogOpen(false);
      setTimeEntry({ hours: '', description: '' });
      setSelectedWorkOrder(null);
      console.log('🔄 Time logged, refreshing dashboard data...');
    },
    onError: (error) => {
      console.error('Log time failed:', error);
    },
  });

  // Comment mutation
  const createCommentMutation = useCreateComment();

  // Quick action handlers
  const handleStartWork = (workOrder: WorkOrder) => {
    updateStatusMutation.mutate({ id: workOrder.id, status: 'IN_PROGRESS' });
  };

  const handleCompleteWork = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setNewStatus('COMPLETED');
    setStatusDialogOpen(true);
  };

  const handlePauseWork = (workOrder: WorkOrder) => {
    updateStatusMutation.mutate({ id: workOrder.id, status: 'ON_HOLD' });
  };

  const handleLogTime = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setTimeDialogOpen(true);
  };

  const handleAddComment = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setCommentDialogOpen(true);
  };

  const submitStatusUpdate = () => {
    if (selectedWorkOrder) {
      updateStatusMutation.mutate({ id: selectedWorkOrder.id, status: newStatus });
    }
  };

  const submitTimeLog = () => {
    if (selectedWorkOrder && timeEntry.hours && timeEntry.description) {
      logTimeMutation.mutate({
        workOrderId: selectedWorkOrder.id,
        hours: parseFloat(timeEntry.hours),
        description: timeEntry.description,
      });
    }
  };

  const submitComment = () => {
    if (selectedWorkOrder && comment.trim()) {
      createCommentMutation.mutate({
        entityType: 'workOrder',
        entityId: selectedWorkOrder.id,
        commentData: {
          content: comment.trim(),
          isInternal: false,
        },
      }, {
        onSuccess: () => {
          setCommentDialogOpen(false);
          setComment('');
          setSelectedWorkOrder(null);
        },
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'primary';
      case 'ON_HOLD': return 'warning';
      case 'PENDING': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'default';
      default: return 'default';
    }
  };

  const getQuickActions = (workOrder: WorkOrder): QuickAction[] => {
    const actions: QuickAction[] = [];

    switch (workOrder.status) {
      case 'PENDING':
        actions.push({
          label: 'Start',
          icon: <StartIcon />,
          action: () => handleStartWork(workOrder),
          color: 'success',
        });
        break;
      case 'IN_PROGRESS':
        actions.push({
          label: 'Complete',
          icon: <CompleteIcon />,
          action: () => handleCompleteWork(workOrder),
          color: 'success',
        });
        actions.push({
          label: 'Pause',
          icon: <PauseIcon />,
          action: () => handlePauseWork(workOrder),
          color: 'warning',
        });
        break;
      case 'ON_HOLD':
        actions.push({
          label: 'Resume',
          icon: <StartIcon />,
          action: () => handleStartWork(workOrder),
          color: 'primary',
        });
        break;
    }

    actions.push({
      label: 'Log Time',
      icon: <TimerIcon />,
      action: () => handleLogTime(workOrder),
      color: 'primary',
    });

    actions.push({
      label: 'Add Note',
      icon: <CommentIcon />,
      action: () => handleAddComment(workOrder),
      color: 'primary',
    });

    return actions;
  };

  // Utility functions
  const handleAddToCart = (part: any, quantity: number = 1) => {
    const existingItem = cartItems.find(item => item.id === part.id);
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item.id === part.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCartItems([...cartItems, { ...part, quantity }]);
    }
  };

  const handleRemoveFromCart = (partId: number) => {
    setCartItems(cartItems.filter(item => item.id !== partId));
  };

  // Parts checkout mutation
  const checkoutPartsMutation = useMutation({
    mutationFn: async (checkoutData: any) => {
      return partsService.checkoutParts(checkoutData);
    },
    onSuccess: () => {
      // Clear cart and close dialog
      setCartItems([]);
      setInventoryDialogOpen(false);
      setCheckoutReason('');
      setCheckoutNotes('');
      // Refresh both parts and work orders data (parts checkout may affect work orders)
      queryClient.invalidateQueries({ queryKey: ['technician-parts'] });
      queryClient.invalidateQueries({ queryKey: ['all-work-orders'] });
      console.log('🔄 Parts checked out, refreshing inventory and work order data...');
    },
    onError: (error) => {
      console.error('Parts checkout failed:', error);
    },
  });

  const handleCheckoutParts = () => {
    if (cartItems.length === 0) return;
    
    const checkoutData = {
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        partNumber: item.partNumber,
        quantity: item.quantity,
        cost: item.cost || 0
      })),
      requestedBy: currentUser?.email || 'Unknown User',
      reason: checkoutReason || 'Work order materials',
      notes: checkoutNotes
    };
    
    checkoutPartsMutation.mutate(checkoutData);
  };

  const handleViewAsset = async (asset: any) => {
    setSelectedAsset(asset);
    setAssetDialogOpen(true);
    
    // Fetch files for this asset
    try {
      const uploadService = new UploadService();
      const files = await uploadService.getAssetFiles(asset.id.toString());
      setAssetFiles(files);
    } catch (error) {
      console.error('Error fetching asset files:', error);
      setAssetFiles([]);
    }
  };

  const handleUploadFile = (type: 'asset' | 'workOrder', id: number) => {
    setUploadTarget({ type, id });
    setSelectedFiles([]);
    setFileDescription('');
    setFileUploadDialogOpen(true);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
    }
  };

  const submitFileUpload = async () => {
    if (!uploadTarget || selectedFiles.length === 0) return;
    
    try {
      const uploadService = new UploadService();
      
      if (uploadTarget.type === 'asset') {
        await uploadService.uploadAssetImages(uploadTarget.id.toString(), selectedFiles);
        console.log(`Successfully uploaded ${selectedFiles.length} files to asset ${uploadTarget.id}`);
      } else {
        await uploadService.uploadWorkOrderAttachments(uploadTarget.id.toString(), selectedFiles);
        console.log(`Successfully uploaded ${selectedFiles.length} files to work order ${uploadTarget.id}`);
      }
      
      // Refresh data to show new files
      queryClient.invalidateQueries({ queryKey: ['technician-assets'] });
      queryClient.invalidateQueries({ queryKey: ['all-work-orders'] });
      
      // Close dialog and reset state
      setFileUploadDialogOpen(false);
      setSelectedFiles([]);
      setFileDescription('');
      setUploadTarget(null);
    } catch (error) {
      console.error('File upload error:', error);
      // You could add a toast notification here for error handling
    }
  };


  const filteredParts = parts.filter(part => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (part.name && typeof part.name === 'string' && part.name.toLowerCase().includes(searchLower)) ||
      (part.partNumber && typeof part.partNumber === 'string' && part.partNumber.toLowerCase().includes(searchLower)) ||
      (part.category && typeof part.category === 'string' && part.category.toLowerCase().includes(searchLower))
    );
  });

  const filteredAssets = assets.filter(asset => {
    const searchLower = searchQuery.toLowerCase();
    const locationStr = typeof asset.location === 'string' 
      ? asset.location 
      : asset.location?.name || '';
    
    return (
      (asset.name && typeof asset.name === 'string' && asset.name.toLowerCase().includes(searchLower)) ||
      (asset.model && typeof asset.model === 'string' && asset.model.toLowerCase().includes(searchLower)) ||
      (locationStr && locationStr.toLowerCase().includes(searchLower))
    );
  });

  // Stats calculation
  const stats = {
    workOrders: {
      total: assignedWorkOrders.length,
      pending: assignedWorkOrders.filter(wo => wo.status === 'PENDING').length,
      inProgress: assignedWorkOrders.filter(wo => wo.status === 'IN_PROGRESS').length,
      completed: assignedWorkOrders.filter(wo => wo.status === 'COMPLETED').length,
      overdue: assignedWorkOrders.filter(wo => wo.dueDate && new Date(wo.dueDate) < new Date()).length,
      available: unassignedWorkOrders.length,
    },
    inventory: {
      total: parts.length,
      lowStock: parts.filter(p => p.quantity <= p.reorderPoint).length,
      outOfStock: parts.filter(p => p.quantity === 0).length,
    },
    assets: {
      total: assets.length,
      online: assets.filter(a => a.status === 'ONLINE').length,
      offline: assets.filter(a => a.status === 'OFFLINE').length,
    },
  };

  if (isLoading && partsLoading && assetsLoading) {
    return (
      <TemplatedSkeleton template="dashboard" />
    );
  }

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', pb: isMobile ? 10 : 2 }}>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant={isSmallMobile ? "h5" : "h4"} fontWeight="bold" color="primary">
                {getCurrentSectionTitle()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Welcome back, {currentUser?.name || 'Technician'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={refreshAllData} color="primary">
                <RefreshIcon />
              </IconButton>
              <IconButton color="primary">
                <Badge badgeContent={stats.workOrders.pending} color="error">
                  <NotificationIcon />
                </Badge>
              </IconButton>
              <IconButton color="primary">
                <Badge badgeContent={cartItems.length} color="secondary">
                  <CartIcon />
                </Badge>
              </IconButton>
            </Box>
          </Box>

          {/* Quick Stats Grid */}
          <Grid container spacing={2}>
            <Grid xs={6} sm={3}>
              <Card>
                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Work Orders
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {stats.workOrders.total}
                      </Typography>
                    </Box>
                    <WorkOrderIcon color="primary" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={6} sm={3}>
              <Card>
                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Low Stock
                      </Typography>
                      <Typography variant="h4" color="warning.main">
                        {stats.inventory.lowStock}
                      </Typography>
                    </Box>
                    <WarningIcon color="warning" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={6} sm={3}>
              <Card>
                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Assets
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        {stats.assets.online}
                      </Typography>
                    </Box>
                    <AssetIcon color="success" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid xs={6} sm={3}>
              <Card>
                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" variant="body2">
                        Available
                      </Typography>
                      <Typography variant="h4" color="info.main">
                        {stats.workOrders.available}
                      </Typography>
                    </Box>
                    <PersonIcon color="info" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>


        {/* Tab Content */}
        {(activeTab === 0 || activeTab === 1) && (
          <>
            {/* Work Orders Filter Bar */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <FilterIcon color="action" />
                <Typography variant="h6" sx={{ mr: 2 }}>
                  {activeTab === 0 ? 'My Assigned Work Orders' : 'Available Work Orders'}
                </Typography>
                {activeTab === 0 && (
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Filter</InputLabel>
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      label="Filter"
                    >
                      <MenuItem value="ALL">All Orders</MenuItem>
                      <MenuItem value="PENDING">Pending</MenuItem>
                      <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                      <MenuItem value="ON_HOLD">On Hold</MenuItem>
                      <MenuItem value="COMPLETED">Completed</MenuItem>
                    </Select>
                  </FormControl>
                )}
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredWorkOrders.length} of {workOrders.length} work orders
                </Typography>
              </Box>
            </Paper>

        {/* Work Orders List */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredWorkOrders.map((workOrder) => {
            const quickActions = getQuickActions(workOrder);
            const isOverdue = workOrder.dueDate && new Date(workOrder.dueDate) < new Date();

            return (
              <Card
                key={workOrder.id}
                sx={{
                  border: isOverdue ? '1px solid' : 'none',
                  borderColor: isOverdue ? 'error.main' : 'transparent',
                  bgcolor: workOrder.status === 'IN_PROGRESS' ? 'primary.50' : 'background.paper',
                }}
              >
                <CardContent sx={{ pb: 1 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ flex: 1, mr: 2 }}>
                      <Typography variant="h6" fontWeight="600" sx={{ mb: 0.5 }}>
                        {workOrder.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        <Chip
                          label={workOrder.status.replace('_', ' ')}
                          color={getStatusColor(workOrder.status) as any}
                          size="small"
                        />
                        <Chip
                          label={workOrder.priority}
                          color={getPriorityColor(workOrder.priority) as any}
                          size="small"
                        />
                        {isOverdue && (
                          <Chip
                            label="OVERDUE"
                            color="error"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      #{workOrder.id}
                    </Typography>
                  </Box>

                  {/* Details */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.4 }}>
                    {workOrder.description}
                  </Typography>

                  {/* Asset and Time Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    {workOrder.assetName && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AssetIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {workOrder.assetName}
                        </Typography>
                      </Box>
                    )}
                    {workOrder.estimatedHours && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ClockIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {workOrder.estimatedHours}h
                        </Typography>
                      </Box>
                    )}
                    {workOrder.dueDate && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TimeIcon fontSize="small" color={isOverdue ? "error" : "action"} />
                        <Typography 
                          variant="body2" 
                          color={isOverdue ? "error" : "text.secondary"}
                          fontWeight={isOverdue ? 600 : 400}
                        >
                          Due {new Date(workOrder.dueDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Progress Bar for In Progress items */}
                  {workOrder.status === 'IN_PROGRESS' && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Progress
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          In Progress...
                        </Typography>
                      </Box>
                      <LoadingBar progress={undefined} />
                    </Box>
                  )}
                </CardContent>

                {/* Actions */}
                <CardActions sx={{ px: 2, pb: 2, pt: 0, flexWrap: 'wrap', gap: 1 }}>
                  {/* Show claim button for unassigned work orders */}
                  {(!workOrder.assignedTo && !workOrder.assignedToId) ? (
                    <Button
                      startIcon={<PersonIcon />}
                      onClick={() => claimWorkOrderMutation.mutate({ id: workOrder.id })}
                      variant="contained"
                      color="primary"
                      size="small"
                      disabled={claimWorkOrderMutation.isPending}
                      sx={{ minWidth: isSmallMobile ? 'auto' : 100 }}
                    >
                      {isSmallMobile ? '' : 'Claim Work Order'}
                    </Button>
                  ) : (
                    /* Show normal quick actions for assigned work orders */
                    quickActions.map((action, index) => (
                      <Button
                        key={index}
                        startIcon={action.icon}
                        onClick={action.action}
                        variant={index === 0 ? 'contained' : 'outlined'}
                        color={action.color}
                        size="small"
                        disabled={action.disabled || updateStatusMutation.isPending}
                        sx={{ minWidth: isSmallMobile ? 'auto' : 100 }}
                      >
                        {isSmallMobile && index > 1 ? '' : action.label}
                      </Button>
                    ))
                  )}
                  <Button
                    startIcon={<FileUploadIcon />}
                    onClick={() => handleUploadFile('workOrder', workOrder.id)}
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: isSmallMobile ? 'auto' : 100 }}
                  >
                    {isSmallMobile ? '' : 'Upload'}
                  </Button>
                </CardActions>
              </Card>
            );
          })}
        </Box>

            {/* Work Orders Empty State */}
            {filteredWorkOrders.length === 0 && (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                {activeTab === 0 ? <WorkOrderIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} /> : <PersonIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />}
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {activeTab === 0 ? 'No assigned work orders' : 'No available work orders'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activeTab === 0 
                    ? (filterStatus === 'ALL' 
                        ? "You don't have any assigned work orders yet. Check the 'Available Work' tab to claim work orders."
                        : `No assigned work orders with status: ${filterStatus.toLowerCase()}`)
                    : "No unassigned work orders are currently available to claim."
                  }
                </Typography>
              </Paper>
            )}
          </>
        )}

        {/* Inventory Tab */}
        {activeTab === 2 && (
          <>
            {/* Inventory Search */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <SearchIcon color="action" />
                <TextField
                  size="small"
                  placeholder="Search parts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ minWidth: 200, flexGrow: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {filteredParts.length} of {parts.length} parts
                </Typography>
                {cartItems.length > 0 && (
                  <Button
                    variant="contained"
                    startIcon={<CartIcon />}
                    onClick={() => setInventoryDialogOpen(true)}
                  >
                    Cart ({cartItems.length})
                  </Button>
                )}
              </Box>
            </Paper>

            {/* Parts List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <Card key={index}>
                    <CardContent>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                      <Skeleton variant="rectangular" height={20} sx={{ mt: 1 }} />
                    </CardContent>
                  </Card>
                ))
              ) : (
                filteredParts.map((part) => (
                  <Card key={part.id}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                          <Typography 
                            variant="h6" 
                            fontWeight="600"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '100%'
                            }}
                            title={part.name} // Show full name on hover
                          >
                            {part.name}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '100%'
                            }}
                            title={`Part #: ${part.partNumber}`}
                          >
                            Part #: {part.partNumber}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                            <Chip 
                              label={part.category} 
                              size="small" 
                              icon={<CategoryIcon />}
                              sx={{
                                maxWidth: '150px',
                                '& .MuiChip-label': {
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }
                              }}
                              title={part.category}
                            />
                            <Chip 
                              label={`${part.quantity} in stock`}
                              size="small"
                              color={part.quantity <= part.reorderPoint ? 'error' : 'success'}
                              icon={part.quantity <= part.reorderPoint ? <WarningIcon /> : <CheckBoxIcon />}
                            />
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min((part.quantity / (part.reorderPoint * 2)) * 100, 100)}
                            color={part.quantity <= part.reorderPoint ? 'error' : 'success'}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h6" color="primary">
                            ${part.cost?.toFixed(2) || '0.00'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            per unit
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '200px',
                            flex: 1,
                            mr: 1
                          }}
                          title={`Location: ${part.location || 'Not specified'}`}
                        >
                          Location: {part.location || 'Not specified'}
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => handleAddToCart(part)}
                          disabled={part.quantity === 0}
                        >
                          Add to Cart
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>

            {/* Inventory Empty State */}
            {filteredParts.length === 0 && !partsLoading && (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <InventoryIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No parts found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchQuery ? `No parts match "${searchQuery}"` : 'No parts available in inventory'}
                </Typography>
              </Paper>
            )}
          </>
        )}

        {/* Assets Tab */}
        {activeTab === 3 && (
          <>
            {/* Asset Search */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <SearchIcon color="action" />
                <TextField
                  size="small"
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ minWidth: 200, flexGrow: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {filteredAssets.length} of {assets.length} assets
                </Typography>
              </Box>
            </Paper>

            {/* Assets List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {assetsLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <Card key={index}>
                    <CardContent>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                      <Skeleton variant="rectangular" height={20} sx={{ mt: 1 }} />
                    </CardContent>
                  </Card>
                ))
              ) : (
                filteredAssets.map((asset) => (
                  <Card 
                    key={asset.id}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleViewAsset(asset)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight="600">
                            {asset.name || 'Unnamed Asset'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Model: {asset.model || 'Unknown'} | Serial: {asset.serialNumber || 'N/A'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Chip
                              label={asset.status || 'UNKNOWN'}
                              color={asset.status === 'ONLINE' ? 'success' : 'error'}
                              size="small"
                            />
                            <Chip
                              label={typeof asset.location === 'string' ? asset.location : asset.location?.name || 'Unknown Location'}
                              size="small"
                              icon={<LocationIcon />}
                            />
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" color="text.secondary">
                            Last Maintained
                          </Typography>
                          <Typography variant="body2" fontWeight="500">
                            {asset.lastMaintenance ? 
                              new Date(asset.lastMaintenance).toLocaleDateString() : 
                              'Never'
                            }
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Category: {asset.category || 'Unknown'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<FileUploadIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUploadFile('asset', asset.id);
                            }}
                          >
                            {isSmallMobile ? '' : 'Upload'}
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            endIcon={<ArrowForwardIcon />}
                          >
                            Details
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>

            {/* Assets Empty State */}
            {filteredAssets.length === 0 && !assetsLoading && (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <AssetIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No assets found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchQuery ? `No assets match "${searchQuery}"` : 'No assets available'}
                </Typography>
              </Paper>
            )}
          </>
        )}

      </Container>

      {/* Inventory Cart Dialog */}
      <Dialog open={inventoryDialogOpen} onClose={() => setInventoryDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CartIcon />
            Parts Cart ({cartItems.length} items)
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {cartItems.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                Your cart is empty
              </Typography>
            ) : (
              <>
                <List>
                  {cartItems.map((item, index) => (
                    <ListItem key={`${item.id}-${index}`}>
                      <ListItemAvatar>
                        <Avatar>
                          <InventoryIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={item.name}
                        secondary={`Part #: ${item.partNumber} | Qty: ${item.quantity} | $${(item.cost * item.quantity).toFixed(2)}`}
                      />
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveFromCart(item.id)}
                      >
                        <RemoveIcon />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Reason for Checkout"
                    value={checkoutReason}
                    onChange={(e) => setCheckoutReason(e.target.value)}
                    placeholder="e.g., Work Order #123, Emergency Repair, etc."
                  />
                  
                  <TextField
                    fullWidth
                    label="Notes (optional)"
                    multiline
                    rows={2}
                    value={checkoutNotes}
                    onChange={(e) => setCheckoutNotes(e.target.value)}
                    placeholder="Additional notes about this checkout..."
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="h6">
                      Total: ${cartItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items
                    </Typography>
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInventoryDialogOpen(false)}>Close</Button>
          <LoadingButton
            variant="contained"
            disabled={cartItems.length === 0 || !checkoutReason.trim()}
            onClick={handleCheckoutParts}
            loading={checkoutPartsMutation.isPending}
            startIcon={<CartIcon />}
          >
            {checkoutPartsMutation.isPending ? 'Processing...' : 'Checkout Parts'}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Asset Details Dialog */}
      <Dialog open={assetDialogOpen} onClose={() => setAssetDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justify: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssetIcon />
              Asset Details
            </Box>
            <IconButton onClick={() => setAssetDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAsset && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={3}>
                <Grid xs={12} md={6}>
                  <Card>
                    <CardHeader title="Basic Information" />
                    <CardContent>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Asset Name</Typography>
                          <Typography variant="body1" fontWeight="500">{selectedAsset.name || 'Unnamed Asset'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Model</Typography>
                          <Typography variant="body1">{selectedAsset.model || 'Unknown'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Serial Number</Typography>
                          <Typography variant="body1">{selectedAsset.serialNumber || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Status</Typography>
                          <Chip
                            label={selectedAsset.status || 'UNKNOWN'}
                            color={selectedAsset.status === 'ONLINE' ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid xs={12} md={6}>
                  <Card>
                    <CardHeader title="Maintenance Info" />
                    <CardContent>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Location</Typography>
                          <Typography variant="body1">
                            {typeof selectedAsset.location === 'string' 
                              ? selectedAsset.location 
                              : selectedAsset.location?.name || 'Unknown Location'
                            }
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Category</Typography>
                          <Typography variant="body1">{selectedAsset.category || 'Unknown'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Last Maintenance</Typography>
                          <Typography variant="body1">
                            {selectedAsset.lastMaintenance ? 
                              new Date(selectedAsset.lastMaintenance).toLocaleDateString() : 
                              'Never'
                            }
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Purchase Date</Typography>
                          <Typography variant="body1">
                            {selectedAsset.purchaseDate ? 
                              new Date(selectedAsset.purchaseDate).toLocaleDateString() : 
                              'Not specified'
                            }
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Files for this Asset */}
                <Grid xs={12}>
                  <Card>
                    <CardHeader title="Attached Files" />
                    <CardContent>
                      {assetFiles.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {assetFiles.map((file, index) => (
                            <Box key={index} sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              p: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <DocumentIcon color="primary" />
                                <Box>
                                  <Typography variant="body2" fontWeight="500">
                                    {file.originalname || file.filename}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </Typography>
                                </Box>
                              </Box>
                              <Button
                                size="small"
                                href={file.downloadUrl || file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View
                              </Button>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
                          No files attached to this asset
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Work Orders for this Asset */}
                <Grid xs={12}>
                  <Card>
                    <CardHeader title="Related Work Orders" />
                    <CardContent>
                      {(() => {
                        const assetWorkOrders = workOrders.filter(wo => 
                          wo.assetId === selectedAsset.id || 
                          wo.assetName === selectedAsset.name
                        );
                        
                        return assetWorkOrders.length > 0 ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {assetWorkOrders.map(wo => (
                              <Box key={wo.id} sx={{ 
                                p: 2, 
                                border: '1px solid', 
                                borderColor: 'divider', 
                                borderRadius: 1,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle2" fontWeight="600">
                                    #{wo.id} - {wo.title}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {wo.description}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                    <Chip
                                      label={wo.status.replace('_', ' ')}
                                      color={getStatusColor(wo.status) as any}
                                      size="small"
                                    />
                                    <Chip
                                      label={wo.priority}
                                      color={getPriorityColor(wo.priority) as any}
                                      size="small"
                                    />
                                  </Box>
                                  {workOrderFiles[wo.id] && workOrderFiles[wo.id].length > 0 && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <DocumentIcon fontSize="small" color="action" />
                                      <Typography variant="caption" color="text.secondary">
                                        {workOrderFiles[wo.id].length} file(s) attached
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                  {wo.assignedTo ? (
                                    <Typography variant="body2" color="text.secondary">
                                      Assigned: {typeof wo.assignedTo === 'object' ? wo.assignedTo.name : wo.assignedTo}
                                    </Typography>
                                  ) : (
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      startIcon={<PersonIcon />}
                                      onClick={() => {
                                        claimWorkOrderMutation.mutate({ id: wo.id });
                                      }}
                                      disabled={claimWorkOrderMutation.isPending}
                                    >
                                      Claim
                                    </Button>
                                  )}
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
                            No work orders found for this asset
                          </Typography>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Work Order Status</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>New Status</InputLabel>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                label="New Status"
              >
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="ON_HOLD">On Hold</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitStatusUpdate}
            disabled={!newStatus || updateStatusMutation.isPending}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Time Logging Dialog */}
      <Dialog open={timeDialogOpen} onClose={() => setTimeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log Time</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Hours Worked"
              type="number"
              value={timeEntry.hours}
              onChange={(e) => setTimeEntry({ ...timeEntry, hours: e.target.value })}
              inputProps={{ min: 0, step: 0.25 }}
              helperText="Enter hours in decimal format (e.g., 2.5)"
            />
            <TextField
              fullWidth
              label="Work Description"
              multiline
              rows={3}
              value={timeEntry.description}
              onChange={(e) => setTimeEntry({ ...timeEntry, description: e.target.value })}
              placeholder="Describe what work was performed..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimeDialogOpen(false)}>Cancel</Button>
          <LoadingButton
            variant="contained"
            onClick={submitTimeLog}
            disabled={!timeEntry.hours || !timeEntry.description.trim()}
            startIcon={<TimerIcon />}
            loading={logTimeMutation.isPending}
          >
            Log Time
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onClose={() => setCommentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Note</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Your Note"
              multiline
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a note about this work order..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitComment}
            disabled={!comment.trim() || createCommentMutation.isPending}
            startIcon={<CommentIcon />}
            loading={createCommentMutation.isPending}
          >
            Add Note
          </Button>
        </DialogActions>
      </Dialog>


      {/* File Upload Dialog */}
      <Dialog open={fileUploadDialogOpen} onClose={() => setFileUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileUploadIcon />
            Upload File
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {uploadTarget && (
              <Alert severity="info">
                Uploading to {uploadTarget.type === 'asset' ? 'Asset' : 'Work Order'} #{uploadTarget.id}
              </Alert>
            )}
            
            {/* Drag and Drop Area */}
            <Box 
              sx={{ 
                border: '2px dashed', 
                borderColor: dragActive ? 'primary.main' : 'grey.300',
                bgcolor: dragActive ? 'primary.50' : 'transparent',
                borderRadius: 2, 
                p: 4, 
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'grey.50'
                }
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              
              {selectedFiles.length > 0 ? (
                <>
                  <DocumentIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom color="success.main">
                    {selectedFiles.length} file(s) selected
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedFiles.map(f => f.name).join(', ')}
                  </Typography>
                </>
              ) : (
                <>
                  <FileUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Drop files here or click to browse
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Supported formats: PDF, JPG, PNG, DOC, XLS
                  </Typography>
                </>
              )}
            </Box>
            
            <TextField
              fullWidth
              label="File Description (optional)"
              value={fileDescription}
              onChange={(e) => setFileDescription(e.target.value)}
              placeholder="Add a description for this file..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFileUploadDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<FileUploadIcon />}
            disabled={selectedFiles.length === 0}
            onClick={submitFileUpload}
          >
            Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Speed Dial for Quick Actions */}
      <SpeedDial
        ariaLabel="Quick actions"
        sx={{
          position: 'fixed',
          bottom: isMobile ? 88 : 16,
          right: 16,
          zIndex: 1000,
        }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          key="file-upload"
          icon={<FileUploadIcon />}
          tooltipTitle="Upload File"
          onClick={() => setFileUploadDialogOpen(true)}
        />
        <SpeedDialAction
          key="search-assets"
          icon={<SearchIcon />}
          tooltipTitle="Search Assets"
          onClick={() => navigate('/tech/dashboard?tab=assets')}
        />
        <SpeedDialAction
          key="view-cart"
          icon={
            <Badge badgeContent={cartItems.length} color="secondary">
              <CartIcon />
            </Badge>
          }
          tooltipTitle="View Cart"
          onClick={() => setInventoryDialogOpen(true)}
        />
        <SpeedDialAction
          key="qr-scanner"
          icon={<QrIcon />}
          tooltipTitle="Scan QR Code"
        />
        <SpeedDialAction
          key="refresh-data"
          icon={<RefreshIcon />}
          tooltipTitle="Refresh Data"
          onClick={refreshAllData}
        />
      </SpeedDial>
    </Box>
  );
}