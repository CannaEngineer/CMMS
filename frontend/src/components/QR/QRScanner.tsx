import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  Fab,
  Slide,
  useTheme,
  useMediaQuery,
  Paper,
  Stack,
  Divider,
} from '@mui/material';
import {
  QrCodeScanner as QrScannerIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  FlashlightOn as FlashlightIcon,
  FlashlightOff as FlashlightOffIcon,
  CameraAlt as CameraIcon,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { qrService } from '../../services/qrService';
import { QRScanResult } from '../../types/qr';

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (result: QRScanResult) => void;
  title?: string;
}

const Transition = React.forwardRef<unknown, TransitionProps & { children: React.ReactElement }>(
  function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  }
);

export default function QRScanner({ 
  open, 
  onClose, 
  onScan, 
  title = "Scan QR Code"
}: QRScannerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Video and canvas refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [scanInterval, setScanInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsScanning(true);

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        
        // Start scanning interval
        const interval = setInterval(() => {
          scanFrame();
        }, 250); // Scan every 250ms
        
        setScanInterval(interval);
      }
    } catch (err) {
      console.error('Camera access failed:', err);
      setHasPermission(false);
      setError('Camera access denied. Please allow camera permissions.');
      setIsScanning(false);
    }
  }, [cameraFacing]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (scanInterval) {
      clearInterval(scanInterval);
      setScanInterval(null);
    }
    
    setIsScanning(false);
    setIsFlashlightOn(false);
  }, [stream, scanInterval]);

  // Scan current video frame
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    // Prevent too frequent scans
    const now = Date.now();
    if (now - lastScanTime < 1000) {
      return;
    }

    // Draw video frame to canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    // Scan for QR code
    const result = qrService.scanQRCodeFromCanvas(canvas);
    
    if (result.isValid) {
      setLastScanTime(now);
      
      // Provide haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      
      onScan(result);
      handleClose();
    }
  }, [isScanning, lastScanTime, onScan]);

  // Toggle flashlight
  const toggleFlashlight = useCallback(async () => {
    if (!stream) return;

    try {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !isFlashlightOn }]
        });
        setIsFlashlightOn(!isFlashlightOn);
      }
    } catch (err) {
      console.warn('Flashlight not supported:', err);
    }
  }, [stream, isFlashlightOn]);

  // Switch camera facing
  const switchCamera = useCallback(() => {
    setCameraFacing(prev => prev === 'user' ? 'environment' : 'user');
  }, []);


  // Handle dialog close
  const handleClose = useCallback(() => {
    stopCamera();
    setError(null);
    setHasPermission(null);
    onClose();
  }, [stopCamera, onClose]);

  // Effects
  useEffect(() => {
    if (open && hasPermission === null) {
      startCamera();
    }
  }, [open, hasPermission, startCamera]);

  useEffect(() => {
    if (open && hasPermission && stream) {
      startCamera();
    }
  }, [cameraFacing]); // Restart camera when facing changes

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        TransitionComponent={Transition}
        fullScreen={isMobile}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'black',
            color: 'white',
            ...(isMobile && {
              margin: 0,
              borderRadius: 0,
            }),
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            py: 1,
          }}
        >
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QrScannerIcon />
            {title}
          </Typography>
          <IconButton onClick={handleClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, position: 'relative', minHeight: 400 }}>
          {/* Camera View */}
          {hasPermission && (
            <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
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
              
              {/* Scanning overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(0, 0, 0, 0.3)',
                }}
              >
                <Box
                  sx={{
                    width: 250,
                    height: 250,
                    border: '2px solid white',
                    borderRadius: 2,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -1,
                      left: -1,
                      width: 20,
                      height: 20,
                      borderTop: '4px solid #1976d2',
                      borderLeft: '4px solid #1976d2',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: -1,
                      right: -1,
                      width: 20,
                      height: 20,
                      borderTop: '4px solid #1976d2',
                      borderRight: '4px solid #1976d2',
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -1,
                      left: -1,
                      width: 20,
                      height: 20,
                      borderBottom: '4px solid #1976d2',
                      borderLeft: '4px solid #1976d2',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -1,
                      right: -1,
                      width: 20,
                      height: 20,
                      borderBottom: '4px solid #1976d2',
                      borderRight: '4px solid #1976d2',
                    }}
                  />
                </Box>
              </Box>

              {/* Camera controls */}
              <Paper
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: 3,
                  p: 1,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconButton onClick={toggleFlashlight} size="small">
                    {isFlashlightOn ? <FlashlightOffIcon /> : <FlashlightIcon />}
                  </IconButton>
                  
                  <Divider orientation="vertical" flexItem />
                  
                  <IconButton onClick={switchCamera} size="small">
                    <RefreshIcon />
                  </IconButton>
                </Stack>
              </Paper>
            </Box>
          )}

          {/* Permission denied / Error state */}
          {hasPermission === false && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 400,
                p: 3,
                textAlign: 'center',
              }}
            >
              <CameraIcon sx={{ fontSize: 64, color: 'grey.500', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Camera Access Required
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Please allow camera access to scan QR codes
              </Typography>
              <Button
                variant="contained"
                onClick={startCamera}
                startIcon={<CameraIcon />}
                sx={{ mb: 2 }}
              >
                Enable Camera
              </Button>
            </Box>
          )}

          {/* Loading state */}
          {isScanning && hasPermission === null && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 400,
                p: 3,
              }}
            >
              <CircularProgress sx={{ color: 'white', mb: 2 }} />
              <Typography variant="body2">
                Starting camera...
              </Typography>
            </Box>
          )}

          {/* Scanning instructions */}
          {hasPermission && (
            <Paper
              sx={{
                position: 'absolute',
                top: 16,
                left: 16,
                right: 16,
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                p: 2,
              }}
            >
              <Typography variant="body2" textAlign="center">
                Position the QR code within the frame to scan
              </Typography>
            </Paper>
          )}

          {/* Hidden canvas for QR processing */}
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />

        </DialogContent>

        {/* Error display */}
        {error && (
          <DialogActions sx={{ bgcolor: 'rgba(0, 0, 0, 0.8)' }}>
            <Alert 
              severity="error" 
              sx={{ width: '100%' }}
              action={
                <IconButton
                  size="small"
                  onClick={() => setError(null)}
                  sx={{ color: 'inherit' }}
                >
                  <CloseIcon />
                </IconButton>
              }
            >
              {error}
            </Alert>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
}

// Quick QR Scanner FAB component
interface QRScannerFabProps {
  onScan: (result: QRScanResult) => void;
  sx?: any;
}

export function QRScannerFab({ onScan, sx }: QRScannerFabProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Fab
        color="secondary"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          zIndex: 1000,
          ...sx,
        }}
      >
        <QrScannerIcon />
      </Fab>
      
      <QRScanner
        open={open}
        onClose={() => setOpen(false)}
        onScan={onScan}
      />
    </>
  );
}