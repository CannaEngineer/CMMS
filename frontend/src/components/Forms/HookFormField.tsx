import React from 'react';
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  SelectChangeEvent,
} from '@mui/material';

interface Option {
  value: string | number;
  label: string;
}

interface HookFormFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  control: Control<T>;
  label: string;
  type?: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select' | 'url';
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  options?: Option[];
  rows?: number;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

export default function HookFormField<T extends FieldValues>({
  name,
  control,
  label,
  type = 'text',
  required = false,
  disabled = false,
  placeholder,
  options = [],
  rows = 1,
  startAdornment,
  endAdornment,
}: HookFormFieldProps<T>) {
  if (type === 'select') {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <FormControl 
            fullWidth 
            error={!!fieldState.error}
            disabled={disabled}
          >
            <InputLabel>{label}{required && ' *'}</InputLabel>
            <Select
              {...field}
              label={label + (required ? ' *' : '')}
              value={field.value || ''}
              onChange={(e: SelectChangeEvent) => {
                const value = e.target.value;
                // Convert to number if the value looks like a number
                if (type === 'select' && !isNaN(Number(value)) && value !== '') {
                  field.onChange(Number(value));
                } else {
                  field.onChange(value);
                }
              }}
            >
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {fieldState.error && (
              <FormHelperText>{fieldState.error.message}</FormHelperText>
            )}
          </FormControl>
        )}
      />
    );
  }

  if (type === 'textarea') {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            fullWidth
            label={label}
            multiline
            rows={rows}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            value={field.value || ''}
          />
        )}
      />
    );
  }

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          fullWidth
          label={label}
          type={type}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
          InputProps={{
            startAdornment,
            endAdornment,
          }}
          value={field.value || ''}
          onChange={(e) => {
            const value = e.target.value;
            if (type === 'number') {
              // Allow empty string or valid numbers
              if (value === '' || !isNaN(Number(value))) {
                field.onChange(value === '' ? undefined : Number(value));
              }
            } else {
              field.onChange(value);
            }
          }}
        />
      )}
    />
  );
}