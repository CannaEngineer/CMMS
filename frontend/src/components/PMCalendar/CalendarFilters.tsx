import React, { useState, useMemo } from 'react';
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  FormControlLabel,
  Switch,
  IconButton,
  Collapse,
  useTheme,
  alpha,
  Fade,
  Divider,
  Typography,
  SelectChangeEvent,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { PMScheduleItem, CalendarFilters as FilterType } from '../../types/pmCalendar';

interface CalendarFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  pmSchedules: PMScheduleItem[];
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
      borderRadius: 12,
    },
  },
};

const CalendarFilters: React.FC<CalendarFiltersProps> = ({
  filters,
  onFiltersChange,
  pmSchedules,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  // Extract unique values from PM schedules for filter options
  const filterOptions = useMemo(() => {
    const assetTypes = [...new Set(pmSchedules.map(pm => pm.assetName))].sort();
    const technicians = [...new Set(pmSchedules.map(pm => pm.assignedTechnician).filter(Boolean))].sort();
    const locations = [...new Set(pmSchedules.map(pm => pm.location))].sort();
    const taskTypes = [...new Set(pmSchedules.map(pm => pm.taskType))].sort();
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

    return {
      assetTypes,
      technicians,
      locations,
      taskTypes,
      priorities,
    };
  }, [pmSchedules]);

  const handleFilterChange = (filterType: keyof FilterType, value: any) => {
    onFiltersChange({
      ...filters,
      [filterType]: value,
    });
  };

  const handleMultiSelectChange = (
    event: SelectChangeEvent<string[]>,
    filterType: keyof FilterType
  ) => {
    const value = event.target.value as string[];
    handleFilterChange(filterType, value);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      assetTypes: [],
      technicians: [],
      locations: [],
      taskTypes: [],
      priorities: [],
      showOverdueOnly: false,
    });
  };

  const getActiveFilterCount = () => {
    return (
      filters.assetTypes.length +
      filters.technicians.length +
      filters.locations.length +
      filters.taskTypes.length +
      filters.priorities.length +
      (filters.showOverdueOnly ? 1 : 0)
    );
  };

  const activeFilterCount = getActiveFilterCount();

  const renderMultiSelect = (
    label: string,
    value: string[],
    options: string[],
    filterType: keyof FilterType
  ) => (
    <FormControl size="small" sx={{ minWidth: 160, maxWidth: 200 }}>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={value}
        onChange={(e) => handleMultiSelectChange(e, filterType)}
        input={<OutlinedInput label={label} />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: '100%' }}>
            {(selected as string[]).slice(0, 2).map((item) => (
              <Chip
                key={item}
                label={item}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                }}
              />
            ))}
            {(selected as string[]).length > 2 && (
              <Chip
                label={`+${(selected as string[]).length - 2}`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                  color: theme.palette.secondary.main,
                }}
              />
            )}
          </Box>
        )}
        MenuProps={MenuProps}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          },
        }}
      >
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            <Checkbox 
              checked={value.indexOf(option) > -1}
              sx={{
                color: theme.palette.primary.main,
                '&.Mui-checked': {
                  color: theme.palette.primary.main,
                },
              }}
            />
            <ListItemText primary={option} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  return (
    <Box>
      {/* Filter Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon sx={{ color: theme.palette.text.secondary }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Filters
          </Typography>
          {activeFilterCount > 0 && (
            <Chip
              label={activeFilterCount}
              size="small"
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                fontWeight: 600,
                minWidth: 24,
                height: 24,
              }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
          {activeFilterCount > 0 && (
            <Fade in>
              <IconButton
                size="small"
                onClick={clearAllFilters}
                sx={{
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                  color: theme.palette.error.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.error.main, 0.2),
                  },
                }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </Fade>
          )}
          
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              },
              transition: 'transform 0.2s ease-in-out',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Quick Filters (Always Visible) */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControlLabel
          control={
            <Switch
              checked={filters.showOverdueOnly}
              onChange={(e) => handleFilterChange('showOverdueOnly', e.target.checked)}
              color="error"
              size="small"
            />
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Overdue Only
            </Typography>
          }
        />

        {/* Priority Quick Filters */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Priority:
          </Typography>
          {['URGENT', 'HIGH'].map((priority) => (
            <Chip
              key={priority}
              label={priority}
              size="small"
              clickable
              onClick={() => {
                const newPriorities = filters.priorities.includes(priority)
                  ? filters.priorities.filter(p => p !== priority)
                  : [...filters.priorities, priority];
                handleFilterChange('priorities', newPriorities);
              }}
              sx={{
                backgroundColor: filters.priorities.includes(priority)
                  ? priority === 'URGENT' 
                    ? theme.palette.error.main 
                    : theme.palette.warning.main
                  : alpha(theme.palette.action.selected, 0.1),
                color: filters.priorities.includes(priority)
                  ? 'white'
                  : priority === 'URGENT'
                    ? theme.palette.error.main
                    : theme.palette.warning.main,
                fontWeight: 600,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Expandable Advanced Filters */}
      <Collapse in={expanded} timeout={300}>
        <Box sx={{ pt: 2 }}>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            {renderMultiSelect(
              'Asset Types',
              filters.assetTypes,
              filterOptions.assetTypes,
              'assetTypes'
            )}

            {renderMultiSelect(
              'Technicians',
              filters.technicians,
              filterOptions.technicians,
              'technicians'
            )}

            {renderMultiSelect(
              'Locations',
              filters.locations,
              filterOptions.locations,
              'locations'
            )}

            {renderMultiSelect(
              'Task Types',
              filters.taskTypes,
              filterOptions.taskTypes,
              'taskTypes'
            )}

            {renderMultiSelect(
              'All Priorities',
              filters.priorities,
              filterOptions.priorities,
              'priorities'
            )}
          </Box>
        </Box>
      </Collapse>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <Fade in>
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 500 }}>
              Active Filters:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {filters.showOverdueOnly && (
                <Chip
                  label="Overdue Only"
                  size="small"
                  onDelete={() => handleFilterChange('showOverdueOnly', false)}
                  sx={{
                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                    color: theme.palette.error.main,
                  }}
                />
              )}
              
              {Object.entries(filters).map(([key, value]) => {
                if (key === 'showOverdueOnly' || !Array.isArray(value) || value.length === 0) return null;
                
                return value.map((item: string) => (
                  <Chip
                    key={`${key}-${item}`}
                    label={`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${item}`}
                    size="small"
                    onDelete={() => {
                      const newValue = (value as string[]).filter(v => v !== item);
                      handleFilterChange(key as keyof FilterType, newValue);
                    }}
                    sx={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                    }}
                  />
                ));
              })}
            </Box>
          </Box>
        </Fade>
      )}
    </Box>
  );
};

export default CalendarFilters;