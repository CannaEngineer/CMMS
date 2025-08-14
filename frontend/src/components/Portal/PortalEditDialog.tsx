/**
 * Portal Edit Dialog - Edit existing portal configuration
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { portalService } from '../../services/portalService';
import { transformPortalForBackend } from '../../utils/portalTransforms';
import type { Portal, PortalType, UpdatePortalRequest } from '../../types/portal';

interface PortalEditDialogProps {
  open: boolean;
  portal: Portal | null;
  onClose: () => void;
  onSuccess: (updatedPortal: Portal) => void;
}

const PORTAL_TYPES: Array<{ value: PortalType; label: string }> = [
  { value: 'maintenance-request', label: 'Maintenance Request' },
  { value: 'asset-registration', label: 'Asset Registration' },
  { value: 'equipment-info', label: 'Equipment Information' },
  { value: 'general-inquiry', label: 'General Inquiry' },
  { value: 'inspection-report', label: 'Inspection Report' },
  { value: 'safety-incident', label: 'Safety Incident' },
];

const PortalEditDialog: React.FC<PortalEditDialogProps> = ({
  open,
  portal,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'maintenance-request' as PortalType,
    isActive: true,
    requiresApproval: false,
    allowAnonymous: true,
    autoCreateWorkOrders: true,
    qrEnabled: true,
    // Additional fields that were missing
    primaryColor: '#1976d2',
    secondaryColor: '#ffffff',
    accentColor: '#ff4081',
    notificationEmails: '',
    autoResponderEnabled: true,
    autoResponderMessage: '',
    rateLimitEnabled: true,
    rateLimitRequests: 10,
    rateLimitWindow: 3600,
    maxSubmissionsPerDay: undefined as number | undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update portal mutation
  const updatePortalMutation = useMutation({
    mutationFn: (data: UpdatePortalRequest) => {
      if (!portal) throw new Error('Portal not found');
      // Transform data to backend format before sending
      const transformedData = transformPortalForBackend(data);
      return portalService.update(portal.id, transformedData);
    },
    onSuccess: (updatedPortal) => {
      onSuccess(updatedPortal);
    },
    onError: (error: any) => {
      console.error('Failed to update portal:', error);
    }
  });

  useEffect(() => {
    if (portal) {
      setFormData({
        name: portal.name,
        description: portal.description || '',
        type: portal.type,
        isActive: portal.isActive,
        requiresApproval: portal.requiresApproval,
        allowAnonymous: portal.allowAnonymous,
        autoCreateWorkOrders: portal.autoCreateWorkOrders,
        qrEnabled: portal.qrEnabled,
        // Map additional portal properties from branding
        primaryColor: portal.branding?.primaryColor || '#1976d2',
        secondaryColor: portal.branding?.secondaryColor || '#ffffff',
        accentColor: portal.branding?.primaryColor || '#ff4081',
        notificationEmails: '',
        autoResponderEnabled: false,
        autoResponderMessage: '',
        rateLimitEnabled: false,
        rateLimitRequests: portal.rateLimitPerHour || 10,
        rateLimitWindow: 3600,
        maxSubmissionsPerDay: portal.rateLimitPerDay,
      });
    }
  }, [portal]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Portal name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!portal || !validateForm()) return;

    const updates: UpdatePortalRequest = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      type: formData.type,
      isActive: formData.isActive,
      requiresApproval: formData.requiresApproval,
      allowAnonymous: formData.allowAnonymous,
      autoCreateWorkOrders: formData.autoCreateWorkOrders,
      // Include all the additional fields
      primaryColor: formData.primaryColor,
      secondaryColor: formData.secondaryColor,
      accentColor: formData.accentColor,
      notificationEmails: formData.notificationEmails.trim() || undefined,
      autoResponderEnabled: formData.autoResponderEnabled,
      autoResponderMessage: formData.autoResponderMessage.trim() || undefined,
      rateLimitEnabled: formData.rateLimitEnabled,
      rateLimitRequests: formData.rateLimitRequests,
      rateLimitWindow: formData.rateLimitWindow,
      maxSubmissionsPerDay: formData.maxSubmissionsPerDay,
    };

    updatePortalMutation.mutate(updates);
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!portal) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Edit Portal: {portal.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Update portal configuration and settings
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Basic Information */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Basic Information
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Portal Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                fullWidth
                required
              />

              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                error={!!errors.description}
                helperText={errors.description}
                multiline
                rows={3}
                fullWidth
                required
              />

              <FormControl fullWidth>
                <InputLabel>Portal Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  label="Portal Type"
                >
                  {PORTAL_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Portal Settings */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Portal Settings
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  />
                }
                label="Portal is Active"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.allowAnonymous}
                    onChange={(e) => handleInputChange('allowAnonymous', e.target.checked)}
                  />
                }
                label="Allow Anonymous Submissions"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.requiresApproval}
                    onChange={(e) => handleInputChange('requiresApproval', e.target.checked)}
                  />
                }
                label="Require Approval Before Processing"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.autoCreateWorkOrders}
                    onChange={(e) => handleInputChange('autoCreateWorkOrders', e.target.checked)}
                  />
                }
                label="Automatically Create Work Orders"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.qrEnabled}
                    onChange={(e) => handleInputChange('qrEnabled', e.target.checked)}
                  />
                }
                label="Enable QR Code Access"
              />
            </Box>
          </Box>

          {/* Current URLs */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Portal URLs
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              These URLs are automatically generated and cannot be edited directly.
            </Alert>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Public URL"
                value={portal.publicUrl}
                InputProps={{ readOnly: true }}
                fullWidth
                variant="outlined"
              />
              
              <TextField
                label="Short URL"
                value={`${window.location.origin}/p/${portal.slug}`}
                InputProps={{ readOnly: true }}
                fullWidth
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          onClick={handleClose}
          disabled={updatePortalMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={updatePortalMutation.isPending}
          startIcon={updatePortalMutation.isPending ? <CircularProgress size={16} /> : undefined}
        >
          {updatePortalMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PortalEditDialog;