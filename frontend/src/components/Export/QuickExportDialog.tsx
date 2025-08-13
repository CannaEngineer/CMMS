/**
 * Quick Export Dialog
 * Simple interface for one-off exports without creating templates
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  Grid,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  TableChart as CsvIcon,
  GridOn as ExcelIcon,
  PictureAsPdf as PdfIcon,
  Code as JsonIcon,
  FilterList as FilterIcon,
  DateRange as DateIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';

import { exportService, ExportRequest } from '../../services/exportService';

interface QuickExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport?: (request: ExportRequest) => void;
  preselectedData?: any[];
  defaultDataSource?: string;
  entityType?: string;
  entityId?: string;
}

interface DataSourceInfo {
  id: string;
  name: string;
  description: string;
  tables: string[];
}

interface ColumnInfo {
  name: string;
  type: string;
  description?: string;
  selected: boolean;
}

const formatOptions = [
  { value: 'csv', label: 'CSV', icon: <CsvIcon />, description: 'Comma-separated values' },
  { value: 'excel', label: 'Excel', icon: <ExcelIcon />, description: 'Microsoft Excel spreadsheet' },
  { value: 'pdf', label: 'PDF', icon: <PdfIcon />, description: 'Portable document format' },
  { value: 'json', label: 'JSON', icon: <JsonIcon />, description: 'JavaScript object notation' },
];

export default function QuickExportDialog({ 
  open, 
  onClose, 
  onExport, 
  preselectedData = [], 
  defaultDataSource = '', 
  entityType = '', 
  entityId = '' 
}: QuickExportDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Form state
  const [dataSource, setDataSource] = useState(defaultDataSource);
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf' | 'json'>('csv');
  const [fileName, setFileName] = useState('');
  const [dateRange, setDateRange] = useState<{
    start: Dayjs | null;
    end: Dayjs | null;
  }>({
    start: dayjs().subtract(30, 'day'),
    end: dayjs(),
  });
  const [searchFilter, setSearchFilter] = useState('');
  const [emailRecipients, setEmailRecipients] = useState('');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [maxRecords, setMaxRecords] = useState(10000);

  // Data
  const [dataSources, setDataSources] = useState<DataSourceInfo[]>([]);
  const [availableColumns, setAvailableColumns] = useState<ColumnInfo[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data sources on mount
  useEffect(() => {
    if (open) {
      loadDataSources();
    }
  }, [open]);

  // Load columns when data source changes
  useEffect(() => {
    if (dataSource) {
      loadColumns();
      generateFileName();
    }
  }, [dataSource, format]);

  const loadDataSources = async () => {
    try {
      const sources = await exportService.getDataSources();
      setDataSources(sources);
    } catch (err) {
      setError('Failed to load data sources');
    }
  };

  const loadColumns = async () => {
    if (!dataSource) return;
    
    try {
      const schema = await exportService.getDataSourceSchema(dataSource);
      const columns: ColumnInfo[] = [];
      
      schema.tables.forEach(table => {
        table.columns.forEach(column => {
          columns.push({
            name: `${table.name}.${column.name}`,
            type: column.type,
            description: column.description,
            selected: ['id', 'name', 'title', 'status', 'created_at'].some(common => 
              column.name.toLowerCase().includes(common)
            ),
          });
        });
      });
      
      setAvailableColumns(columns);
      setSelectedColumns(columns.filter(c => c.selected).map(c => c.name));
    } catch (err) {
      console.error('Failed to load columns:', err);
    }
  };

  const generateFileName = () => {
    if (!dataSource) return;
    
    const timestamp = dayjs().format('YYYY_MM_DD_HHmm');
    const sourceName = dataSources.find(s => s.id === dataSource)?.name?.toLowerCase().replace(/\s+/g, '_') || dataSource;
    setFileName(`${sourceName}_export_${timestamp}`);
  };

  const handleDataSourceChange = (value: string) => {
    setDataSource(value);
    setSelectedColumns([]);
  };

  const handleColumnToggle = (columnName: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnName)
        ? prev.filter(col => col !== columnName)
        : [...prev, columnName]
    );
  };

  const handleSelectAllColumns = () => {
    if (selectedColumns.length === availableColumns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(availableColumns.map(col => col.name));
    }
  };

  const handleExport = async () => {
    if (!dataSource || selectedColumns.length === 0) {
      setError('Please select a data source and at least one column');
      return;
    }

    const filters: Record<string, any> = {};
    
    // Add date range filter
    if (dateRange.start && dateRange.end) {
      filters.dateRange = {
        start: dateRange.start.format('YYYY-MM-DD'),
        end: dateRange.end.format('YYYY-MM-DD'),
      };
    }
    
    // Add search filter
    if (searchFilter.trim()) {
      filters.search = searchFilter.trim();
    }

    const request: ExportRequest = {
      dataSource,
      format,
      config: {
        columns: selectedColumns,
        filters,
        maxRecords,
        includeHeaders,
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      fileName: fileName || undefined,
      emailRecipients: emailRecipients ? emailRecipients.split(',').map(email => email.trim()) : undefined,
      priority: 5, // Normal priority
      preselectedData: preselectedData.length > 0 ? preselectedData : undefined,
    };

    if (onExport) {
      onExport(request);
    } else {
      // If no onExport handler, execute the export directly
      try {
        setLoading(true);
        await exportService.requestExport(request);
        handleClose();
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Export failed');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    // Reset form
    setDataSource(defaultDataSource);
    setFormat('csv');
    setFileName('');
    setDateRange({
      start: dayjs().subtract(30, 'day'),
      end: dayjs(),
    });
    setSearchFilter('');
    setEmailRecipients('');
    setSelectedColumns([]);
    setError(null);
    
    onClose();
  };

  const getFormatIcon = (formatValue: string) => {
    const option = formatOptions.find(opt => opt.value === formatValue);
    return option?.icon || <CsvIcon />;
  };

  const selectedDataSource = dataSources.find(s => s.id === dataSource);
  const isValid = dataSource && selectedColumns.length > 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { height: isMobile ? '100%' : '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getFormatIcon(format)}
            <Typography variant="h6">Quick Export</Typography>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Data Source Selection */}
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Data Source
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Select Data Source</InputLabel>
              <Select
                value={dataSource}
                onChange={(e) => handleDataSourceChange(e.target.value)}
                label="Select Data Source"
              >
                {dataSources.map((source) => (
                  <MenuItem key={source.id} value={source.id}>
                    <Box>
                      <Typography variant="body1">{source.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {source.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {selectedDataSource && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  Tables: {selectedDataSource.tables.join(', ')}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Format and File Settings */}
          <Grid container spacing={2}>
            <Grid xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Output Format
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Format</InputLabel>
                <Select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  label="Format"
                >
                  {formatOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {option.icon}
                        <Box>
                          <Typography variant="body1">{option.label}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {option.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                File Name
              </Typography>
              <TextField
                fullWidth
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Leave empty for auto-generated name"
                helperText={`File extension (.${format}) will be added automatically`}
              />
            </Grid>
          </Grid>

          {/* Filters */}
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              <FilterIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Filters
            </Typography>
            
            <Grid container spacing={2}>
              <Grid xs={12} md={6}>
                <DatePicker
                  label="Start Date"
                  value={dateRange.start}
                  onChange={(value) => setDateRange(prev => ({ ...prev, start: value }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              
              <Grid xs={12} md={6}>
                <DatePicker
                  label="End Date"
                  value={dateRange.end}
                  onChange={(value) => setDateRange(prev => ({ ...prev, end: value }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              
              <Grid xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Search Filter"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search in text fields"
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Grid>
              
              <Grid xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Max Records"
                  type="number"
                  value={maxRecords}
                  onChange={(e) => setMaxRecords(Number(e.target.value))}
                  inputProps={{ min: 1, max: 100000 }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Column Selection */}
          {availableColumns.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Columns ({selectedColumns.length} selected)
                </Typography>
                <Button
                  size="small"
                  onClick={handleSelectAllColumns}
                  variant="outlined"
                >
                  {selectedColumns.length === availableColumns.length ? 'Deselect All' : 'Select All'}
                </Button>
              </Box>
              
              <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
                <List dense>
                  {availableColumns.map((column, index) => [
                    <ListItem
                      key={column.name}
                      onClick={() => handleColumnToggle(column.name)}
                      dense
                      sx={{ cursor: 'pointer' }}
                    >
                      <ListItemIcon>
                        <Checkbox
                          checked={selectedColumns.includes(column.name)}
                          tabIndex={-1}
                          disableRipple
                          size="small"
                        />
                      </ListItemIcon>
                      <Box sx={{ flex: 1 }}>
                        <ListItemText
                          primary={column.name}
                          secondary={column.description}
                        />
                        <Box sx={{ mt: 0.5 }}>
                          <Chip label={column.type} size="small" variant="outlined" />
                        </Box>
                      </Box>
                    </ListItem>,
                    index < availableColumns.length - 1 && <Divider key={`divider-${column.name}`} />
                  ]).flat().filter(Boolean)}
                </List>
              </Paper>
            </Box>
          )}

          {/* Email Settings */}
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Email Delivery (Optional)
            </Typography>
            <TextField
              fullWidth
              label="Email Recipients"
              value={emailRecipients}
              onChange={(e) => setEmailRecipients(e.target.value)}
              placeholder="email1@example.com, email2@example.com"
              helperText="Comma-separated email addresses"
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleExport}
            disabled={!isValid || loading}
            startIcon={loading ? <CircularProgress size={20} /> : getFormatIcon(format)}
          >
            {loading ? 'Starting Export...' : 'Start Export'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}