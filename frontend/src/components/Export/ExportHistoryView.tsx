/**
 * Export History View
 * Display and manage export history and status
 */

import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Typography,
  Chip,
  IconButton,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Autorenew as ProcessingIcon,
  AccessTime as ExpiredIcon,
} from '@mui/icons-material';

import { type ExportHistory } from '../../services/exportService';

interface ExportHistoryProps {
  history: ExportHistory[];
  onAction: (action: string, historyId: string) => void;
  loading: boolean;
}

interface HistoryRowProps {
  item: ExportHistory;
  onAction: (action: string, historyId: string) => void;
}

function HistoryRow({ item, onAction }: HistoryRowProps) {
  const _theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: string) => {
    onAction(action, item.id);
    handleMenuClose();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <SuccessIcon sx={{ color: 'success.main' }} />;
      case 'processing': return <ProcessingIcon sx={{ color: 'primary.main' }} />;
      case 'pending': return <PendingIcon sx={{ color: 'warning.main' }} />;
      case 'failed': return <ErrorIcon sx={{ color: 'error.main' }} />;
      case 'cancelled': return <CancelIcon sx={{ color: 'action.disabled' }} />;
      case 'expired': return <ExpiredIcon sx={{ color: 'text.disabled' }} />;
      default: return <InfoIcon />;
    }
  };

  const getStatusChipColor = (status: string): 'success' | 'primary' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'primary';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '-';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDuration = (ms?: number): string => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes > 0 ? `${diffMinutes} min ago` : 'Just now';
    }
  };

  const canDownload = item.status === 'completed' && item.filePath;
  const canRetry = item.status === 'failed' || item.status === 'cancelled';
  const canCancel = item.status === 'pending' || item.status === 'processing';

  return (
    <>
      <TableRow hover>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getStatusIcon(item.status)}
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {item.templateName}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                ID: {item.id.slice(0, 8)}...
              </Typography>
            </Box>
          </Box>
        </TableCell>

        <TableCell>
          <Chip
            label={item.status.toUpperCase()}
            size="small"
            color={getStatusChipColor(item.status)}
            variant="outlined"
          />
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {item.outputFormat === 'csv' ? '📊' : 
             item.outputFormat === 'excel' ? '📗' :
             item.outputFormat === 'pdf' ? '📄' :
             item.outputFormat === 'json' ? '📝' : '📁'}
            <Typography variant="body2">
              {item.outputFormat.toUpperCase()}
            </Typography>
          </Box>
        </TableCell>

        <TableCell>
          <Typography variant="body2">
            {item.recordCount ? item.recordCount.toLocaleString() : '-'}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2">
            {formatFileSize(item.fileSize)}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2">
            {formatDuration(item.executionTimeMs)}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2">
            {formatDate(item.startedAt)}
          </Typography>
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {canDownload && (
              <Tooltip title="Download">
                <IconButton
                  size="small"
                  onClick={() => handleAction('download')}
                  color="primary"
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            )}
            
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreIcon />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{ sx: { minWidth: 160 } }}
      >
        <MenuItem onClick={() => setDetailsOpen(true)}>
          <ListItemIcon><InfoIcon /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>

        {canDownload && (
          <MenuItem onClick={() => handleAction('download')}>
            <ListItemIcon><DownloadIcon /></ListItemIcon>
            <ListItemText>Download</ListItemText>
          </MenuItem>
        )}

        {canRetry && (
          <MenuItem onClick={() => handleAction('retry')}>
            <ListItemIcon><RefreshIcon /></ListItemIcon>
            <ListItemText>Retry</ListItemText>
          </MenuItem>
        )}

        {canCancel && (
          <MenuItem onClick={() => handleAction('cancel')}>
            <ListItemIcon><CancelIcon /></ListItemIcon>
            <ListItemText>Cancel</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Export Details
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Basic Information
              </Typography>
              <Typography variant="body2"><strong>Template:</strong> {item.templateName}</Typography>
              <Typography variant="body2"><strong>Type:</strong> {item.exportType}</Typography>
              <Typography variant="body2"><strong>Format:</strong> {item.outputFormat.toUpperCase()}</Typography>
              <Typography variant="body2"><strong>Status:</strong> {item.status}</Typography>
              <Typography variant="body2"><strong>File Name:</strong> {item.fileName || 'N/A'}</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Performance Metrics
              </Typography>
              <Typography variant="body2"><strong>Records:</strong> {item.recordCount?.toLocaleString() || 'N/A'}</Typography>
              <Typography variant="body2"><strong>File Size:</strong> {formatFileSize(item.fileSize)}</Typography>
              <Typography variant="body2"><strong>Duration:</strong> {formatDuration(item.executionTimeMs)}</Typography>
              <Typography variant="body2"><strong>Retries:</strong> {item.retryCount}</Typography>
              <Typography variant="body2"><strong>Downloads:</strong> {item.downloadCount}</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Timestamps
              </Typography>
              <Typography variant="body2"><strong>Started:</strong> {new Date(item.startedAt).toLocaleString()}</Typography>
              {item.completedAt && (
                <Typography variant="body2"><strong>Completed:</strong> {new Date(item.completedAt).toLocaleString()}</Typography>
              )}
              {item.expiresAt && (
                <Typography variant="body2"><strong>Expires:</strong> {new Date(item.expiresAt).toLocaleString()}</Typography>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Quality & Compliance
              </Typography>
              <Typography variant="body2">
                <strong>Compliance Validated:</strong> {item.complianceValidated ? 'Yes' : 'No'}
              </Typography>
              {item.dataIntegrityHash && (
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                  <strong>Data Hash:</strong> {item.dataIntegrityHash.slice(0, 16)}...
                </Typography>
              )}
            </Box>

            {item.errorMessage && (
              <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                <Typography variant="subtitle2" gutterBottom color="error">
                  Error Details
                </Typography>
                <Typography variant="body2" color="error">
                  {item.errorMessage}
                </Typography>
                {item.errorCode && (
                  <Typography variant="caption" color="error">
                    Error Code: {item.errorCode}
                  </Typography>
                )}
              </Box>
            )}

            {Object.keys(item.filtersApplied).length > 0 && (
              <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                <Typography variant="subtitle2" gutterBottom>
                  Applied Filters
                </Typography>
                <Box component="pre" sx={{ fontSize: '0.75rem', backgroundColor: 'grey.100', p: 1, borderRadius: 1 }}>
                  {JSON.stringify(item.filtersApplied, null, 2)}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {canDownload && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => {
                handleAction('download');
                setDetailsOpen(false);
              }}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function ExportHistoryView({ history, onAction, loading }: ExportHistoryProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesFormat = formatFilter === 'all' || item.outputFormat === formatFilter;

    return matchesSearch && matchesStatus && matchesFormat;
  });

  const paginatedHistory = filteredHistory.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'completed', label: 'Completed' },
    { value: 'processing', label: 'Processing' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'expired', label: 'Expired' },
  ];

  const formatOptions = [
    { value: 'all', label: 'All Formats' },
    { value: 'csv', label: 'CSV' },
    { value: 'excel', label: 'Excel' },
    { value: 'pdf', label: 'PDF' },
    { value: 'json', label: 'JSON' },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <Typography>Loading export history...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' }, gap: 2, alignItems: 'center' }}>
          <Box>
            <TextField
              fullWidth
              placeholder="Search exports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Box>
          
          <Box>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Box>
            <FormControl fullWidth size="small">
              <InputLabel>Format</InputLabel>
              <Select
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value)}
                label="Format"
              >
                {formatOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>

      {/* Results Summary */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="textSecondary">
          {filteredHistory.length} of {history.length} exports
          {searchTerm && ` matching "${searchTerm}"`}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            icon={<ProcessingIcon />}
            label={`${history.filter(h => h.status === 'processing').length} processing`}
            size="small"
            variant="outlined"
            color="primary"
          />
          <Chip
            icon={<SuccessIcon />}
            label={`${history.filter(h => h.status === 'completed').length} completed`}
            size="small"
            variant="outlined"
            color="success"
          />
        </Box>
      </Box>

      {/* Table */}
      <Paper sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {filteredHistory.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No exports found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {searchTerm ? 'Try adjusting your search terms or filters' : 'Export history will appear here'}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 400px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Template</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Format</TableCell>
                    <TableCell>Records</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedHistory.map((item) => (
                    <HistoryRow
                      key={item.id}
                      item={item}
                      onAction={onAction}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={filteredHistory.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}