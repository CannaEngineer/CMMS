// Public Portal Form - Mobile-first submission interface for external users
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  PhotoCamera as CameraIcon,
  AttachFile as AttachIcon,
  Send as SendIcon,
  CheckCircle as SuccessIcon,
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { publicPortalService, portalSubmissionService } from '../../services/portalService';
import { 
  SubmitPortalRequest, 
  PortalField, 
  FieldType,
  Portal
} from '../../types/portal';
import PortalFieldRenderer from './PortalFieldRenderer';
import LocationPicker from './LocationPicker';
import PhotoCapture from './PhotoCapture';
import PrioritySelector from './PrioritySelector';

interface PublicPortalFormProps {
  portalSlug: string;
  onSubmissionSuccess?: (submissionId: string, trackingCode: string) => void;
}

const PublicPortalForm: React.FC<PublicPortalFormProps> = ({
  portalSlug,
  onSubmissionSuccess
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitterInfo, setSubmitterInfo] = useState<Partial<SubmitterInfo>>({
    isAnonymous: false,
    preferredContact: 'email',
    allowFollowUp: true
  });
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    fileId: string;
    filename: string;
    url: string;
    size: number;
    originalFile: File;
  }>>([]);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Fetch portal information
  const { data: portalInfo, isLoading: isLoadingPortal, error: portalError } = useQuery({
    queryKey: ['public-portal', portalSlug],
    queryFn: () => publicPortalService.getPortalInfo(portalSlug),
    retry: 2
  });

  // Submit form mutation
  const submitFormMutation = useMutation({
    mutationFn: (request: PortalSubmissionRequest) => 
      portalSubmissionService.submitForm(request),
    onSuccess: (response) => {
      setSubmissionResult(response);
      setShowSuccess(true);
      
      // Record portal view for analytics
      if (portalInfo) {
        publicPortalService.recordPortalView(portalInfo.id, {
          converted: true,
          completionTime: Date.now() - startTime.current
        });
      }
      
      if (onSubmissionSuccess && response.submissionId && response.trackingCode) {
        onSubmissionSuccess(response.submissionId, response.trackingCode);
      }
    },
    onError: (error: any) => {
      console.error('Submission failed:', error);
    }
  });

  const startTime = useRef(Date.now());

  // Get user location if needed
  useEffect(() => {
    if (portalInfo?.configuration.allowLocationSelection) {
      navigator.geolocation?.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.debug('Location not available:', error);
        }
      );
    }
  }, [portalInfo]);

  // Record portal view for analytics
  useEffect(() => {
    if (portalInfo) {
      publicPortalService.recordPortalView(portalInfo.id, {
        userAgent: navigator.userAgent,
        language: navigator.language,
        referrer: document.referrer
      });
    }
  }, [portalInfo]);

  // Initialize form data with default values
  useEffect(() => {
    if (portalInfo?.configuration.fields) {
      const initialData: Record<string, any> = {};
      
      portalInfo.configuration.fields.forEach(field => {
        if (field.type === 'checkbox') {
          initialData[field.name] = [];
        } else if (field.options?.find(opt => opt.isDefault)) {
          initialData[field.name] = field.options.find(opt => opt.isDefault)?.value;
        } else {
          initialData[field.name] = '';
        }
      });
      
      setFormData(initialData);
    }
  }, [portalInfo]);

  // Group fields for multi-step form
  const getFieldSteps = (): PortalField[][] => {
    if (!portalInfo?.configuration.fields) return [];
    
    if (portalInfo.branding.layout === 'multi-step') {
      // Group fields into logical steps
      const steps: PortalField[][] = [];
      const fieldsPerStep = Math.ceil(portalInfo.configuration.fields.length / 3);
      
      for (let i = 0; i < portalInfo.configuration.fields.length; i += fieldsPerStep) {
        steps.push(portalInfo.configuration.fields.slice(i, i + fieldsPerStep));
      }
      
      return steps;
    } else {
      // Single step
      return [portalInfo.configuration.fields];
    }
  };

  const fieldSteps = getFieldSteps();

  // Validation
  const validateCurrentStep = (): boolean => {
    if (!portalInfo) return false;
    
    const errors: Record<string, string> = {};
    const currentFields = fieldSteps[currentStep] || [];
    
    currentFields.forEach(field => {
      if (field.isRequired) {
        const value = formData[field.name];
        
        if (!value || (Array.isArray(value) && value.length === 0)) {
          errors[field.name] = `${field.label} is required`;
        }
      }
      
      // Validate field formats
      const value = formData[field.name];
      if (value && field.validation) {
        if (field.validation.pattern) {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(value)) {
            errors[field.name] = `Invalid format for ${field.label}`;
          }
        }
        
        if (field.validation.minLength && value.length < field.validation.minLength) {
          errors[field.name] = `${field.label} must be at least ${field.validation.minLength} characters`;
        }
        
        if (field.validation.maxLength && value.length > field.validation.maxLength) {
          errors[field.name] = `${field.label} must be no more than ${field.validation.maxLength} characters`;
        }
      }
    });
    
    // Validate submitter info on last step
    if (currentStep === fieldSteps.length - 1 && !portalInfo.configuration.allowAnonymous) {
      if (!submitterInfo.name?.trim()) {
        errors.submitterName = 'Name is required';
      }
      if (!submitterInfo.email?.trim()) {
        errors.submitterEmail = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(submitterInfo.email)) {
        errors.submitterEmail = 'Valid email is required';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form field changes
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Handle file uploads
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const maxFiles = portalInfo?.configuration.maxFiles || 5;
    const maxSize = (portalInfo?.configuration.maxFileSize || 10) * 1024 * 1024; // Convert MB to bytes
    
    const validFiles = selectedFiles.filter(file => {
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is ${portalInfo?.configuration.maxFileSize}MB`);
        return false;
      }
      
      const allowedTypes = portalInfo?.configuration.allowedFileTypes || [];
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        alert(`File ${file.name} is not an allowed type`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    // Check if adding these files would exceed the limit
    const currentFileCount = uploadedFiles.length;
    const newFileCount = Math.min(validFiles.length, maxFiles - currentFileCount);
    const filesToUpload = validFiles.slice(0, newFileCount);

    if (newFileCount < validFiles.length) {
      alert(`Only ${newFileCount} files can be uploaded. Maximum is ${maxFiles} files total.`);
    }

    setUploading(true);
    try {
      // Upload files individually to show progress
      for (const file of filesToUpload) {
        try {
          const uploadedFile = await publicPortalService.uploadFile(portalSlug, file, 'attachments');
          setUploadedFiles(prev => [...prev, {
            ...uploadedFile,
            originalFile: file
          }]);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          alert(`Failed to upload ${file.name}. Please try again.`);
        }
      }
    } finally {
      setUploading(false);
      // Clear the input
      event.target.value = '';
    }
  };

  // Handle photo capture
  const handlePhotoCapture = async (photo: File) => {
    const maxFiles = portalInfo?.configuration.maxFiles || 5;
    
    if (uploadedFiles.length >= maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    try {
      const uploadedFile = await publicPortalService.uploadFile(portalSlug, photo, 'photos');
      setUploadedFiles(prev => [...prev, {
        ...uploadedFile,
        originalFile: photo
      }]);
    } catch (error) {
      console.error('Failed to upload photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Remove uploaded file
  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.fileId !== fileId));
  };

  // Navigation
  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Submit form
  const handleSubmit = () => {
    if (!validateCurrentStep() || !portalInfo) return;
    
    const request: PortalSubmissionRequest = {
      portalId: portalInfo.id,
      formData: {
        ...formData,
        // Include uploaded file info in form data
        attachments: uploadedFiles.map(file => ({
          fileId: file.fileId,
          filename: file.filename,
          url: file.url,
          size: file.size
        }))
      },
      files: uploadedFiles.map(file => file.originalFile),
      submitter: submitterInfo,
      captchaToken: captchaToken || undefined,
      language: portalInfo.configuration.defaultLanguage,
      submissionLocation: userLocation ? {
        latitude: userLocation.lat,
        longitude: userLocation.lng
      } : undefined,
      referrer: document.referrer,
      utmParams: {}
    };
    
    submitFormMutation.mutate(request);
  };

  // Loading state
  if (isLoadingPortal) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Error state
  if (portalError || !portalInfo) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">
          Portal not found or unavailable. Please check the URL and try again.
        </Alert>
      </Container>
    );
  }

  // Inactive portal
  if (!portalInfo.isActive) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="warning">
          This portal is currently inactive. Please contact the administrator.
        </Alert>
      </Container>
    );
  }

  const isMultiStep = portalInfo.branding.layout === 'multi-step';
  const isLastStep = currentStep === fieldSteps.length - 1;
  const currentFields = fieldSteps[currentStep] || [];

  // Field details for debugging
  console.log('Portal Form Debug - Field Details:', {
    currentFieldsLength: currentFields.length,
    currentFields: currentFields.map(f => ({
      fieldType: f.fieldType,
      fieldName: f.fieldName,
      fieldLabel: f.fieldLabel,
      label: f.label,
      allProps: Object.keys(f)
    }))
  });

  return (
    <>
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: portalInfo.branding.backgroundColor,
          color: portalInfo.branding.textColor,
          fontFamily: portalInfo.branding.fontFamily
        }}
      >
        {/* Header */}
        <Box
          sx={{
            backgroundColor: portalInfo.branding.primaryColor,
            color: 'white',
            py: 3,
            textAlign: 'center'
          }}
        >
          <Container maxWidth="sm">
            {portalInfo.organizationInfo.logoUrl && (
              <Box sx={{ mb: 2 }}>
                <img
                  src={portalInfo.organizationInfo.logoUrl}
                  alt="Organization Logo"
                  style={{ maxHeight: '60px', maxWidth: '200px' }}
                />
              </Box>
            )}
            
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontSize: `${portalInfo.branding.fontSize.heading}px`,
                fontWeight: 'bold',
                mb: 2
              }}
            >
              {portalInfo.name}
            </Typography>
            
            {portalInfo.branding.welcomeMessage && (
              <Typography
                variant="h6"
                sx={{
                  fontSize: `${portalInfo.branding.fontSize.body}px`,
                  opacity: 0.9
                }}
              >
                {portalInfo.branding.welcomeMessage}
              </Typography>
            )}
          </Container>
        </Box>

        <Container maxWidth="sm" sx={{ py: 3 }}>
          {/* Instructions */}
          {portalInfo.branding.instructionsText && (
            <Box sx={{ mb: 3 }}>
              <Alert severity="info" icon={<HelpIcon />}>
                {portalInfo.branding.instructionsText}
              </Alert>
            </Box>
          )}

          {/* Progress Bar */}
          {isMultiStep && portalInfo.branding.showProgressBar && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress
                variant="determinate"
                value={(currentStep / (fieldSteps.length - 1)) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: portalInfo.branding.accentColor
                  }
                }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, textAlign: 'center' }}
              >
                Step {currentStep + 1} of {fieldSteps.length}
              </Typography>
            </Box>
          )}

          {/* Stepper for Multi-step */}
          {isMultiStep && !isMobile && (
            <Box sx={{ mb: 3 }}>
              <Stepper activeStep={currentStep} alternativeLabel>
                {fieldSteps.map((_, index) => (
                  <Step key={index}>
                    <StepLabel>Step {index + 1}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          )}

          {/* Form */}
          <Paper
            elevation={portalInfo.branding.cardStyle === 'elevated' ? 3 : 0}
            variant={portalInfo.branding.cardStyle === 'outlined' ? 'outlined' : 'elevation'}
            sx={{
              p: 3,
              borderRadius: 2,
              ...(portalInfo.branding.cardStyle === 'minimal' && {
                boxShadow: 'none',
                border: 'none'
              })
            }}
          >
            {/* Current Step Fields */}
            <Box sx={{ mb: 3 }}>
              {currentFields.map((field) => (
                <Box key={field.id} sx={{ mb: 3 }}>
                  <PortalFieldRenderer
                    field={field}
                    value={formData[field.name]}
                    onChange={(value) => handleFieldChange(field.name, value)}
                    error={validationErrors[field.name]}
                    branding={portalInfo.branding}
                  />
                </Box>
              ))}
            </Box>

            {/* File Upload Section */}
            {isLastStep && portalInfo.configuration.allowFileUploads && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Attachments (Optional)
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    startIcon={uploading ? <CircularProgress size={16} /> : <AttachIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    size="small"
                    disabled={uploading || uploadedFiles.length >= (portalInfo?.configuration.maxFiles || 5)}
                  >
                    {uploading ? 'Uploading...' : 'Add Files'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={uploading ? <CircularProgress size={16} /> : <CameraIcon />}
                    onClick={() => cameraInputRef.current?.click()}
                    size="small"
                    disabled={uploading || uploadedFiles.length >= (portalInfo?.configuration.maxFiles || 5)}
                  >
                    {uploading ? 'Uploading...' : 'Take Photo'}
                  </Button>
                </Box>

                {/* File Inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={portalInfo.configuration.allowedFileTypes.join(',')}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Uploaded Files ({uploadedFiles.length}/{portalInfo?.configuration.maxFiles || 5}):
                    </Typography>
                    {uploadedFiles.map((file, index) => (
                      <Box key={file.fileId} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Chip
                          label={`${file.originalFile.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`}
                          onDelete={() => handleRemoveFile(file.fileId)}
                          sx={{ mr: 1 }}
                          color="success"
                          variant="outlined"
                        />
                        {file.url && (
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => window.open(file.url, '_blank')}
                            sx={{ ml: 1 }}
                          >
                            View
                          </Button>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Upload Progress */}
                {uploading && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Uploading files...
                    </Typography>
                    <LinearProgress sx={{ mt: 1 }} />
                  </Box>
                )}
              </Box>
            )}

            {/* Submitter Information */}
            {isLastStep && !portalInfo.configuration.allowAnonymous && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Contact Information
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={submitterInfo.name || ''}
                    onChange={(e) => setSubmitterInfo(prev => ({ ...prev, name: e.target.value }))}
                    error={Boolean(validationErrors.submitterName)}
                    helperText={validationErrors.submitterName}
                    required
                  />
                  
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={submitterInfo.email || ''}
                    onChange={(e) => setSubmitterInfo(prev => ({ ...prev, email: e.target.value }))}
                    error={Boolean(validationErrors.submitterEmail)}
                    helperText={validationErrors.submitterEmail}
                    required
                  />
                  
                  <TextField
                    fullWidth
                    label="Phone (Optional)"
                    value={submitterInfo.phone || ''}
                    onChange={(e) => setSubmitterInfo(prev => ({ ...prev, phone: e.target.value }))}
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={submitterInfo.allowFollowUp}
                        onChange={(e) => setSubmitterInfo(prev => ({ ...prev, allowFollowUp: e.target.checked }))}
                      />
                    }
                    label="Allow follow-up contact"
                  />
                </Box>
              </Box>
            )}

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              {currentStep > 0 && (
                <Button
                  startIcon={<BackIcon />}
                  onClick={handleBack}
                  disabled={submitFormMutation.isPending}
                >
                  Back
                </Button>
              )}
              
              <Box sx={{ flexGrow: 1 }} />
              
              {!isLastStep ? (
                <Button
                  variant="contained"
                  endIcon={<ForwardIcon />}
                  onClick={handleNext}
                  sx={{
                    backgroundColor: portalInfo.branding.primaryColor,
                    '&:hover': {
                      backgroundColor: portalInfo.branding.secondaryColor
                    }
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={submitFormMutation.isPending ? <CircularProgress size={16} /> : <SendIcon />}
                  onClick={handleSubmit}
                  disabled={submitFormMutation.isPending}
                  sx={{
                    backgroundColor: portalInfo.branding.accentColor,
                    '&:hover': {
                      backgroundColor: portalInfo.branding.primaryColor
                    }
                  }}
                >
                  {submitFormMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </Button>
              )}
            </Box>
          </Paper>

          {/* Organization Contact Info */}
          {portalInfo.organizationInfo.contactInfo && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Questions? Contact us: {portalInfo.organizationInfo.contactInfo}
              </Typography>
            </Box>
          )}
        </Container>
      </Box>

      {/* Success Dialog */}
      <Dialog
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <SuccessIcon
            sx={{
              fontSize: 64,
              color: 'success.main',
              mb: 2
            }}
          />
          
          <Typography variant="h5" gutterBottom>
            {portalInfo.branding.thankYouMessage || 'Thank you!'}
          </Typography>
          
          {submissionResult?.message && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {submissionResult.message}
            </Typography>
          )}
          
          {submissionResult?.trackingCode && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Your tracking code:
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: 'monospace',
                  backgroundColor: 'grey.100',
                  py: 1,
                  px: 2,
                  borderRadius: 1,
                  display: 'inline-block'
                }}
              >
                {submissionResult.trackingCode}
              </Typography>
            </Box>
          )}
          
          {submissionResult?.nextSteps && (
            <Box sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Next steps:
              </Typography>
              <ul>
                {submissionResult.nextSteps.map((step: string, index: number) => (
                  <li key={index}>
                    <Typography variant="body2">{step}</Typography>
                  </li>
                ))}
              </ul>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button
            onClick={() => setShowSuccess(false)}
            variant="contained"
            fullWidth
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PublicPortalForm;