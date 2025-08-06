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
  Slider,
  Switch,
  Autocomplete,
  Card,
  CardContent,
  Grid,
  Alert,
  IconButton,
  InputAdornment
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
  Help as HelpIcon,
  PhotoCamera as CameraIcon,
  Edit as SignatureIcon
} from '@mui/icons-material';
import {
  PortalField,
  PortalBranding,
  FieldType
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
  const [signatureData, setSignatureData] = useState<string>('');

  // Common props for all fields
  const commonProps = {
    fullWidth: true,
    disabled,
    error: Boolean(error),
    helperText: error || field.helpText,
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
    switch (field.type) {
      case 'text':
        return (
          <TextField
            {...commonProps}
            label={field.label}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            inputProps={{
              pattern: field.validation?.pattern,
              minLength: field.validation?.minLength,
              maxLength: field.validation?.maxLength
            }}
          />
        );

      case 'textarea':
        return (
          <TextField
            {...commonProps}
            label={field.label}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            multiline
            rows={4}
            inputProps={{
              minLength: field.validation?.minLength,
              maxLength: field.validation?.maxLength
            }}
          />
        );

      case 'email':
        return (
          <TextField
            {...commonProps}
            label={field.label}
            type="email"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case 'phone':
        return (
          <TextField
            {...commonProps}
            label={field.label}
            type="tel"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case 'number':
        return (
          <TextField
            {...commonProps}
            label={field.label}
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder={field.placeholder}
            inputProps={{
              min: field.validation?.min,
              max: field.validation?.max
            }}
          />
        );

      case 'select':
        return (
          <FormControl {...commonProps}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              label={field.label}
            >
              {field.options?.map((option) => (
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
            <FormLabel component="legend">{field.label}</FormLabel>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {field.options?.map((option) => (
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
            <FormLabel component="legend">{field.label}</FormLabel>
            <RadioGroup
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              sx={{ mt: 1 }}
            >
              {field.options?.map((option) => (
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
            <FormLabel component="legend">{field.label}</FormLabel>
            <FormGroup sx={{ mt: 1 }}>
              {field.options?.map((option) => (
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
              label={field.label}
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
              label={field.label}
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
              label={field.label}
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
            <FormLabel component="legend">{field.label}</FormLabel>
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
            <FormLabel component="legend">{field.label}</FormLabel>
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
                    {field.label}
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
                    {field.label}
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
                    {field.label}
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
                    {field.label}
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

      case 'hidden':
        return null;

      default:
        return (
          <Alert severity="warning">
            Unsupported field type: {field.type}
          </Alert>
        );
    }
  };

  // Don't render hidden fields
  if (field.type === 'hidden' || !field.isVisible) {
    return null;
  }

  return (
    <Box>
      {renderField()}
      
      {/* Help text */}
      {field.helpText && !error && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5, fontSize: '0.75rem' }}
        >
          {field.helpText}
        </Typography>
      )}
    </Box>
  );
};

export default PortalFieldRenderer;