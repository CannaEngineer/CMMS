/**
 * Portal Demo Component
 * Demonstrates the key features of the maintenance request portal system
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
} from '@mui/material';
import {
  QrCode as QrCodeIcon,
  Link as LinkIcon,
  Visibility as ViewIcon,
  ContentCopy as CopyIcon,
  Share as ShareIcon,
  Analytics as AnalyticsIcon,
  Build as MaintenanceIcon,
  Add as AddIcon,
  Info as InfoIcon,
  Assignment as ReportIcon,
} from '@mui/icons-material';

const DEMO_PORTALS = [
  {
    id: '1',
    name: 'Facility Maintenance Requests',
    type: 'maintenance-request',
    description: 'Submit maintenance issues and repair requests',
    slug: 'facility-maintenance',
    publicUrl: 'https://yourcompany.com/portal/facility-maintenance',
    submissionCount: 45,
    isActive: true,
    color: '#ff6b35'
  },
  {
    id: '2', 
    name: 'New Equipment Registration',
    type: 'asset-registration',
    description: 'Register new equipment and assets for tracking',
    slug: 'equipment-registration',
    publicUrl: 'https://yourcompany.com/portal/equipment-registration',
    submissionCount: 12,
    isActive: true,
    color: '#4dabf7'
  },
  {
    id: '3',
    name: 'Safety Incident Reports',
    type: 'safety-incident',
    description: 'Report safety incidents and near-misses',
    slug: 'safety-reports',
    publicUrl: 'https://yourcompany.com/portal/safety-reports',
    submissionCount: 3,
    isActive: true,
    color: '#fa5252'
  }
];

const getPortalIcon = (type: string) => {
  switch (type) {
    case 'maintenance-request': return <MaintenanceIcon />;
    case 'asset-registration': return <AddIcon />;
    case 'safety-incident': return <ReportIcon />;
    default: return <InfoIcon />;
  }
};

const PortalDemo: React.FC = () => {
  const [selectedPortal, setSelectedPortal] = useState<typeof DEMO_PORTALS[0] | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    // You could show a toast notification here
    console.log('URL copied to clipboard');
  };

  const handleShare = (portal: typeof DEMO_PORTALS[0]) => {
    if (navigator.share) {
      navigator.share({
        title: portal.name,
        text: portal.description,
        url: portal.publicUrl,
      });
    } else {
      handleCopyUrl(portal.publicUrl);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        🚀 Portal System Demo
      </Typography>
      
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
          Welcome to the Maintenance Request Portal System!
        </Typography>
        <Typography variant="body2">
          This system allows you to create public-facing portals where external users can submit maintenance requests, 
          register new equipment, report safety incidents, and more - all without needing to log in to your CMMS.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {DEMO_PORTALS.map((portal) => (
          <Grid item xs={12} md={6} lg={4} key={portal.id}>
            <Card 
              sx={{ 
                height: '100%',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
                border: 2,
                borderColor: 'transparent',
                '&:hover': {
                  borderColor: portal.color,
                }
              }}
              onClick={() => setSelectedPortal(portal)}
            >
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: portal.color,
                      width: 48,
                      height: 48,
                    }}
                  >
                    {getPortalIcon(portal.type)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                      {portal.name}
                    </Typography>
                    <Chip 
                      label={portal.type.replace('-', ' ')}
                      size="small"
                      sx={{ 
                        textTransform: 'capitalize',
                        mt: 0.5,
                        bgcolor: `${portal.color}20`,
                        color: portal.color
                      }}
                    />
                  </Box>
                </Box>

                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ mb: 3, flexGrow: 1 }}
                >
                  {portal.description}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Public URL
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontFamily: 'monospace',
                      bgcolor: 'grey.100',
                      p: 1,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      wordBreak: 'break-all'
                    }}
                  >
                    {portal.publicUrl}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Submissions
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: portal.color }}>
                      {portal.submissionCount}
                    </Typography>
                  </Box>
                  <Chip
                    label={portal.isActive ? 'Active' : 'Inactive'}
                    color={portal.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Box>

                <Stack direction="row" spacing={1}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPortal(portal);
                      setQrDialogOpen(true);
                    }}
                    sx={{ bgcolor: 'action.hover' }}
                  >
                    <QrCodeIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyUrl(portal.publicUrl);
                    }}
                    sx={{ bgcolor: 'action.hover' }}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(portal);
                    }}
                    sx={{ bgcolor: 'action.hover' }}
                  >
                    <ShareIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(portal.publicUrl, '_blank');
                    }}
                    sx={{ bgcolor: 'action.hover' }}
                  >
                    <ViewIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Key Features Section */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          🎯 Key Features
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                📱 Mobile-First Design
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Optimized for smartphones and tablets. Workers in the field can easily submit requests, capture photos, and provide location details.
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'success.main' }}>
                🔓 No Login Required
              </Typography>
              <Typography variant="body2" color="text.secondary">
                External users can submit requests instantly without creating accounts. Perfect for contractors, tenants, and visitors.
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'warning.main' }}>
                📊 Auto Work Order Creation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Submissions automatically create work orders in your CMMS with proper categorization, priority, and assignment.
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'info.main' }}>
                🎨 Custom Branding
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Customize colors, logos, and messaging to match your organization's branding and maintain a professional appearance.
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* QR Code Dialog */}
      <Dialog
        open={qrDialogOpen}
        onClose={() => setQrDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          QR Code for {selectedPortal?.name}
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
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
              mx: 'auto',
              mb: 2,
              bgcolor: 'grey.50'
            }}
          >
            <QrCodeIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Scan this QR code to access the portal directly on mobile devices
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              fontFamily: 'monospace',
              bgcolor: 'grey.100',
              p: 1,
              borderRadius: 1,
              display: 'block'
            }}
          >
            {selectedPortal?.publicUrl}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialogOpen(false)}>
            Close
          </Button>
          <Button 
            variant="contained"
            startIcon={<CopyIcon />}
            onClick={() => selectedPortal && handleCopyUrl(selectedPortal.publicUrl)}
          >
            Copy URL
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PortalDemo;