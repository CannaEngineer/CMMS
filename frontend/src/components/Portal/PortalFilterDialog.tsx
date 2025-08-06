/**
 * Portal Filter Dialog - Filter portals by various criteria
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { PortalType, PortalSearchFilters } from '../../types/portal';

interface PortalFilterDialogProps {
  open: boolean;
  filters: PortalSearchFilters;
  onClose: () => void;
  onApplyFilters: (filters: PortalSearchFilters) => void;
  onClearFilters: () => void;
}

const PORTAL_TYPES: Array<{ value: PortalType; label: string; color: string }> = [
  { value: 'maintenance-request', label: 'Maintenance Request', color: '#1976d2' },
  { value: 'asset-registration', label: 'Asset Registration', color: '#388e3c' },
  { value: 'equipment-info', label: 'Equipment Information', color: '#f57c00' },
  { value: 'general-inquiry', label: 'General Inquiry', color: '#7b1fa2' },
  { value: 'inspection-report', label: 'Inspection Report', color: '#d32f2f' },
  { value: 'safety-incident', label: 'Safety Incident', color: '#c62828' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', color: 'success' },
  { value: 'INACTIVE', label: 'Inactive', color: 'default' },
  { value: 'DRAFT', label: 'Draft', color: 'warning' },
  { value: 'ARCHIVED', label: 'Archived', color: 'secondary' },
];

const PortalFilterDialog: React.FC<PortalFilterDialogProps> = ({
  open,
  filters,
  onClose,
  onApplyFilters,
  onClearFilters,
}) => {
  const [localFilters, setLocalFilters] = useState<PortalSearchFilters>(filters);
  const [selectedTypes, setSelectedTypes] = useState<PortalType[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  useEffect(() => {
    setLocalFilters(filters);
    setSelectedTypes(filters.type ? [filters.type] : []);
    setSelectedStatuses(filters.status ? [filters.status] : []);
  }, [filters]);

  const handleTypeChange = (type: PortalType, checked: boolean) => {
    const newTypes = checked
      ? [...selectedTypes, type]
      : selectedTypes.filter(t => t !== type);
    
    setSelectedTypes(newTypes);
    setLocalFilters(prev => ({
      ...prev,
      type: newTypes.length === 1 ? newTypes[0] : undefined
    }));
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatuses = checked
      ? [...selectedStatuses, status]
      : selectedStatuses.filter(s => s !== status);
    
    setSelectedStatuses(newStatuses);
    setLocalFilters(prev => ({
      ...prev,
      status: newStatuses.length === 1 ? newStatuses[0] : undefined
    }));
  };

  const handleInputChange = (field: keyof PortalSearchFilters, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value || undefined
    }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    const emptyFilters: PortalSearchFilters = {};
    setLocalFilters(emptyFilters);
    setSelectedTypes([]);
    setSelectedStatuses([]);
    onClearFilters();
  };

  const hasActiveFilters = Object.values(localFilters).some(value => value !== undefined && value !== '');
  const filterCount = Object.values(localFilters).filter(value => value !== undefined && value !== '').length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Filter Portals
          </Typography>
          {hasActiveFilters && (
            <Chip
              label={`${filterCount} active`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary">
          Filter portals by type, status, and other criteria
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Search Term */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Search
            </Typography>
            <TextField
              label="Search portals..."
              value={localFilters.searchTerm || ''}
              onChange={(e) => handleInputChange('searchTerm', e.target.value)}
              fullWidth
              placeholder="Search by name or description"
            />
          </Box>

          {/* Portal Types */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Portal Types
            </Typography>
            <FormGroup>
              {PORTAL_TYPES.map((type) => (
                <FormControlLabel
                  key={type.value}
                  control={
                    <Checkbox
                      checked={selectedTypes.includes(type.value)}
                      onChange={(e) => handleTypeChange(type.value, e.target.checked)}
                      sx={{ color: type.color }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">{type.label}</Typography>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: type.color,
                        }}
                      />
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          </Box>

          <Divider />

          {/* Status */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Portal Status
            </Typography>
            <FormGroup>
              {STATUS_OPTIONS.map((status) => (
                <FormControlLabel
                  key={status.value}
                  control={
                    <Checkbox
                      checked={selectedStatuses.includes(status.value)}
                      onChange={(e) => handleStatusChange(status.value, e.target.checked)}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">{status.label}</Typography>
                      <Chip
                        label=""
                        size="small"
                        color={status.color as any}
                        sx={{ width: 12, height: 12, minWidth: 12 }}
                      />
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          </Box>

          <Divider />

          {/* Date Range */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Creation Date
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                label="Created After"
                type="date"
                value={localFilters.createdAfter || ''}
                onChange={(e) => handleInputChange('createdAfter', e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Created Before"
                type="date"
                value={localFilters.createdBefore || ''}
                onChange={(e) => handleInputChange('createdBefore', e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>
          </Box>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Active Filters
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {localFilters.searchTerm && (
                  <Chip
                    label={`Search: "${localFilters.searchTerm}"`}
                    size="small"
                    onDelete={() => handleInputChange('searchTerm', '')}
                  />
                )}
                {selectedTypes.map(type => (
                  <Chip
                    key={type}
                    label={PORTAL_TYPES.find(t => t.value === type)?.label}
                    size="small"
                    onDelete={() => handleTypeChange(type, false)}
                  />
                ))}
                {selectedStatuses.map(status => (
                  <Chip
                    key={status}
                    label={STATUS_OPTIONS.find(s => s.value === status)?.label}
                    size="small"
                    onDelete={() => handleStatusChange(status, false)}
                  />
                ))}
                {localFilters.createdAfter && (
                  <Chip
                    label={`After: ${localFilters.createdAfter}`}
                    size="small"
                    onDelete={() => handleInputChange('createdAfter', '')}
                  />
                )}
                {localFilters.createdBefore && (
                  <Chip
                    label={`Before: ${localFilters.createdBefore}`}
                    size="small"
                    onDelete={() => handleInputChange('createdBefore', '')}
                  />
                )}
              </Box>
            </Box>
          )}

          {!hasActiveFilters && (
            <Alert severity="info">
              No filters applied. All portals will be shown.
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={handleClear}
          startIcon={<ClearIcon />}
          disabled={!hasActiveFilters}
        >
          Clear All
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleApply}
          variant="contained"
          startIcon={<FilterIcon />}
        >
          Apply Filters
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PortalFilterDialog;