import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Alert,
} from '@mui/material';
import {
  QrCode as QrCodeIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  ContentCopy as CopyIcon,
  MoreVert as MoreIcon,
  Fullscreen as FullscreenIcon,
} from '@mui/icons-material';
import { qrService } from '../../services/qrService';
import type { QRCodeType } from '../../types/qr';

interface QRCodeDisplayProps {
  entityType: QRCodeType;
  entityId: string;
  entityName: string;
  qrCodeUrl?: string;
  metadata?: Record<string, any>;
  size?: number;
  showLabel?: boolean;
  showActions?: boolean;
}

const QR_SIZES = [
  { label: 'Small (200px)', value: 200 },
  { label: 'Medium (400px)', value: 400 },
  { label: 'Large (600px)', value: 600 },
  { label: 'Extra Large (800px)', value: 800 },
  { label: 'Print Quality (1200px)', value: 1200 },
];

export default function QRCodeDisplay({
  entityType,
  entityId,
  entityName,
  qrCodeUrl,
  metadata = {},
  size = 200,
  showLabel = true,
  showActions = true,
}: QRCodeDisplayProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState(400);
  const [generatedQRCode, setGeneratedQRCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  // Generate QR code if not provided
  useEffect(() => {
    const generateQRCode = async () => {
      if (qrCodeUrl) {
        setGeneratedQRCode(qrCodeUrl);
        return;
      }

      setIsGenerating(true);
      try {
        const qrData = qrService.createQRCodeData(entityType, entityId, {
          name: entityName,
          ...metadata,
        });
        const qrCode = await qrService.generateQRCode(qrData, { size });
        setGeneratedQRCode(qrCode);
      } catch (error) {
        console.error('Failed to generate QR code:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    generateQRCode();
  }, [entityType, entityId, entityName, qrCodeUrl, metadata, size]);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleDownload = useCallback(async (downloadSize?: number) => {
    const targetSize = downloadSize || selectedSize;
    
    try {
      setIsGenerating(true);
      const qrData = qrService.createQRCodeData(entityType, entityId, {
        name: entityName,
        ...metadata,
      });
      
      const qrCode = await qrService.generateQRCode(qrData, { size: targetSize });
      
      // Create download link
      const link = document.createElement('a');
      link.href = qrCode;
      link.download = `qr-${entityType}-${entityId}-${targetSize}px.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setDownloadDialogOpen(false);
      handleMenuClose();
    } catch (error) {
      console.error('Failed to download QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [entityType, entityId, entityName, metadata, selectedSize]);

  const handleCopy = useCallback(async () => {
    if (!generatedQRCode) return;
    
    try {
      const response = await fetch(generatedQRCode);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      handleMenuClose();
    } catch (error) {
      console.error('Failed to copy QR code:', error);
    }
  }, [generatedQRCode]);

  const handlePrint = useCallback(() => {
    if (!generatedQRCode) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const printDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${entityName}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              text-align: center;
              border: 2px dashed #ccc;
              padding: 20px;
              margin: 20px;
            }
            .qr-code {
              max-width: 400px;
              height: auto;
            }
            .qr-info {
              margin-top: 10px;
              font-size: 14px;
              color: #666;
            }
            @media print {
              body { margin: 0; }
              .qr-container { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <img src="${generatedQRCode}" alt="QR Code" class="qr-code" />
            <div class="qr-info">
              <strong>${entityName}</strong><br>
              ${entityType.replace('-', ' ').toUpperCase()}: ${entityId}
            </div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printDocument);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
    
    handleMenuClose();
  }, [generatedQRCode, entityName, entityType, entityId]);

  if (isGenerating && !generatedQRCode) {
    return (
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: size,
          minWidth: size,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Generating QR Code...
        </Typography>
      </Paper>
    );
  }

  if (!generatedQRCode) {
    return (
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: size,
          minWidth: size,
        }}
      >
        <Alert severity="warning" sx={{ maxWidth: size }}>
          QR Code not available
        </Alert>
      </Paper>
    );
  }

  return (
    <>
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 2, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {showActions && (
          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreIcon />
            </IconButton>
          </Box>
        )}

        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            cursor: showActions ? 'pointer' : 'default',
          }}
          onClick={showActions ? () => setFullscreenOpen(true) : undefined}
        >
          <img 
            src={generatedQRCode} 
            alt={`QR Code for ${entityName}`}
            style={{ 
              width: size, 
              height: size,
              border: '1px solid #e0e0e0'
            }} 
          />
          
          {showLabel && (
            <Box sx={{ mt: 1, textAlign: 'center' }}>
              <Typography variant="body2" fontWeight="medium">
                {entityName}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} justifyContent="center">
                <Chip 
                  label={entityType ? entityType.replace('-', ' ').toUpperCase() : 'UNKNOWN'} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
                <Chip 
                  label={entityId} 
                  size="small" 
                  variant="outlined"
                />
              </Stack>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => setDownloadDialogOpen(true)}>
          <DownloadIcon sx={{ mr: 1 }} />
          Download
        </MenuItem>
        <MenuItem onClick={handleCopy}>
          <CopyIcon sx={{ mr: 1 }} />
          Copy to Clipboard
        </MenuItem>
        <MenuItem onClick={handlePrint}>
          <PrintIcon sx={{ mr: 1 }} />
          Print
        </MenuItem>
        <MenuItem onClick={() => setFullscreenOpen(true)}>
          <FullscreenIcon sx={{ mr: 1 }} />
          View Full Size
        </MenuItem>
      </Menu>

      {/* Download Dialog */}
      <Dialog open={downloadDialogOpen} onClose={() => setDownloadDialogOpen(false)}>
        <DialogTitle>Download QR Code</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Size</InputLabel>
            <Select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value as number)}
              label="Size"
            >
              {QR_SIZES.map((sizeOption) => (
                <MenuItem key={sizeOption.value} value={sizeOption.value}>
                  {sizeOption.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDownloadDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => handleDownload()}
            disabled={isGenerating}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fullscreen Dialog */}
      <Dialog 
        open={fullscreenOpen} 
        onClose={() => setFullscreenOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">QR Code - {entityName}</Typography>
            <IconButton onClick={() => setFullscreenOpen(false)}>
              <QrCodeIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', p: 4 }}>
          <img 
            src={generatedQRCode} 
            alt={`QR Code for ${entityName}`}
            style={{ 
              maxWidth: '100%', 
              height: 'auto',
              border: '2px solid #e0e0e0',
              borderRadius: 8,
            }} 
          />
          <Stack direction="row" spacing={2} sx={{ mt: 3 }} justifyContent="center">
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />}
              onClick={() => setDownloadDialogOpen(true)}
            >
              Download
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<CopyIcon />}
              onClick={handleCopy}
            >
              Copy
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<PrintIcon />}
              onClick={handlePrint}
            >
              Print
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}