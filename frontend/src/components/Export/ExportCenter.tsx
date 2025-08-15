/**
 * Export Center - Comprehensive Export and Reporting Hub
 * Main interface for managing exports, templates, and reports
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
  Chip,
  Alert,
  Snackbar,
  Fab,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Tooltip,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  Queue as QueueIcon,
  Analytics as AnalyticsIcon,
  FileDownload as ExportIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';

import { exportService, type ExportTemplate, type ExportHistory as ExportHistoryType, type ExportQueue as ExportQueueType, type ExportStats } from '../../services/exportService';
import ExportTemplateManager from './ExportTemplateManager';
import ExportHistoryView from './ExportHistoryView';
import ExportQueueView from './ExportQueueView';
import ExportAnalytics from './ExportAnalytics';
import QuickExportDialog from './QuickExportDialog';
import TemplateBuilderDialog from './TemplateBuilderDialog';
import ExportStatsCards from './ExportStatsCards';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`export-tabpanel-${index}`}
      aria-labelledby={`export-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `export-tab-${index}`,
    'aria-controls': `export-tabpanel-${index}`,
  };
}

export default function ExportCenter() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Data
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [history, setHistory] = useState<ExportHistoryType[]>([]);
  const [queue, setQueue] = useState<ExportQueueType[]>([]);
  const [stats, setStats] = useState<ExportStats | null>(null);
  
  // Dialogs
  const [quickExportOpen, setQuickExportOpen] = useState(false);
  const [templateBuilderOpen, setTemplateBuilderOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate | null>(null);
  
  // Real-time updates
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh for real-time updates
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    
    const interval = setInterval(() => {
      if (currentTab === 2) { // Queue tab
        loadQueue();
      } else if (currentTab === 1) { // History tab
        loadHistory();
      }
      setLastRefresh(new Date());
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [currentTab, autoRefreshEnabled]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesData, historyData, queueData, statsData] = await Promise.all([
        exportService.getTemplates(),
        exportService.getHistory({ limit: 50 }),
        exportService.getQueue(),
        exportService.getStats('week')
      ]);
      
      setTemplates(templatesData);
      setHistory(historyData.items);
      setQueue(queueData);
      setStats(statsData);
    } catch (err) {
      setError('Failed to load export data');
      console.error('Export data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await exportService.getTemplates();
      setTemplates(data);
    } catch (err) {
      setError('Failed to load templates');
    }
  };

  const loadHistory = async () => {
    try {
      const data = await exportService.getHistory({ limit: 50 });
      setHistory(data.items);
    } catch (err) {
      setError('Failed to load export history');
    }
  };

  const loadQueue = async () => {
    try {
      const data = await exportService.getQueue();
      setQueue(data);
    } catch (err) {
      setError('Failed to load export queue');
    }
  };

  const loadStats = async () => {
    try {
      const data = await exportService.getStats('week');
      setStats(data);
    } catch (err) {
      setError('Failed to load export statistics');
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleRefresh = () => {
    switch (currentTab) {
      case 0:
        loadTemplates();
        loadStats();
        break;
      case 1:
        loadHistory();
        break;
      case 2:
        loadQueue();
        break;
      case 3:
        loadStats();
        break;
      default:
        loadData();
    }
    setLastRefresh(new Date());
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setTemplateBuilderOpen(true);
  };

  const handleEditTemplate = (template: ExportTemplate) => {
    setSelectedTemplate(template);
    setTemplateBuilderOpen(true);
  };

  const handleTemplateAction = async (action: string, templateId: string, options?: any) => {
    try {
      switch (action) {
        case 'execute':
          await exportService.executeTemplate(templateId, options);
          setSuccess('Export started successfully');
          loadHistory();
          loadQueue();
          break;
        case 'duplicate':
          await exportService.duplicateTemplate(templateId, options.name);
          setSuccess('Template duplicated successfully');
          loadTemplates();
          break;
        case 'delete':
          await exportService.deleteTemplate(templateId);
          setSuccess('Template deleted successfully');
          loadTemplates();
          break;
        case 'toggle':
          const template = templates.find(t => t.id === templateId);
          if (template) {
            await exportService.updateTemplate(templateId, { isActive: !template.isActive });
            setSuccess(`Template ${template.isActive ? 'disabled' : 'enabled'} successfully`);
            loadTemplates();
          }
          break;
      }
    } catch (err) {
      setError(`Failed to ${action} template`);
      console.error(`Template ${action} error:`, err);
    }
  };

  const handleHistoryAction = async (action: string, historyId: string) => {
    try {
      switch (action) {
        case 'download':
          const downloadData = await exportService.downloadExport(historyId);
          window.open(downloadData.url, '_blank');
          setSuccess('Download started');
          break;
        case 'retry':
          await exportService.retryExport(historyId);
          setSuccess('Export retry initiated');
          loadHistory();
          loadQueue();
          break;
        case 'cancel':
          await exportService.cancelExport(historyId);
          setSuccess('Export cancelled');
          loadHistory();
          loadQueue();
          break;
      }
    } catch (err) {
      setError(`Failed to ${action} export`);
      console.error(`Export ${action} error:`, err);
    }
  };

  const handleQuickExport = async (request: any) => {
    try {
      await exportService.requestExport(request);
      setSuccess('Quick export started successfully');
      setQuickExportOpen(false);
      loadHistory();
      loadQueue();
    } catch (err) {
      setError('Failed to start quick export');
      console.error('Quick export error:', err);
    }
  };

  const handleTemplateBuilderSave = async (templateData: any) => {
    try {
      if (selectedTemplate) {
        await exportService.updateTemplate(selectedTemplate.id, templateData);
        setSuccess('Template updated successfully');
      } else {
        await exportService.createTemplate(templateData);
        setSuccess('Template created successfully');
      }
      setTemplateBuilderOpen(false);
      loadTemplates();
    } catch (err) {
      setError('Failed to save template');
      console.error('Template save error:', err);
    }
  };

  const getTabIcon = (index: number) => {
    switch (index) {
      case 0: return <DashboardIcon />;
      case 1: return <HistoryIcon />;
      case 2: return <QueueIcon />;
      case 3: return <AnalyticsIcon />;
      default: return <ExportIcon />;
    }
  };

  const getTabLabel = (index: number) => {
    switch (index) {
      case 0: return 'Templates';
      case 1: return 'History';
      case 2: return 'Queue';
      case 3: return 'Analytics';
      default: return 'Export';
    }
  };

  const getTabBadgeContent = (index: number) => {
    switch (index) {
      case 1: return history.filter(h => h.status === 'processing').length;
      case 2: return queue.filter(q => q.status === 'queued' || q.status === 'processing').length;
      default: return null;
    }
  };

  const pendingExports = queue.filter(q => q.status === 'queued' || q.status === 'processing').length;
  const recentFailures = history.filter(h => h.status === 'failed' && 
    new Date(h.startedAt) > new Date(Date.now() - 86400000)).length;

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Export Center
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Manage reports, exports, and data analytics
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* Status Indicators */}
          {pendingExports > 0 && (
            <Tooltip title={`${pendingExports} exports in progress`}>
              <Chip
                icon={<QueueIcon />}
                label={pendingExports}
                color="primary"
                size="small"
                variant="outlined"
              />
            </Tooltip>
          )}
          
          {recentFailures > 0 && (
            <Tooltip title={`${recentFailures} failed exports today`}>
              <Chip
                icon={<NotificationsIcon />}
                label={recentFailures}
                color="error"
                size="small"
                variant="outlined"
              />
            </Tooltip>
          )}
          
          {/* Auto-refresh indicator */}
          {autoRefreshEnabled && (
            <Tooltip title={`Last updated: ${lastRefresh.toLocaleTimeString()}`}>
              <Chip
                label="Live"
                color="success"
                size="small"
                variant="outlined"
              />
            </Tooltip>
          )}
          
          {/* Action Buttons */}
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={() => setQuickExportOpen(true)}
            size={isMobile ? 'small' : 'medium'}
          >
            Quick Export
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateTemplate}
            size={isMobile ? 'small' : 'medium'}
          >
            New Template
          </Button>
        </Box>
      </Box>

      {/* Loading indicator */}
      {loading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Stats Cards */}
      {stats && currentTab === 0 && (
        <Box sx={{ mb: 3 }}>
          <ExportStatsCards stats={stats} />
        </Box>
      )}

      {/* Main Content */}
      <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons="auto"
            sx={{ px: 2 }}
          >
            {[0, 1, 2, 3].map((index) => (
              <Tab
                key={index}
                icon={
                  <Badge badgeContent={getTabBadgeContent(index)} color="error">
                    {getTabIcon(index)}
                  </Badge>
                }
                label={getTabLabel(index)}
                {...a11yProps(index)}
                sx={{ minWidth: isMobile ? 'auto' : 120 }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Tab Content */}
        <CardContent sx={{ flexGrow: 1, overflow: 'hidden', p: isMobile ? 1 : 3 }}>
          <TabPanel value={currentTab} index={0}>
            <ExportTemplateManager
              templates={templates}
              onEdit={handleEditTemplate}
              onAction={handleTemplateAction}
              loading={loading}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <ExportHistoryView
              history={history}
              onAction={handleHistoryAction}
              loading={loading}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            <ExportQueueView
              queue={queue}
              onRefresh={loadQueue}
              autoRefresh={autoRefreshEnabled}
              onAutoRefreshChange={setAutoRefreshEnabled}
              loading={loading}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={3}>
            <ExportAnalytics
              stats={stats}
              onRefresh={loadStats}
              loading={loading}
            />
          </TabPanel>
        </CardContent>
      </Card>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setQuickExportOpen(true)}
        >
          <ExportIcon />
        </Fab>
      )}

      {/* Dialogs */}
      <QuickExportDialog
        open={quickExportOpen}
        onClose={() => setQuickExportOpen(false)}
        onExport={handleQuickExport}
      />

      <TemplateBuilderDialog
        open={templateBuilderOpen}
        onClose={() => setTemplateBuilderOpen(false)}
        onSave={handleTemplateBuilderSave}
        template={selectedTemplate}
      />

      {/* Notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}