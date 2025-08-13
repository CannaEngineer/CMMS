// Portal Creation Wizard - Step-by-step portal creation interface
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  Check as CheckIcon,
  Preview as PreviewIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon,
  Assignment as FormIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { portalService, portalTemplateService } from '../../services/portalService';
import {
  PortalType,
  CreatePortalRequest,
  PortalTemplate,
  PortalConfiguration,
  PortalBranding,
  PortalField
} from '../../types/portal';
import PortalTemplateSelector from './PortalTemplateSelector';
import PortalFormBuilder from './PortalFormBuilder';
import PortalBrandingEditor from './PortalBrandingEditor';
import PortalConfigurationEditor from './PortalConfigurationEditor';
import PortalPreview from './PortalPreview';
import { transformPortalForBackend } from '../../utils/portalTransforms';

const PORTAL_TYPE_OPTIONS: Array<{ value: PortalType; label: string; description: string; icon: string }> = [
  {
    value: 'maintenance-request',
    label: 'Maintenance Request',
    description: 'Allow users to submit work orders and maintenance requests',
    icon: '🔧'
  },
  {
    value: 'asset-registration',
    label: 'Asset Registration',
    description: 'Enable registration of new equipment and assets',
    icon: '📦'
  },
  {
    value: 'equipment-info',
    label: 'Equipment Info',
    description: 'Collect equipment updates and issue reports',
    icon: '⚙️'
  },
  {
    value: 'general-inquiry',
    label: 'General Inquiry',
    description: 'Handle general facility questions and requests',
    icon: '❓'
  },
  {
    value: 'inspection-report',
    label: 'Inspection Report',
    description: 'Submit safety and quality inspection reports',
    icon: '🔍'
  },
  {
    value: 'safety-incident',
    label: 'Safety Incident',
    description: 'Report safety incidents and near-misses',
    icon: '⚠️'
  }
];

// Simplified mobile-first wizard steps
const WIZARD_STEPS = [
  'Portal Info',
  'Template',
  'Create'
];

// Full desktop wizard steps (for reference)
const FULL_WIZARD_STEPS = [
  'Basic Information',
  'Choose Template', 
  'Configure Form',
  'Customize Branding',
  'Settings & Permissions',
  'Review & Create'
];

interface PortalCreationWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (portal: any) => void;
}

