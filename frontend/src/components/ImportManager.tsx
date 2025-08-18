
import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  SelectChangeEvent
} from '@mui/material';
import { LoadingBar, LoadingSpinner, LoadingButton } from './Loading';
import {
  Upload as UploadIcon,
  CloudUpload as CloudUploadIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Visibility as PreviewIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import Papa, { ParseResult } from 'papaparse';
import Fuse from 'fuse.js';

interface ParsedCSVData {
  data: Record<string, any>[];
  headers: string[];
  fileName: string;
  totalRows: number;
}

interface ColumnMapping {
  csvColumn: string;
  targetField: string;
  confidence: number;
  required: boolean;
}

interface EntityTypeConfig {
  label: string;
  value: string;
  fields: Array<{
    key: string;
    label: string;
    required: boolean;
    type: 'string' | 'number' | 'date' | 'enum';
    enumValues?: string[];
  }>;
}

const ImportManager = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [csvData, setCsvData] = useState<ParsedCSVData | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<string>('');
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Entity type configurations based on your Prisma schema
  const entityTypes: EntityTypeConfig[] = [
    {
      label: 'Assets',
      value: 'assets',
      fields: [
        { key: 'name', label: 'Name', required: true, type: 'string' },
        { key: 'description', label: 'Description', required: false, type: 'string' },
        { key: 'serialNumber', label: 'Serial Number', required: false, type: 'string' },
        { key: 'modelNumber', label: 'Model', required: false, type: 'string' },
        { key: 'manufacturer', label: 'Manufacturer', required: false, type: 'string' },
        { key: 'year', label: 'Year', required: false, type: 'number' },
        { key: 'status', label: 'Status', required: false, type: 'enum', enumValues: ['ONLINE', 'OFFLINE'] },
        { key: 'criticality', label: 'Criticality', required: false, type: 'enum', enumValues: ['LOW', 'MEDIUM', 'HIGH', 'IMPORTANT'] },
        { key: 'barcode', label: 'Barcode', required: false, type: 'string' },
        { key: 'location', label: 'Location', required: true, type: 'string' }
      ]
    },
    {
      label: 'Work Orders',
      value: 'workorders',
      fields: [
        { key: 'title', label: 'Title', required: true, type: 'string' },
        { key: 'description', label: 'Description', required: false, type: 'string' },
        { key: 'status', label: 'Status', required: false, type: 'enum', enumValues: ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELED'] },
        { key: 'priority', label: 'Priority', required: false, type: 'enum', enumValues: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
        { key: 'workType', label: 'Work Type', required: false, type: 'string' },
        { key: 'recurrence', label: 'Recurrence', required: false, type: 'string' },
        { key: 'assetName', label: 'Asset', required: false, type: 'string' },
        { key: 'locationName', label: 'Location', required: false, type: 'string' },
        { key: 'assignedTo', label: 'Assigned to', required: false, type: 'string' },
        { key: 'requestedBy', label: 'Requested by', required: false, type: 'string' },
        { key: 'createdBy', label: 'Created by', required: false, type: 'string' },
        { key: 'estimatedTime', label: 'Estimated Time', required: false, type: 'string' },
        { key: 'dueDate', label: 'Due date', required: false, type: 'date' },
        { key: 'plannedStartDate', label: 'Planned Start Date', required: false, type: 'date' }
      ]
    },
    {
      label: 'Users',
      value: 'users',
      fields: [
        { key: 'name', label: 'Full Name', required: true, type: 'string' },
        { key: 'email', label: 'Email', required: true, type: 'string' },
        { key: 'role', label: 'Role', required: false, type: 'enum', enumValues: ['ADMIN', 'MANAGER', 'TECHNICIAN'] }
      ]
    },
    {
      label: 'Locations',
      value: 'locations',
      fields: [
        { key: 'name', label: 'Name', required: true, type: 'string' },
        { key: 'description', label: 'Description', required: false, type: 'string' },
        { key: 'address', label: 'Address', required: false, type: 'string' },
        { key: 'parent', label: 'Parent', required: false, type: 'string' },
        { key: 'barcode', label: 'QR/Bar code', required: false, type: 'string' }
      ]
    },
    {
      label: 'Parts',
      value: 'parts',
      fields: [
        { key: 'name', label: 'Name', required: true, type: 'string' },
        { key: 'description', label: 'Description', required: false, type: 'string' },
        { key: 'sku', label: 'Part Numbers', required: false, type: 'string' },
        { key: 'stockLevel', label: 'Quantity in Stock', required: false, type: 'number' },
        { key: 'reorderPoint', label: 'Minimum Quantity', required: false, type: 'number' },
        { key: 'location', label: 'Location', required: false, type: 'string' },
        { key: 'unitCost', label: 'Unit Cost', required: false, type: 'number' }
      ]
    },
    {
      label: 'Suppliers',
      value: 'suppliers',
      fields: [
        { key: 'name', label: 'Vendor', required: true, type: 'string' },
        { key: 'contactInfo', label: 'Contact Name', required: false, type: 'string' },
        { key: 'address', label: 'Description', required: false, type: 'string' },
        { key: 'phone', label: 'Phone Number', required: false, type: 'string' },
        { key: 'email', label: 'Email', required: false, type: 'string' }
      ]
    }
  ];

  const currentEntityConfig = useMemo(() => 
    entityTypes.find(type => type.value === selectedEntityType),
    [selectedEntityType]
  );

  // Smart column mapping using fuzzy search
  const generateColumnMappings = (csvHeaders: string[], entityFields: EntityTypeConfig['fields']) => {
    const fuse = new Fuse(entityFields, {
      keys: ['key', 'label'],
      threshold: 0.3, // Stricter threshold for better matches
      includeScore: true
    });

    return csvHeaders.map(csvColumn => {
      const searchResults = fuse.search(csvColumn);
      if (searchResults.length > 0) {
        const bestMatch = searchResults[0];
        const confidence = Math.round((1 - (bestMatch.score || 0)) * 100);
        
        // Only auto-assign if confidence is 100% (perfect match)
        const shouldAutoAssign = confidence >= 100;
        
        return {
          csvColumn,
          targetField: shouldAutoAssign ? bestMatch.item.key : '',
          confidence,
          required: bestMatch.item.required
        };
      }
      return {
        csvColumn,
        targetField: '',
        confidence: 0,
        required: false
      };
    });
  };

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: ParseResult<Record<string, any>>) => {
        const headers = results.meta.fields || [];
        setCsvData({
          data: results.data,
          headers,
          fileName: file.name,
          totalRows: results.data.length
        });
        setActiveTab(1); // Move to mapping step
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
      }
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleEntityTypeChange = (event: SelectChangeEvent<string>) => {
    const entityType = event.target.value;
    setSelectedEntityType(entityType);
    
    if (csvData && entityType) {
      const entityConfig = entityTypes.find(type => type.value === entityType);
      if (entityConfig) {
        const mappings = generateColumnMappings(csvData.headers, entityConfig.fields);
        setColumnMappings(mappings);
      }
    }
  };

  const handleMappingChange = (csvColumn: string, targetField: string) => {
    setColumnMappings(prev => prev.map(mapping => 
      mapping.csvColumn === csvColumn 
        ? { ...mapping, targetField, confidence: targetField ? 100 : 0 }
        : mapping
    ));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'warning';
    return 'error';
  };

  const getMappedFieldsCount = () => {
    return columnMappings.filter(mapping => mapping.targetField).length;
  };

  const getRequiredFieldsCount = () => {
    if (!currentEntityConfig) return 0;
    return currentEntityConfig.fields.filter(field => field.required).length;
  };

  const getMappedRequiredFields = () => {
    if (!currentEntityConfig) return 0;
    const requiredFields = currentEntityConfig.fields.filter(field => field.required);
    return requiredFields.filter(field => 
      columnMappings.some(mapping => mapping.targetField === field.key)
    ).length;
  };

  const canProceedToReview = () => {
    return selectedEntityType && 
           getMappedRequiredFields() === getRequiredFieldsCount() &&
           getMappedFieldsCount() > 0;
  };

  const handleImport = async () => {
    if (!csvData || !currentEntityConfig) return;
    
    setIsImporting(true);
    try {
      // Get authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // Send import request to backend
      const response = await fetch('/api/import/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          entityType: selectedEntityType,
          csvData: csvData.data,
          mappings: columnMappings
        })
      });

      console.log('Import response status:', response.status);
      console.log('Import response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Import request failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        if (response.status === 413) {
          throw new Error('Import file is too large. Please try with a smaller CSV file or contact your administrator.');
        } else if (response.status >= 400) {
          throw new Error(`Server error (${response.status}): ${response.statusText}`);
        }
      }
      
      const result = await response.json();
      console.log('Import response data:', result);
      
      if (result.success) {
        let successMessage = `Import completed successfully! ${result.importedCount} records imported.${result.skippedCount > 0 ? ` (${result.skippedCount} skipped)` : ''}`;
        
        // Add PM conversion summary if available
        if (result.pmConversionSummary) {
          successMessage += `\n\n${result.pmConversionSummary}`;
        }
        
        alert(successMessage);
        
        // Reset state after successful import
        setCsvData(null);
        setColumnMappings([]);
        setSelectedEntityType('');
        setActiveTab(0);
      } else {
        // Show detailed error information
        let errorMessage = 'Import failed';
        if (result.errors && result.errors.length > 0) {
          errorMessage += `:\n• ${result.errors.slice(0, 3).join('\n• ')}`;
          if (result.errors.length > 3) {
            errorMessage += `\n• ... and ${result.errors.length - 3} more errors`;
          }
        }
        
        if (result.duplicates && result.duplicates.length > 0) {
          errorMessage += `\n\nDuplicates found:\n• ${result.duplicates.slice(0, 3).join('\n• ')}`;
          if (result.duplicates.length > 3) {
            errorMessage += `\n• ... and ${result.duplicates.length - 3} more duplicates`;
          }
        }
        
        if (result.importedCount > 0) {
          errorMessage += `\n\nPartially successful: ${result.importedCount} records were imported before errors occurred.`;
        }
        
        alert(errorMessage);
        console.error('Import failed with details:', result);
      }
      
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed: Network error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        CSV Import Manager
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Import data from CSV files with intelligent column mapping and data validation.
      </Typography>
      
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab 
          label="Upload File" 
          icon={<UploadIcon />}
        />
        <Tab 
          label="Map Columns" 
          disabled={!csvData}
          icon={<RefreshIcon />}
        />
        <Tab 
          label="Review & Import" 
          disabled={!canProceedToReview()}
          icon={<CheckCircleIcon />}
        />
      </Tabs>

      {/* Upload Tab */}
      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Box 
              {...getRootProps()} 
              sx={{
                border: 2,
                borderStyle: 'dashed',
                borderColor: isDragActive ? 'primary.main' : 'grey.300',
                borderRadius: 2,
                p: 6,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: isDragActive ? 'primary.light' : 'background.default',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'primary.light'
                }
              }}
            >
              <input {...getInputProps()} />
              <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {isDragActive ? 'Drop your CSV file here' : 'Upload CSV File'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Drag and drop a CSV file here, or click to browse files
              </Typography>
              <Button variant="outlined" sx={{ mt: 2 }}>
                Choose File
              </Button>
            </Box>

            {csvData && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Successfully loaded <strong>{csvData.fileName}</strong> with {csvData.totalRows} rows and {csvData.headers.length} columns.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Column Mapping Tab */}
      {activeTab === 1 && csvData && (
        <Grid container spacing={3}>
          <Grid xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Select Data Type
                </Typography>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Entity Type</InputLabel>
                  <Select
                    value={selectedEntityType}
                    onChange={handleEntityTypeChange}
                    label="Entity Type"
                  >
                    {entityTypes.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedEntityType && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Chip 
                        label={`${csvData.headers.length} CSV Columns`} 
                        color="info" 
                      />
                      <Chip 
                        label={`${getMappedFieldsCount()} Mapped`} 
                        color="primary" 
                      />
                      <Chip 
                        label={`${getMappedRequiredFields()}/${getRequiredFieldsCount()} Required Fields`} 
                        color={getMappedRequiredFields() === getRequiredFieldsCount() ? 'success' : 'error'} 
                      />
                    </Box>

                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>CSV Column</TableCell>
                            <TableCell>Map To Field</TableCell>
                            <TableCell>Confidence</TableCell>
                            <TableCell>Sample Data</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {columnMappings.map(mapping => (
                            <TableRow key={mapping.csvColumn}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {mapping.csvColumn}
                                </Typography>
                                {mapping.required && (
                                  <Chip label="Required" size="small" color="error" sx={{ mt: 0.5 }} />
                                )}
                              </TableCell>
                              <TableCell>
                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                  <Select
                                    value={mapping.targetField}
                                    onChange={(e) => handleMappingChange(mapping.csvColumn, e.target.value)}
                                    displayEmpty
                                  >
                                    <MenuItem value="">
                                      <em>Don't import</em>
                                    </MenuItem>
                                    {currentEntityConfig?.fields.map(field => (
                                      <MenuItem key={field.key} value={field.key}>
                                        {field.label} {field.required && '*'}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </TableCell>
                              <TableCell>
                                {mapping.targetField && (
                                  <Chip 
                                    label={`${mapping.confidence}%`}
                                    size="small"
                                    color={getConfidenceColor(mapping.confidence)}
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {csvData.data[0]?.[mapping.csvColumn] || '-'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Review & Import Tab */}
      {activeTab === 2 && csvData && canProceedToReview() && (
        <Grid container spacing={3}>
          <Grid xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Ready to Import
                  </Typography>
                  <Button
                    startIcon={<PreviewIcon />}
                    onClick={() => setPreviewDialogOpen(true)}
                    variant="outlined"
                  >
                    Preview Data
                  </Button>
                </Box>

                <Alert severity="info" sx={{ mb: 2 }}>
                  You are about to import {csvData.totalRows} {currentEntityConfig?.label.toLowerCase()} records.
                  {selectedEntityType === 'workorders' && (
                    <Box sx={{ mt: 1, fontWeight: 'medium' }}>
                      📋 Smart PM Detection: Work orders with Work Type = "PREVENTIVE" will be automatically converted to PM tasks and schedules. REACTIVE work orders will remain as regular work orders.
                    </Box>
                  )}
                </Alert>

                {isImporting && (
                  <Box sx={{ mb: 2 }}>
                    <LoadingBar progress={undefined} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Importing data, please wait...
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleImport}
                    disabled={isImporting}
                    size="large"
                  >
                    Import Data
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setActiveTab(1)}
                    disabled={isImporting}
                  >
                    Back to Mapping
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Data Preview</DialogTitle>
        <DialogContent>
          {csvData && (
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {columnMappings
                      .filter(mapping => mapping.targetField)
                      .map(mapping => (
                        <TableCell key={mapping.csvColumn}>
                          {mapping.csvColumn} → {mapping.targetField}
                        </TableCell>
                      ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {csvData.data.slice(0, 10).map((row, index) => (
                    <TableRow key={index}>
                      {columnMappings
                        .filter(mapping => mapping.targetField)
                        .map(mapping => (
                          <TableCell key={mapping.csvColumn}>
                            {row[mapping.csvColumn] || '-'}
                          </TableCell>
                        ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImportManager;
