import React from 'react';
import { Alert, AlertTitle, Box, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Error as ErrorIcon, Warning as WarningIcon } from '@mui/icons-material';
import { FieldErrors } from 'react-hook-form';

interface FormErrorDisplayProps {
  errors: FieldErrors;
  title?: string;
  severity?: 'error' | 'warning';
  showErrorList?: boolean;
  variant?: 'filled' | 'outlined' | 'standard';
}

const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.type === 'required') return 'This field is required';
  return 'Invalid value';
};

const getFieldLabel = (fieldName: string): string => {
  // Convert camelCase to readable labels
  const label = fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
  
  // Special cases for better readability
  const specialCases: Record<string, string> = {
    'Email': 'Email Address',
    'First Name': 'First Name',
    'Last Name': 'Last Name',
    'Asset Id': 'Asset',
    'Location Id': 'Location',
    'Supplier Id': 'Supplier',
    'Stock Level': 'Stock Level',
    'Reorder Point': 'Reorder Point',
    'Serial Number': 'Serial Number',
    'Model Number': 'Model Number',
    'Image Url': 'Image URL',
    'Terms Accepted': 'Terms and Conditions',
    'Confirm Password': 'Password Confirmation',
  };
  
  return specialCases[label] || label;
};

export default function FormErrorDisplay({
  errors,
  title = 'Please fix the following errors:',
  severity = 'error',
  showErrorList = true,
  variant = 'filled',
}: FormErrorDisplayProps) {
  const errorKeys = Object.keys(errors);
  
  if (errorKeys.length === 0) {
    return null;
  }

  const errorEntries = errorKeys.map(key => ({
    field: key,
    label: getFieldLabel(key),
    message: getErrorMessage(errors[key]),
  }));

  return (
    <Alert 
      severity={severity} 
      variant={variant}
      icon={severity === 'error' ? <ErrorIcon /> : <WarningIcon />}
      sx={{ mb: 2 }}
    >
      {title && <AlertTitle>{title}</AlertTitle>}
      
      {showErrorList && errorEntries.length > 1 ? (
        <List dense sx={{ mt: 1, pl: 0 }}>
          {errorEntries.map(({ field, label, message }) => (
            <ListItem key={field} sx={{ pl: 0, py: 0.25 }}>
              <ListItemIcon sx={{ minWidth: 20 }}>
                <Box
                  component="span"
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: 'currentColor',
                    display: 'inline-block',
                  }}
                />
              </ListItemIcon>
              <ListItemText 
                primary={`${label}: ${message}`}
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        // Single error or simple display
        <Box sx={{ mt: errorEntries.length === 1 ? 0 : 1 }}>
          {errorEntries.map(({ field, label, message }) => (
            <Box key={field} sx={{ mb: 0.5 }}>
              <strong>{label}:</strong> {message}
            </Box>
          ))}
        </Box>
      )}
    </Alert>
  );
}

// Variant components for specific use cases
export const FormErrorSummary = (props: Omit<FormErrorDisplayProps, 'showErrorList'>) => (
  <FormErrorDisplay {...props} showErrorList={true} />
);

export const FormErrorInline = (props: Omit<FormErrorDisplayProps, 'showErrorList' | 'title'>) => (
  <FormErrorDisplay {...props} showErrorList={false} title="" />
);

export const FormWarningDisplay = (props: Omit<FormErrorDisplayProps, 'severity'>) => (
  <FormErrorDisplay {...props} severity="warning" />
);