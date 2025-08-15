import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Checkbox,
  RadioGroup,
  Radio,
  Autocomplete,
  Chip,
  Box,
  Typography,
  Button,
  Avatar,
} from '@mui/material';
import { DatePicker, DateTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { CloudUpload as UploadIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface FormFieldProps {
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'multiselect' | 'autocomplete' | 'switch' | 'checkbox' | 'radio' | 'date' | 'datetime' | 'file' | 'image';
  name: string;
  label: string;
  value?: any;
  onChange: (name: string, value: any) => void;
  options?: Option[];
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  accept?: string;
  multiple?: boolean;
  size?: 'small' | 'medium';
}

export default function FormField({
  type,
  name,
  label,
  value = '',
  onChange,
  options = [],
  required = false,
  disabled = false,
  error,
  helperText,
  fullWidth = true,
  rows = 4,
  placeholder,
  accept,
  multiple = false,
  size = 'medium',
}: FormFieldProps) {

  const handleChange = (newValue: any) => {
    onChange(name, newValue);
  };

  const renderField = () => {
    switch (type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
        return (
          <TextField
            type={type}
            label={label}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            required={required}
            disabled={disabled}
            error={!!error}
            helperText={error || helperText}
            fullWidth={fullWidth}
            placeholder={placeholder}
            size={size}
          />
        );

      case 'textarea':
        return (
          <TextField
            label={label}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            required={required}
            disabled={disabled}
            error={!!error}
            helperText={error || helperText}
            fullWidth={fullWidth}
            multiline
            rows={rows}
            placeholder={placeholder}
            size={size}
          />
        );

      case 'select':
        return (
          <FormControl fullWidth={fullWidth} error={!!error} size={size}>
            <InputLabel required={required}>{label}</InputLabel>
            <Select
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              label={label}
              disabled={disabled}
            >
              {options.map((option) => (
                <MenuItem 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {(error || helperText) && (
              <Typography variant="caption" color={error ? 'error' : 'text.secondary'} sx={{ mt: 0.5, px: 1.75 }}>
                {error || helperText}
              </Typography>
            )}
          </FormControl>
        );

      case 'multiselect':
        return (
          <FormControl fullWidth={fullWidth} error={!!error} size={size}>
            <InputLabel required={required}>{label}</InputLabel>
            <Select
              multiple
              value={value || []}
              onChange={(e) => handleChange(e.target.value)}
              label={label}
              disabled={disabled}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((val) => {
                    const option = options.find(opt => opt.value === val);
                    return (
                      <Chip key={val} label={option?.label || val} size="small" />
                    );
                  })}
                </Box>
              )}
            >
              {options.map((option) => (
                <MenuItem 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                >
                  <Checkbox checked={(value || []).indexOf(option.value) > -1} />
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {(error || helperText) && (
              <Typography variant="caption" color={error ? 'error' : 'text.secondary'} sx={{ mt: 0.5, px: 1.75 }}>
                {error || helperText}
              </Typography>
            )}
          </FormControl>
        );

      case 'autocomplete':
        return (
          <Autocomplete
            options={options}
            getOptionLabel={(option) => option.label}
            value={options.find(opt => opt.value === value) || null}
            onChange={(_, newValue) => handleChange(newValue?.value || '')}
            disabled={disabled}
            size={size}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                required={required}
                error={!!error}
                helperText={error || helperText}
                placeholder={placeholder}
              />
            )}
          />
        );

      case 'switch':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={value || false}
                onChange={(e) => handleChange(e.target.checked)}
                disabled={disabled}
              />
            }
            label={label}
          />
        );

      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={value || false}
                onChange={(e) => handleChange(e.target.checked)}
                disabled={disabled}
              />
            }
            label={label}
          />
        );

      case 'radio':
        return (
          <FormControl component="fieldset" error={!!error}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              {label} {required && '*'}
            </Typography>
            <RadioGroup
              value={value}
              onChange={(e) => handleChange(e.target.value)}
            >
              {options.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                  disabled={disabled || option.disabled}
                />
              ))}
            </RadioGroup>
            {(error || helperText) && (
              <Typography variant="caption" color={error ? 'error' : 'text.secondary'} sx={{ mt: 0.5 }}>
                {error || helperText}
              </Typography>
            )}
          </FormControl>
        );

      case 'date':
        return (
          <DatePicker
            label={label}
            value={value ? dayjs(value) : null}
            onChange={(newValue) => {
              // Handle dayjs objects
              if (newValue && dayjs.isDayjs(newValue)) {
                const dateString = newValue.format('YYYY-MM-DD');
                handleChange(dateString);
              } else {
                handleChange('');
              }
            }}
            disabled={disabled}
            slotProps={{
              textField: {
                fullWidth: fullWidth,
                required: required,
                error: !!error,
                helperText: error || helperText,
                size: size,
              },
            }}
          />
        );

      case 'datetime':
        return (
          <DateTimePicker
            label={label}
            value={value ? new Date(value) : null}
            onChange={(newValue) => handleChange(newValue?.toISOString() || '')}
            disabled={disabled}
            slotProps={{
              textField: {
                fullWidth: fullWidth,
                required: required,
                error: !!error,
                helperText: error || helperText,
                size: size,
              },
            }}
          />
        );

      case 'file':
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              {label} {required && '*'}
            </Typography>
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadIcon />}
              fullWidth={fullWidth}
              disabled={disabled}
            >
              Choose File
              <input
                type="file"
                hidden
                accept={accept}
                multiple={multiple}
                onChange={(e) => {
                  const files = e.target.files;
                  handleChange(multiple ? Array.from(files || []) : files?.[0] || null);
                }}
              />
            </Button>
            {value && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {multiple ? `${(value as File[]).length} files selected` : (value as File).name}
              </Typography>
            )}
            {(error || helperText) && (
              <Typography variant="caption" color={error ? 'error' : 'text.secondary'} sx={{ mt: 0.5, display: 'block' }}>
                {error || helperText}
              </Typography>
            )}
          </Box>
        );

      case 'image':
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              {label} {required && '*'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {value && (
                <Avatar
                  src={typeof value === 'string' ? value : URL.createObjectURL(value)}
                  sx={{ width: 80, height: 80 }}
                  variant="rounded"
                />
              )}
              <Box sx={{ flexGrow: 1 }}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  disabled={disabled}
                  sx={{ mb: 1 }}
                >
                  Upload Image
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleChange(file);
                    }}
                  />
                </Button>
                {value && (
                  <Button
                    startIcon={<DeleteIcon />}
                    color="error"
                    onClick={() => handleChange(null)}
                    sx={{ ml: 1 }}
                  >
                    Remove
                  </Button>
                )}
              </Box>
            </Box>
            {(error || helperText) && (
              <Typography variant="caption" color={error ? 'error' : 'text.secondary'} sx={{ mt: 0.5, display: 'block' }}>
                {error || helperText}
              </Typography>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return <Box sx={{ mb: 2 }}>{renderField()}</Box>;
}