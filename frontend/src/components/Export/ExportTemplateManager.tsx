/**
 * Export Template Manager
 * Interface for managing export templates
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Tooltip,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreIcon,
  PlayArrow as PlayIcon,
  Edit as EditIcon,
  FileCopy as CopyIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  Email as EmailIcon,
  Assessment as ReportIcon,
  FileDownload as ExportIcon,
  Security as ComplianceIcon,
  Dashboard as DashboardIcon,
  Notifications as AlertIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';

import { ExportTemplate } from '../../services/exportService';

interface ExportTemplateManagerProps {
  templates: ExportTemplate[];
  onEdit: (template: ExportTemplate) => void;
  onAction: (action: string, templateId: string, options?: any) => void;
  loading: boolean;
}

interface TemplateCardProps {
  template: ExportTemplate;
  onEdit: (template: ExportTemplate) => void;
  onAction: (action: string, templateId: string, options?: any) => void;
}

function TemplateCard({ template, onEdit, onAction }: TemplateCardProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState(`${template.name} (Copy)`);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: string, options?: any) => {
    onAction(action, template.id, options);
    handleMenuClose();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'report': return <ReportIcon sx={{ color: theme.palette.primary.main }} />;
      case 'export': return <ExportIcon sx={{ color: theme.palette.secondary.main }} />;
      case 'compliance': return <ComplianceIcon sx={{ color: theme.palette.warning.main }} />;
      case 'dashboard': return <DashboardIcon sx={{ color: theme.palette.info.main }} />;
      case 'alert': return <AlertIcon sx={{ color: theme.palette.error.main }} />;
      default: return <ExportIcon />;
    }
  };

  const getTypeColor = (type: string): 'primary' | 'secondary' | 'warning' | 'info' | 'error' => {
    switch (type) {
      case 'report': return 'primary';
      case 'export': return 'secondary';
      case 'compliance': return 'warning';
      case 'dashboard': return 'info';
      case 'alert': return 'error';
      default: return 'primary';
    }
  };

  const formatLastRun = (date: string) => {
    const now = new Date();
    const lastRun = new Date(date);
    const diffMs = now.getTime() - lastRun.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Recently';
    }
  };

  return (
    <>
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          '&:hover': {
            boxShadow: theme.shadows[8],
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.2s ease-in-out',
          opacity: template.isActive ? 1 : 0.7,
        }}
      >
        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
              <Avatar sx={{ width: 32, height: 32 }}>
                {getTypeIcon(template.templateType)}
              </Avatar>
              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Typography variant="h6" noWrap title={template.name}>
                  {template.name}
                </Typography>
                <Typography variant="caption" color="textSecondary" noWrap>
                  {template.dataSource.replace('_', ' ').toUpperCase()}
                </Typography>
              </Box>
            </Box>
            
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreIcon />
            </IconButton>
          </Box>

          {/* Description */}
          {template.description && (
            <Typography 
              variant="body2" 
              color="textSecondary" 
              sx={{ 
                mb: 2, 
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                minHeight: '2.5em',
              }}
            >
              {template.description}
            </Typography>
          )}

          {/* Status Chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            <Chip
              label={template.templateType}
              size="small"
              color={getTypeColor(template.templateType)}
              variant="outlined"
            />
            
            <Chip
              label={template.qualityLevel}
              size="small"
              variant="outlined"
            />

            {template.isScheduled && (
              <Chip
                icon={<ScheduleIcon />}
                label="Scheduled"
                size="small"
                color="primary"
                variant="outlined"
              />
            )}

            {template.emailConfig && (
              <Chip
                icon={<EmailIcon />}
                label="Email"
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}

            {template.isPublic ? (
              <Chip
                icon={<PublicIcon />}
                label="Public"
                size="small"
                color="success"
                variant="outlined"
              />
            ) : (
              <Chip
                icon={<PrivateIcon />}
                label="Private"
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          {/* Metadata */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
            <Typography variant="caption" color="textSecondary">
              Updated {formatLastRun(template.updatedAt)}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title={template.isActive ? 'Template is active' : 'Template is disabled'}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: template.isActive ? 'success.main' : 'error.main',
                  }}
                />
              </Tooltip>
            </Box>
          </Box>
        </CardContent>

        {/* Actions */}
        <Box sx={{ p: 1, pt: 0, display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={() => handleAction('execute')}
            disabled={!template.isActive}
            fullWidth
          >
            Execute
          </Button>
          
          <Button
            size="small"
            variant="outlined"
            onClick={() => onEdit(template)}
          >
            <EditIcon />
          </Button>
        </Box>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 200 }
        }}
      >
        <MenuItem onClick={() => handleAction('execute')} disabled={!template.isActive}>
          <ListItemIcon><PlayIcon /></ListItemIcon>
          <ListItemText>Execute Now</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => onEdit(template)}>
          <ListItemIcon><EditIcon /></ListItemIcon>
          <ListItemText>Edit Template</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => setDuplicateDialogOpen(true)}>
          <ListItemIcon><CopyIcon /></ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleAction('toggle')}>
          <ListItemIcon>{template.isActive ? <PrivateIcon /> : <PublicIcon />}</ListItemIcon>
          <ListItemText>{template.isActive ? 'Disable' : 'Enable'}</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => setDeleteDialogOpen(true)} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon sx={{ color: 'error.main' }} /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Template</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{template.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              handleAction('delete');
              setDeleteDialogOpen(false);
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Duplicate Dialog */}
      <Dialog open={duplicateDialogOpen} onClose={() => setDuplicateDialogOpen(false)}>
        <DialogTitle>Duplicate Template</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="New Template Name"
            value={duplicateName}
            onChange={(e) => setDuplicateName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDuplicateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              handleAction('duplicate', { name: duplicateName });
              setDuplicateDialogOpen(false);
            }}
            variant="contained"
            disabled={!duplicateName.trim()}
          >
            Duplicate
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function ExportTemplateManager({ templates, onEdit, onAction, loading }: ExportTemplateManagerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showScheduledOnly, setShowScheduledOnly] = useState(false);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.dataSource.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || template.templateType === filterType;
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && template.isActive) ||
                         (filterStatus === 'inactive' && !template.isActive);

    const matchesScheduled = !showScheduledOnly || template.isScheduled;

    return matchesSearch && matchesType && matchesStatus && matchesScheduled;
  });

  const templateTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'report', label: 'Reports' },
    { value: 'export', label: 'Data Exports' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'alert', label: 'Alerts' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active Only' },
    { value: 'inactive', label: 'Inactive Only' },
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          
          <Grid xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Type"
              >
                {templateTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={showScheduledOnly}
                  onChange={(e) => setShowScheduledOnly(e.target.checked)}
                />
              }
              label="Scheduled only"
            />
          </Grid>
        </Grid>
      </Box>

      {/* Results Summary */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="textSecondary">
          {filteredTemplates.length} of {templates.length} templates
          {searchTerm && ` matching "${searchTerm}"`}
        </Typography>
        
        {filteredTemplates.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              icon={<FilterIcon />}
              label={`${filteredTemplates.filter(t => t.isScheduled).length} scheduled`}
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<PublicIcon />}
              label={`${filteredTemplates.filter(t => t.isPublic).length} public`}
              size="small"
              variant="outlined"
            />
          </Box>
        )}
      </Box>

      {/* Templates Grid */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Typography>Loading templates...</Typography>
          </Box>
        ) : filteredTemplates.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No templates found
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center">
              {searchTerm ? 
                'Try adjusting your search terms or filters' : 
                'Create your first export template to get started'
              }
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredTemplates.map((template) => (
              <Grid xs={12} md={6} lg={4} key={template.id}>
                <TemplateCard
                  template={template}
                  onEdit={onEdit}
                  onAction={onAction}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}