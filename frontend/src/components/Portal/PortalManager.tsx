// Portal Manager - Main portal management interface
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  Fab,
  Tooltip,
  Alert,
  CircularProgress,
  InputAdornment,
  TextField
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  QrCode as QrCodeIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as DuplicateIcon,
  Analytics as AnalyticsIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portalService } from '../../services/portalService';
import { Portal, PortalType, PortalSearchFilters } from '../../types/portal';
import PortalCreationWizard from './PortalCreationWizard';
import PortalEditDialog from './PortalEditDialog';
import PortalAnalyticsDialog from './PortalAnalyticsDialog';
import PortalShareDialog from './PortalShareDialog';
import PortalFilterDialog from './PortalFilterDialog';

const PORTAL_TYPE_COLORS: Record<PortalType, string> = {
  'maintenance-request': '#1976d2',
  'asset-registration': '#388e3c',
  'equipment-info': '#f57c00',
  'general-inquiry': '#7b1fa2',
  'inspection-report': '#d32f2f',
  'safety-incident': '#c62828'
};

const PORTAL_TYPE_LABELS: Record<PortalType, string> = {
  'maintenance-request': 'Maintenance Request',
  'asset-registration': 'Asset Registration',
  'equipment-info': 'Equipment Info',
  'general-inquiry': 'General Inquiry',
  'inspection-report': 'Inspection Report',
  'safety-incident': 'Safety Incident'
};

interface PortalManagerProps {
  onPortalSelect?: (portal: Portal) => void;
}

