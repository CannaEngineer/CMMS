// Portal Form Builder - Drag and drop form field configuration
import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Visibility as PreviewIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { PortalField, PortalType, FieldType } from '../../types/portal';
import { getValidFrontendFieldTypes } from '../../utils/portalTransforms';

// Available field types with descriptions (using valid frontend field types)
const FIELD_TYPES: Array<{
  type: string;
  label: string;
  description: string;
  icon: string;
  category: 'basic' | 'advanced' | 'special';
}> = [
  { type: 'text', label: 'Text Input', description: 'Single line text', icon: '📝', category: 'basic' },
  { type: 'textarea', label: 'Text Area', description: 'Multi-line text', icon: '📄', category: 'basic' },
  { type: 'email', label: 'Email', description: 'Email address', icon: '📧', category: 'basic' },
  { type: 'phone', label: 'Phone', description: 'Phone number', icon: '📞', category: 'basic' },
  { type: 'number', label: 'Number', description: 'Numeric input', icon: '🔢', category: 'basic' },
  { type: 'select', label: 'Dropdown', description: 'Single selection', icon: '📋', category: 'basic' },
  { type: 'radio', label: 'Radio Buttons', description: 'Single choice', icon: '⚪', category: 'basic' },
  { type: 'checkbox', label: 'Checkboxes', description: 'Multiple choice', icon: '☑️', category: 'basic' },
  { type: 'date', label: 'Date', description: 'Date picker', icon: '📅', category: 'basic' },
  { type: 'time', label: 'Time', description: 'Time picker', icon: '🕐', category: 'basic' },
  { type: 'datetime', label: 'Date & Time', description: 'Date and time picker', icon: '🕐', category: 'advanced' },
  { type: 'multiselect', label: 'Multi-Select', description: 'Multiple selections', icon: '☑️', category: 'advanced' },
  { type: 'rating', label: 'Rating', description: 'Star rating', icon: '⭐', category: 'advanced' },
  { type: 'priority', label: 'Priority', description: 'Priority level selector', icon: '🚨', category: 'special' },
  { type: 'location', label: 'Location', description: 'Location selector', icon: '📍', category: 'special' },
  { type: 'asset-picker', label: 'Asset', description: 'Asset selector', icon: '🏭', category: 'special' },
  { type: 'image', label: 'Photo Upload', description: 'Camera/file upload', icon: '📷', category: 'special' },
  { type: 'signature', label: 'Signature', description: 'Electronic signature', icon: '✍️', category: 'special' }
];

// Default fields for different portal types (using valid field types)
const DEFAULT_FIELDS_BY_TYPE: Record<PortalType, Partial<PortalField>[]> = {
  'maintenance-request': [
    { name: 'requestType', label: 'Request Type', type: 'select', isRequired: true, order: 1 },
    { name: 'priority', label: 'Priority', type: 'priority', isRequired: true, order: 2 },
    { name: 'location', label: 'Location', type: 'location', isRequired: true, order: 3 },
    { name: 'description', label: 'Problem Description', type: 'textarea', isRequired: true, order: 4 },
    { name: 'photos', label: 'Photos', type: 'image', isRequired: false, order: 5 }
  ],
  'asset-registration': [
    { name: 'assetName', label: 'Asset Name', type: 'text', isRequired: true, order: 1 },
    { name: 'assetType', label: 'Asset Type', type: 'select', isRequired: true, order: 2 },
    { name: 'location', label: 'Location', type: 'location', isRequired: true, order: 3 },
    { name: 'serialNumber', label: 'Serial Number', type: 'text', isRequired: false, order: 4 },
    { name: 'description', label: 'Description', type: 'textarea', isRequired: false, order: 5 },
    { name: 'photos', label: 'Photos', type: 'image', isRequired: false, order: 6 }
  ],
  'equipment-info': [
    { name: 'equipmentId', label: 'Equipment ID/Name', type: 'asset-picker', isRequired: true, order: 1 },
    { name: 'updateType', label: 'Update Type', type: 'select', isRequired: true, order: 2 },
    { name: 'description', label: 'Details', type: 'textarea', isRequired: true, order: 3 },
    { name: 'photos', label: 'Photos', type: 'image', isRequired: false, order: 4 }
  ],
  'general-inquiry': [
    { name: 'inquiryType', label: 'Inquiry Type', type: 'select', isRequired: true, order: 1 },
    { name: 'subject', label: 'Subject', type: 'text', isRequired: true, order: 2 },
    { name: 'message', label: 'Message', type: 'textarea', isRequired: true, order: 3 }
  ],
  'inspection-report': [
    { name: 'inspectionType', label: 'Inspection Type', type: 'select', isRequired: true, order: 1 },
    { name: 'location', label: 'Location', type: 'location', isRequired: true, order: 2 },
    { name: 'findings', label: 'Findings', type: 'textarea', isRequired: true, order: 3 },
    { name: 'rating', label: 'Overall Rating', type: 'rating', isRequired: false, order: 4 },
    { name: 'photos', label: 'Evidence Photos', type: 'image', isRequired: false, order: 5 },
    { name: 'inspector', label: 'Inspector Signature', type: 'signature', isRequired: true, order: 6 }
  ],
  'safety-incident': [
    { name: 'incidentType', label: 'Incident Type', type: 'select', isRequired: true, order: 1 },
    { name: 'severity', label: 'Severity', type: 'priority', isRequired: true, order: 2 },
    { name: 'location', label: 'Location', type: 'location', isRequired: true, order: 3 },
    { name: 'description', label: 'Incident Description', type: 'textarea', isRequired: true, order: 4 },
    { name: 'injuryOccurred', label: 'Injury Occurred?', type: 'radio', isRequired: true, order: 5 },
    { name: 'photos', label: 'Photos', type: 'image', isRequired: false, order: 6 },
    { name: 'reporter', label: 'Reporter Signature', type: 'signature', isRequired: true, order: 7 }
  ]
};

