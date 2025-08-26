import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  GetApp as DownloadIcon,
  Image as ImageIcon,
  AttachFile as FileIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Build as AssetIcon,
  Assignment as WorkOrderIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { uploadService } from '../services/uploadService';
import { apiClient } from '../services/api';

interface FileItem {
  id: string;
  filename: string;
  originalName?: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: string;
  uploadedBy: number;
  entityId: number;
  entityName: string;
  entityType: 'assets' | 'work-orders';
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`files-tabpanel-${index}`}
      aria-labelledby={`files-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Files() {
  const [tabValue, setTabValue] = useState(0);
  const [assetFiles, setAssetFiles] = useState<FileItem[]>([]);
  const [workOrderFiles, setWorkOrderFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading files from API...');

      // Try to fetch organization-wide files (admin only)
      try {
        console.log('Fetching asset files...');
        const assetResponse = await apiClient.get('/api/uploads/assets');
        console.log('Asset response raw:', assetResponse);
        
        // Handle different response formats from apiClient
        let assetFiles = [];
        if (assetResponse?.files && Array.isArray(assetResponse.files)) {
          assetFiles = assetResponse.files;
        } else if (assetResponse?.data?.files && Array.isArray(assetResponse.data.files)) {
          assetFiles = assetResponse.data.files;
        } else if (assetResponse?.success && assetResponse?.files) {
          assetFiles = assetResponse.files;
        } else if (assetResponse?.data?.success && assetResponse?.data?.files) {
          assetFiles = assetResponse.data.files;
        }
        
        console.log('Processed asset files:', assetFiles);
        setAssetFiles(assetFiles);

        console.log('Fetching work order files...');
        const workOrderResponse = await apiClient.get('/api/uploads/work-orders');
        console.log('Work order response raw:', workOrderResponse);
        
        // Handle different response formats from apiClient
        let workOrderFiles = [];
        if (workOrderResponse?.files && Array.isArray(workOrderResponse.files)) {
          workOrderFiles = workOrderResponse.files;
        } else if (workOrderResponse?.data?.files && Array.isArray(workOrderResponse.data.files)) {
          workOrderFiles = workOrderResponse.data.files;
        } else if (workOrderResponse?.success && workOrderResponse?.files) {
          workOrderFiles = workOrderResponse.files;
        } else if (workOrderResponse?.data?.success && workOrderResponse?.data?.files) {
          workOrderFiles = workOrderResponse.data.files;
        }
        
        console.log('Processed work order files:', workOrderFiles);
        setWorkOrderFiles(workOrderFiles);
        
      } catch (adminError: any) {
        console.error('Admin API error:', adminError);
        if (adminError.response?.status === 403) {
          // User is not admin, try to get files from their assigned assets/work orders
          console.log('Not admin, fetching files from user assignments...');
          
          try {
            // Get assets the user has access to
            const assetsResponse = await apiClient.get('/api/assets');
            const assets = assetsResponse.data || assetsResponse || [];
            
            // Get work orders assigned to the user
            const workOrdersResponse = await apiClient.get('/api/work-orders');
            const workOrders = workOrdersResponse.data || workOrdersResponse || [];
            
            // Extract files from assets
            const assetFilesList: FileItem[] = [];
            assets.forEach((asset: any) => {
              if (asset.attachments && Array.isArray(asset.attachments)) {
                asset.attachments.forEach((file: any) => {
                  assetFilesList.push({
                    ...file,
                    entityId: asset.id,
                    entityName: asset.name,
                    entityType: 'assets'
                  });
                });
              }
            });
            
            // Extract files from work orders
            const workOrderFilesList: FileItem[] = [];
            workOrders.forEach((workOrder: any) => {
              if (workOrder.attachments && Array.isArray(workOrder.attachments)) {
                workOrder.attachments.forEach((file: any) => {
                  workOrderFilesList.push({
                    ...file,
                    entityId: workOrder.id,
                    entityName: workOrder.title,
                    entityType: 'work-orders'
                  });
                });
              }
            });
            
            setAssetFiles(assetFilesList);
            setWorkOrderFiles(workOrderFilesList);
            
          } catch (userError) {
            console.error('Error fetching user files:', userError);
            setError('Failed to load your files. Please try again.');
          }
        } else {
          console.error('Non-403 admin error:', adminError);
          setError('Failed to load files. Please try again.');
        }
      }

    } catch (error: any) {
      console.error('Error loading files:', error);
      setError('Failed to load files. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePreviewFile = (file: FileItem) => {
    setPreviewFile(file);
  };

  const handleDeleteFile = async (file: FileItem) => {
    try {
      await apiClient.delete(`/api/uploads/${file.entityType}/${file.entityId}/${file.id}`);
      
      // Refresh the file lists
      if (file.entityType === 'assets') {
        setAssetFiles(prev => prev.filter(f => f.id !== file.id));
      } else {
        setWorkOrderFiles(prev => prev.filter(f => f.id !== file.id));
      }
      
      setPreviewFile(null);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isImageFile = (filename: string, mimetype: string) => {
    return mimetype?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
  };

  const filterFiles = (files: FileItem[]) => {
    return files.filter(file => {
      const matchesSearch = file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          file.entityName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || 
                         (filterType === 'images' && isImageFile(file.filename, file.mimetype)) ||
                         (filterType === 'documents' && !isImageFile(file.filename, file.mimetype));
      
      return matchesSearch && matchesType;
    });
  };

  const FileList = ({ files, emptyMessage }: { files: FileItem[], emptyMessage: string }) => {
    const filteredFiles = filterFiles(files);

    if (filteredFiles.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            {files.length === 0 ? emptyMessage : 'No files match your search criteria'}
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={2}>
        {filteredFiles.map((file) => (
          <Grid item xs={12} sm={6} md={4} key={file.id}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {isImageFile(file.filename, file.mimetype) ? (
                    <ImageIcon color="primary" />
                  ) : (
                    <FileIcon color="action" />
                  )}
                  <Typography variant="subtitle2" noWrap title={file.filename}>
                    {file.filename}
                  </Typography>
                  <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => handlePreviewFile(file)}>
                      <ViewIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" href={file.url} target="_blank">
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                
                {isImageFile(file.filename, file.mimetype) && (
                  <Box
                    component="img"
                    src={file.url}
                    alt={file.filename}
                    sx={{
                      width: '100%',
                      height: 120,
                      objectFit: 'cover',
                      borderRadius: 1,
                      mb: 1,
                      cursor: 'pointer',
                    }}
                    onClick={() => handlePreviewFile(file)}
                  />
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {file.entityType === 'assets' ? <AssetIcon fontSize="small" /> : <WorkOrderIcon fontSize="small" />}
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {file.entityName}
                  </Typography>
                </Box>

                <Typography variant="caption" color="text.secondary" display="block">
                  {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                </Typography>

                <Chip
                  size="small"
                  label={file.entityType === 'assets' ? 'Asset' : 'Work Order'}
                  color={file.entityType === 'assets' ? 'primary' : 'secondary'}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Organization Files
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search and Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search files by name or entity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>File Type</InputLabel>
                <Select
                  value={filterType}
                  label="File Type"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="all">All Files</MenuItem>
                  <MenuItem value="images">Images</MenuItem>
                  <MenuItem value="documents">Documents</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={loadFiles}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* File Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label={`Asset Files (${assetFiles.length})`} />
            <Tab label={`Work Order Files (${workOrderFiles.length})`} />
            <Tab label={`All Files (${assetFiles.length + workOrderFiles.length})`} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <FileList files={assetFiles} emptyMessage="No asset files found" />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <FileList files={workOrderFiles} emptyMessage="No work order files found" />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <FileList files={[...assetFiles, ...workOrderFiles]} emptyMessage="No files found" />
        </TabPanel>
      </Card>

      {/* File Preview Dialog */}
      <Dialog 
        open={!!previewFile} 
        onClose={() => setPreviewFile(null)}
        maxWidth="md"
        fullWidth
      >
        {previewFile && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isImageFile(previewFile.filename, previewFile.mimetype) ? (
                  <ImageIcon />
                ) : (
                  <FileIcon />
                )}
                {previewFile.filename}
              </Box>
            </DialogTitle>
            <DialogContent>
              {isImageFile(previewFile.filename, previewFile.mimetype) ? (
                <Box
                  component="img"
                  src={previewFile.url}
                  alt={previewFile.filename}
                  sx={{ width: '100%', height: 'auto', borderRadius: 1 }}
                />
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <FileIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6">{previewFile.filename}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {formatFileSize(previewFile.size)} • {previewFile.mimetype}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>File Details</Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Associated Entity" 
                      secondary={`${previewFile.entityName} (${previewFile.entityType})`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Upload Date" 
                      secondary={formatDate(previewFile.uploadedAt)} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="File Size" 
                      secondary={formatFileSize(previewFile.size)} 
                    />
                  </ListItem>
                </List>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button 
                startIcon={<DeleteIcon />} 
                color="error"
                onClick={() => handleDeleteFile(previewFile)}
              >
                Delete
              </Button>
              <Button 
                startIcon={<DownloadIcon />} 
                href={previewFile.url} 
                target="_blank"
              >
                Download
              </Button>
              <Button onClick={() => setPreviewFile(null)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
}