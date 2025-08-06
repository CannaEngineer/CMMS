import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Alert,
  Stack,
  Fade,
  Collapse,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  QrCode as QrCodeIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
  Settings as SettingsIcon,
  Label as LabelIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { qrService } from '../../services/qrService';
import { 
  QRLabel,
  QRLabelTemplate,
  QRCodeType,
  QRGenerationRequest,
  QRBatchOperation,
  QR_LABEL_TEMPLATES 
} from '../../types/qr';

interface QRCodeManagerProps {
  open: boolean;
  onClose: () => void;
  items?: Array<{
    type: QRCodeType;
    id: string;
    title: string;
    subtitle?: string;
    additionalInfo?: string[];
  }>;
  defaultType?: QRCodeType;
  allowBatchGeneration?: boolean;
}

export default function QRCodeManager({
  open,
  onClose,
  items = [],
  defaultType = 'asset',
  allowBatchGeneration = true,
}: QRCodeManagerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const downloadRef = useRef<HTMLAnchorElement>(null);

  // State
  const [selectedTemplate, setSelectedTemplate] = useState<QRLabelTemplate>(
    QR_LABEL_TEMPLATES.MEDIUM_EQUIPMENT_LABEL
  );
  const [generatedLabels, setGeneratedLabels] = useState<QRLabel[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchOperation, setBatchOperation] = useState<QRBatchOperation | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [customOptions, setCustomOptions] = useState({
    size: 200,
    errorCorrectionLevel: 'M' as 'L' | 'M' | 'Q' | 'H',
    includeCompanyLogo: false,
  });

  // Available templates
  const templates = Object.values(QR_LABEL_TEMPLATES);

  // Generate single QR code
  const generateSingleQR = useCallback(async (
    type: QRCodeType,
    id: string,
    title: string,
    subtitle?: string,
    additionalInfo?: string[]
  ) => {
    try {
      setIsGenerating(true);
      
      const label = await qrService.generateQRLabel(
        { type, id, title, subtitle, additionalInfo },
        selectedTemplate,
        {
          size: customOptions.size,
          errorCorrectionLevel: customOptions.errorCorrectionLevel,
          includeLogo: customOptions.includeCompanyLogo,
        }
      );

      setGeneratedLabels(prev => [...prev, label]);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedTemplate, customOptions]);

  // Generate batch QR codes
  const generateBatchQR = useCallback(async () => {
    if (items.length === 0) return;

    try {
      setIsGenerating(true);
      
      const request: QRGenerationRequest = {
        items,
        template: selectedTemplate,
        options: {
          size: customOptions.size,
          errorCorrectionLevel: customOptions.errorCorrectionLevel,
          includeLogo: customOptions.includeCompanyLogo,
        },
        organizationId: '1', // TODO: Get from auth context
      };

      const operation = await qrService.generateBatchQRCodes(request);
      setBatchOperation(operation);

      // Convert successful results to labels
      const labels: QRLabel[] = [];
      for (const item of operation.items) {
        if (item.status === 'completed' && item.result) {
          const originalItem = items.find(i => i.id === item.data.id);
          if (originalItem) {
            labels.push({
              id: item.id,
              title: originalItem.title,
              subtitle: originalItem.subtitle,
              qrCode: item.result,
              additionalInfo: originalItem.additionalInfo,
              template: selectedTemplate,
            });
          }
        }
      }

      setGeneratedLabels(labels);
    } catch (error) {
      console.error('Failed to generate batch QR codes:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [items, selectedTemplate, customOptions]);

  // Download single QR code
  const downloadQRCode = useCallback((label: QRLabel) => {
    if (!downloadRef.current) return;

    downloadRef.current.href = label.qrCode;
    downloadRef.current.download = `qr-${label.title.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
    downloadRef.current.click();
  }, []);

  // Copy QR code to clipboard
  const copyQRCode = useCallback(async (label: QRLabel) => {
    try {
      // Convert data URL to blob
      const response = await fetch(label.qrCode);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);

      // Show success feedback (you might want to use a toast here)
      console.log('QR code copied to clipboard');
    } catch (error) {
      console.error('Failed to copy QR code:', error);
    }
  }, []);

  // Print labels
  const printLabels = useCallback(() => {
    if (generatedLabels.length === 0) return;

    const sheet = qrService.generatePrintableSheet(generatedLabels, selectedTemplate);
    qrService.printLabels(sheet);
  }, [generatedLabels, selectedTemplate]);

  // Clear generated labels
  const clearLabels = useCallback(() => {
    setGeneratedLabels([]);
    setBatchOperation(null);
    setSelectedItems(new Set());
  }, []);

  // Template selection
  const handleTemplateChange = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
    }
  }, [templates]);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            height: isMobile ? '100vh' : '90vh',
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <QrCodeIcon />
              QR Code Manager
            </Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          <Grid container sx={{ height: '100%' }}>
            {/* Configuration Panel */}
            <Grid item xs={12} md={4} sx={{ borderRight: { md: `1px solid ${theme.palette.divider}` } }}>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Configuration
                </Typography>

                {/* Template Selection */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Label Template</InputLabel>
                  <Select
                    value={selectedTemplate.id}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    label="Label Template"
                  >
                    {templates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        <Box>
                          <Typography variant="body2">{template.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {template.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Template Preview */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    mb: 2,
                    bgcolor: 'grey.50',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Template Preview
                  </Typography>
                  <Box
                    sx={{
                      width: selectedTemplate.dimensions.width * 2,
                      height: selectedTemplate.dimensions.height * 2,
                      border: '1px dashed',
                      borderColor: 'grey.300',
                      display: 'flex',
                      flexDirection: selectedTemplate.layout === 'horizontal' ? 'row' : 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      gap: 1,
                      p: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: selectedTemplate.qrSize * 2,
                        height: selectedTemplate.qrSize * 2,
                        bgcolor: 'grey.300',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <QrCodeIcon sx={{ fontSize: selectedTemplate.qrSize }} />
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ fontSize: selectedTemplate.fontSize.title / 2 }}>
                        Asset Name
                      </Typography>
                      <br />
                      <Typography variant="caption" sx={{ fontSize: selectedTemplate.fontSize.subtitle / 2 }}>
                        Location
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* Custom Options */}
                <Typography variant="subtitle2" gutterBottom>
                  Options
                </Typography>

                <TextField
                  label="QR Code Size"
                  type="number"
                  value={customOptions.size}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, size: parseInt(e.target.value) }))}
                  fullWidth
                  sx={{ mb: 2 }}
                  inputProps={{ min: 100, max: 500 }}
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Error Correction</InputLabel>
                  <Select
                    value={customOptions.errorCorrectionLevel}
                    onChange={(e) => setCustomOptions(prev => ({ 
                      ...prev, 
                      errorCorrectionLevel: e.target.value as 'L' | 'M' | 'Q' | 'H'
                    }))}
                    label="Error Correction"
                  >
                    <MenuItem value="L">Low (7%)</MenuItem>
                    <MenuItem value="M">Medium (15%)</MenuItem>
                    <MenuItem value="Q">Quartile (25%)</MenuItem>
                    <MenuItem value="H">High (30%)</MenuItem>
                  </Select>
                </FormControl>

                {/* Generation Actions */}
                <Stack spacing={2}>
                  {allowBatchGeneration && items.length > 0 && (
                    <Button
                      variant="contained"
                      onClick={generateBatchQR}
                      disabled={isGenerating}
                      startIcon={isGenerating ? <CircularProgress size={20} /> : <AddIcon />}
                      fullWidth
                    >
                      Generate All ({items.length})
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    onClick={clearLabels}
                    disabled={generatedLabels.length === 0}
                    startIcon={<DeleteIcon />}
                    fullWidth
                  >
                    Clear All
                  </Button>
                </Stack>
              </Box>
            </Grid>

            {/* Generated Labels Panel */}
            <Grid item xs={12} md={8}>
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    Generated QR Codes ({generatedLabels.length})
                  </Typography>
                  
                  {generatedLabels.length > 0 && (
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        onClick={() => setPreviewMode(!previewMode)}
                        startIcon={<PreviewIcon />}
                      >
                        {previewMode ? 'List' : 'Preview'}
                      </Button>
                      <Button
                        size="small"
                        onClick={printLabels}
                        startIcon={<PrintIcon />}
                        variant="contained"
                      >
                        Print
                      </Button>
                    </Stack>
                  )}
                </Box>

                {/* Batch Operation Progress */}
                {batchOperation && (
                  <Alert
                    severity={
                      batchOperation.status === 'completed' ? 'success' :
                      batchOperation.status === 'failed' ? 'error' : 'info'
                    }
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="body2">
                      Batch Operation: {batchOperation.processed}/{batchOperation.total} completed
                    </Typography>
                    {batchOperation.status === 'processing' && (
                      <Box sx={{ mt: 1 }}>
                        <CircularProgress size={16} />
                      </Box>
                    )}
                  </Alert>
                )}

                {/* Generated Labels Display */}
                {generatedLabels.length === 0 ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      bgcolor: 'grey.50',
                    }}
                  >
                    <QrCodeIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No QR Codes Generated
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {items.length > 0 
                        ? 'Click "Generate All" to create QR codes for all items'
                        : 'Add items to generate QR codes'
                      }
                    </Typography>
                  </Paper>
                ) : previewMode ? (
                  /* Print Preview Mode */
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      minHeight: 400,
                      bgcolor: 'white',
                      overflow: 'auto',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Print Preview (A4)
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${Math.floor(210 / selectedTemplate.dimensions.width)}, 1fr)`,
                        gap: 1,
                        mt: 1,
                      }}
                    >
                      {generatedLabels.map((label, index) => (
                        <Box
                          key={index}
                          sx={{
                            width: selectedTemplate.dimensions.width * 1.5,
                            height: selectedTemplate.dimensions.height * 1.5,
                            border: '1px solid',
                            borderColor: 'grey.300',
                            display: 'flex',
                            flexDirection: selectedTemplate.layout === 'horizontal' ? 'row' : 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 0.5,
                            fontSize: '0.6rem',
                          }}
                        >
                          <img
                            src={label.qrCode}
                            alt="QR Code"
                            style={{
                              width: selectedTemplate.qrSize * 1.5,
                              height: selectedTemplate.qrSize * 1.5,
                            }}
                          />
                          <Box sx={{ textAlign: 'center', ml: selectedTemplate.layout === 'horizontal' ? 0.5 : 0 }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.5rem' }}>
                              {label.title}
                            </Typography>
                            {label.subtitle && (
                              <Typography variant="caption" sx={{ fontSize: '0.4rem', display: 'block' }}>
                                {label.subtitle}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                ) : (
                  /* List Mode */
                  <List>
                    {generatedLabels.map((label, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <Box sx={{ mr: 2 }}>
                            <img
                              src={label.qrCode}
                              alt="QR Code"
                              style={{ width: 60, height: 60 }}
                            />
                          </Box>
                          <ListItemText
                            primary={label.title}
                            secondary={
                              <Box>
                                {label.subtitle && (
                                  <Typography variant="body2" color="text.secondary">
                                    {label.subtitle}
                                  </Typography>
                                )}
                                <Chip
                                  label={label.template.name}
                                  size="small"
                                  sx={{ mt: 0.5 }}
                                />
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Stack direction="row" spacing={1}>
                              <IconButton
                                size="small"
                                onClick={() => copyQRCode(label)}
                                title="Copy to clipboard"
                              >
                                <CopyIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => downloadQRCode(label)}
                                title="Download"
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Stack>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < generatedLabels.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>
            Close
          </Button>
          {generatedLabels.length > 0 && (
            <Button
              variant="contained"
              onClick={printLabels}
              startIcon={<PrintIcon />}
            >
              Print Labels
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Hidden download link */}
      <a ref={downloadRef} style={{ display: 'none' }} />
    </>
  );
}