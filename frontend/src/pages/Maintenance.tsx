import React, { useState, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  useTheme,
  Menu,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  TextField,
  LinearProgress,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Build as BuildIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  NotificationsActive as AlertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ChevronLeft,
  ChevronRight,
  Cancel as CancelIcon,
  History as HistoryIcon,
  Assignment as WorkOrderIcon,
  SelectAll as SelectAllIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import StatCard from '../components/Common/StatCard';
import UniversalExportButton from '../components/Common/UniversalExportButton';
import MaintenanceScheduleForm from '../components/Forms/MaintenanceScheduleForm';
import { PMCalendar } from '../components/PMCalendar';
import { ResponsiveText, MobileContainer, MobileCard } from '../components/Common/MobileComponents';
import { statusColors } from '../theme/theme';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pmService, dashboardService, assetsService, workOrdersService } from '../services/api';
import { qrService } from '../services/qrService';
import { LoadingSpinner, LoadingBar, TemplatedSkeleton, LoadingOverlay } from '../components/Loading';
import dayjs from 'dayjs';

export default function Maintenance() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(dayjs());
  const [pmDetailsOpen, setPmDetailsOpen] = useState(false);
  const [selectedPM, setSelectedPM] = useState<any>(null);
  
  // Bulk edit state
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [selectedPMIds, setSelectedPMIds] = useState<Set<string>>(new Set());
  const [bulkEditData, setBulkEditData] = useState({
    frequency: '',
    nextDue: '',
  });
  const [bulkEditProgress, setBulkEditProgress] = useState<{
    isProcessing: boolean;
    processed: number;
    total: number;
    currentBatch: number;
    totalBatches: number;
  }>({
    isProcessing: false,
    processed: 0,
    total: 0,
    currentBatch: 0,
    totalBatches: 0
  });
  
  // Bulk delete state
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState<{
    isProcessing: boolean;
    processed: number;
    total: number;
  }>({
    isProcessing: false,
    processed: 0,
    total: 0
  });

  // Fetch PM Schedules
  const { data: pmSchedules, isLoading: pmSchedulesLoading, error: pmSchedulesError } = useQuery({
    queryKey: ['pmSchedules'],
    queryFn: pmService.getSchedules,
  });

  // Fetch Dashboard Stats for KPI cards
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardService.getStats,
  });

  const { data: maintenanceScheduleStats, isLoading: maintenanceScheduleStatsLoading } = useQuery({
    queryKey: ['dashboard', 'maintenance-stats'],
    queryFn: dashboardService.getMaintenanceStats,
  });

  // Fetch critical assets data
  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: assetsService.getAll,
  });

  // Fetch work orders for maintenance analytics
  const { data: workOrders, isLoading: workOrdersLoading } = useQuery({
    queryKey: ['work-orders'],
    queryFn: workOrdersService.getAll,
  });

  // Fetch monthly trends data
  const { data: monthlyTrendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['dashboard', 'maintenance-trends'],
    queryFn: () => dashboardService.getTrends(6), // Get last 6 months
  });

  // Fetch work orders for the selected PM schedule
  const { data: pmWorkOrders, isLoading: pmWorkOrdersLoading } = useQuery({
    queryKey: ['pm-work-orders', selectedPM?.id],
    queryFn: async () => {
      if (!selectedPM?.id) return { current: null, history: [] };
      
      try {
        const allWorkOrders = await workOrdersService.getAll();
        
        // Find work orders related to this PM schedule
        const relatedWorkOrders = allWorkOrders.filter((wo: any) => 
          wo.pmScheduleId === selectedPM.id || 
          (wo.title && wo.title.toLowerCase().includes(selectedPM.title?.toLowerCase() || '')) ||
          (wo.assetId === selectedPM.assetId && wo.type === 'PREVENTIVE')
        );
        
        // Separate current (open/in progress) from completed
        const currentWorkOrder = relatedWorkOrders.find((wo: any) => 
          wo.status === 'OPEN' || wo.status === 'IN_PROGRESS'
        );
        
        const completedWorkOrders = relatedWorkOrders
          .filter((wo: any) => wo.status === 'COMPLETED')
          .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        
        return {
          current: currentWorkOrder || null,
          history: completedWorkOrders,
          total: relatedWorkOrders.length
        };
      } catch (error) {
        console.error('Error fetching PM work orders:', error);
        return { current: null, history: [], total: 0 };
      }
    },
    enabled: !!selectedPM?.id && pmDetailsOpen
  });

  // Helper function to generate QR code for PM schedule
  const generatePMScheduleQRCode = useCallback(async (pmData: any) => {
    try {
      const qrData = qrService.createQRCodeData('pm-schedule', pmData.id?.toString() || 'temp', {
        name: pmData.name,
        frequency: pmData.frequency,
        assetId: pmData.assetId,
      });
      const qrCodeUrl = qrService.generateQRCodeUrl(qrData);
      return qrCodeUrl;
    } catch (error) {
      console.error('Failed to generate QR code for PM schedule:', error);
      return null;
    }
  }, []);

  // Mutations for PM Schedules
  const createMutation = useMutation({
    mutationFn: async (pmData: any) => {
      // Create the PM schedule
      const createdSchedule = await pmService.createSchedule(pmData);
      return createdSchedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pmSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'maintenance-stats'] });
      setOpenScheduleDialog(false);
    },
    onError: (error) => {
      console.error("Error creating PM schedule:", error);
      alert("Failed to create PM schedule.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      console.log('[Maintenance] Starting PM schedule update mutation:', id, 'with data:', data);
      
      try {
        // If the PM schedule doesn't have a QR code, generate one
        if (!data.qrCode) {
          console.log('[Maintenance] Generating QR code for PM schedule...');
          const qrCodeUrl = await generatePMScheduleQRCode({ ...data, id });
          data = { ...data, qrCode: qrCodeUrl };
          console.log('[Maintenance] QR code generated:', qrCodeUrl);
        }
        
        console.log('[Maintenance] Calling pmService.updateSchedule...');
        const result = await pmService.updateSchedule(id, data);
        console.log('[Maintenance] PM schedule update successful:', result);
        return result;
      } catch (error) {
        console.error('[Maintenance] PM schedule update failed in mutation:', error);
        throw error; // Re-throw to trigger onError
      }
    },
    onSuccess: (result) => {
      console.log('[Maintenance] PM schedule update mutation succeeded:', result);
      queryClient.invalidateQueries({ queryKey: ['pmSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'maintenance-stats'] });
      setOpenScheduleDialog(false);
      setSelectedSchedule(null);
    },
    onError: (error: any) => {
      console.error("[Maintenance] PM schedule update mutation failed:", error);
      console.error("[Maintenance] Error details:", error?.response?.data);
      const errorMessage = error?.response?.data?.message || error?.message || "Unknown error occurred";
      alert(`Failed to update PM schedule: ${errorMessage}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: pmService.deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pmSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'maintenance-stats'] });
      handleCloseMenu();
    },
    onError: (error) => {
      console.error("Error deleting PM schedule:", error);
      alert("Failed to delete PM schedule.");
    },
  });

  const bulkEditMutation = useMutation({
    mutationFn: async ({ ids, data }: { ids: string[], data: any }) => {
      const BATCH_SIZE = 5; // Process 5 items at a time
      const DELAY_MS = 200; // 200ms delay between batches
      const results = [];
      const errors = [];
      const totalBatches = Math.ceil(ids.length / BATCH_SIZE);

      console.log(`Processing bulk edit for ${ids.length} PM schedules in batches of ${BATCH_SIZE}`);
      
      // Initialize progress
      setBulkEditProgress({
        isProcessing: true,
        processed: 0,
        total: ids.length,
        currentBatch: 0,
        totalBatches
      });

      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);
        const currentBatchNum = Math.floor(i / BATCH_SIZE) + 1;
        
        console.log(`Processing batch ${currentBatchNum}/${totalBatches}: ${batch.length} items`);
        
        // Update progress
        setBulkEditProgress(prev => ({
          ...prev,
          currentBatch: currentBatchNum
        }));

        try {
          // Process batch with individual error handling
          const batchPromises = batch.map(async (id) => {
            try {
              const result = await pmService.updateSchedule(id, data);
              return { id, success: true, result };
            } catch (error) {
              console.error(`Failed to update PM schedule ${id}:`, error);
              return { id, success: false, error: error.message || 'Unknown error' };
            }
          });

          const batchResults = await Promise.all(batchPromises);
          
          // Separate successful and failed updates
          batchResults.forEach(result => {
            if (result.success) {
              results.push(result);
            } else {
              errors.push(result);
            }
          });

          // Update progress with completed items
          setBulkEditProgress(prev => ({
            ...prev,
            processed: results.length + errors.length
          }));

          // Add delay between batches (except for the last batch)
          if (i + BATCH_SIZE < ids.length) {
            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
          }

        } catch (batchError) {
          console.error(`Batch processing failed:`, batchError);
          // If entire batch fails, mark all items in batch as failed
          batch.forEach(id => {
            errors.push({ id, success: false, error: batchError.message || 'Batch processing failed' });
          });
          
          // Update progress
          setBulkEditProgress(prev => ({
            ...prev,
            processed: results.length + errors.length
          }));
        }
      }

      console.log(`Bulk edit completed: ${results.length} successful, ${errors.length} failed`);
      
      return {
        successful: results,
        failed: errors,
        totalProcessed: ids.length,
        successCount: results.length,
        failureCount: errors.length
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pmSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'maintenance-stats'] });
      
      // Reset progress
      setBulkEditProgress({
        isProcessing: false,
        processed: 0,
        total: 0,
        currentBatch: 0,
        totalBatches: 0
      });
      
      // Show detailed success/failure message
      if (result.failureCount === 0) {
        alert(`Successfully updated all ${result.successCount} PM schedules.`);
      } else if (result.successCount === 0) {
        alert(`Failed to update any PM schedules. Please try again or contact support.`);
      } else {
        alert(`Updated ${result.successCount} PM schedules successfully. ${result.failureCount} failed - please check the console for details.`);
        console.log('Failed updates:', result.failed);
      }
      
      setBulkEditOpen(false);
      setSelectedPMIds(new Set());
      setBulkEditData({ frequency: '', nextDue: '' });
    },
    onError: (error) => {
      console.error("Error during bulk edit operation:", error);
      
      // Reset progress
      setBulkEditProgress({
        isProcessing: false,
        processed: 0,
        total: 0,
        currentBatch: 0,
        totalBatches: 0
      });
      
      alert(`Bulk edit operation failed: ${error.message || 'Unknown error'}. Please try with fewer items or contact support.`);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      setBulkDeleteProgress(prev => ({
        ...prev,
        isProcessing: true,
        total: ids.length,
        processed: 0
      }));

      console.log(`Starting bulk delete of ${ids.length} PM schedules`);
      
      const result = await pmService.bulkDeleteSchedules(ids);
      
      setBulkDeleteProgress(prev => ({
        ...prev,
        processed: result.deletedSchedules
      }));
      
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['pmSchedules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'maintenance-stats'] });
      
      // Reset progress
      setBulkDeleteProgress({
        isProcessing: false,
        processed: 0,
        total: 0
      });
      
      alert(`Successfully deleted ${result.deletedSchedules} PM schedules and ${result.deletedWorkOrders} related work orders.`);
      
      setBulkDeleteOpen(false);
      setSelectedPMIds(new Set());
    },
    onError: (error) => {
      console.error("Error during bulk delete operation:", error);
      
      // Reset progress
      setBulkDeleteProgress({
        isProcessing: false,
        processed: 0,
        total: 0
      });
      
      alert(`Bulk delete operation failed: ${error.message || 'Unknown error'}. Please try again or contact support.`);
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleScheduleMaintenance = () => {
    setSelectedSchedule(null);
    setFormMode('create');
    setOpenScheduleDialog(true);
  };

  const handleSubmitSchedule = (data: any) => {
    console.log('[Maintenance] handleSubmitSchedule called with mode:', formMode, 'data:', data);
    console.log('[Maintenance] selectedSchedule:', selectedSchedule);
    console.log('[Maintenance] updateMutation status:', {
      isPending: updateMutation.isPending,
      isError: updateMutation.isError,
      error: updateMutation.error
    });
    
    if (formMode === 'create') {
      console.log('[Maintenance] Calling createMutation.mutate');
      createMutation.mutate(data);
    } else if (formMode === 'edit' && selectedSchedule) {
      console.log('[Maintenance] Calling updateMutation.mutate with id:', selectedSchedule.id.toString());
      updateMutation.mutate({ id: selectedSchedule.id.toString(), data });
    } else {
      console.error('[Maintenance] Update conditions not met:', {
        formMode,
        hasSelectedSchedule: !!selectedSchedule,
        selectedScheduleId: selectedSchedule?.id
      });
    }
  };

  const handleEditClick = (schedule: any) => {
    console.log('[Maintenance] handleEditClick called with schedule:', schedule);
    setSelectedSchedule(schedule);
    setFormMode('edit');
    setOpenScheduleDialog(true);
    setAnchorEl(null); // Close menu without clearing selectedSchedule
  };

  const handleDeleteClick = (scheduleId: string) => {
    if (window.confirm("Are you sure you want to delete this PM schedule?")) {
      deleteMutation.mutate(scheduleId);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, schedule: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedSchedule(schedule);
  };

  const handleCloseMenu = () => {
    console.log('[Maintenance] handleCloseMenu called, clearing selectedSchedule');
    setAnchorEl(null);
    setSelectedSchedule(null);
  };

  // PM Details Modal Handlers
  const handlePMDetailsOpen = (pm: any) => {
    setSelectedPM(pm);
    setPmDetailsOpen(true);
  };

  const handlePMDetailsClose = () => {
    setPmDetailsOpen(false);
    setSelectedPM(null);
  };

  // Function to check if PM has ACTIVE work orders (open or in progress only)
  const hasActiveWorkOrder = (pmSchedule: any) => {
    if (!workOrders || !pmSchedule) return false;
    
    return workOrders.some((wo: any) => 
      (wo.status === 'OPEN' || wo.status === 'IN_PROGRESS') && (
        wo.pmScheduleId === pmSchedule.id || 
        (wo.title && wo.title.toLowerCase().includes(pmSchedule.title?.toLowerCase() || '')) ||
        (wo.assetId === pmSchedule.assetId && wo.type === 'PREVENTIVE')
      )
    );
  };

  // Bulk edit handlers
  const handleSelectPM = (pmId: string, selected: boolean) => {
    const newSelection = new Set(selectedPMIds);
    if (selected) {
      newSelection.add(pmId);
    } else {
      newSelection.delete(pmId);
    }
    setSelectedPMIds(newSelection);
  };

  const handleSelectAll = () => {
    if (!filteredPMSchedules) return;
    
    if (selectedPMIds.size === filteredPMSchedules.length) {
      // Deselect all
      setSelectedPMIds(new Set());
    } else {
      // Select all
      const allIds = new Set(filteredPMSchedules.map((pm: any) => pm.id.toString()));
      setSelectedPMIds(allIds);
    }
  };

  const handleBulkEditOpen = () => {
    if (selectedPMIds.size === 0) {
      alert('Please select at least one PM schedule to edit.');
      return;
    }
    
    // Warn for large batch operations
    if (selectedPMIds.size > 20) {
      const proceed = confirm(
        `You are about to edit ${selectedPMIds.size} PM schedules. This may take some time and will be processed in batches to avoid database issues. Do you want to proceed?`
      );
      if (!proceed) {
        return;
      }
    }
    
    setBulkEditOpen(true);
  };

  const handleBulkEditClose = () => {
    // Prevent closing while processing
    if (bulkEditProgress.isProcessing) {
      return;
    }
    setBulkEditOpen(false);
    setBulkEditData({ frequency: '', nextDue: '' });
  };

  const handleBulkEditChange = (field: string, value: string) => {
    setBulkEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBulkEditSubmit = () => {
    const updateData: any = {};
    
    if (bulkEditData.frequency) {
      updateData.frequency = bulkEditData.frequency;
    }
    
    if (bulkEditData.nextDue) {
      updateData.nextDue = bulkEditData.nextDue;
    }

    if (Object.keys(updateData).length === 0) {
      alert('Please select at least one field to update.');
      return;
    }

    bulkEditMutation.mutate({
      ids: Array.from(selectedPMIds),
      data: updateData
    });
  };

  const handleBulkDeleteOpen = () => {
    if (selectedPMIds.size === 0) {
      alert('Please select at least one PM schedule to delete.');
      return;
    }
    
    // Warn for large batch operations
    if (selectedPMIds.size > 10) {
      const proceed = confirm(
        `You are about to delete ${selectedPMIds.size} PM schedules and their related work orders. This action cannot be undone. Do you want to proceed?`
      );
      if (!proceed) {
        return;
      }
    }
    
    setBulkDeleteOpen(true);
  };

  const handleBulkDeleteClose = () => {
    // Prevent closing while processing
    if (bulkDeleteProgress.isProcessing) {
      return;
    }
    setBulkDeleteOpen(false);
  };

  const handleBulkDeleteSubmit = () => {
    const ids = Array.from(selectedPMIds).map(id => parseInt(id));
    bulkDeleteMutation.mutate(ids);
  };

  // Filter PM schedules based on tab
  const filteredPMSchedules = pmSchedules?.filter((schedule: any) => {
    const nextDueDate = dayjs(schedule.nextDue);
    const now = dayjs();

    if (tabValue === 0) { // Upcoming
      return nextDueDate.isAfter(now) || nextDueDate.isSame(now, 'day');
    } else if (tabValue === 1) { // In Progress (no direct status for PMs, so we'll approximate)
      // For now, we'll consider PMs that have generated a WO that is in progress
      // This would require linking PMs to WOs, which is not yet fully implemented in backend
      return false; // Placeholder
    } else if (tabValue === 2) { // Completed (no direct status for PMs)
      return false; // Placeholder
    }
    return true;
  }) || [];

  // Process real data for maintenance analytics
  const maintenanceByType = [
    { 
      type: 'Preventive', 
      count: workOrders?.filter(wo => wo.category === 'PREVENTIVE' || wo.type === 'PREVENTIVE').length || 0, 
      color: statusColors.ONLINE 
    },
    { 
      type: 'Corrective', 
      count: workOrders?.filter(wo => wo.category === 'CORRECTIVE' || wo.type === 'CORRECTIVE').length || 0, 
      color: statusColors.URGENT 
    },
    { 
      type: 'Emergency', 
      count: workOrders?.filter(wo => wo.category === 'EMERGENCY' || wo.priority === 'URGENT').length || 0, 
      color: statusColors.CRITICAL 
    },
  ];

  // Transform monthly trends data
  const monthlyTrend = monthlyTrendsData?.map(trend => ({
    month: new Date(trend.date).toLocaleDateString('en-US', { month: 'short' }),
    scheduled: trend.created || 0,
    completed: trend.completed || 0,
  })) || [];

  // Get critical assets from real asset data
  const criticalAssets = assets
    ?.filter(asset => asset.criticality === 'HIGH' || asset.criticality === 'CRITICAL')
    ?.sort((a, b) => {
      // Sort by health score if available, otherwise by criticality
      const healthA = a.healthScore || (a.criticality === 'CRITICAL' ? 50 : 70);
      const healthB = b.healthScore || (b.criticality === 'CRITICAL' ? 50 : 70);
      return healthA - healthB;
    })
    ?.slice(0, 5) // Take top 5 most critical
    ?.map(asset => ({
      id: asset.id,
      name: asset.name,
      nextMaintenance: asset.nextMaintenanceDate || 'Not scheduled',
      health: asset.healthScore || (asset.criticality === 'CRITICAL' ? 50 : 70),
      location: asset.location?.name || 'Unknown',
      criticality: asset.criticality,
    })) || [];

  if (pmSchedulesLoading || statsLoading || maintenanceScheduleStatsLoading || assetsLoading || workOrdersLoading || trendsLoading) {
    return (
      <LoadingOverlay
        open={true}
        message="Loading Maintenance Data..."
        context="dashboard"
      />
    );
  }

  if (pmSchedulesError || statsError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load maintenance data: {pmSchedulesError?.message || statsError?.message}</Alert>
      </Box>
    );
  }

  return (
    <MobileContainer maxHeight="100vh" sx={{ bgcolor: 'background.default' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <ResponsiveText variant="h4" maxLines={2} sx={{ fontWeight: 700 }}>
          Maintenance Management
        </ResponsiveText>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <UniversalExportButton
            dataSource="maintenance"
            entityType="maintenance_schedules"
            buttonText="Export"
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleScheduleMaintenance}
          >
            Schedule Maintenance
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Scheduled This Month"
            value={maintenanceScheduleStats?.thisMonth || 0}
            subtitle={`${maintenanceScheduleStats?.thisWeek || 0} due this week`}
            icon={<ScheduleIcon />}
            color="primary"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Work Orders"
            value={stats?.workOrders?.byStatus?.COMPLETED || 0}
            subtitle={`${stats?.workOrders?.completionRate || 0}% completion rate`}
            change={5} // Placeholder
            changeLabel="vs last month" // Placeholder
            icon={<CheckIcon />}
            color="success"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Overdue Work Orders"
            value={stats?.workOrders?.overdue || 0}
            subtitle="Requires immediate attention"
            icon={<WarningIcon />}
            color="error"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Total Assets"
            value={stats?.assets?.total || 0}
            subtitle="Managed assets"
            change={0} // Placeholder
            changeLabel="" // Placeholder
            icon={<BuildIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Maintenance Schedule */}
        <Grid xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Maintenance Schedule
              </Typography>
              <Box>
                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab label="Upcoming" />
                  <Tab label="In Progress" />
                  <Tab label="Completed" />
                  <Tab label="Calendar View" />
                </Tabs>
              </Box>
            </Box>

            {tabValue === 3 ? (
              // Calendar View - PMCalendar Component
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  🗓️ PM Calendar - Component Successfully Updated! 
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Found {pmSchedules?.length || 0} PM schedules to display in calendar format.
                </Typography>
                <Paper 
                  elevation={3} 
                  sx={{ 
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Calendar Header */}
                  <Box sx={{ 
                    bgcolor: 'primary.main', 
                    color: 'white', 
                    p: 3,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                        📅 {currentCalendarDate.format('MMMM YYYY')}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                          onClick={() => setCurrentCalendarDate(prev => prev.subtract(1, 'month'))}
                        >
                          <ChevronLeft />
                        </IconButton>
                        <Button 
                          variant="contained"
                          size="small"
                          sx={{ 
                            bgcolor: 'rgba(255,255,255,0.2)', 
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                          }}
                          onClick={() => setCurrentCalendarDate(dayjs())}
                        >
                          Today
                        </Button>
                        <IconButton 
                          sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                          onClick={() => setCurrentCalendarDate(prev => prev.add(1, 'month'))}
                        >
                          <ChevronRight />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>

                  {/* Calendar Body */}
                  <Box sx={{ p: 3 }}>
                    {/* Calendar Grid */}
                    <Grid container spacing={1}>
                      {(() => {
                        const startOfMonth = currentCalendarDate.startOf('month');
                        const endOfMonth = currentCalendarDate.endOf('month');
                        const startOfCalendar = startOfMonth.startOf('week');
                        const endOfCalendar = endOfMonth.endOf('week');
                        
                        const days = [];
                        let current = startOfCalendar;
                        
                        while (current.isBefore(endOfCalendar) || current.isSame(endOfCalendar, 'day')) {
                          days.push(current);
                          current = current.add(1, 'day');
                        }
                        
                        return days.map((date, i) => {
                          const isCurrentMonth = date.month() === currentCalendarDate.month();
                          const isToday = date.isSame(dayjs(), 'day');
                          const dayPMs = pmSchedules?.filter((schedule: any) => 
                            dayjs(schedule.nextDue).isSame(date, 'day')
                          ) || [];

                          return (
                            <Grid xs={12/7} key={i}>
                              <Paper 
                                elevation={isToday ? 3 : 1}
                                sx={{ 
                                  minHeight: { xs: 80, sm: 120 },
                                  p: { xs: 1, sm: 1.5 },
                                  bgcolor: isCurrentMonth 
                                    ? (isToday ? 'primary.light' : 'background.paper')
                                    : 'grey.50',
                                  border: isToday ? '2px solid' : '1px solid',
                                  borderColor: isToday ? 'primary.main' : 'divider',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease-in-out',
                                  '&:hover': { 
                                    bgcolor: isCurrentMonth ? 'action.hover' : 'grey.100',
                                    transform: 'translateY(-1px)',
                                    boxShadow: 2
                                  }
                                }}
                                onClick={() => console.log('Date clicked:', date.format('YYYY-MM-DD'))}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      fontWeight: isToday ? 'bold' : 'normal',
                                      color: isCurrentMonth 
                                        ? (isToday ? 'white' : 'text.primary') 
                                        : 'text.disabled',
                                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                    }}
                                  >
                                    {date.format('D')}
                                  </Typography>
                                  <Chip
                                    label={date.format('ddd')}
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: { xs: '0.55rem', sm: '0.6rem' },
                                      bgcolor: isCurrentMonth 
                                        ? (isToday ? 'rgba(255,255,255,0.3)' : 'primary.light')
                                        : 'grey.300',
                                      color: isCurrentMonth 
                                        ? (isToday ? 'white' : 'white') 
                                        : 'text.disabled',
                                      fontWeight: 'bold'
                                    }}
                                  />
                                </Box>
                                
                                {dayPMs.slice(0, 2).map((pm: any, idx: number) => (
                                  <Chip 
                                    key={idx}
                                    label={pm.title}
                                    size="small"
                                    sx={{ 
                                      fontSize: { xs: '0.55rem', sm: '0.65rem' },
                                      height: 'auto',
                                      mb: 0.5,
                                      maxWidth: '100%',
                                      display: 'block',
                                      bgcolor: 'secondary.light',
                                      color: 'white',
                                      '&:hover': {
                                        bgcolor: 'secondary.main'
                                      }
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSchedule(pm);
                                      setFormMode('view');
                                      setOpenScheduleDialog(true);
                                    }}
                                  />
                                ))}
                                
                                {dayPMs.length > 2 && (
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: 'text.secondary', 
                                      fontSize: { xs: '0.6rem', sm: '0.7rem' } 
                                    }}
                                  >
                                    +{dayPMs.length - 2} more
                                  </Typography>
                                )}
                              </Paper>
                            </Grid>
                          );
                        });
                      })()}
                    </Grid>

                    {/* Calendar Footer */}
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>💡 How to use:</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Click on any date to add a new PM schedule • Click on PM chips to view details • Use navigation arrows to browse months
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            ) : (
              // List View
              <>
                {/* Bulk Action Toolbar */}
                {filteredPMSchedules.length > 0 && (
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Checkbox
                        checked={selectedPMIds.size > 0 && selectedPMIds.size === filteredPMSchedules.length}
                        indeterminate={selectedPMIds.size > 0 && selectedPMIds.size < filteredPMSchedules.length}
                        onChange={handleSelectAll}
                      />
                      <Typography variant="body2">
                        {selectedPMIds.size > 0 
                          ? `${selectedPMIds.size} of ${filteredPMSchedules.length} selected` 
                          : 'Select all'}
                      </Typography>
                      
                      {selectedPMIds.size > 0 && (
                        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={handleBulkEditOpen}
                          >
                            Bulk Edit ({selectedPMIds.size})
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={handleBulkDeleteOpen}
                          >
                            Bulk Delete ({selectedPMIds.size})
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ClearIcon />}
                            onClick={() => setSelectedPMIds(new Set())}
                          >
                            Clear Selection
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
                
                <List>
                {filteredPMSchedules.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No PM schedules found for this category.
                  </Typography>
                ) : (
                  filteredPMSchedules.map((item: any) => (
                    <ListItem
                      key={item.id}
                      sx={{
                        mb: 1,
                        backgroundColor: theme.palette.background.default,
                        borderRadius: 2,
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <Checkbox
                        checked={selectedPMIds.has(item.id.toString())}
                        onChange={(e) => handleSelectPM(item.id.toString(), e.target.checked)}
                        sx={{ mr: 1 }}
                      />
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: theme.palette.primary.light }}>
                          <ScheduleIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" fontWeight={600}>
                              {item.title}
                            </Typography>
                            <Chip
                              label={item.frequency}
                              size="small"
                              sx={{
                                backgroundColor: theme.palette.info.light + '20',
                                color: theme.palette.info.main,
                                fontWeight: 600,
                              }}
                            />
                            {/* Work Order Verification Indicator */}
                            <IconButton
                              size="small"
                              onClick={() => handlePMDetailsOpen(item)}
                              sx={{
                                color: hasActiveWorkOrder(item) ? 'success.main' : 'error.main',
                                '&:hover': {
                                  backgroundColor: hasActiveWorkOrder(item) ? 'success.light' : 'error.light',
                                  opacity: 0.1,
                                },
                              }}
                              title={hasActiveWorkOrder(item) ? 'Has active work order - Click to view details' : 'No active work orders - Click to view details'}
                            >
                              {hasActiveWorkOrder(item) ? <CheckIcon /> : <CancelIcon />}
                            </IconButton>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Asset: {item.asset?.name || 'N/A'} • Due: {dayjs(item.nextDue).format('YYYY-MM-DD')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.description}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={(event) => handleMenuOpen(event, item)}>
                          <MoreVertIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))
                )}
              </List>
              </>
            )}
          </Paper>
        </Grid>

      </Grid>

      {/* Context Menu for List Items */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => handleEditClick(selectedSchedule)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => handleDeleteClick(selectedSchedule.id)}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Maintenance Schedule Form Dialog */}
      <MaintenanceScheduleForm
        open={openScheduleDialog}
        onClose={() => {
          console.log('[Maintenance] Form dialog closing, keeping selectedSchedule');
          setOpenScheduleDialog(false);
        }}
        onSubmit={handleSubmitSchedule}
        initialData={selectedSchedule || {}}
        mode={formMode}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* PM Details Modal */}
      <Dialog
        open={pmDetailsOpen}
        onClose={handlePMDetailsClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '500px' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon color="primary" />
            <Typography variant="h6">
              PM Schedule Details: {selectedPM?.title}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
            {hasActiveWorkOrder(selectedPM) ? (
              <Chip
                icon={<CheckIcon />}
                label="Has Active Work Orders"
                color="success"
                size="small"
              />
            ) : (
              <Chip
                icon={<CancelIcon />}
                label="No Active Work Orders"
                color="error"
                size="small"
              />
            )}
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {pmWorkOrdersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <LoadingSpinner />
            </Box>
          ) : (
            <>
              {/* PM Schedule Information */}
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Frequency</Typography>
                    <Typography variant="body1" fontWeight={600}>{selectedPM?.frequency}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Next Due</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedPM?.nextDue ? dayjs(selectedPM.nextDue).format('YYYY-MM-DD') : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Asset</Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedPM?.asset?.name || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Priority</Typography>
                    <Chip
                      label={selectedPM?.priority || 'MEDIUM'}
                      color={selectedPM?.priority === 'HIGH' ? 'error' : selectedPM?.priority === 'LOW' ? 'default' : 'warning'}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Description</Typography>
                    <Typography variant="body1">{selectedPM?.description || 'No description available'}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Current Work Order */}
              {pmWorkOrders?.current ? (
                <>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WorkOrderIcon color="primary" />
                    Current Work Order
                  </Typography>
                  <Paper sx={{ p: 2, mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={8}>
                        <Typography variant="body1" fontWeight={600}>
                          {pmWorkOrders.current.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {pmWorkOrders.current.description}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                          <Chip
                            label={pmWorkOrders.current.status}
                            color={pmWorkOrders.current.status === 'OPEN' ? 'info' : 'warning'}
                            size="small"
                          />
                          <Chip
                            label={pmWorkOrders.current.priority}
                            color={pmWorkOrders.current.priority === 'HIGH' ? 'error' : 'default'}
                            size="small"
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="text.secondary">
                          Created: {dayjs(pmWorkOrders.current.createdAt).format('YYYY-MM-DD')}
                        </Typography>
                        {pmWorkOrders.current.dueDate && (
                          <Typography variant="body2" color="text.secondary">
                            Due: {dayjs(pmWorkOrders.current.dueDate).format('YYYY-MM-DD')}
                          </Typography>
                        )}
                      </Grid>
                    </Grid>
                  </Paper>
                </>
              ) : (
                <Alert severity="info" sx={{ mb: 3 }}>
                  No current work order found for this PM schedule.
                </Alert>
              )}

              {/* Work Order History */}
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon color="action" />
                Work Order History ({pmWorkOrders?.history?.length || 0})
              </Typography>

              {pmWorkOrders?.history && pmWorkOrders.history.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Completed</TableCell>
                        <TableCell>Duration</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pmWorkOrders.history.map((wo: any) => (
                        <TableRow key={wo.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {wo.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {wo.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={wo.status}
                              color="success"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={wo.priority}
                              color={wo.priority === 'HIGH' ? 'error' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {dayjs(wo.createdAt).format('YYYY-MM-DD')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {dayjs(wo.updatedAt).format('YYYY-MM-DD')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {dayjs(wo.updatedAt).diff(dayjs(wo.createdAt), 'days')} days
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  No completed work orders found for this PM schedule.
                </Alert>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handlePMDetailsClose}>Close</Button>
          {pmWorkOrders?.current && (
            <Button
              variant="contained"
              onClick={() => {
                // Navigate to work order details
                window.open(`/admin/work-orders/${pmWorkOrders.current.id}`, '_blank');
              }}
            >
              View Current Work Order
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Bulk Edit Dialog */}
      <Dialog
        open={bulkEditOpen}
        onClose={handleBulkEditClose}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={bulkEditProgress.isProcessing}
        PaperProps={{
          sx: { 
            minHeight: bulkEditProgress.isProcessing ? '350px' : 'auto'
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6">
            Bulk Edit PM Schedules ({selectedPMIds.size} selected)
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Frequency</InputLabel>
              <Select
                value={bulkEditData.frequency}
                label="Frequency"
                onChange={(e) => handleBulkEditChange('frequency', e.target.value)}
              >
                <MenuItem value="">Keep Current</MenuItem>
                <MenuItem value="DAILY">Daily</MenuItem>
                <MenuItem value="WEEKLY">Weekly</MenuItem>
                <MenuItem value="MONTHLY">Monthly</MenuItem>
                <MenuItem value="QUARTERLY">Quarterly</MenuItem>
                <MenuItem value="SEMI_ANNUAL">Semi-Annual</MenuItem>
                <MenuItem value="ANNUAL">Annual</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Next Due Date"
              type="datetime-local"
              value={bulkEditData.nextDue}
              onChange={(e) => handleBulkEditChange('nextDue', e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              helperText="Leave empty to keep current due dates"
            />

            {/* Progress Indicator */}
            {bulkEditProgress.isProcessing && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Processing batch {bulkEditProgress.currentBatch} of {bulkEditProgress.totalBatches}...
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(bulkEditProgress.processed / bulkEditProgress.total) * 100}
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {bulkEditProgress.processed} of {bulkEditProgress.total} items processed
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={handleBulkEditClose}
            disabled={bulkEditProgress.isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleBulkEditSubmit}
            variant="contained"
            disabled={bulkEditMutation.isPending || bulkEditProgress.isProcessing}
          >
            {bulkEditProgress.isProcessing 
              ? `Processing... (${bulkEditProgress.processed}/${bulkEditProgress.total})`
              : bulkEditMutation.isPending 
                ? 'Starting...' 
                : 'Update Selected'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={bulkDeleteOpen}
        onClose={handleBulkDeleteClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: '2px solid',
            borderColor: 'error.main'
          }
        }}
      >
        <DialogTitle sx={{ color: 'error.main' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon />
            Confirm Bulk Delete
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>This action cannot be undone!</strong>
          </Alert>
          
          <Typography variant="body1" gutterBottom>
            You are about to permanently delete <strong>{selectedPMIds.size}</strong> PM schedules and all their related work orders.
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will remove:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <Typography component="li" variant="body2">All selected PM schedules</Typography>
            <Typography component="li" variant="body2">All related work orders</Typography>
            <Typography component="li" variant="body2">All associated tasks and triggers</Typography>
          </Box>

          {bulkDeleteProgress.isProcessing && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" gutterBottom>
                Deleting PM schedules... ({bulkDeleteProgress.processed}/{bulkDeleteProgress.total})
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(bulkDeleteProgress.processed / bulkDeleteProgress.total) * 100} 
                sx={{ mt: 1 }}
              />
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={handleBulkDeleteClose}
            disabled={bulkDeleteProgress.isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleBulkDeleteSubmit}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={bulkDeleteMutation.isPending || bulkDeleteProgress.isProcessing}
          >
            {bulkDeleteProgress.isProcessing 
              ? `Deleting... (${bulkDeleteProgress.processed}/${bulkDeleteProgress.total})`
              : bulkDeleteMutation.isPending 
                ? 'Starting...' 
                : `Delete ${selectedPMIds.size} PM Schedules`}
          </Button>
        </DialogActions>
      </Dialog>
    </MobileContainer>
  );
}