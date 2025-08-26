import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  FlashOn as FlashOnIcon,
  FlashOff as FlashOffIcon,
  CameraFront as CameraFrontIcon,
  CameraRear as CameraRearIcon,
} from '@mui/icons-material';
import { qrService } from '../services/qrService';

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onAssetFound?: (assetId: string) => void;
  onWorkOrderFound?: (workOrderId: string) => void;
}

export default function QRScanner({ open, onClose, onAssetFound, onWorkOrderFound }: QRScannerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera when dialog opens
  useEffect(() => {
    if (open) {
      initializeCamera();
    } else {
      cleanup();
    }

    return cleanup;
  }, [open, facingMode]);

  const initializeCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Request camera permission
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setHasPermission(true);
        startScanning();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  const startScanning = () => {
    if (scanning) return;
    
    setScanning(true);
    intervalRef.current = setInterval(() => {
      captureAndScan();
    }, 500); // Scan every 500ms
  };

  const stopScanning = () => {
    setScanning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for QR scanning
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    try {
      // Use qrService to scan for QR codes
      const result = qrService.scanQRCodeFromCanvas(canvas);
      
      if (result.isValid && result.data) {
        handleQRCodeFound(result.data);
      }
    } catch (err) {
      // Ignore scanning errors - they're expected when no QR code is present
    }
  };

  const handleQRCodeFound = async (qrData: string) => {
    stopScanning();
    
    try {
      // Try to parse as asset or work order ID
      const assetMatch = qrData.match(/asset[:\-_]?(\d+)/i);
      const workOrderMatch = qrData.match(/work[_\-]?order[:\-_]?(\d+)/i) || qrData.match(/wo[:\-_]?(\d+)/i);
      
      if (assetMatch && onAssetFound) {
        onAssetFound(assetMatch[1]);
        onClose();
      } else if (workOrderMatch && onWorkOrderFound) {
        onWorkOrderFound(workOrderMatch[1]);
        onClose();
      } else if (/^\d+$/.test(qrData)) {
        // If it's just a number, try it as asset ID first
        if (onAssetFound) {
          onAssetFound(qrData);
          onClose();
        }
      } else {
        setError('QR code format not recognized. Expected asset or work order ID.');
        setTimeout(() => {
          setError(null);
          startScanning();
        }, 2000);
      }
    } catch (err) {
      setError('Error processing QR code.');
      setTimeout(() => {
        setError(null);
        startScanning();
      }, 2000);
    }
  };

  const toggleFlash = async () => {
    if (!streamRef.current) return;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
        setFlashEnabled(!flashEnabled);
      }
    } catch (err) {
      console.error('Flash not supported:', err);
    }
  };

  const switchCamera = () => {
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
  };

  const cleanup = () => {
    stopScanning();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { bgcolor: 'black', color: 'white' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white' }}>
        <Typography variant="h6">Scan QR Code</Typography>
        <IconButton onClick={handleClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, position: 'relative', minHeight: 400 }}>
        {isLoading && (
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.7)',
            zIndex: 2
          }}>
            <CircularProgress sx={{ color: 'white' }} />
          </Box>
        )}

        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {hasPermission && !error && (
          <Box sx={{ position: 'relative', width: '100%', height: 400 }}>
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              playsInline
              muted
            />
            
            {/* Scanning frame overlay */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 200,
                height: 200,
                border: '2px solid #00ff00',
                borderRadius: 2,
                '&::before, &::after': {
                  content: '""',
                  position: 'absolute',
                  width: 20,
                  height: 20,
                },
                '&::before': {
                  top: -2,
                  left: -2,
                  borderTop: '4px solid #00ff00',
                  borderLeft: '4px solid #00ff00',
                },
                '&::after': {
                  bottom: -2,
                  right: -2,
                  borderBottom: '4px solid #00ff00',
                  borderRight: '4px solid #00ff00',
                },
              }}
            />

            {scanning && (
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                textAlign: 'center',
                mt: 15
              }}>
                <CircularProgress size={24} sx={{ color: '#00ff00', mb: 1 }} />
                <Typography variant="caption">Scanning...</Typography>
              </Box>
            )}

            {/* Camera controls */}
            <Box sx={{ 
              position: 'absolute', 
              bottom: 16, 
              right: 16, 
              display: 'flex', 
              gap: 1 
            }}>
              <IconButton 
                onClick={toggleFlash} 
                sx={{ 
                  bgcolor: 'rgba(0,0,0,0.5)', 
                  color: flashEnabled ? '#00ff00' : 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                }}
              >
                {flashEnabled ? <FlashOnIcon /> : <FlashOffIcon />}
              </IconButton>
              
              <IconButton 
                onClick={switchCamera} 
                sx={{ 
                  bgcolor: 'rgba(0,0,0,0.5)', 
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                }}
              >
                {facingMode === 'user' ? <CameraRearIcon /> : <CameraFrontIcon />}
              </IconButton>
            </Box>
          </Box>
        )}

        {hasPermission === false && !isLoading && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              Camera Access Required
            </Typography>
            <Typography variant="body2" sx={{ color: 'grey.300', mb: 2 }}>
              Please allow camera access to scan QR codes
            </Typography>
            <Button variant="contained" onClick={initializeCamera}>
              Try Again
            </Button>
          </Box>
        )}

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </DialogContent>

      <DialogActions sx={{ bgcolor: 'rgba(0,0,0,0.8)' }}>
        <Typography variant="caption" sx={{ color: 'grey.300', mr: 'auto' }}>
          Point camera at QR code on asset or work order
        </Typography>
        <Button onClick={handleClose} sx={{ color: 'white' }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}