const PortalCreationWizard: React.FC<PortalCreationWizardProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  // Mobile detection for simplified workflow
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeStep, setActiveStep] = useState(0);
  
  // Use simplified steps for mobile, full steps for desktop
  const currentSteps = isMobile ? WIZARD_STEPS : FULL_WIZARD_STEPS;
  const totalSteps = currentSteps.length;

  // Handle window resize for responsive behavior
  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      if (mobile !== isMobile) {
        setIsMobile(mobile);
        // Reset to appropriate step when switching modes
        if (mobile && activeStep > 2) {
          setActiveStep(2); // Reset to last mobile step
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, activeStep]);
  const [portalData, setPortalData] = useState<Partial<CreatePortalRequest>>({
    name: '',
    type: 'maintenance-request',
    description: '',
    configuration: {
      fields: [],
      requiredFields: [],
      customFields: [],
      allowAnonymous: true,
      requireApproval: false,
      defaultPriority: 'MEDIUM',
      defaultStatus: 'PENDING',
      allowFileUploads: true,
      maxFileSize: 10,
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif'],
      maxFiles: 5,
      allowLocationSelection: true,
      allowAssetSelection: false,
      emailNotifications: {
        notifySubmitter: true,
        notifyAdmins: true,
        notifyAssignee: false,
        adminEmails: [],
        emailTemplate: {
          subject: 'New Portal Submission',
          htmlBody: '<p>A new submission has been received.</p>',
          textBody: 'A new submission has been received.'
        },
        submitterConfirmation: {
          enabled: true,
          subject: 'Submission Received',
          htmlBody: '<p>Thank you for your submission.</p>',
          textBody: 'Thank you for your submission.'
        }
      },
      autoCreateWorkOrder: true,
      requireCaptcha: false,
      rateLimitPerHour: 10,
      supportedLanguages: ['en'],
      defaultLanguage: 'en'
    },
    branding: {
      primaryColor: '#1976d2',
      secondaryColor: '#424242',
      accentColor: '#ff4081',
      backgroundColor: '#ffffff',
      textColor: '#333333',
      logoPosition: 'top',
      fontFamily: 'Roboto, sans-serif',
      fontSize: {
        heading: 24,
        body: 16,
        small: 14
      },
      layout: 'single-page',
      showProgressBar: false,
      cardStyle: 'elevated',
      welcomeMessage: 'Welcome to our portal',
      instructionsText: 'Please fill out the form below.',
      thankYouMessage: 'Thank you for your submission.'
    }
  });

  const [selectedTemplate, setSelectedTemplate] = useState<PortalTemplate | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Create portal mutation
  const createPortalMutation = useMutation({
    mutationFn: (data: CreatePortalRequest) => portalService.create(data),
    onSuccess: (portal) => {
      onSuccess(portal);
    },
    onError: (error: any) => {
      console.error('Failed to create portal:', error);
    }
  });

  // Validation functions - simplified for mobile
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (isMobile) {
      // Simplified mobile validation
      switch (step) {
        case 0: // Portal Info
          if (!portalData.name?.trim()) {
            errors.name = 'Portal name is required';
          }
          if (!portalData.type) {
            errors.type = 'Portal type is required'; 
          }
          break;
        case 1: // Template - validation handled by template selector
          break;
        case 2: // Create - no validation needed, just submit
          break;
      }
    } else {
      // Full desktop validation
      switch (step) {
        case 0: // Basic Information
          if (!portalData.name?.trim()) {
            errors.name = 'Portal name is required';
          }
          if (!portalData.type) {
            errors.type = 'Portal type is required';
          }
          break;
        case 2: // Configure Form
          if (!portalData.configuration?.fields?.length) {
            errors.fields = 'At least one form field is required';
          }
          break;
        case 4: // Settings & Permissions
          if (portalData.configuration?.emailNotifications?.notifyAdmins && 
              !portalData.configuration.emailNotifications.adminEmails?.length) {
            errors.adminEmails = 'Admin emails are required when admin notifications are enabled';
          }
          break;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step navigation - handles both mobile and desktop flows
  const handleNext = () => {
    if (validateStep(activeStep)) {
      if (isMobile && activeStep === totalSteps - 1) {
        // Mobile: Last step triggers create immediately
        handleCreatePortal();
      } else if (!isMobile && activeStep === FULL_WIZARD_STEPS.length - 1) {
        // Desktop: Last step triggers create
        handleCreatePortal();
      } else {
        setActiveStep((prev) => prev + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Create portal with smart defaults for mobile
  const handleCreatePortal = () => {
    // Get configuration and branding data
    const config = selectedTemplate?.configuration || portalData.configuration || {};
    const branding = selectedTemplate?.branding || portalData.branding || {};
    
    // Build a complete portal data object with proper structure
    const finalPortalData = {
      // Basic required fields
      name: portalData.name || 'New Portal',
      type: portalData.type || 'maintenance-request',
      description: portalData.description || 'Portal for maintenance requests',
      
      // Configuration properties
      isActive: true,
      allowAnonymous: config.allowAnonymous ?? true,
      requiresApproval: config.requireApproval ?? false,  
      autoCreateWorkOrders: config.autoCreateWorkOrder ?? true,
      maxSubmissionsPerDay: config.rateLimitPerHour ? config.rateLimitPerHour * 24 : undefined,
      
      // Branding properties
      primaryColor: branding.primaryColor || '#1976d2',
      secondaryColor: branding.secondaryColor || '#ffffff',
      accentColor: branding.accentColor || '#ff4081',
      logoUrl: branding.logoUrl,
      backgroundImageUrl: branding.backgroundImageUrl,
      customCss: branding.customCss,
      
      // Notification settings
      notificationEmails: config.emailNotifications?.adminEmails?.join(',') || '',
      autoResponderEnabled: config.emailNotifications?.submitterConfirmation?.enabled ?? true,
      autoResponderMessage: config.emailNotifications?.submitterConfirmation?.textBody || 'Thank you for your submission.',
      
      // Rate limiting
      rateLimitEnabled: true,
      rateLimitRequests: config.rateLimitPerHour || 10,
      rateLimitWindow: 3600,
      
      // QR Code
      qrEnabled: true,
      
      // Portal fields - use configuration fields or sensible defaults
      fields: config.fields && config.fields.length > 0 ? config.fields : [
        { 
          name: 'title', 
          label: 'Issue Title', 
          type: 'TEXT', 
          isRequired: true, 
          orderIndex: 0,
          placeholder: 'Brief description of the issue'
        },
        { 
          name: 'description', 
          label: 'Description', 
          type: 'TEXTAREA', 
          isRequired: true, 
          orderIndex: 1,
          placeholder: 'Detailed description of the issue'
        },
        { 
          name: 'priority', 
          label: 'Priority', 
          type: 'SELECT', 
          isRequired: false, 
          orderIndex: 2, 
          options: ['Low', 'Medium', 'High', 'Urgent']
        }
      ]
    };

    console.log('Portal data before transformation:', JSON.stringify(finalPortalData, null, 2));
    
    try {
      // Transform the data using our utility functions
      const transformedData = transformPortalForBackend(finalPortalData);
      console.log('Transformed portal data:', JSON.stringify(transformedData, null, 2));
      
      createPortalMutation.mutate(transformedData);
    } catch (error) {
      console.error('Error transforming portal data:', error);
      // Show error to user - for now, just log it
    }
  };

  const handleStepClick = (step: number) => {
    if (step < activeStep || validateStep(activeStep)) {
      setActiveStep(step);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (template: PortalTemplate | null) => {
    setSelectedTemplate(template);
    
    if (template) {
      setPortalData(prev => ({
        ...prev,
        templateId: template.id,
        configuration: {
          ...prev.configuration,
          ...template.configuration
        },
        branding: {
          ...prev.branding,
          ...template.branding
        }
      }));
    }
  };

  // Update portal data
  const updatePortalData = (updates: Partial<CreatePortalRequest>) => {
    setPortalData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const updateConfiguration = (updates: Partial<PortalConfiguration>) => {
    setPortalData(prev => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        ...updates
      }
    }));
  };

  const updateBranding = (updates: Partial<PortalBranding>) => {
    setPortalData(prev => ({
      ...prev,
      branding: {
        ...prev.branding,
        ...updates
      }
    }));
  };


  // Render step content
  const renderStepContent = (step: number) => {
    if (isMobile) {
      // Simplified mobile workflow
      switch (step) {
        case 0: // Portal Info - streamlined version
          return (
            <MobilePortalInfoStep
              data={portalData}
              onChange={updatePortalData}
              errors={validationErrors}
            />
          );
        case 1: // Template - simplified selector
          return (
            <MobileTemplateStep
              selectedType={portalData.type || 'maintenance-request'}
              selectedTemplate={selectedTemplate}
              onTemplateSelect={setSelectedTemplate}
            />
          );
        case 2: // Create - summary and create
          return (
            <MobileCreateStep
              data={portalData}
              selectedTemplate={selectedTemplate}
              isCreating={createPortalMutation.isPending}
            />
          );
        default:
          return null;
      }
    } else {
      // Full desktop workflow
      switch (step) {
        case 0:
          return (
            <BasicInformationStep
              data={portalData}
              onChange={updatePortalData}
              errors={validationErrors}
            />
          );

      case 1:
        return (
          <PortalTemplateSelector
            selectedType={portalData.type!}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
          />
        );

      case 2:
        return (
          <PortalFormBuilder
            fields={portalData.configuration?.fields || []}
            onChange={(fields) => updateConfiguration({ fields })}
            portalType={portalData.type!}
            errors={validationErrors}
          />
        );

      case 3:
        return (
          <PortalBrandingEditor
            branding={portalData.branding!}
            onChange={updateBranding}
            portalName={portalData.name || 'Portal'}
          />
        );

      case 4:
        return (
          <PortalConfigurationEditor
            configuration={portalData.configuration!}
            onChange={updateConfiguration}
            errors={validationErrors}
          />
        );

      case 5:
        return (
          <ReviewStep
            portalData={portalData}
            selectedTemplate={selectedTemplate}
            onPreview={() => setIsPreviewMode(true)}
          />
        );

      default:
        return null;
      }
    }
  };

  const canGoNext = activeStep < totalSteps - 1;
  const canGoBack = activeStep > 0;
  const isLastStep = activeStep === totalSteps - 1;

  return (
    <>
      <Dialog
        open={open && !isPreviewMode}
        onClose={onClose}
        maxWidth={isMobile ? "sm" : "lg"}
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { 
            height: isMobile ? '100vh' : '90vh', 
            maxHeight: isMobile ? '100vh' : '90vh',
            // Enhanced contrast for mobile
            boxShadow: isMobile ? 'none' : 'theme.shadows[24]',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, px: isMobile ? 2 : 3 }}>
          <Box component="span" sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 700, display: 'block' }}>
            {isMobile ? "Create Portal" : "Create New Portal"}
          </Box>
          <Box component="span" sx={{ fontSize: '0.875rem', color: 'text.secondary', fontWeight: 500, display: 'block' }}>
            {isMobile 
              ? `Step ${activeStep + 1} of ${totalSteps}` 
              : "Set up a public portal for external submissions"
            }
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* Stepper - Mobile optimized */}
          <Box sx={{ px: isMobile ? 2 : 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Stepper 
              activeStep={activeStep} 
              alternativeLabel={!isMobile}
              orientation={isMobile ? "horizontal" : "horizontal"}
              sx={{
                '& .MuiStepLabel-label': {
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  fontWeight: 600,
                },
                '& .MuiStepIcon-root': {
                  fontSize: isMobile ? '1.5rem' : '1.75rem',
                },
              }}
            >
              {currentSteps.map((label, index) => (
                <Step
                  key={label}
                  onClick={() => handleStepClick(index)}
                  sx={{ cursor: index <= activeStep ? 'pointer' : 'default' }}
                >
                  <StepLabel 
                    sx={{
                      '& .MuiStepLabel-labelContainer': {
                        maxWidth: isMobile ? '60px' : 'none',
                      }
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Step Content */}
          <Box sx={{ p: 3, flexGrow: 1, overflow: 'auto' }}>
            {renderStepContent(activeStep)}
          </Box>

          {/* Error Display */}
          {Object.keys(validationErrors).length > 0 && (
            <Box sx={{ px: 3, pb: 2 }}>
              <Alert severity="error">
                <Box component="div">
                  Please fix the following errors:
                  <Box component="ul" sx={{ margin: '8px 0 0 20px', pl: 0 }}>
                    {Object.entries(validationErrors).map(([field, message]) => (
                      <Box component="li" key={field} sx={{ listStyle: 'disc', ml: 2 }}>{message}</Box>
                    ))}
                  </Box>
                </Box>
              </Alert>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ 
          p: isMobile ? 2 : 3, 
          borderTop: 1, 
          borderColor: 'divider',
          gap: isMobile ? 1 : 2,
          flexDirection: isMobile ? 'column' : 'row',
        }}>
          {/* Mobile: Stack buttons vertically for better touch */}
          {isMobile ? (
            <>
              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                onClick={handleNext}
                disabled={createPortalMutation.isPending}
                sx={{ 
                  minHeight: 56,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: 2,
                }}
                endIcon={activeStep === totalSteps - 1 ? <CheckIcon /> : <ForwardIcon />}
              >
                {activeStep === totalSteps - 1 ? 'Create Portal' : 'Next'}
              </Button>
              
              <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                {activeStep > 0 && (
                  <Button
                    startIcon={<BackIcon />}
                    onClick={handleBack}
                    disabled={createPortalMutation.isPending}
                    size="large"
                    sx={{
                      flex: 1,
                      minHeight: 48,
                      fontSize: '1rem',
                      textTransform: 'none',
                    }}
                  >
                    Back
                  </Button>
                )}
                
                <Button 
                  onClick={onClose}
                  disabled={createPortalMutation.isPending}
                  size="large"
                  sx={{
                    flex: activeStep > 0 ? 1 : 2,
                    minHeight: 48,
                    fontSize: '1rem',
                    textTransform: 'none',
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </>
          ) : (
            // Desktop: Horizontal layout
            <>
              <Button onClick={onClose} disabled={createPortalMutation.isPending}>
                Cancel
              </Button>
              
              <Box sx={{ flexGrow: 1 }} />
              
              {activeStep > 0 && (
                <Button
                  startIcon={<BackIcon />}
                  onClick={handleBack}
                  disabled={createPortalMutation.isPending}
                >
                  Back
                </Button>
              )}
              
              <Button
                variant="contained"
                endIcon={activeStep === FULL_WIZARD_STEPS.length - 1 ? <CheckIcon /> : <ForwardIcon />}
                onClick={handleNext}
                disabled={createPortalMutation.isPending}
              >
                {activeStep === FULL_WIZARD_STEPS.length - 1 ? 'Create Portal' : 'Next'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      {isPreviewMode && (
        <PortalPreview
          portalData={portalData}
          open={isPreviewMode}
          onClose={() => setIsPreviewMode(false)}
        />
      )}
    </>
  );
};

// Basic Information Step Component
const BasicInformationStep: React.FC<{
  data: Partial<CreatePortalRequest>;
  onChange: (updates: Partial<CreatePortalRequest>) => void;
  errors: Record<string, string>;
}> = ({ data, onChange, errors }) => {
  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        Portal Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Provide basic information about your portal
      </Typography>

      <Grid container spacing={3}>
        <Grid xs={12}>
          <TextField
            fullWidth
            label="Portal Name"
            value={data.name || ''}
            onChange={(e) => onChange({ name: e.target.value })}
            error={Boolean(errors.name)}
            helperText={errors.name || 'Choose a descriptive name for your portal'}
            required
          />
        </Grid>

        <Grid xs={12}>
          <FormControl fullWidth error={Boolean(errors.type)}>
            <InputLabel>Portal Type</InputLabel>
            <Select
              value={data.type || ''}
              onChange={(e) => onChange({ type: e.target.value as PortalType })}
              label="Portal Type"
              required
            >
              {PORTAL_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span style={{ fontSize: '1.2em' }}>{option.icon}</span>
                    <Box>
                      <Typography variant="body1">{option.label}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.description}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid xs={12}>
          <TextField
            fullWidth
            label="Description"
            value={data.description || ''}
            onChange={(e) => onChange({ description: e.target.value })}
            multiline
            rows={3}
            helperText="Provide a brief description of what this portal is for"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

// Review Step Component
const ReviewStep: React.FC<{
  portalData: Partial<CreatePortalRequest>;
  selectedTemplate: PortalTemplate | null;
  onPreview: () => void;
}> = ({ portalData, selectedTemplate, onPreview }) => {
  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h6" gutterBottom>
        Review Your Portal
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review all settings before creating your portal
      </Typography>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <FormIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Basic Information
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Name"
                    secondary={portalData.name}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Type"
                    secondary={PORTAL_TYPE_OPTIONS.find(t => t.value === portalData.type)?.label}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Description"
                    secondary={portalData.description || 'No description'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Template */}
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Template & Configuration
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Template"
                    secondary={selectedTemplate?.name || 'Custom configuration'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Form Fields"
                    secondary={`${portalData.configuration?.fields?.length || 0} fields configured`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="File Uploads"
                    secondary={portalData.configuration?.allowFileUploads ? 'Enabled' : 'Disabled'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Branding */}
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PaletteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Branding
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Primary Color"
                    secondary={
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          component="span"
                          sx={{
                            width: 16,
                            height: 16,
                            backgroundColor: portalData.branding?.primaryColor,
                            borderRadius: 1,
                            display: 'inline-block'
                          }}
                        />
                        {portalData.branding?.primaryColor}
                      </Box>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Layout"
                    secondary={portalData.branding?.layout}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Card Style"
                    secondary={portalData.branding?.cardStyle}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Settings */}
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ShareIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Settings
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Anonymous Submissions"
                    secondary={portalData.configuration?.allowAnonymous ? 'Allowed' : 'Not allowed'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Auto-create Work Orders"
                    secondary={portalData.configuration?.autoCreateWorkOrder ? 'Yes' : 'No'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Rate Limit"
                    secondary={`${portalData.configuration?.rateLimitPerHour || 10} submissions per hour`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Preview Button */}
        <Grid xs={12}>
          <Card sx={{ textAlign: 'center' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Portal Preview
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Preview how your portal will look to users
              </Typography>
              <Button
                variant="outlined"
                size="large"
                startIcon={<PreviewIcon />}
                onClick={onPreview}
              >
                Preview Portal
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Simplified Mobile Step Components for field technician usability

const MobilePortalInfoStep: React.FC<{
  data: Partial<CreatePortalRequest>;
  onChange: (updates: Partial<CreatePortalRequest>) => void;
  errors: Record<string, string>;
}> = ({ data, onChange, errors }) => (
  <Box sx={{ p: 2 }}>
    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
      Portal Information
    </Typography>
    
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <TextField
        fullWidth
        label="Portal Name"
        value={data.name || ''}
        onChange={(e) => onChange({ name: e.target.value })}
        error={!!errors.name}
        helperText={errors.name || 'Choose a descriptive name'}
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            minHeight: 56, // Enhanced touch target
            fontSize: '1.1rem',
          },
          '& .MuiInputLabel-root': {
            fontSize: '1rem',
            fontWeight: 600,
          }
        }}
      />
      
      <FormControl fullWidth error={!!errors.type}>
        <InputLabel sx={{ fontSize: '1rem', fontWeight: 600 }}>Portal Type</InputLabel>
        <Select
          value={data.type || 'maintenance-request'}
          onChange={(e) => onChange({ type: e.target.value as PortalType })}
          label="Portal Type"
          sx={{
            minHeight: 56, // Enhanced touch target
            fontSize: '1.1rem',
          }}
        >
          {PORTAL_TYPE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value} sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: '1.5rem' }}>{option.icon}</span>
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    {option.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    {option.description}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <TextField
        fullWidth
        label="Description (Optional)"
        value={data.description || ''}
        onChange={(e) => onChange({ description: e.target.value })}
        multiline
        rows={3}
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            fontSize: '1rem',
          },
          '& .MuiInputLabel-root': {
            fontSize: '1rem',
          }
        }}
      />
    </Box>
  </Box>
);

const MobileTemplateStep: React.FC<{
  selectedType: PortalType;
  selectedTemplate: PortalTemplate | null;
  onTemplateSelect: (template: PortalTemplate | null) => void;
}> = ({ selectedType, selectedTemplate, onTemplateSelect }) => (
  <Box sx={{ p: 2 }}>
    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
      Choose Template
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      Start with a pre-built template or create from scratch
    </Typography>
    
    {/* Mobile-optimized template selector */}
    <PortalTemplateSelector
      selectedType={selectedType}
      selectedTemplate={selectedTemplate}
      onTemplateSelect={onTemplateSelect}
    />
  </Box>
);

const MobileCreateStep: React.FC<{
  data: Partial<CreatePortalRequest>;
  selectedTemplate: PortalTemplate | null;
  isCreating: boolean;
}> = ({ data, selectedTemplate, isCreating }) => (
  <Box sx={{ p: 2 }}>
    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
      Ready to Create
    </Typography>
    
    <Card sx={{ mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Portal Name</Typography>
            <Typography variant="h6" fontWeight={600}>{data.name}</Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2" color="text.secondary">Type</Typography>
            <Typography variant="body1">
              {PORTAL_TYPE_OPTIONS.find(opt => opt.value === data.type)?.label}
            </Typography>
          </Box>
          
          {selectedTemplate && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Template</Typography>
              <Typography variant="body1">{selectedTemplate.name}</Typography>
            </Box>
          )}
          
          {data.description && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Description</Typography>
              <Typography variant="body2">{data.description}</Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
    
    {isCreating && (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={48} />
          <Typography variant="body1" color="text.secondary">
            Creating your portal...
          </Typography>
        </Box>
      </Box>
    )}
  </Box>
);

export default PortalCreationWizard;