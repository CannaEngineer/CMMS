// Portal Preview - Live preview of how the portal will look to users
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  PhoneAndroid as MobileIcon,
  Computer as DesktopIcon
} from '@mui/icons-material';
import { CreatePortalRequest } from '../../types/portal';

interface PortalPreviewProps {
  portalData: Partial<CreatePortalRequest>;
  open: boolean;
  onClose: () => void;
}

const PortalPreview: React.FC<PortalPreviewProps> = ({
  portalData,
  open,
  onClose
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [viewMode, setViewMode] = React.useState<'mobile' | 'desktop'>('mobile');

  // Mock portal info for preview
  const mockPortalInfo = {
    id: 'preview',
    name: portalData.name || 'Portal Preview',
    description: portalData.description || 'This is a preview of your portal',
    type: portalData.type || 'maintenance-request',
    branding: portalData.branding || {},
    configuration: {
      ...portalData.configuration,
      fields: portalData.configuration?.fields || []
    },
    isActive: true,
    organizationInfo: {
      name: 'Your Organization',
      logoUrl: undefined,
      contactInfo: 'support@yourorg.com'
    }
  };

  const previewWidth = viewMode === 'mobile' ? 375 : 800;
  const previewHeight = viewMode === 'mobile' ? 667 : 600;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          width: isMobile ? '100%' : previewWidth + 100,
          height: isMobile ? '100%' : previewHeight + 150,
          maxWidth: 'none',
          maxHeight: 'none'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Portal Preview</Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!isMobile && (
              <Box sx={{ display: 'flex', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Button
                  size="small"
                  variant={viewMode === 'mobile' ? 'contained' : 'text'}
                  onClick={() => setViewMode('mobile')}
                  startIcon={<MobileIcon />}
                  sx={{ borderRadius: '4px 0 0 4px' }}
                >
                  Mobile
                </Button>
                <Button
                  size="small"
                  variant={viewMode === 'desktop' ? 'contained' : 'text'}
                  onClick={() => setViewMode('desktop')}
                  startIcon={<DesktopIcon />}
                  sx={{ borderRadius: '0 4px 4px 0' }}
                >
                  Desktop
                </Button>
              </Box>
            )}
            
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            width: isMobile ? '100%' : previewWidth,
            height: isMobile ? '100%' : previewHeight,
            border: isMobile ? 0 : 1,
            borderColor: 'divider',
            borderRadius: isMobile ? 0 : 2,
            overflow: 'hidden',
            backgroundColor: '#f5f5f5',
            position: 'relative'
          }}
        >
          {/* Mock Browser/Mobile Frame */}
          {!isMobile && (
            <Box
              sx={{
                height: 40,
                backgroundColor: '#e0e0e0',
                display: 'flex',
                alignItems: 'center',
                px: 2,
                borderBottom: 1,
                borderColor: 'divider'
              }}
            >
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff5f57' }} />
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#28ca42' }} />
              </Box>
              <Box sx={{ ml: 2, flexGrow: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  https://portal.yourorg.com/{portalData.name?.toLowerCase().replace(/\s+/g, '-') || 'portal'}
                </Typography>
              </Box>
            </Box>
          )}
          
          {/* Portal Content */}
          <Box
            sx={{
              height: isMobile ? '100%' : previewHeight - 40,
              overflow: 'auto',
              '& > div': {
                minHeight: '100%'
              }
            }}
          >
            <PreviewPortalContent portalInfo={mockPortalInfo} />
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
          This is a preview of how your portal will appear to users
        </Typography>
        <Button onClick={onClose} variant="contained">
          Close Preview
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Simplified preview content component
const PreviewPortalContent: React.FC<{ portalInfo: any }> = ({ portalInfo }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: portalInfo.branding?.backgroundColor || '#ffffff',
        color: portalInfo.branding?.textColor || '#333333',
        fontFamily: portalInfo.branding?.fontFamily || 'Roboto, sans-serif'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          backgroundColor: portalInfo.branding?.primaryColor || '#1976d2',
          color: 'white',
          py: 3,
          textAlign: 'center'
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontSize: `${portalInfo.branding?.fontSize?.heading || 24}px`,
            fontWeight: 'bold',
            mb: 2
          }}
        >
          {portalInfo.name}
        </Typography>
        
        {portalInfo.branding?.welcomeMessage && (
          <Typography
            variant="h6"
            sx={{
              fontSize: `${portalInfo.branding?.fontSize?.body || 16}px`,
              opacity: 0.9
            }}
          >
            {portalInfo.branding.welcomeMessage}
          </Typography>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
        {portalInfo.branding?.instructionsText && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
            <Typography variant="body2">
              {portalInfo.branding.instructionsText}
            </Typography>
          </Box>
        )}

        {/* Sample Form Fields */}
        <Box
          sx={{
            p: 3,
            backgroundColor: portalInfo.branding?.cardStyle === 'elevated' ? 'white' : 'transparent',
            boxShadow: portalInfo.branding?.cardStyle === 'elevated' ? 2 : 0,
            border: portalInfo.branding?.cardStyle === 'outlined' ? 1 : 0,
            borderColor: 'divider',
            borderRadius: 2,
            '& > div': { mb: 3 }
          }}
        >
          {portalInfo.configuration.fields.length > 0 ? (
            portalInfo.configuration.fields.slice(0, 3).map((field: any, index: number) => (
              <Box key={index}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {field.label} {field.isRequired && <span style={{ color: 'red' }}>*</span>}
                </Typography>
                <Box
                  sx={{
                    height: 40,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    backgroundColor: 'white',
                    color: 'text.secondary'
                  }}
                >
                  {field.placeholder || `Enter ${field.label.toLowerCase()}`}
                </Box>
                {field.helpText && (
                  <Typography variant="caption" color="text.secondary">
                    {field.helpText}
                  </Typography>
                )}
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No form fields configured yet
            </Typography>
          )}

          {/* Submit Button */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              disabled
              sx={{
                backgroundColor: portalInfo.branding?.accentColor || '#ff4081',
                '&:disabled': {
                  backgroundColor: 'rgba(0,0,0,0.12)'
                }
              }}
            >
              Submit Request (Preview)
            </Button>
          </Box>
        </Box>

        {/* Footer */}
        {portalInfo.branding?.footerText && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {portalInfo.branding.footerText}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PortalPreview;