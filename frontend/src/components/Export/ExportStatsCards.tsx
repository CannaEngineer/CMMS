/**
 * Export Statistics Cards
 * Dashboard overview of export system metrics
 */

import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  FileDownload as ExportIcon,
  Schedule as PendingIcon,
  Error as ErrorIcon,
  Storage as DataIcon,
  Speed as PerformanceIcon,
  TrendingUp as TrendIcon,
} from '@mui/icons-material';

import { ExportStats } from '../../services/exportService';

interface ExportStatsCardsProps {
  stats: ExportStats;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  progress?: number;
}

function StatCard({ title, value, subtitle, icon, color, trend, progress }: StatCardProps) {
  const theme = useTheme();
  
  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              backgroundColor: theme.palette[color].light,
              color: theme.palette[color].contrastText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
        
        {trend && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<TrendIcon />}
              label={`${trend.isPositive ? '+' : ''}${trend.value}%`}
              size="small"
              color={trend.isPositive ? 'success' : 'error'}
              variant="outlined"
            />
            <Typography variant="caption" color="textSecondary">
              vs last period
            </Typography>
          </Box>
        )}
        
        {progress !== undefined && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="textSecondary">
                Progress
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              color={color}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function ExportStatsCards({ stats }: ExportStatsCardsProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
  
  const calculateSuccessRate = (): number => {
    const total = stats.totalExports;
    const failed = stats.failedExports;
    return total > 0 ? Math.round(((total - failed) / total) * 100) : 100;
  };
  
  const getTopDataSource = (): string => {
    return stats.topDataSources.length > 0 ? stats.topDataSources[0].source : 'N/A';
  };
  
  const getTopFormat = (): string => {
    return stats.formatDistribution.length > 0 ? stats.formatDistribution[0].format.toUpperCase() : 'N/A';
  };

  const cards: StatCardProps[] = [
    {
      title: 'Total Exports',
      value: stats.totalExports.toLocaleString(),
      subtitle: `${stats.todayExports} today`,
      icon: <ExportIcon />,
      color: 'primary',
      trend: {
        value: 12.5,
        isPositive: true,
      },
    },
    {
      title: 'Pending Exports',
      value: stats.pendingExports,
      subtitle: 'In queue or processing',
      icon: <PendingIcon />,
      color: 'warning',
    },
    {
      title: 'Success Rate',
      value: `${calculateSuccessRate()}%`,
      subtitle: `${stats.failedExports} failed`,
      icon: <ErrorIcon />,
      color: calculateSuccessRate() >= 95 ? 'success' : calculateSuccessRate() >= 90 ? 'warning' : 'error',
      progress: calculateSuccessRate(),
    },
    {
      title: 'Data Exported',
      value: formatFileSize(stats.totalDataExported * 1024 * 1024),
      subtitle: 'Total volume',
      icon: <DataIcon />,
      color: 'info',
    },
    {
      title: 'Avg Processing Time',
      value: formatTime(stats.averageExecutionTime),
      subtitle: 'Per export',
      icon: <PerformanceIcon />,
      color: 'secondary',
    },
    {
      title: 'Top Data Source',
      value: getTopDataSource(),
      subtitle: `${stats.topDataSources[0]?.count || 0} exports`,
      icon: <TrendIcon />,
      color: 'success',
    },
  ];

  return (
    <Grid container spacing={isMobile ? 2 : 3}>
      {cards.map((card, index) => (
        <Grid xs={12} sm={6} md={4} lg={2} key={index}>
          <StatCard {...card} />
        </Grid>
      ))}
    </Grid>
  );
}