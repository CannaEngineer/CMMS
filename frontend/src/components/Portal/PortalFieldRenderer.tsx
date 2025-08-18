// Portal Field Renderer - Renders different form field types with consistent styling
import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  Typography,
  Button,
  Rating,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import {
  DatePicker,
  TimePicker,
  DateTimePicker,
  LocalizationProvider
} from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import {
  LocationOn as LocationIcon,
  Inventory as AssetIcon,
  Star as StarIcon,
  PhotoCamera as CameraIcon,
  Edit as SignatureIcon
} from '@mui/icons-material';
import type {
  PortalField,
  PortalBranding
} from '../../types/portal';

interface PortalFieldRendererProps {
  field: PortalField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  branding: PortalBranding;
  disabled?: boolean;
}

const PortalFieldRenderer: React.FC<PortalFieldRendererProps> = ({
  field,
  value,
  onChange,
  error,
  branding,
  disabled = false
}) => {
  const [, setSignatureData] = useState<string>('');

  // Normalize field properties (handle both old and new field formats)
  const label = field.label || field.fieldLabel || 'Field';
  const placeholder = field.placeholder || field.fieldPlaceholder || '';
  const description = field.fieldDescription || '';
  const helpText = field.helpText || '';
  const options = field.options || field.fieldOptions || [];
  const validation = field.validation || field.validationRules || {};

  // Common props for all fields
  const commonProps = {
    fullWidth: true,
    disabled,
    error: Boolean(error),
    helperText: error || description,
    required: field.isRequired,
    sx: {
      '& .MuiOutlinedInput-root': {
        '&.Mui-focused fieldset': {
          borderColor: branding.primaryColor
        }
      },
      '& .MuiInputLabel-root.Mui-focused': {
        color: branding.primaryColor
      }
    }
  };

  // Handle different field types
  const renderField = () => {
    // Normalize field type from backend SCREAMING_SNAKE_CASE to lowercase with hyphens
    const normalizedFieldType = field.fieldType
      ?.toLowerCase()
      .replace(/_/g, '-');
    
    // Debug log to see what field types we're getting (development only)
    if (process.env.NODE_ENV === 'development' && (!normalizedFieldType || normalizedFieldType === '')) {
      console.warn('PortalFieldRenderer - Empty or undefined fieldType:', {
        fieldName: field.fieldName,
        fieldType: field.fieldType
      });
    }
    
    switch (normalizedFieldType) {
      case 'text':
        return (
          <TextField
            {...commonProps}
            label={label}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            inputProps={{
              pattern: validation?.pattern,
              minLength: validation?.minLength,
              maxLength: validation?.maxLength
            }}
          />
        );

      case 'textarea':
        return (
          <TextField
            {...commonProps}
            label={label}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            multiline
            rows={4}
            inputProps={{
              minLength: validation?.minLength,
              maxLength: validation?.maxLength
            }}
          />
        );

      case 'email':
        return (
          <TextField
            {...commonProps}
            label={label}
            type="email"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        );

      case 'phone':
        return (
          <TextField
            {...commonProps}
            label={label}
            type="tel"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        );

      case 'number':
        return (
          <TextField
            {...commonProps}
            label={label}
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder={placeholder}
            inputProps={{
              min: validation?.min,
              max: validation?.max
            }}
          />
        );

      case 'select':
        return (
          <FormControl {...commonProps}>
            <InputLabel>{label}</InputLabel>
            <Select
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              label={label}
            >
              {options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {option.icon && <span>{option.icon}</span>}
                    <Box>
                      <Typography>{option.label}</Typography>
                      {option.description && (
                        <Typography variant="body2" color="text.secondary">
                          {option.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'multi-select':
        return (
          <FormControl component="fieldset" {...commonProps}>
            <FormLabel component="legend">{label}</FormLabel>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {options?.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  clickable
                  color={Array.isArray(value) && value.includes(option.value) ? 'primary' : 'default'}
                  variant={Array.isArray(value) && value.includes(option.value) ? 'filled' : 'outlined'}
                  onClick={() => {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValues = currentValues.includes(option.value)
                      ? currentValues.filter(v => v !== option.value)
                      : [...currentValues, option.value];
                    onChange(newValues);
                  }}
                  sx={{
                    '&.MuiChip-colorPrimary': {
                      backgroundColor: branding.primaryColor,
                      color: 'white'
                    }
                  }}
                />
              ))}
            </Box>
          </FormControl>
        );

      case 'radio':
        return (
          <FormControl component="fieldset" {...commonProps}>
            <FormLabel component="legend">{label}</FormLabel>
            <RadioGroup
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              sx={{ mt: 1 }}
            >
              {options?.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={
                    <Radio
                      sx={{
                        '&.Mui-checked': {
                          color: branding.primaryColor
                        }
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography>{option.label}</Typography>
                      {option.description && (
                        <Typography variant="body2" color="text.secondary">
                          {option.description}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'checkbox':
        const checkboxValues = Array.isArray(value) ? value : [];
        
        return (
          <FormControl component="fieldset" {...commonProps}>
            <FormLabel component="legend">{label}</FormLabel>
            <FormGroup sx={{ mt: 1 }}>
              {options?.map((option) => (
                <FormControlLabel
                  key={option.value}
                  control={
                    <Checkbox
                      checked={checkboxValues.includes(option.value)}
                      onChange={(e) => {
                        const newValues = e.target.checked
                          ? [...checkboxValues, option.value]
                          : checkboxValues.filter(v => v !== option.value);
                        onChange(newValues);
                      }}
                      sx={{
                        '&.Mui-checked': {
                          color: branding.primaryColor
                        }
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography>{option.label}</Typography>
                      {option.description && (
                        <Typography variant="body2" color="text.secondary">
                          {option.description}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          </FormControl>
        );

      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label={label}
              value={value ? dayjs(value) : null}
              onChange={(newValue) => onChange(newValue?.format('YYYY-MM-DD'))}
              slotProps={{
                textField: {
                  ...commonProps,
                  fullWidth: true
                }
              }}
            />
          </LocalizationProvider>
        );

      case 'time':
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <TimePicker
              label={label}
              value={value ? dayjs(value, 'HH:mm') : null}
              onChange={(newValue) => onChange(newValue?.format('HH:mm'))}
              slotProps={{
                textField: {
                  ...commonProps,
                  fullWidth: true
                }
              }}
            />
          </LocalizationProvider>
        );

      case 'datetime':
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              label={label}
              value={value ? dayjs(value) : null}
              onChange={(newValue) => onChange(newValue?.toISOString())}
              slotProps={{
                textField: {
                  ...commonProps,
                  fullWidth: true
                }
              }}
            />
          </LocalizationProvider>
        );

      case 'priority-selector':
        const priorityOptions = [
          { value: 'LOW', label: 'Low', color: '#4caf50', description: 'Non-urgent, can wait' },
          { value: 'MEDIUM', label: 'Medium', color: '#ff9800', description: 'Normal priority' },
          { value: 'HIGH', label: 'High', color: '#f44336', description: 'Urgent attention needed' },
          { value: 'URGENT', label: 'Urgent', color: '#d32f2f', description: 'Emergency - immediate action required' }
        ];

        return (
          <FormControl component="fieldset" {...commonProps}>
            <FormLabel component="legend">{label}</FormLabel>
            <RadioGroup
              value={value || 'MEDIUM'}
              onChange={(e) => onChange(e.target.value)}
              sx={{ mt: 1 }}
            >
              {priorityOptions.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={
                    <Radio
                      sx={{
                        color: option.color,
                        '&.Mui-checked': {
                          color: option.color
                        }
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: option.color
                        }}
                      />
                      <Box>
                        <Typography>{option.label}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {option.description}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'rating':
        return (
          <FormControl component="fieldset" {...commonProps}>
            <FormLabel component="legend">{label}</FormLabel>
            <Box sx={{ mt: 1 }}>
              <Rating
                value={value || 0}
                onChange={(event, newValue) => onChange(newValue)}
                precision={0.5}
                size="large"
                icon={<StarIcon sx={{ color: branding.accentColor }} />}
                emptyIcon={<StarIcon sx={{ color: 'grey.300' }} />}
              />
              {value && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {value} out of 5 stars
                </Typography>
              )}
            </Box>
          </FormControl>
        );

      case 'location-picker':
        return (
          <Card variant="outlined" sx={{ ...commonProps }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <LocationIcon sx={{ color: branding.primaryColor, mt: 0.5 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {label}
                  </Typography>
                  
                  <TextField
                    fullWidth
                    placeholder="Enter location or address"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  
                  <Button
                    variant="outlined"
                    startIcon={<LocationIcon />}
                    onClick={() => {
                      navigator.geolocation?.getCurrentPosition(
                        (position) => {
                          onChange(`${position.coords.latitude}, ${position.coords.longitude}`);
                        },
                        (error) => {
                          console.error('Location error:', error);
                        }
                      );
                    }}
                    size="small"
                  >
                    Use My Location
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        );

      case 'asset-picker':
        return (
          <Card variant="outlined" sx={{ ...commonProps }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <AssetIcon sx={{ color: branding.primaryColor, mt: 0.5 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {label}
                  </Typography>
                  
                  <TextField
                    fullWidth
                    placeholder="Enter asset name or ID"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    helperText="You can also scan the asset QR code"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        );

      case 'photo-capture':
        return (
          <Card variant="outlined" sx={{ ...commonProps }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <CameraIcon sx={{ color: branding.primaryColor, mt: 0.5 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {label}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Photos will be handled by the file upload section
                  </Typography>
                  
                  <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                    Use the camera or file upload buttons below the form to add photos
                  </Alert>
                </Box>
              </Box>
            </CardContent>
          </Card>
        );

      case 'signature':
        return (
          <Card variant="outlined" sx={{ ...commonProps }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <SignatureIcon sx={{ color: branding.primaryColor, mt: 0.5 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {label}
                  </Typography>
                  
                  <TextField
                    fullWidth
                    placeholder="Type your full name as signature"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    helperText="By typing your name, you agree this serves as your electronic signature"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        );

      case 'file':
      case 'image':
        return (
          <Card variant="outlined" sx={{ ...commonProps }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <CameraIcon sx={{ color: branding.primaryColor, mt: 0.5 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {label}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {description || `Upload ${normalizedFieldType === 'image' ? 'images' : 'files'} using the buttons below the form`}
                  </Typography>
                  
                  <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                    Use the file upload section below to add {normalizedFieldType === 'image' ? 'images' : 'files'}
                  </Alert>
                </Box>
              </Box>
            </CardContent>
          </Card>
        );

      case 'location':
        // Use the existing location-picker case
        return (
          <Card variant="outlined" sx={{ ...commonProps }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <LocationIcon sx={{ color: branding.primaryColor, mt: 0.5 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {label}
                  </Typography>
                  
                  <TextField
                    fullWidth
                    placeholder="Enter location or address"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  
                  <Button
                    variant="outlined"
                    startIcon={<LocationIcon />}
                    onClick={() => {
                      navigator.geolocation?.getCurrentPosition(
                        (position) => {
                          onChange(`${position.coords.latitude}, ${position.coords.longitude}`);
                        },
                        (error) => {
                          console.error('Location error:', error);
                        }
                      );
                    }}
                    size="small"
                  >
                    Use My Location
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        );

      case 'hidden':
        return null;

      default:
        // Enhanced debugging for unsupported field types
        console.error('PortalFieldRenderer - Unsupported field type:', {
          originalFieldType: field.fieldType,
          normalizedFieldType: normalizedFieldType,
          fieldName: field.fieldName,
          field: field
        });
        return (
          <Alert severity="warning">
            Unsupported field type: {field.fieldType} (normalized: {normalizedFieldType})
          </Alert>
        );
    }
  };

  // Don't render hidden fields
  if (field.fieldType === 'hidden' || !field.isVisible) {
    return null;
  }

  return (
    <Box>
      {renderField()}
      
      {/* Help text */}
      {helpText && !error && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5, fontSize: '0.75rem' }}
        >
          {helpText}
        </Typography>
      )}
    </Box>
  );
};

export default PortalFieldRenderer;