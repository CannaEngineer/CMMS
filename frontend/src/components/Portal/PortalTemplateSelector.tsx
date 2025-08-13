// Portal Template Selector - Choose from predefined or custom templates
import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Build as BuildIcon,
  Assignment as FormIcon,
  Inventory as AssetIcon,
  Help as InquiryIcon,
  Assessment as InspectionIcon,
  Warning as SafetyIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { portalTemplateService } from '../../services/portalService';
import { PortalType, PortalTemplate } from '../../types/portal';

const PORTAL_TYPE_ICONS: Record<PortalType, React.ReactNode> = {
  'maintenance-request': <BuildIcon />,
  'asset-registration': <AssetIcon />,
  'equipment-info': <FormIcon />,
  'general-inquiry': <InquiryIcon />,
  'inspection-report': <InspectionIcon />,
  'safety-incident': <SafetyIcon />
};

interface PortalTemplateSelectorProps {
  selectedType: PortalType;
  selectedTemplate: PortalTemplate | null;
  onTemplateSelect: (template: PortalTemplate | null) => void;
}

const PortalTemplateSelector: React.FC<PortalTemplateSelectorProps> = ({
  selectedType,
  selectedTemplate,
  onTemplateSelect
}) => {
  const [showCustomOption, setShowCustomOption] = useState(false);

  // Fetch available templates
  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ['portal-templates', selectedType],
    queryFn: () => portalTemplateService.getTemplates()
  });

  // Filter templates by selected type
  const filteredTemplates = templates.filter(template => template.type === selectedType);

  const handleTemplateSelect = (template: PortalTemplate | null) => {
    onTemplateSelect(template);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load templates. You can still create a custom portal.
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h6" gutterBottom>
        Choose a Template
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Start with a pre-built template or create a custom portal from scratch
      </Typography>

      <RadioGroup
        value={selectedTemplate?.id || 'custom'}
        onChange={(e) => {
          const value = e.target.value;
          if (value === 'custom') {
            handleTemplateSelect(null);
          } else {
            const template = filteredTemplates.find(t => t.id === value);
            handleTemplateSelect(template || null);
          }
        }}
      >
        <Grid container spacing={3}>
          {/* Pre-built Templates */}
          {filteredTemplates.map((template) => (
            <Grid xs={12} sm={6} md={4} key={template.id}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  border: selectedTemplate?.id === template.id ? 2 : 1,
                  borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: 2
                  }
                }}
                onClick={() => handleTemplateSelect(template)}
              >
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ color: 'primary.main', mr: 1 }}>
                      {PORTAL_TYPE_ICONS[template.type]}
                    </Box>
                    <FormControlLabel
                      value={template.id}
                      control={<Radio />}
                      label=""
                      sx={{ mr: 0 }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    {template.name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {template.description}
                  </Typography>

                  {template.tags && template.tags.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {template.tags.slice(0, 3).map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {template.configuration?.fields?.length || 0} fields
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      v{template.version || '1.0'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Custom Template Option */}
          <Grid xs={12} sm={6} md={4}>
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                cursor: 'pointer',
                border: !selectedTemplate ? 2 : 1,
                borderColor: !selectedTemplate ? 'primary.main' : 'divider',
                borderStyle: !selectedTemplate ? 'solid' : 'dashed',
                '&:hover': {
                  borderColor: 'primary.main',
                  borderStyle: 'solid',
                  boxShadow: 2
                }
              }}
              onClick={() => handleTemplateSelect(null)}
            >
              <CardContent sx={{ 
                pb: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                minHeight: 200
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FormControlLabel
                    value="custom"
                    control={<Radio />}
                    label=""
                    sx={{ mr: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Box>
                
                <Typography variant="h6" gutterBottom>
                  Custom Portal
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Start from scratch and build a completely custom portal with your own fields and branding
                </Typography>

                <Chip label="Fully Customizable" size="small" color="primary" />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </RadioGroup>

      {/* Template Details */}
      {selectedTemplate && (
        <Box sx={{ mt: 4, p: 3, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Template Details: {selectedTemplate.name}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Fields Included:</strong>
              </Typography>
              <Box sx={{ pl: 2 }}>
                {selectedTemplate.configuration?.fields?.slice(0, 5).map((field) => (
                  <Typography key={field.id} variant="body2" sx={{ mb: 0.5 }}>
                    • {field.label} ({field.type})
                  </Typography>
                ))}
                {selectedTemplate.configuration?.fields?.length > 5 && (
                  <Typography variant="body2" color="text.secondary">
                    ... and {selectedTemplate.configuration.fields.length - 5} more
                  </Typography>
                )}
              </Box>
            </Grid>
            
            <Grid xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Features:</strong>
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  • File uploads: {selectedTemplate.configuration?.allowFileUploads ? 'Enabled' : 'Disabled'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  • Anonymous submissions: {selectedTemplate.configuration?.allowAnonymous ? 'Allowed' : 'Not allowed'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  • Auto work orders: {selectedTemplate.configuration?.autoCreateWorkOrder ? 'Yes' : 'No'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  • Email notifications: {selectedTemplate.configuration?.emailNotifications?.notifySubmitter ? 'Enabled' : 'Disabled'}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {selectedTemplate.previewImageUrl && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Preview:</strong>
              </Typography>
              <img
                src={selectedTemplate.previewImageUrl}
                alt="Template Preview"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px'
                }}
              />
            </Box>
          )}
        </Box>
      )}

      {/* Custom Template Info */}
      {!selectedTemplate && (
        <Box sx={{ mt: 4, p: 3, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Custom Portal
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You'll be able to:
          </Typography>
          <Box sx={{ pl: 2, mt: 1 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              • Add your own form fields and validation rules
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              • Customize the look and feel with your branding
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              • Configure submission workflow and notifications
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              • Set up integrations with your CMMS
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PortalTemplateSelector;