interface PortalFormBuilderProps {
  fields: PortalField[];
  onChange: (fields: PortalField[]) => void;
  portalType: PortalType;
  errors?: Record<string, string>;
}

const PortalFormBuilder: React.FC<PortalFormBuilderProps> = ({
  fields,
  onChange,
  portalType,
  errors
}) => {
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [editingField, setEditingField] = useState<PortalField | null>(null);
  const [fieldCategory, setFieldCategory] = useState<'basic' | 'advanced' | 'special'>('basic');

  // Initialize with default fields if empty
  React.useEffect(() => {
    if (fields.length === 0) {
      const defaultFields = DEFAULT_FIELDS_BY_TYPE[portalType] || [];
      const newFields: PortalField[] = defaultFields.map((field, index) => ({
        id: `field-${index}`,
        name: field.name || '',
        label: field.label || '',
        type: field.type as any || 'text',
        placeholder: '',
        helpText: '',
        validation: {},
        options: field.type === 'select' || field.type === 'radio' || field.type === 'checkbox' ? [] : undefined,
        order: field.order || index,
        isVisible: true,
        isRequired: field.isRequired || false
      }));
      onChange(newFields);
    }
  }, [portalType, fields.length, onChange]);

  const handleAddField = () => {
    setEditingField(null);
    setShowFieldDialog(true);
  };

  const handleEditField = (field: PortalField) => {
    setEditingField(field);
    setShowFieldDialog(true);
  };

  const handleDeleteField = (fieldId: string) => {
    onChange(fields.filter(f => f.id !== fieldId));
  };

  const handleSaveField = (fieldData: Partial<PortalField>) => {
    if (editingField) {
      // Update existing field
      onChange(fields.map(f => 
        f.id === editingField.id 
          ? { ...f, ...fieldData }
          : f
      ));
    } else {
      // Add new field
      const newField: PortalField = {
        id: `field-${Date.now()}`,
        name: fieldData.name || '',
        label: fieldData.label || '',
        type: fieldData.type || 'text',
        placeholder: fieldData.placeholder || '',
        helpText: fieldData.helpText || '',
        validation: fieldData.validation || {},
        options: fieldData.options,
        order: fields.length,
        isVisible: true,
        isRequired: fieldData.isRequired || false
      };
      onChange([...fields, newField]);
    }
    setShowFieldDialog(false);
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    const newFields = [...fields];
    const [movedField] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, movedField);
    
    // Update order values
    newFields.forEach((field, index) => {
      field.order = index;
    });
    
    onChange(newFields);
  };

  const filteredFieldTypes = FIELD_TYPES.filter(ft => ft.category === fieldCategory);

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h6" gutterBottom>
        Configure Form Fields
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Add and customize the fields that users will fill out in your portal
      </Typography>

      {errors?.fields && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.fields}
        </Alert>
      )}

      {/* Current Fields */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Form Fields ({fields.length})</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddField}
              size="small"
            >
              Add Field
            </Button>
          </Box>

          {fields.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No fields configured yet. Click "Add Field" to get started.
              </Typography>
            </Box>
          ) : (
            <List>
              {fields
                .sort((a, b) => a.order - b.order)
                .map((field, index) => (
                  <ListItem
                    key={field.id}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      backgroundColor: 'background.paper'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                      <DragIcon color="action" />
                    </Box>

                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {field.label}
                          </Typography>
                          <Chip
                            label={field.type}
                            size="small"
                            variant="outlined"
                          />
                          {field.isRequired && (
                            <Chip
                              label="Required"
                              size="small"
                              color="primary"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Field name: {field.name}
                          </Typography>
                          {field.helpText && (
                            <Typography variant="body2" color="text.secondary">
                              Help: {field.helpText}
                            </Typography>
                          )}
                        </Box>
                      }
                    />

                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        onClick={() => handleEditField(field)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteField(field.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Field Editor Dialog */}
      <FieldEditorDialog
        open={showFieldDialog}
        field={editingField}
        onClose={() => setShowFieldDialog(false)}
        onSave={handleSaveField}
        fieldTypes={FIELD_TYPES}
      />
    </Box>
  );
};

// Field Editor Dialog Component
const FieldEditorDialog: React.FC<{
  open: boolean;
  field: PortalField | null;
  onClose: () => void;
  onSave: (field: Partial<PortalField>) => void;
  fieldTypes: typeof FIELD_TYPES;
}> = ({ open, field, onClose, onSave, fieldTypes }) => {
  const [fieldData, setFieldData] = useState<Partial<PortalField>>(
    field || {
      name: '',
      label: '',
      type: 'text',
      placeholder: '',
      helpText: '',
      isRequired: false,
      isVisible: true,
      validation: {},
      options: []
    }
  );

  React.useEffect(() => {
    if (field) {
      setFieldData(field);
    } else {
      setFieldData({
        name: '',
        label: '',
        type: 'text',
        placeholder: '',
        helpText: '',
        isRequired: false,
        isVisible: true,
        validation: {},
        options: []
      });
    }
  }, [field]);

  const handleSave = () => {
    if (!fieldData.name || !fieldData.label) {
      return;
    }
    onSave(fieldData);
  };

  const needsOptions = ['select', 'radio', 'checkbox', 'multi-select'].includes(fieldData.type || '');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {field ? 'Edit Field' : 'Add New Field'}
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Basic Settings */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Field Name"
              value={fieldData.name || ''}
              onChange={(e) => setFieldData(prev => ({ ...prev, name: e.target.value }))}
              helperText="Used internally and in API responses"
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Display Label"
              value={fieldData.label || ''}
              onChange={(e) => setFieldData(prev => ({ ...prev, label: e.target.value }))}
              helperText="Shown to users on the form"
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Field Type</InputLabel>
              <Select
                value={fieldData.type || 'text'}
                onChange={(e) => setFieldData(prev => ({ ...prev, type: e.target.value as FieldType }))}
                label="Field Type"
              >
                {fieldTypes.map((type) => (
                  <MenuItem key={type.type} value={type.type}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{type.icon}</span>
                      <Box>
                        <Typography>{type.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {type.description}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={fieldData.isRequired || false}
                    onChange={(e) => setFieldData(prev => ({ ...prev, isRequired: e.target.checked }))}
                  />
                }
                label="Required Field"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={fieldData.isVisible !== false}
                    onChange={(e) => setFieldData(prev => ({ ...prev, isVisible: e.target.checked }))}
                  />
                }
                label="Visible to Users"
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Placeholder Text"
              value={fieldData.placeholder || ''}
              onChange={(e) => setFieldData(prev => ({ ...prev, placeholder: e.target.value }))}
              helperText="Optional hint text shown in the input"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Help Text"
              value={fieldData.helpText || ''}
              onChange={(e) => setFieldData(prev => ({ ...prev, helpText: e.target.value }))}
              multiline
              rows={2}
              helperText="Additional guidance shown below the field"
            />
          </Grid>

          {/* Options for select/radio/checkbox fields */}
          {needsOptions && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Field Options
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure the available choices for this field
              </Typography>
              
              {/* Options editor would go here - simplified for now */}
              <Alert severity="info">
                Options configuration coming soon. For now, default options will be provided based on field type.
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!fieldData.name || !fieldData.label}
        >
          {field ? 'Update Field' : 'Add Field'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PortalFormBuilder;