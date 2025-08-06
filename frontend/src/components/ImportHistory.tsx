import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Collapse,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  History as HistoryIcon,
  Undo as RollbackIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface ImportRecord {
  id: number;
  importId: string;
  entityType: string;
  fileName: string | null;
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  status: string;
  errors: string[] | null;
  warnings: string[] | null;
  duplicates: string[] | null;
  canRollback: boolean;
  rolledBack: boolean;
  rolledBackAt: string | null;
  user: {
    id: number;
    name: string;
    email: string;
  };
  rolledBackBy?: {
    id: number;
    name: string;
    email: string;
  };
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  createdAt: string;
}

const ImportHistory: React.FC = () => {
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [rollbackDialog, setRollbackDialog] = useState<{
    open: boolean;
    importRecord: ImportRecord | null;
  }>({ open: false, importRecord: null });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [rollbackLoading, setRollbackLoading] = useState(false);

  useEffect(() => {
    loadImportHistory();
  }, []);

  const loadImportHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/import/history');
      const result = await response.json();
      
      if (result.success) {
        setImports(result.imports);
      } else {
        console.error('Failed to load import history:', result.error);
      }
    } catch (error) {
      console.error('Error loading import history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!rollbackDialog.importRecord) return;

    setRollbackLoading(true);
    try {
      const response = await fetch(`/api/import/rollback/${rollbackDialog.importRecord.importId}`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(result.result.message);
        loadImportHistory(); // Refresh the list
      } else {
        alert(`Rollback failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Rollback error:', error);
      alert('Rollback failed: Network error');
    } finally {
      setRollbackLoading(false);
      setRollbackDialog({ open: false, importRecord: null });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'partial': return 'warning';
      case 'in_progress': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <SuccessIcon fontSize="small" />;
      case 'failed': return <ErrorIcon fontSize="small" />;
      case 'partial': return <WarningIcon fontSize="small" />;
      case 'in_progress': return <InfoIcon fontSize="small" />;
      default: return <InfoIcon fontSize="small" />;
    }
  };

  const formatDuration = (durationMs: number | null) => {
    if (!durationMs) return 'Unknown';
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const toggleRowExpansion = (importId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(importId)) {
      newExpanded.delete(importId);
    } else {
      newExpanded.add(importId);
    }
    setExpandedRows(newExpanded);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Loading Import History...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <HistoryIcon sx={{ mr: 1 }} />
        <Typography variant="h5">
          Import History
        </Typography>
      </Box>

      {imports.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No import history found. Start importing data to see your history here.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="40px"></TableCell>
                <TableCell>Entity Type</TableCell>
                <TableCell>File Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Records</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Imported By</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {imports.map((importRecord) => (
                <React.Fragment key={importRecord.id}>
                  <TableRow>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => toggleRowExpansion(importRecord.importId)}
                      >
                        {expandedRows.has(importRecord.importId) ? 
                          <ExpandLessIcon /> : <ExpandMoreIcon />
                        }
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {importRecord.entityType.charAt(0).toUpperCase() + importRecord.entityType.slice(1)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {importRecord.fileName || 'Unknown'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(importRecord.status)}
                        label={importRecord.status}
                        color={getStatusColor(importRecord.status)}
                        size="small"
                      />
                      {importRecord.rolledBack && (
                        <Chip
                          label="Rolled Back"
                          color="secondary"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {importRecord.importedCount} / {importRecord.totalRows}
                      </Typography>
                      {importRecord.skippedCount > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          ({importRecord.skippedCount} skipped)
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDuration(importRecord.durationMs)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {importRecord.user.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(importRecord.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {importRecord.canRollback && !importRecord.rolledBack && (
                        <Tooltip title="Rollback Import">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => setRollbackDialog({ 
                              open: true, 
                              importRecord 
                            })}
                          >
                            <RollbackIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded row with details */}
                  <TableRow>
                    <TableCell colSpan={9} sx={{ py: 0 }}>
                      <Collapse in={expandedRows.has(importRecord.importId)}>
                        <Box sx={{ p: 2 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Typography variant="h6" gutterBottom>
                                    Import Details
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Import ID:</strong> {importRecord.importId}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Started:</strong> {formatDate(importRecord.startedAt)}
                                  </Typography>
                                  {importRecord.completedAt && (
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                      <strong>Completed:</strong> {formatDate(importRecord.completedAt)}
                                    </Typography>
                                  )}
                                  {importRecord.rolledBackAt && (
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                      <strong>Rolled Back:</strong> {formatDate(importRecord.rolledBackAt)}
                                      {importRecord.rolledBackBy && (
                                        <span> by {importRecord.rolledBackBy.name}</span>
                                      )}
                                    </Typography>
                                  )}
                                </CardContent>
                              </Card>
                            </Grid>
                            
                            {/* Errors and Warnings */}
                            <Grid item xs={12} md={6}>
                              {importRecord.errors && importRecord.errors.length > 0 && (
                                <Alert severity="error" sx={{ mb: 1 }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Errors ({importRecord.errors.length})
                                  </Typography>
                                  {importRecord.errors.slice(0, 3).map((error, index) => (
                                    <Typography key={index} variant="body2">
                                      • {error}
                                    </Typography>
                                  ))}
                                  {importRecord.errors.length > 3 && (
                                    <Typography variant="body2" color="text.secondary">
                                      ... and {importRecord.errors.length - 3} more
                                    </Typography>
                                  )}
                                </Alert>
                              )}
                              
                              {importRecord.duplicates && importRecord.duplicates.length > 0 && (
                                <Alert severity="warning" sx={{ mb: 1 }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Duplicates ({importRecord.duplicates.length})
                                  </Typography>
                                  {importRecord.duplicates.slice(0, 3).map((duplicate, index) => (
                                    <Typography key={index} variant="body2">
                                      • {duplicate}
                                    </Typography>
                                  ))}
                                  {importRecord.duplicates.length > 3 && (
                                    <Typography variant="body2" color="text.secondary">
                                      ... and {importRecord.duplicates.length - 3} more
                                    </Typography>
                                  )}
                                </Alert>
                              )}
                              
                              {(!importRecord.errors || importRecord.errors.length === 0) &&
                               (!importRecord.duplicates || importRecord.duplicates.length === 0) && (
                                <Alert severity="success">
                                  <Typography variant="body2">
                                    Import completed successfully with no errors or duplicates.
                                  </Typography>
                                </Alert>
                              )}
                            </Grid>
                          </Grid>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Rollback Confirmation Dialog */}
      <Dialog open={rollbackDialog.open} onClose={() => setRollbackDialog({ open: false, importRecord: null })}>
        <DialogTitle>Confirm Rollback</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. All records imported during this import will be permanently deleted.
          </Alert>
          {rollbackDialog.importRecord && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to rollback the following import?
              </Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                <strong>Import ID:</strong> {rollbackDialog.importRecord.importId}
              </Typography>
              <Typography variant="body2">
                <strong>Entity Type:</strong> {rollbackDialog.importRecord.entityType}
              </Typography>
              <Typography variant="body2">
                <strong>Records to Delete:</strong> {rollbackDialog.importRecord.importedCount}
              </Typography>
              <Typography variant="body2">
                <strong>Import Date:</strong> {formatDate(rollbackDialog.importRecord.createdAt)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setRollbackDialog({ open: false, importRecord: null })}
            disabled={rollbackLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRollback} 
            color="warning" 
            variant="contained"
            disabled={rollbackLoading}
          >
            {rollbackLoading ? 'Rolling Back...' : 'Rollback'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImportHistory;