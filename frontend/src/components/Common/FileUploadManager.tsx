import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  IconButton,
  Snackbar,
  Typography,
  Alert,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  AttachFile as AttachFileIcon,
  GetApp as DownloadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
} from '@mui/icons-material';

export interface FileAttachment {
  url: string;
  filename: string;
  size: number;
  type?: string;
  fileId?: string;
}

interface FileUploadManagerProps {
  entityType: 'asset' | 'workOrder' | 'part';
  entityId: string;
  attachments?: FileAttachment[];
  onAttachmentsChange: (attachments: FileAttachment[]) => void;
  disabled?: boolean;
  acceptedTypes?: string;
  maxFiles?: number;
  title?: string;
}

export default function FileUploadManager({
  entityType,
  entityId,
  attachments = [],
  onAttachmentsChange,
  disabled = false,
  acceptedTypes = 'image/*,.pdf,.doc,.docx,.txt',
  maxFiles = 10,
  title = 'Attachments',
}: FileUploadManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    // Check file limit
    if (attachments.length + files.length > maxFiles) {
      setUploadError(`Maximum ${maxFiles} files allowed. You can upload ${maxFiles - attachments.length} more files.`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    
    try {
      const newAttachments: FileAttachment[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File "${file.name}" is too large. Maximum size is 10MB.`);
        }
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityType', entityType);
        formData.append('entityId', entityId);
        
        try {
          console.log('📎 Starting upload for file:', { 
            name: file.name, 
            size: file.size, 
            type: file.type,
            entityType, 
            entityId 
          });
          
          const response = await fetch('/api/upload/blob', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: formData,
          });
          
          console.log('📎 Upload response status:', response.status, response.statusText);
          
          if (response.ok) {
            const uploadResult = await response.json();
            console.log('📎 Upload result:', uploadResult);
            
            if (uploadResult.success && uploadResult.files) {
              // Handle new backend format that returns files array
              uploadResult.files.forEach((uploadedFile: any) => {
                const newAttachment = {
                  url: uploadedFile.url,
                  filename: uploadedFile.filename || uploadedFile.originalName || file.name,
                  size: uploadedFile.size || file.size,
                  type: file.type,
                  fileId: uploadedFile.id,
                };
                console.log('📎 Adding new attachment:', newAttachment);
                newAttachments.push(newAttachment);
              });
            } else if (uploadResult.success && uploadResult.url) {
              // Handle legacy format for backward compatibility
              const newAttachment = {
                url: uploadResult.url,
                filename: uploadResult.filename || file.name,
                size: uploadResult.size || file.size,
                type: file.type,
                fileId: uploadResult.fileId,
              };
              console.log('📎 Adding new attachment (legacy format):', newAttachment);
              newAttachments.push(newAttachment);
            } else {
              console.log('📎 Upload result not successful or missing data:', uploadResult);
            }
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.log('📎 Upload failed with error data:', errorData);
            throw new Error(errorData.error || `Upload failed for ${file.name}`);
          }
        } catch (error) {
          console.error('📎 Upload error for file:', file.name, error);
          throw error;
        }
      }
      
      // Update attachments
      const updatedAttachments = [...attachments, ...newAttachments];
      console.log('📎 FileUploadManager: Calling onAttachmentsChange with:', {
        previousAttachments: attachments,
        newAttachments,
        updatedAttachments,
        entityType,
        entityId
      });
      onAttachmentsChange(updatedAttachments);
      
      setUploadSuccess(true);
    } catch (error) {
      console.error('File upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleFileUpload(event.target.files);
    }
    // Reset input
    event.target.value = '';
  };

  const handleRemoveFile = async (index: number) => {
    const fileToRemove = attachments[index];
    
    try {
      // Try to delete from server if fileId exists
      if (fileToRemove.fileId) {
        await fetch(`/api/upload/blob/${fileToRemove.fileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
      }
    } catch (error) {
      console.warn('Could not delete file from server:', error);
      // Continue with local removal even if server deletion fails
    }

    // Remove from local state
    const updatedAttachments = attachments.filter((_, i) => i !== index);
    onAttachmentsChange(updatedAttachments);
  };

  const isImageFile = (filename: string, type?: string) => {
    if (type && type.startsWith('image/')) return true;
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => filename.toLowerCase().includes(ext));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {title} ({attachments.length})
        </Typography>
        <Box>
          <input
            type="file"
            multiple
            accept={acceptedTypes}
            style={{ display: 'none' }}
            id={`file-upload-${entityType}-${entityId}`}
            onChange={handleFileInputChange}
            disabled={isUploading || disabled}
          />
          <label htmlFor={`file-upload-${entityType}-${entityId}`}>
            <Button
              variant="outlined"
              component="span"
              startIcon={isUploading ? <CircularProgress size={20} /> : <UploadIcon />}
              disabled={isUploading || disabled || attachments.length >= maxFiles}
              size="small"
            >
              {isUploading ? 'Uploading...' : 'Add Files'}
            </Button>
          </label>
        </Box>
      </Box>
      
      {attachments.length > 0 ? (
        <Grid container spacing={2}>
          {attachments.map((attachment, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card variant="outlined" sx={{ height: '100%', position: 'relative' }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    {isImageFile(attachment.filename, attachment.type) ? (
                      <ImageIcon color="primary" />
                    ) : (
                      <AttachFileIcon color="action" />
                    )}
                    <Typography variant="subtitle2" noWrap title={attachment.filename}>
                      {attachment.filename}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveFile(index)}
                      sx={{ ml: 'auto' }}
                      color="error"
                      disabled={disabled}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  {isImageFile(attachment.filename, attachment.type) && attachment.url ? (
                    <Box
                      component="img"
                      src={attachment.url}
                      alt={attachment.filename}
                      sx={{
                        width: '100%',
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: 1,
                        mb: 2,
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.8,
                        },
                      }}
                      onClick={() => window.open(attachment.url, '_blank')}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: 120,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        mb: 2,
                      }}
                    >
                      <AttachFileIcon sx={{ fontSize: 40, color: 'grey.500' }} />
                    </Box>
                  )}
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Size: {(attachment.size / 1024).toFixed(1)} KB
                  </Typography>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => window.open(attachment.url, '_blank')}
                    disabled={!attachment.url}
                  >
                    View/Download
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 4, 
            color: 'text.secondary',
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1 
          }}
        >
          <AttachFileIcon sx={{ fontSize: 48, mb: 1, color: 'text.disabled' }} />
          <Typography variant="body2">
            No attachments yet. Click "Add Files" to upload documents or images.
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Maximum {maxFiles} files, 10MB each
          </Typography>
        </Box>
      )}

      {/* Upload feedback notifications */}
      <Snackbar
        open={uploadSuccess}
        autoHideDuration={4000}
        onClose={() => setUploadSuccess(false)}
      >
        <Alert severity="success" onClose={() => setUploadSuccess(false)}>
          Files uploaded successfully!
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!uploadError}
        autoHideDuration={6000}
        onClose={() => setUploadError(null)}
      >
        <Alert severity="error" onClose={() => setUploadError(null)}>
          {uploadError}
        </Alert>
      </Snackbar>
    </Box>
  );
}