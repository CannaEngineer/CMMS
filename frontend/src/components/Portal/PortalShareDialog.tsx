/**
 * Portal Share Dialog - Share portal URLs and QR codes
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  Tabs,
  Tab,
  Card,
  CardContent,
  Alert,
  Chip,
  Stack,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  QrCode as QrCodeIcon,
  Share as ShareIcon,
  Email as EmailIcon,
  Link as LinkIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import type { Portal } from '../../types/portal';
import { qrService } from '../../services/qrService';

interface PortalShareDialogProps {
  open: boolean;
  portal: Portal | null;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const PortalShareDialog: React.FC<PortalShareDialogProps> = ({
  open,
  portal,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [copySuccess, setCopySuccess] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrError, setQrError] = useState<string>('');

  // Generate QR code when dialog opens
  useEffect(() => {
    if (portal && open && !qrCodeDataUrl && !isGeneratingQR) {
      generateQRCode();
    }
  }, [portal, open]);

  const generateQRCode = async () => {
    if (!portal) return;
    
    setIsGeneratingQR(true);
    setQrError('');
    
    try {
      const qrData = qrService.createQRCodeData('portal', portal.slug, {
        portalName: portal.name,
        portalType: portal.type,
        trackingEnabled: true
      });
      
      const qrCodeImage = await qrService.generateQRCode(qrData, {
        size: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      setQrCodeDataUrl(qrCodeImage);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      setQrError('Failed to generate QR code. Please try again.');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  if (!portal) return null;

  const publicUrl = portal.publicUrl || `${window.location.origin}/p/${portal.slug}`;
  const shortUrl = `${window.location.origin}/p/${portal.slug}`;
  const qrUrl = `${publicUrl}?qr=1`;

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: portal.name,
          text: portal.description,
          url: publicUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopy(publicUrl, 'url');
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Access Portal: ${portal.name}`);
    const body = encodeURIComponent(
      `Hi,\n\nYou can access the ${portal.name} portal using this link:\n\n${publicUrl}\n\nOr scan the QR code for quick mobile access.\n\nDescription: ${portal.description}\n\nBest regards`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;
    
    try {
      const link = document.createElement('a');
      link.download = `${portal.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr_code.png`;
      link.href = qrCodeDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download QR code:', error);
    }
  };

  const handlePrintQR = async () => {
    if (!qrCodeDataUrl) return;
    
    try {
      qrService.createQRCodeData('portal', portal.slug, {
        portalName: portal.name,
        portalType: portal.type
      });
      
      const label = await qrService.generateQRLabel(
        {
          type: 'portal',
          id: portal.slug,
          title: portal.name,
          subtitle: portal.type.replace('-', ' ').toUpperCase(),
          additionalInfo: [shortUrl]
        },
        qrService.getAvailableTemplates()['standard'],
        { size: 200 }
      );
      
      const sheet = qrService.generatePrintableSheet([label], qrService.getAvailableTemplates()['standard']);
      qrService.printLabels(sheet);
    } catch (error) {
      console.error('Failed to print QR code:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Share Portal: {portal.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Share access links and QR codes for easy portal access
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="URLs & Links" icon={<LinkIcon />} />
            <Tab label="QR Code" icon={<QrCodeIcon />} />
            <Tab label="Share Options" icon={<ShareIcon />} />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Stack spacing={3}>
            {/* Full URL */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Full Portal URL
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  value={publicUrl}
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
                  }}
                />
                <IconButton
                  onClick={() => handleCopy(publicUrl, 'full-url')}
                  color={copySuccess === 'full-url' ? 'success' : 'default'}
                >
                  <CopyIcon />
                </IconButton>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Use this URL for desktop sharing and email links
              </Typography>
            </Box>

            {/* Short URL */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Short URL
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  value={shortUrl}
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
                  }}
                />
                <IconButton
                  onClick={() => handleCopy(shortUrl, 'short-url')}
                  color={copySuccess === 'short-url' ? 'success' : 'default'}
                >
                  <CopyIcon />
                </IconButton>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Shorter URL perfect for SMS, business cards, and verbal communication
              </Typography>
            </Box>

            {/* QR Tracking URL */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                QR Tracking URL
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  value={qrUrl}
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
                  }}
                />
                <IconButton
                  onClick={() => handleCopy(qrUrl, 'qr-url')}
                  color={copySuccess === 'qr-url' ? 'success' : 'default'}
                >
                  <CopyIcon />
                </IconButton>
              </Box>
              <Typography variant="caption" color="text.secondary">
                URL with QR tracking parameter for analytics
              </Typography>
            </Box>

            {copySuccess && (
              <Alert severity="success" sx={{ mt: 2 }}>
                URL copied to clipboard!
              </Alert>
            )}
          </Stack>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ textAlign: 'center' }}>
            {/* QR Code Display */}
            <Card sx={{ display: 'inline-block', p: 3, mb: 3 }}>
              <Box
                sx={{
                  width: 200,
                  height: 200,
                  border: 2,
                  borderColor: 'divider',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.50',
                  mb: 2,
                }}
              >
                {isGeneratingQR ? (
                  <CircularProgress size={60} />
                ) : qrError ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <QrCodeIcon sx={{ fontSize: 60, color: 'error.main', mb: 1 }} />
                    <Typography variant="caption" color="error.main">
                      Failed to load
                    </Typography>
                  </Box>
                ) : qrCodeDataUrl ? (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }} 
                  />
                ) : (
                  <QrCodeIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                QR Code for {portal.name}
              </Typography>
              {qrError && (
                <Button 
                  size="small" 
                  onClick={generateQRCode}
                  sx={{ mt: 1 }}
                >
                  Retry
                </Button>
              )}
            </Card>

            {/* QR Code Actions */}
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadQR}
                disabled={!qrCodeDataUrl || isGeneratingQR}
              >
                Download
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrintQR}
                disabled={!qrCodeDataUrl || isGeneratingQR}
              >
                Print
              </Button>
            </Stack>

            {/* QR Code Info */}
            <Alert severity="info">
              <Typography variant="body2">
                <strong>QR Code Usage Tips:</strong>
                <br />
                • Place in high-traffic areas for maximum visibility
                <br />
                • Include instructions like "Scan to report maintenance issues"
                <br />
                • Test scanning distance and lighting conditions
                <br />
                • Consider printing on weather-resistant materials for outdoor use
              </Typography>
            </Alert>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Stack spacing={3}>
            {/* Quick Share Actions */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Quick Share
              </Typography>
              
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant="outlined"
                  startIcon={<ShareIcon />}
                  onClick={handleShare}
                  size="large"
                >
                  Native Share
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<EmailIcon />}
                  onClick={handleEmail}
                  size="large"
                >
                  Email Link
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<CopyIcon />}
                  onClick={() => handleCopy(publicUrl, 'share-url')}
                  size="large"
                >
                  Copy URL
                </Button>
              </Stack>
            </Box>

            <Divider />

            {/* Portal Information */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Portal Information
              </Typography>
              
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {portal.name}
                    </Typography>
                    <Chip
                      label={portal.type.replace('-', ' ')}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {portal.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={portal.isActive ? 'Active' : 'Inactive'}
                      color={portal.isActive ? 'success' : 'default'}
                      size="small"
                    />
                    {portal.allowAnonymous && (
                      <Chip label="No Login Required" color="info" size="small" />
                    )}
                    {portal.qrEnabled && (
                      <Chip label="QR Enabled" color="secondary" size="small" />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Share Guidelines */}
            <Alert severity="success">
              <Typography variant="body2">
                <strong>Best Practices for Sharing:</strong>
                <br />
                • Use short URLs for verbal communication and business cards
                <br />
                • Include QR codes in printed materials and signage
                <br />
                • Test links before sharing with large groups
                <br />
                • Provide context about what the portal is for
              </Typography>
            </Alert>
          </Stack>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button
          variant="contained"
          startIcon={<ShareIcon />}
          onClick={handleShare}
        >
          Share Portal
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PortalShareDialog;