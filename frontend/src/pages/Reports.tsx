import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  useTheme,
  useMediaQuery,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  Divider,
  SwipeableDrawer,
  BottomNavigation,
  BottomNavigationAction,
  Fade,
  Slide,
  Stack,
  Avatar,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Assignment as WorkOrderIcon,
  Build as AssetIcon,
  Schedule as MaintenanceIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  MoreVert as MoreIcon,
  DateRange as DateRangeIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FileDownload as FileDownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Description as CsvIcon,
  Close as CloseIcon,
  TouchApp as TouchIcon,
  Swipe as SwipeIcon,
} from '@mui/icons-material';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { dashboardService, workOrderService, assetService } from '../services/api';
import { statusColors } from '../theme/theme';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  dir?: string;
}

interface ChartCarouselProps {
  charts: React.ReactNode[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  isMobile: boolean;
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  color?: string;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, dir, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      dir={dir}
      {...other}
    >
      {value === index && (
        <Fade in={value === index} timeout={300}>
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {children}
          </Box>
        </Fade>
      )}
    </div>
  );
}

function ChartCarousel({ charts, currentIndex, onIndexChange, isMobile }: ChartCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  }, [isMobile]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !isDragging) return;
    const endX = e.changedTouches[0].clientX;
    const diff = startX.current - endX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex < charts.length - 1) {
        onIndexChange(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        onIndexChange(currentIndex - 1);
      }
    }
    setIsDragging(false);
  }, [isMobile, isDragging, currentIndex, charts.length, onIndexChange]);

  return (
    <Box 
      sx={{ 
        position: 'relative',
        overflow: 'hidden',
        touchAction: 'pan-y',
      }}
    >
      <Box
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        sx={{
          display: 'flex',
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          width: `${charts.length * 100}%`,
        }}
      >
        {charts.map((chart, index) => (
          <Box
            key={index}
            sx={{
              width: `${100 / charts.length}%`,
              flexShrink: 0,
            }}
          >
            {chart}
          </Box>
        ))}
      </Box>
      
      {isMobile && charts.length > 1 && (
        <>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 2,
              gap: 1,
            }}
          >
            {charts.map((_, index) => (
              <Box
                key={index}
                onClick={() => onIndexChange(index)}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: index === currentIndex ? 'primary.main' : 'grey.300',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </Box>
          
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: 8,
              transform: 'translateY(-50%)',
              zIndex: 1,
            }}
          >
            <IconButton
              onClick={() => onIndexChange(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' },
                boxShadow: 1,
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
          </Box>
          
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              right: 8,
              transform: 'translateY(-50%)',
              zIndex: 1,
            }}
          >
            <IconButton
              onClick={() => onIndexChange(Math.min(charts.length - 1, currentIndex + 1))}
              disabled={currentIndex === charts.length - 1}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' },
                boxShadow: 1,
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </>
      )}
    </Box>
  );
}

