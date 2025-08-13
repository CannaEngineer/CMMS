/**
 * Portal Analytics Dialog - Show portal usage statistics and metrics
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Assessment as AssessmentIcon,
  Visibility as ViewsIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { portalService } from '../../services/portalService';
import { Portal } from '../../types/portal';

interface PortalAnalyticsDialogProps {
  open: boolean;
  portal: Portal | null;
  onClose: () => void;
}

const PortalAnalyticsDialog: React.FC<PortalAnalyticsDialogProps> = ({
  open,
  portal,
  onClose,
}) => {
  const [timePeriod, setTimePeriod] = useState('30d');
  
  // Fetch real analytics data
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['portal-analytics', portal?.id, timePeriod],
    queryFn: () => portalService.getAnalytics(portal!.id, timePeriod),
    enabled: !!portal && open,
    refetchOnWindowFocus: false,
  });
  
  if (!portal) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'info';
      case 'REVIEWED': return 'warning';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, minHeight: '80vh' }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Portal Analytics: {portal.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Usage statistics and performance metrics
            </Typography>
          </Box>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              label="Period"
            >
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
              <MenuItem value="1y">Last Year</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to load analytics data. Please try again later.
          </Alert>
        ) : !analytics ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            No analytics data available for this portal yet.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Key Metrics */}
            <Grid container spacing={3}>
              <Grid xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', bgcolor: 'primary.50' }}>
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <TrendingUpIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {analytics.totalSubmissions || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Submissions
                    </Typography>
                    <Typography variant="caption" color={analytics.submissionsInPeriod > 0 ? 'success.main' : 'text.secondary'}>
                      {analytics.submissionsInPeriod || 0} in period
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', bgcolor: 'warning.50' }}>
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <ScheduleIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                      {analytics.avgResponseTime || 0}h
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Response Time
                    </Typography>
                    <Typography variant="caption" color={analytics.avgResponseTime > 0 ? 'success.main' : 'text.secondary'}>
                      {analytics.avgResponseTime > 0 ? 'Tracked' : 'No data yet'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', bgcolor: 'success.50' }}>
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {analytics.completionRate || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completion Rate
                    </Typography>
                    <Typography variant="caption" color={analytics.completionRate > 80 ? 'success.main' : analytics.completionRate > 50 ? 'warning.main' : 'error.main'}>
                      {analytics.completionRate > 80 ? 'Excellent' : analytics.completionRate > 50 ? 'Good' : analytics.completionRate > 0 ? 'Needs improvement' : 'No data'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', bgcolor: 'info.50' }}>
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <ViewsIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                      {analytics.totalViews || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Views
                    </Typography>
                    <Typography variant="caption" color={analytics.conversionRate > 0 ? 'success.main' : 'text.secondary'}>
                      {analytics.conversionRate || 0}% conversion rate
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
          </Grid>

            {/* Status Breakdown */}
            {analytics.statusBreakdown && Object.keys(analytics.statusBreakdown).length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Submission Status Breakdown
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {Object.entries(analytics.statusBreakdown).map(([status, count]) => (
                      <Grid xs={12} sm={6} md={4} key={status}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Chip
                            label={status.replace('_', ' ')}
                            color={getStatusColor(status) as any}
                            size="small"
                            sx={{ minWidth: 80 }}
                          />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {count}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ({analytics.submissionsInPeriod > 0 ? ((count / analytics.submissionsInPeriod) * 100).toFixed(1) : 0}%)
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Device Breakdown */}
            {analytics.deviceBreakdown && Object.values(analytics.deviceBreakdown).some(v => v > 0) && (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Device Usage
                  </Typography>
                  
                  <Grid container spacing={3}>
                    {Object.entries(analytics.deviceBreakdown).map(([device, count]) => {
                      const totalViews = Object.values(analytics.deviceBreakdown).reduce((a, b) => a + b, 0);
                      const percentage = totalViews > 0 ? (count / totalViews) * 100 : 0;
                      return (
                        <Grid xs={12} sm={4} key={device}>
                          <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {device}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {count} ({percentage.toFixed(1)}%)
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={percentage}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Top Categories */}
            {analytics.categoryBreakdown && analytics.categoryBreakdown.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Top Categories
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {analytics.categoryBreakdown.map((category, index) => (
                      <Box key={category.category} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" sx={{ minWidth: 20, fontWeight: 600, color: 'text.secondary' }}>
                          #{index + 1}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {category.category}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {category.count} submissions
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={category.percentage}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40, textAlign: 'right' }}>
                          {category.percentage}%
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Real-time Insights */}
            <Alert severity="info">
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                Analytics Insights
              </Typography>
              <Typography variant="body2">
                {analytics.totalViews > 0 && (
                  <>• Portal has received {analytics.totalViews} views with {analytics.conversionRate.toFixed(1)}% conversion rate<br /></>
                )}
                {analytics.avgResponseTime > 0 && (
                  <>• Average response time is {analytics.avgResponseTime.toFixed(1)} hours {analytics.avgResponseTime < 4 ? '(excellent)' : analytics.avgResponseTime < 8 ? '(good)' : '(needs improvement)'}<br /></>
                )}
                {analytics.completionRate > 0 && (
                  <>• Completion rate of {analytics.completionRate.toFixed(1)}% indicates {analytics.completionRate > 85 ? 'strong' : analytics.completionRate > 50 ? 'moderate' : 'low'} process efficiency<br /></>
                )}
                {analytics.bounceRate > 0 && (
                  <>• Bounce rate is {analytics.bounceRate.toFixed(1)}% {analytics.bounceRate < 30 ? '(excellent)' : analytics.bounceRate < 60 ? '(good)' : '(needs attention)'}<br /></>
                )}
                {analytics.totalViews === 0 && analytics.totalSubmissions === 0 && (
                  <>• This portal hasn't received any traffic or submissions yet. Share the portal URL to start collecting data.</>
                )}
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button variant="contained" onClick={onClose}>
          Export Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PortalAnalyticsDialog;