const PortalManager: React.FC<PortalManagerProps> = ({ onPortalSelect }) => {
  const [filters, setFilters] = useState<PortalSearchFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPortal, setSelectedPortal] = useState<Portal | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showCreationWizard, setShowCreationWizard] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch portals
  const { data: portals = [], isLoading, error } = useQuery({
    queryKey: ['portals', filters, searchTerm],
    queryFn: () => portalService.getAll({ ...filters, searchTerm: searchTerm || undefined })
  });

  // Portal mutations
  const deletePortalMutation = useMutation({
    mutationFn: (portalId: string) => portalService.delete(portalId),
    onSuccess: () => {
      // Invalidate and refetch portal list
      queryClient.invalidateQueries({ queryKey: ['portals'] });
      setConfirmDelete(null);
    },
    onError: (error: any) => {
      // Handle 404 errors gracefully - portal might already be deleted
      if (error.status === 404 || error.response?.status === 404) {
        // Remove portal from cache since it doesn't exist in backend
        queryClient.setQueryData(['portals', filters, searchTerm], (oldData: Portal[] | undefined) => {
          if (oldData && confirmDelete) {
            return oldData.filter(portal => portal.id !== confirmDelete);
          }
          return oldData;
        });
        setConfirmDelete(null);
      } else {
        console.error('Error deleting portal:', error);
      }
    }
  });

  const duplicatePortalMutation = useMutation({
    mutationFn: (portalId: string) => portalService.duplicate(portalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portals'] });
    }
  });

  // Handle portal actions
  const handlePortalMenuClick = (event: React.MouseEvent<HTMLElement>, portal: Portal) => {
    event.stopPropagation();
    setSelectedPortal(portal);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    // Don't clear selectedPortal here as it's needed for dialogs
  };

  const handlePortalAction = (action: string) => {
    if (!selectedPortal) return;

    switch (action) {
      case 'view':
        if (onPortalSelect) {
          onPortalSelect(selectedPortal);
        } else {
          window.open(selectedPortal.publicUrl, '_blank');
        }
        break;
      case 'edit':
        setShowEditDialog(true);
        break;
      case 'duplicate':
        duplicatePortalMutation.mutate(selectedPortal.id);
        break;
      case 'analytics':
        setShowAnalyticsDialog(true);
        break;
      case 'share':
        setShowShareDialog(true);
        break;
      case 'delete':
        setConfirmDelete(selectedPortal.id);
        break;
    }
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    if (confirmDelete) {
      deletePortalMutation.mutate(confirmDelete);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const getStatusColor = (portal: Portal) => {
    if (!portal.isActive) return '#9e9e9e';
    return portal.submissionCount > 0 ? '#4caf50' : '#ff9800';
  };

  const getStatusText = (portal: Portal) => {
    if (!portal.isActive) return 'Inactive';
    return portal.submissionCount > 0 ? 'Active' : 'No Submissions';
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load portals. Please try again later.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Portal Manager
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreationWizard(true)}
          size="large"
        >
          Create Portal
        </Button>
      </Box>

      {/* Search and Filter Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Search portals..."
          value={searchTerm}
          onChange={handleSearch}
          variant="outlined"
          size="small"
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => setShowFilterDialog(true)}
        >
          Filters
        </Button>
      </Box>

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Portal Grid */}
      {!isLoading && (
        <Grid container spacing={3}>
          {portals.map((portal) => (
            <Grid item xs={12} sm={6} md={4} key={portal.id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3
                  }
                }}
                onClick={() => onPortalSelect?.(portal)}
              >
                <CardContent>
                  {/* Portal Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h2" noWrap>
                        {portal.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {portal.description}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => handlePortalMenuClick(e, portal)}
                      sx={{ ml: 1 }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  {/* Portal Type and Status */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={PORTAL_TYPE_LABELS[portal.type]}
                      size="small"
                      sx={{
                        backgroundColor: PORTAL_TYPE_COLORS[portal.type],
                        color: 'white'
                      }}
                    />
                    <Chip
                      label={getStatusText(portal)}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(portal),
                        color: 'white'
                      }}
                    />
                  </Box>

                  {/* Portal Stats */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Submissions
                      </Typography>
                      <Typography variant="h6">
                        {portal.submissionCount}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" color="text.secondary">
                        Last Activity
                      </Typography>
                      <Typography variant="body2">
                        {portal.lastSubmissionAt
                          ? new Date(portal.lastSubmissionAt).toLocaleDateString()
                          : 'No activity'
                        }
                      </Typography>
                    </Box>
                  </Box>

                  {/* Portal URL */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Portal URL
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        backgroundColor: '#f5f5f5',
                        padding: '4px 8px',
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        wordBreak: 'break-all'
                      }}
                    >
                      {portal.publicUrl}
                    </Typography>
                  </Box>

                  {/* Quick Actions */}
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Tooltip title="View Portal">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(portal.publicUrl, '_blank');
                        }}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="QR Code">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPortal(portal);
                          setShowShareDialog(true);
                        }}
                      >
                        <QrCodeIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Analytics">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPortal(portal);
                          setShowAnalyticsDialog(true);
                        }}
                      >
                        <AnalyticsIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Empty State */}
      {!isLoading && portals.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            textAlign: 'center'
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No portals found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm || Object.keys(filters).length > 0
              ? 'Try adjusting your search or filters'
              : 'Create your first portal to get started'
            }
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowCreationWizard(true)}
          >
            Create Portal
          </Button>
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => handlePortalAction('view')}>
          <ViewIcon sx={{ mr: 1 }} />
          View Portal
        </MenuItem>
        <MenuItem onClick={() => handlePortalAction('edit')}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => handlePortalAction('duplicate')}>
          <DuplicateIcon sx={{ mr: 1 }} />
          Duplicate
        </MenuItem>
        <MenuItem onClick={() => handlePortalAction('analytics')}>
          <AnalyticsIcon sx={{ mr: 1 }} />
          Analytics
        </MenuItem>
        <MenuItem onClick={() => handlePortalAction('share')}>
          <ShareIcon sx={{ mr: 1 }} />
          Share & QR Code
        </MenuItem>
        <MenuItem onClick={() => handlePortalAction('delete')} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      {showCreationWizard && (
        <PortalCreationWizard
          open={showCreationWizard}
          onClose={() => setShowCreationWizard(false)}
          onSuccess={() => {
            setShowCreationWizard(false);
            queryClient.invalidateQueries({ queryKey: ['portals'] });
          }}
        />
      )}

      {selectedPortal && showEditDialog && (
        <PortalEditDialog
          open={showEditDialog}
          portal={selectedPortal}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedPortal(null);
          }}
          onSuccess={() => {
            setShowEditDialog(false);
            setSelectedPortal(null);
            queryClient.invalidateQueries({ queryKey: ['portals'] });
          }}
        />
      )}

      {selectedPortal && showAnalyticsDialog && (
        <PortalAnalyticsDialog
          open={showAnalyticsDialog}
          portal={selectedPortal}
          onClose={() => {
            setShowAnalyticsDialog(false);
            setSelectedPortal(null);
          }}
        />
      )}

      {selectedPortal && showShareDialog && (
        <PortalShareDialog
          open={showShareDialog}
          portal={selectedPortal}
          onClose={() => {
            setShowShareDialog(false);
            setSelectedPortal(null);
          }}
        />
      )}

      {showFilterDialog && (
        <PortalFilterDialog
          open={showFilterDialog}
          filters={filters}
          onApplyFilters={(newFilters) => {
            setFilters(newFilters);
            // Trigger a refetch with the new filters
            queryClient.invalidateQueries({ queryKey: ['portals'] });
          }}
          onClearFilters={() => {
            setFilters({});
            // Trigger a refetch with cleared filters  
            queryClient.invalidateQueries({ queryKey: ['portals'] });
          }}
          onClose={() => setShowFilterDialog(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Delete Portal
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Are you sure you want to delete this portal? This action cannot be undone.
            All submissions will be permanently lost.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteConfirm}
              disabled={deletePortalMutation.isPending}
            >
              {deletePortalMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        aria-label="create portal"
        onClick={() => setShowCreationWizard(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', sm: 'none' }
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default PortalManager;