function SummaryCard({ title, value, change, changeType = 'neutral', icon, color }: SummaryCardProps) {
  const theme = useTheme();
  
  const changeColor = changeType === 'positive' ? theme.palette.success.main : 
                     changeType === 'negative' ? theme.palette.error.main : 
                     theme.palette.text.secondary;

  return (
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${color || theme.palette.primary.main}15 0%, ${color || theme.palette.primary.main}05 100%)`,
        border: `1px solid ${color || theme.palette.primary.main}20`,
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Avatar
            sx={{
              backgroundColor: color || theme.palette.primary.main,
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
            }}
          >
            {icon}
          </Avatar>
          {change && (
            <Typography
              variant="caption"
              sx={{
                color: changeColor,
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }}
            >
              {change}
            </Typography>
          )}
        </Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '2rem' },
            mb: 1,
          }}
        >
          {value}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
        >
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function Reports() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const [selectedTab, setSelectedTab] = useState(0);
  const [timePeriod, setTimePeriod] = useState('month');
  const [exportDrawerOpen, setExportDrawerOpen] = useState(false);
  const [chartIndex, setChartIndex] = useState(0);
  const [isShareSupported, setIsShareSupported] = useState(false);

  // Check if Web Share API is supported
  useEffect(() => {
    setIsShareSupported('share' in navigator);
  }, []);

  // Fetch report data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardService.getStats,
  });

  const { data: workOrderTrends = [], isLoading: trendsLoading } = useQuery({
    queryKey: ['dashboard', 'work-order-trends', timePeriod],
    queryFn: () => dashboardService.getWorkOrderTrends(timePeriod as 'week' | 'month' | 'year'),
  });

  const { data: assetHealth, isLoading: assetHealthLoading } = useQuery({
    queryKey: ['dashboard', 'asset-health'],
    queryFn: dashboardService.getAssetHealth,
  });

  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    setChartIndex(0); // Reset chart carousel when switching tabs
  }, []);

  const handleExport = useCallback(async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      // TODO: Implement actual export functionality
      console.log(`Exporting as ${format}`);
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message or handle download
      alert(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExportDrawerOpen(false);
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (isShareSupported && navigator.share) {
      try {
        await navigator.share({
          title: 'CMMS Reports',
          text: 'Check out these maintenance reports',
          url: window.location.href,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
    setExportDrawerOpen(false);
  }, [isShareSupported]);

  const handlePrint = useCallback(() => {
    window.print();
    setExportDrawerOpen(false);
  }, []);

  // Memoized data for performance
  const workOrderStatusData = useMemo(() => [
    { name: 'Open', value: stats?.workOrders?.open || 0, color: statusColors.OPEN },
    { name: 'In Progress', value: stats?.workOrders?.inProgress || 0, color: statusColors.IN_PROGRESS },
    { name: 'Completed', value: stats?.workOrders?.completed || 0, color: statusColors.COMPLETED },
    { name: 'On Hold', value: stats?.workOrders?.onHold || 0, color: statusColors.ON_HOLD },
  ], [stats]);

  const maintenanceTypeData = useMemo(() => [
    { name: 'Preventive', value: 45, color: theme.palette.success.main },
    { name: 'Corrective', value: 35, color: theme.palette.warning.main },
    { name: 'Emergency', value: 15, color: theme.palette.error.main },
    { name: 'Inspection', value: 5, color: theme.palette.info.main },
  ], [theme]);

  const assetUtilizationData = useMemo(() => [
    { month: 'Jan', utilization: 85, downtime: 15 },
    { month: 'Feb', utilization: 88, downtime: 12 },
    { month: 'Mar', utilization: 82, downtime: 18 },
    { month: 'Apr', utilization: 90, downtime: 10 },
    { month: 'May', utilization: 87, downtime: 13 },
    { month: 'Jun', utilization: 89, downtime: 11 },
  ], []);

  const costAnalysisData = useMemo(() => [
    { category: 'Labor', planned: 12000, actual: 13500 },
    { category: 'Parts', planned: 8000, actual: 7200 },
    { category: 'Contractors', planned: 5000, actual: 6800 },
    { category: 'Equipment', planned: 3000, actual: 2900 },
  ], []);

  // Mobile-optimized chart dimensions
  const chartHeight = isMobile ? 250 : isTablet ? 350 : 400;
  const pieRadius = isMobile ? 70 : isTablet ? 85 : 100;

  // Custom tooltip for mobile
  const MobileTooltip = useCallback(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            p: 2,
            boxShadow: 3,
            minWidth: isMobile ? 140 : 160,
          }}
        >
          {label && (
            <Typography variant="body2" fontWeight={600} mb={1}>
              {label}
            </Typography>
          )}
          {payload.map((entry: any, index: number) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ color: entry.color, fontSize: isMobile ? '0.875rem' : '1rem' }}
            >
              {entry.name}: {typeof entry.value === 'number' && entry.name?.includes('%') ? `${entry.value}%` : entry.value}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  }, [theme, isMobile]);

  // Render loading state
  if (statsLoading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
        gap={2}
      >
        <CircularProgress size={isMobile ? 40 : 60} />
        <Typography variant="body1" color="text.secondary">
          Loading reports...
        </Typography>
      </Box>
    );
  }

  // Tab configuration for mobile
  const tabConfig = [
    { icon: ReportIcon, label: 'Overview', shortLabel: 'Overview' },
    { icon: WorkOrderIcon, label: 'Work Orders', shortLabel: 'Orders' },
    { icon: AssetIcon, label: 'Assets', shortLabel: 'Assets' },
    { icon: MaintenanceIcon, label: 'Maintenance', shortLabel: 'Maint.' },
    { icon: InventoryIcon, label: 'Inventory', shortLabel: 'Stock' },
  ];

  // Mobile export options
  const exportOptions = [
    { 
      icon: PdfIcon, 
      label: 'Export as PDF', 
      action: () => handleExport('pdf'),
      color: theme.palette.error.main 
    },
    { 
      icon: ExcelIcon, 
      label: 'Export as Excel', 
      action: () => handleExport('excel'),
      color: theme.palette.success.main 
    },
    { 
      icon: CsvIcon, 
      label: 'Export as CSV', 
      action: () => handleExport('csv'),
      color: theme.palette.info.main 
    },
    { 
      icon: PrintIcon, 
      label: 'Print Report', 
      action: handlePrint,
      color: theme.palette.text.primary 
    },
  ];

  if (isShareSupported) {
    exportOptions.push({
      icon: ShareIcon,
      label: 'Share Report',
      action: handleShare,
      color: theme.palette.primary.main
    });
  }

  return (
    <Box sx={{ pb: isMobile ? 10 : 0 }}>
      {/* Header */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={{ xs: 2, sm: 0 }}
        mb={3}
      >
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontSize: { xs: '1.75rem', sm: '2.125rem' },
              fontWeight: 700,
            }}
          >
            Reports & Analytics
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Comprehensive insights into your maintenance operations
          </Typography>
        </Box>
        <Stack 
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <FormControl size="small" sx={{ minWidth: { xs: 100, sm: 120 } }}>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={timePeriod}
              label="Time Period"
              onChange={(e) => setTimePeriod(e.target.value)}
              sx={{ 
                '& .MuiSelect-select': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }
              }}
            >
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={() => setExportDrawerOpen(true)}
            sx={{ 
              minWidth: { xs: 44, sm: 'auto' },
              px: { xs: 1, sm: 2 },
              '& .MuiButton-startIcon': {
                margin: { xs: 0, sm: '0 8px 0 -4px' }
              }
            }}
          >
            {!isMobile && 'Export'}
          </Button>
        </Stack>
      </Box>

      {/* Mobile hint for swipe gestures */}
      {isMobile && (
        <Alert 
          icon={<SwipeIcon />} 
          severity="info" 
          sx={{ 
            mb: 2,
            backgroundColor: theme.palette.primary.main + '08',
            border: `1px solid ${theme.palette.primary.main}20`,
            '& .MuiAlert-message': {
              fontSize: '0.875rem'
            }
          }}
        >
          Swipe left or right on charts to explore more data visualizations
        </Alert>
      )}

      {/* Desktop Tabs */}
      {!isMobile && (
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                fontSize: '1rem',
                minWidth: 120,
                fontWeight: 500,
                '& .MuiSvgIcon-root': {
                  fontSize: 20
                }
              }
            }}
          >
            {tabConfig.map((tab, index) => (
              <Tab 
                key={index}
                icon={<tab.icon />} 
                label={tab.label}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Paper>
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            borderRadius: '16px 16px 0 0',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          }}
          elevation={8}
        >
          <BottomNavigation
            value={selectedTab}
            onChange={handleTabChange}
            sx={{
              height: 80,
              '& .MuiBottomNavigationAction-root': {
                minWidth: 'auto',
                maxWidth: 'none',
                fontSize: '0.75rem',
                '& .MuiSvgIcon-root': {
                  fontSize: 22
                },
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  '& .MuiBottomNavigationAction-label': {
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }
                }
              }
            }}
          >
            {tabConfig.map((tab, index) => (
              <BottomNavigationAction 
                key={index}
                icon={<tab.icon />} 
                label={tab.shortLabel}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}

      {/* Content Container */}
      <Paper sx={{ mb: 3, overflow: 'hidden' }}>
        {/* Overview Tab */}
        <TabPanel value={selectedTab} index={0}>
          {/* Key Metrics Summary Cards */}
          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <SummaryCard
                title="Total Work Orders"
                value={((stats?.workOrders?.open || 0) + (stats?.workOrders?.inProgress || 0) + (stats?.workOrders?.completed || 0) + (stats?.workOrders?.onHold || 0)).toString()}
                change="+12%"
                changeType="positive"
                icon={<WorkOrderIcon />}
                color={theme.palette.primary.main}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard
                title="Completion Rate"
                value="87%"
                change="+5%"
                changeType="positive"
                icon={<TrendingUpIcon />}
                color={theme.palette.success.main}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard
                title="Avg Response Time"
                value="2.4h"
                change="-0.3h"
                changeType="positive"
                icon={<DateRangeIcon />}
                color={theme.palette.info.main}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard
                title="Cost Savings"
                value="$24K"
                change="+18%"
                changeType="positive"
                icon={<TrendingUpIcon />}
                color={theme.palette.secondary.main}
              />
            </Grid>
          </Grid>

          {/* Charts Section */}
          {isMobile ? (
            <ChartCarousel
              currentIndex={chartIndex}
              onIndexChange={setChartIndex}
              isMobile={isMobile}
              charts={[
                // Work Order Status Chart
                <Card key="status" sx={{ mx: 1 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem', textAlign: 'center', mb: 3 }}>
                      Work Order Status Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <PieChart>
                        <Pie
                          data={workOrderStatusData}
                          cx="50%"
                          cy="50%"
                          outerRadius={pieRadius}
                          innerRadius={40}
                          dataKey="value"
                          paddingAngle={2}
                        >
                          {workOrderStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<MobileTooltip />} />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          iconType="circle"
                          wrapperStyle={{ fontSize: '14px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>,
                // Work Order Trends Chart
                <Card key="trends" sx={{ mx: 1 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem', textAlign: 'center', mb: 3 }}>
                      Work Order Trends
                    </Typography>
                    {trendsLoading ? (
                      <Box display="flex" justifyContent="center" py={6}>
                        <CircularProgress />
                      </Box>
                    ) : (
                      <ResponsiveContainer width="100%" height={chartHeight}>
                        <LineChart data={workOrderTrends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.grey[200]} />
                          <XAxis 
                            dataKey="period" 
                            fontSize={12}
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis 
                            fontSize={12}
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip content={<MobileTooltip />} />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            iconType="line"
                            wrapperStyle={{ fontSize: '14px' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="completed" 
                            stroke={theme.palette.success.main} 
                            name="Completed"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="created" 
                            stroke={theme.palette.primary.main} 
                            name="Created"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              ]}
            />
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontSize: '1.25rem' }}>
                      Work Order Status Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <PieChart>
                        <Pie
                          data={workOrderStatusData}
                          cx="50%"
                          cy="50%"
                          outerRadius={pieRadius}
                          innerRadius={50}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          paddingAngle={2}
                        >
                          {workOrderStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontSize: '1.25rem' }}>
                      Work Order Trends
                    </Typography>
                    {trendsLoading ? (
                      <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                      </Box>
                    ) : (
                      <ResponsiveContainer width="100%" height={chartHeight}>
                        <LineChart data={workOrderTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="period" 
                            fontSize={12}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            fontSize={12}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="completed" 
                            stroke={theme.palette.success.main} 
                            name="Completed"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="created" 
                            stroke={theme.palette.primary.main} 
                            name="Created"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Work Orders Tab */}
        <TabPanel value={selectedTab} index={1}>
          {/* Work Order Summary Cards */}
          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <SummaryCard
                title="Open Orders"
                value={stats?.workOrders?.open || 0}
                change="+3"
                changeType="neutral"
                icon={<WorkOrderIcon />}
                color={statusColors.OPEN}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard
                title="In Progress"
                value={stats?.workOrders?.inProgress || 0}
                change="+8"
                changeType="positive"
                icon={<WorkOrderIcon />}
                color={statusColors.IN_PROGRESS}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard
                title="Completed"
                value={stats?.workOrders?.completed || 0}
                change="+15"
                changeType="positive"
                icon={<WorkOrderIcon />}
                color={statusColors.COMPLETED}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard
                title="On Hold"
                value={stats?.workOrders?.onHold || 0}
                change="-2"
                changeType="positive"
                icon={<WorkOrderIcon />}
                color={statusColors.ON_HOLD}
              />
            </Grid>
          </Grid>

          {/* Charts */}
          {isMobile ? (
            <ChartCarousel
              currentIndex={chartIndex}
              onIndexChange={setChartIndex}
              isMobile={isMobile}
              charts={[
                // Maintenance Type Chart
                <Card key="maintenance" sx={{ mx: 1 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem', textAlign: 'center', mb: 3 }}>
                      Maintenance Type Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <PieChart>
                        <Pie
                          data={maintenanceTypeData}
                          cx="50%"
                          cy="50%"
                          outerRadius={pieRadius}
                          innerRadius={40}
                          dataKey="value"
                          paddingAngle={2}
                        >
                          {maintenanceTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<MobileTooltip />} />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          iconType="circle"
                          wrapperStyle={{ fontSize: '14px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>,
                // Cost Analysis Chart (Horizontal Bar for mobile)
                <Card key="cost" sx={{ mx: 1 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem', textAlign: 'center', mb: 3 }}>
                      Cost Analysis
                    </Typography>
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <BarChart 
                        data={costAnalysisData} 
                        layout="horizontal"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.grey[200]} />
                        <XAxis 
                          type="number"
                          fontSize={12}
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `$${value/1000}K`}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          type="category"
                          dataKey="category" 
                          fontSize={12}
                          tick={{ fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          content={<MobileTooltip />}
                          formatter={(value) => [`$${value}`, '']}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          iconType="rect"
                          wrapperStyle={{ fontSize: '14px' }}
                        />
                        <Bar 
                          dataKey="planned" 
                          fill={theme.palette.primary.main} 
                          name="Planned"
                          radius={[0, 4, 4, 0]}
                        />
                        <Bar 
                          dataKey="actual" 
                          fill={theme.palette.secondary.main} 
                          name="Actual"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ]}
            />
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontSize: '1.25rem' }}>
                      Maintenance Type Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <PieChart>
                        <Pie
                          data={maintenanceTypeData}
                          cx="50%"
                          cy="50%"
                          outerRadius={pieRadius}
                          innerRadius={50}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          paddingAngle={2}
                        >
                          {maintenanceTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontSize: '1.25rem' }}>
                      Cost Analysis
                    </Typography>
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <BarChart data={costAnalysisData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="category" 
                          fontSize={12}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          fontSize={12}
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `$${value/1000}K`}
                        />
                        <Tooltip formatter={(value) => [`$${value}`, '']} />
                        <Legend />
                        <Bar 
                          dataKey="planned" 
                          fill={theme.palette.primary.main} 
                          name="Planned"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey="actual" 
                          fill={theme.palette.secondary.main} 
                          name="Actual"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Assets Tab */}
        <TabPanel value={selectedTab} index={2}>
          {/* Asset Summary Cards */}
          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <SummaryCard
                title="Total Assets"
                value="142"
                change="+8"
                changeType="positive"
                icon={<AssetIcon />}
                color={theme.palette.primary.main}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard
                title="Online Assets"
                value="134"
                change="+2"
                changeType="positive"
                icon={<AssetIcon />}
                color={statusColors.ONLINE}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard
                title="Avg Utilization"
                value="87%"
                change="+3%"
                changeType="positive"
                icon={<TrendingUpIcon />}
                color={theme.palette.success.main}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard
                title="Downtime Hours"
                value="24.3h"
                change="-5.2h"
                changeType="positive"
                icon={<DateRangeIcon />}
                color={theme.palette.warning.main}
              />
            </Grid>
          </Grid>

          {/* Asset Utilization Chart */}
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  textAlign: { xs: 'center', sm: 'left' },
                  mb: 3
                }}
              >
                Asset Utilization & Downtime Trends
              </Typography>
              <ResponsiveContainer width="100%" height={chartHeight + 50}>
                <BarChart 
                  data={assetUtilizationData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.grey[200]} />
                  <XAxis 
                    dataKey="month" 
                    fontSize={isMobile ? 11 : 12}
                    tick={{ fontSize: isMobile ? 11 : 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    fontSize={isMobile ? 11 : 12}
                    tick={{ fontSize: isMobile ? 11 : 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    content={<MobileTooltip />}
                    formatter={(value) => [`${value}%`, '']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="rect"
                    wrapperStyle={{ fontSize: isMobile ? '13px' : '14px' }}
                  />
                  <Bar 
                    dataKey="utilization" 
                    stackId="a" 
                    fill={theme.palette.success.main} 
                    name="Utilization %"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="downtime" 
                    stackId="a" 
                    fill={theme.palette.error.main} 
                    name="Downtime %"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Maintenance Tab */}
        <TabPanel value={selectedTab} index={3}>
          {/* Maintenance Summary Cards */}
          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <SummaryCard
                title="PM Compliance"
                value="87%"
                change="+3%"
                changeType="positive"
                icon={<MaintenanceIcon />}
                color={theme.palette.success.main}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard
                title="Overdue Tasks"
                value="12"
                change="-8"
                changeType="positive"
                icon={<MaintenanceIcon />}
                color={theme.palette.warning.main}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard
                title="Completed Tasks"
                value="156"
                change="+24"
                changeType="positive"
                icon={<MaintenanceIcon />}
                color={theme.palette.primary.main}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard
                title="Upcoming Tasks"
                value="34"
                change="+7"
                changeType="neutral"
                icon={<MaintenanceIcon />}
                color={theme.palette.info.main}
              />
            </Grid>
          </Grid>

          <Alert 
            severity="info" 
            sx={{ 
              mb: 3,
              backgroundColor: theme.palette.info.main + '08',
              border: `1px solid ${theme.palette.info.main}20`,
              '& .MuiAlert-message': {
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }
            }}
          >
            Maintenance reports help you track preventive maintenance schedules, compliance, and effectiveness.
          </Alert>

          {/* Compliance Progress */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
              >
                Preventive Maintenance Compliance
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                  >
                    Overall Compliance
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color="success.main"
                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, fontWeight: 700 }}
                  >
                    87%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={87} 
                  sx={{ 
                    height: { xs: 8, sm: 12 }, 
                    borderRadius: 6,
                    backgroundColor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 6,
                      background: `linear-gradient(90deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`
                    }
                  }}
                />
              </Box>
              <Box 
                display="flex" 
                justifyContent="space-between" 
                flexWrap="wrap" 
                gap={2}
              >
                <Box>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    Target: 95%
                  </Typography>
                </Box>
                <Box>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    Last Month: 84%
                  </Typography>
                </Box>
                <Box>
                  <Typography 
                    variant="caption" 
                    color="success.main"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 600 }}
                  >
                    Trend: ↗ +3%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Quick Actions for Mobile */}
          {isMobile && (
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
                  Quick Actions
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip 
                    label="Schedule PM" 
                    onClick={() => {}} 
                    color="primary" 
                    size="medium"
                    sx={{ fontSize: '0.875rem' }}
                  />
                  <Chip 
                    label="View Overdue" 
                    onClick={() => {}} 
                    color="warning" 
                    size="medium"
                    sx={{ fontSize: '0.875rem' }}
                  />
                  <Chip 
                    label="Generate Report" 
                    onClick={() => setExportDrawerOpen(true)} 
                    color="secondary" 
                    size="medium"
                    sx={{ fontSize: '0.875rem' }}
                  />
                </Box>
              </CardContent>
            </Card>
          )}
        </TabPanel>

        {/* Inventory Tab */}
        <TabPanel value={selectedTab} index={4}>
          {/* Inventory Summary Cards */}
          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <SummaryCard
                title="Total Items"
                value="2,847"
                change="+125"
                changeType="positive"
                icon={<InventoryIcon />}
                color={theme.palette.primary.main}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard
                title="Low Stock"
                value="23"
                change="-8"
                changeType="positive"
                icon={<InventoryIcon />}
                color={theme.palette.warning.main}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard
                title="Out of Stock"
                value="5"
                change="-3"
                changeType="positive"
                icon={<InventoryIcon />}
                color={theme.palette.error.main}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard
                title="Total Value"
                value="$847K"
                change="+12%"
                changeType="positive"
                icon={<TrendingUpIcon />}
                color={theme.palette.success.main}
              />
            </Grid>
          </Grid>

          <Alert 
            severity="warning" 
            sx={{ 
              mb: 3,
              backgroundColor: theme.palette.warning.main + '08',
              border: `1px solid ${theme.palette.warning.main}20`,
              '& .MuiAlert-message': {
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }
            }}
          >
            5 parts are below reorder point. Consider restocking soon.
          </Alert>

          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
              >
                Inventory Movement Analysis
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  mb: 3
                }}
              >
                Track how efficiently your inventory is being used and identify slow-moving stock.
              </Typography>
              
              {/* Movement Categories */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      backgroundColor: theme.palette.success.main + '10',
                      border: `1px solid ${theme.palette.success.main}20`,
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="h4" color="success.main" fontWeight={700}>
                      45
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fast Moving Items
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      backgroundColor: theme.palette.warning.main + '10',
                      border: `1px solid ${theme.palette.warning.main}20`,
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="h4" color="warning.main" fontWeight={700}>
                      78
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Medium Moving Items
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      backgroundColor: theme.palette.error.main + '10',
                      border: `1px solid ${theme.palette.error.main}20`,
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="h4" color="error.main" fontWeight={700}>
                      23
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Slow Moving Items
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Action Chips */}
              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 1, sm: 2 }, 
                flexWrap: 'wrap',
                justifyContent: { xs: 'center', sm: 'flex-start' }
              }}>
                <Chip 
                  label="Review Slow Items" 
                  color="error" 
                  size={isMobile ? "medium" : "medium"}
                  onClick={() => {}}
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                />
                <Chip 
                  label="Reorder Alerts" 
                  color="warning" 
                  size={isMobile ? "medium" : "medium"}
                  onClick={() => {}}
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                />
                <Chip 
                  label="Generate Stock Report" 
                  color="primary" 
                  size={isMobile ? "medium" : "medium"}
                  onClick={() => setExportDrawerOpen(true)}
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                />
              </Box>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>

      {/* Mobile Export Bottom Sheet */}
      <SwipeableDrawer
        anchor="bottom"
        open={exportDrawerOpen}
        onClose={() => setExportDrawerOpen(false)}
        onOpen={() => setExportDrawerOpen(true)}
        disableSwipeToOpen={false}
        PaperProps={{
          sx: {
            borderRadius: '16px 16px 0 0',
            maxHeight: '60vh',
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Handle bar */}
          <Box
            sx={{
              width: 32,
              height: 4,
              backgroundColor: 'grey.300',
              borderRadius: 2,
              mx: 'auto',
              mb: 2,
            }}
          />
          
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
              Export Report
            </Typography>
            <IconButton 
              onClick={() => setExportDrawerOpen(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          <List sx={{ pt: 0 }}>
            {exportOptions.map((option, index) => (
              <ListItem key={index} disablePadding>
                <ListItemButton 
                  onClick={option.action}
                  sx={{ 
                    borderRadius: 2, 
                    mb: 1,
                    '&:hover': {
                      backgroundColor: option.color + '10'
                    }
                  }}
                >
                  <ListItemIcon>
                    <Avatar 
                      sx={{ 
                        backgroundColor: option.color + '20',
                        color: option.color,
                        width: 40,
                        height: 40
                      }}
                    >
                      <option.icon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText 
                    primary={option.label}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontSize: '1rem',
                        fontWeight: 500
                      }
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </SwipeableDrawer>
    </Box>
  );
}