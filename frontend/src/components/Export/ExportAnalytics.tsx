/**
 * Export Analytics
 * Analytics and insights for export system performance and usage
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

import { ExportStats } from '../../services/exportService';

interface ExportAnalyticsProps {
  stats: ExportStats | null;
  onRefresh: () => void;
  loading: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function MetricCard({ title, value, subtitle, icon, color, trend }: MetricCardProps) {
  const theme = useTheme();

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color, mb: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUpIcon 
                  sx={{ 
                    fontSize: 16, 
                    color: trend.isPositive ? 'success.main' : 'error.main',
                    transform: trend.isPositive ? 'none' : 'rotate(180deg)',
                  }} 
                />
                <Typography 
                  variant="caption" 
                  sx={{ color: trend.isPositive ? 'success.main' : 'error.main' }}
                >
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </Typography>
              </Box>
            )}
          </Box>
          
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              backgroundColor: `${color}20`,
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function ExportAnalytics({ stats, onRefresh, loading }: ExportAnalyticsProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [timePeriod, setTimePeriod] = useState('week');

  if (!stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <Typography>Loading analytics...</Typography>
      </Box>
    );
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 MB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const successRate = stats.totalExports > 0 
    ? Math.round(((stats.totalExports - stats.failedExports) / stats.totalExports) * 100)
    : 100;

  // Chart colors
  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.success.main,
  ];

  // Prepare data for charts
  const dataSourceData = stats.topDataSources.map((item, index) => ({
    name: item.source.replace('_', ' ').toUpperCase(),
    value: item.count,
    fill: colors[index % colors.length],
  }));

  const formatData = stats.formatDistribution.map((item, index) => ({
    name: item.format.toUpperCase(),
    value: item.count,
    fill: colors[index % colors.length],
  }));

  // Mock trend data (in real implementation, this would come from the API)
  const trendData = [
    { date: 'Mon', exports: 12, successful: 11, failed: 1 },
    { date: 'Tue', exports: 19, successful: 18, failed: 1 },
    { date: 'Wed', exports: 15, successful: 14, failed: 1 },
    { date: 'Thu', exports: 22, successful: 20, failed: 2 },
    { date: 'Fri', exports: 18, successful: 17, failed: 1 },
    { date: 'Sat', exports: 8, successful: 8, failed: 0 },
    { date: 'Sun', exports: 6, successful: 6, failed: 0 },
  ];

  // Mock performance data
  const performanceData = [
    { time: '00:00', avgTime: 25000, volume: 120 },
    { time: '04:00', avgTime: 22000, volume: 80 },
    { time: '08:00', avgTime: 35000, volume: 350 },
    { time: '12:00', avgTime: 45000, volume: 280 },
    { time: '16:00', avgTime: 38000, volume: 220 },
    { time: '20:00', avgTime: 28000, volume: 180 },
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon />
          Export Analytics
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              label="Period"
            >
              <MenuItem value="day">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Exports"
            value={stats.totalExports.toLocaleString()}
            subtitle={`${stats.todayExports} today`}
            icon={<AssessmentIcon />}
            color={theme.palette.primary.main}
            trend={{ value: 12.5, isPositive: true }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Success Rate"
            value={`${successRate}%`}
            subtitle={`${stats.failedExports} failed`}
            icon={<TrendingUpIcon />}
            color={successRate >= 95 ? theme.palette.success.main : theme.palette.warning.main}
            trend={{ value: 2.3, isPositive: true }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg. Processing Time"
            value={formatTime(stats.averageExecutionTime)}
            subtitle="Per export"
            icon={<SpeedIcon />}
            color={theme.palette.info.main}
            trend={{ value: -8.1, isPositive: false }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Data Volume"
            value={formatFileSize(stats.totalDataExported * 1024 * 1024)}
            subtitle="Total exported"
            icon={<StorageIcon />}
            color={theme.palette.secondary.main}
            trend={{ value: 15.7, isPositive: true }}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ flexGrow: 1 }}>
        {/* Export Trends */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Export Trends
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="successful" 
                    stackId="1"
                    stroke={theme.palette.success.main} 
                    fill={theme.palette.success.main}
                    fillOpacity={0.6}
                    name="Successful"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="failed" 
                    stackId="1"
                    stroke={theme.palette.error.main} 
                    fill={theme.palette.error.main}
                    fillOpacity={0.6}
                    name="Failed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Data Sources Distribution */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Data Sources
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={dataSourceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {dataSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Format Distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 350 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Export Formats
              </Typography>
              <ResponsiveContainer width="100%" height={270}>
                <BarChart data={formatData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={theme.palette.primary.main} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Over Time */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 350 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance by Hour
              </Typography>
              <ResponsiveContainer width="100%" height={270}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'avgTime') {
                        return [formatTime(value as number), 'Avg. Time'];
                      }
                      return [value, 'Volume'];
                    }}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="avgTime" 
                    stroke={theme.palette.warning.main}
                    strokeWidth={2}
                    name="Avg. Time (ms)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="volume" 
                    stroke={theme.palette.info.main}
                    strokeWidth={2}
                    name="Volume (MB)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity Summary */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      {stats.recentActivity.length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Recent Exports
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h5" color="success.main" fontWeight="bold">
                      {stats.recentActivity.filter(a => a.status === 'completed').length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Completed
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h5" color="warning.main" fontWeight="bold">
                      {stats.recentActivity.filter(a => a.status === 'processing').length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      In Progress
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h5" color="error.main" fontWeight="bold">
                      {stats.recentActivity.filter(a => a.status === 'failed').length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Failed
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}