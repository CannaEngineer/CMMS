// Portal Branding Editor - Customize portal appearance and branding
import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  ColorPicker,
  Slider,
  FormControlLabel,
  Switch,
  Alert
} from '@mui/material';
import { ChromePicker } from 'react-color';
import { PortalBranding } from '../../types/portal';

interface PortalBrandingEditorProps {
  branding: PortalBranding;
  onChange: (updates: Partial<PortalBranding>) => void;
  portalName: string;
}

const PortalBrandingEditor: React.FC<PortalBrandingEditorProps> = ({
  branding,
  onChange,
  portalName
}) => {
  const [showColorPicker, setShowColorPicker] = React.useState<string | null>(null);

  const handleColorChange = (colorKey: keyof PortalBranding, color: string) => {
    onChange({ [colorKey]: color });
    setShowColorPicker(null);
  };

  const ColorPickerButton: React.FC<{
    label: string;
    colorKey: keyof PortalBranding;
    value: string;
  }> = ({ label, colorKey, value }) => (
    <Box>
      <Typography variant="body2" gutterBottom>
        {label}
      </Typography>
      <Button
        variant="outlined"
        onClick={() => setShowColorPicker(colorKey as string)}
        sx={{
          backgroundColor: value,
          color: value === '#ffffff' ? '#000' : '#fff',
          border: 1,
          borderColor: 'divider',
          '&:hover': {
            backgroundColor: value,
            opacity: 0.8
          }
        }}
      >
        {value}
      </Button>
      
      {showColorPicker === colorKey && (
        <Box sx={{ position: 'absolute', zIndex: 1000, mt: 1 }}>
          <Box
            sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={() => setShowColorPicker(null)}
          />
          <ChromePicker
            color={value}
            onChange={(color) => handleColorChange(colorKey, color.hex)}
          />
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h6" gutterBottom>
        Customize Branding
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Customize the look and feel of your portal to match your organization's branding
      </Typography>

      <Grid container spacing={3}>
        {/* Colors */}
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Colors
              </Typography>
              
              <Grid container spacing={3}>
                <Grid xs={12} sm={6} md={3}>
                  <ColorPickerButton
                    label="Primary Color"
                    colorKey="primaryColor"
                    value={branding.primaryColor}
                  />
                </Grid>
                
                <Grid xs={12} sm={6} md={3}>
                  <ColorPickerButton
                    label="Secondary Color"
                    colorKey="secondaryColor"
                    value={branding.secondaryColor}
                  />
                </Grid>
                
                <Grid xs={12} sm={6} md={3}>
                  <ColorPickerButton
                    label="Accent Color"
                    colorKey="accentColor"
                    value={branding.accentColor}
                  />
                </Grid>
                
                <Grid xs={12} sm={6} md={3}>
                  <ColorPickerButton
                    label="Background"
                    colorKey="backgroundColor"
                    value={branding.backgroundColor}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Typography */}
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Typography
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Font Family</InputLabel>
                  <Select
                    value={branding.fontFamily}
                    onChange={(e) => onChange({ fontFamily: e.target.value })}
                    label="Font Family"
                  >
                    <MenuItem value="Roboto, sans-serif">Roboto</MenuItem>
                    <MenuItem value="Arial, sans-serif">Arial</MenuItem>
                    <MenuItem value="Helvetica, sans-serif">Helvetica</MenuItem>
                    <MenuItem value="Georgia, serif">Georgia</MenuItem>
                    <MenuItem value="'Times New Roman', serif">Times New Roman</MenuItem>
                  </Select>
                </FormControl>

                <Box>
                  <Typography variant="body2" gutterBottom>
                    Heading Size: {branding.fontSize.heading}px
                  </Typography>
                  <Slider
                    value={branding.fontSize.heading}
                    onChange={(e, value) => onChange({
                      fontSize: { ...branding.fontSize, heading: value as number }
                    })}
                    min={18}
                    max={36}
                    step={2}
                    marks
                  />
                </Box>

                <Box>
                  <Typography variant="body2" gutterBottom>
                    Body Size: {branding.fontSize.body}px
                  </Typography>
                  <Slider
                    value={branding.fontSize.body}
                    onChange={(e, value) => onChange({
                      fontSize: { ...branding.fontSize, body: value as number }
                    })}
                    min={12}
                    max={20}
                    step={1}
                    marks
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Layout */}
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Layout
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Layout Style</InputLabel>
                  <Select
                    value={branding.layout}
                    onChange={(e) => onChange({ layout: e.target.value as any })}
                    label="Layout Style"
                  >
                    <MenuItem value="single-page">Single Page</MenuItem>
                    <MenuItem value="multi-step">Multi-step</MenuItem>
                    <MenuItem value="accordion">Accordion</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Card Style</InputLabel>
                  <Select
                    value={branding.cardStyle}
                    onChange={(e) => onChange({ cardStyle: e.target.value as any })}
                    label="Card Style"
                  >
                    <MenuItem value="minimal">Minimal</MenuItem>
                    <MenuItem value="elevated">Elevated</MenuItem>
                    <MenuItem value="outlined">Outlined</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={branding.showProgressBar}
                      onChange={(e) => onChange({ showProgressBar: e.target.checked })}
                    />
                  }
                  label="Show Progress Bar"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Content */}
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Content & Messaging
              </Typography>
              
              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Welcome Message"
                    value={branding.welcomeMessage || ''}
                    onChange={(e) => onChange({ welcomeMessage: e.target.value })}
                    placeholder={`Welcome to ${portalName}`}
                  />
                </Grid>
                
                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Instructions Text"
                    value={branding.instructionsText || ''}
                    onChange={(e) => onChange({ instructionsText: e.target.value })}
                    placeholder="Please fill out the form below"
                  />
                </Grid>
                
                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Thank You Message"
                    value={branding.thankYouMessage || ''}
                    onChange={(e) => onChange({ thankYouMessage: e.target.value })}
                    placeholder="Thank you for your submission"
                  />
                </Grid>
                
                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Footer Text"
                    value={branding.footerText || ''}
                    onChange={(e) => onChange({ footerText: e.target.value })}
                    placeholder="Optional footer text"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Preview */}
        <Grid xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Preview
              </Typography>
              
              <Box
                sx={{
                  backgroundColor: branding.backgroundColor,
                  color: branding.textColor,
                  fontFamily: branding.fontFamily,
                  p: 3,
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider'
                }}
              >
                {/* Header Preview */}
                <Box
                  sx={{
                    backgroundColor: branding.primaryColor,
                    color: 'white',
                    p: 2,
                    borderRadius: 1,
                    mb: 2,
                    textAlign: 'center'
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{ fontSize: `${branding.fontSize.heading}px` }}
                  >
                    {portalName}
                  </Typography>
                  {branding.welcomeMessage && (
                    <Typography
                      variant="h6"
                      sx={{ 
                        fontSize: `${branding.fontSize.body}px`,
                        opacity: 0.9,
                        mt: 1
                      }}
                    >
                      {branding.welcomeMessage}
                    </Typography>
                  )}
                </Box>

                {/* Content Preview */}
                <Box
                  sx={{
                    backgroundColor: branding.cardStyle === 'elevated' ? 'white' : 'transparent',
                    boxShadow: branding.cardStyle === 'elevated' ? 2 : 0,
                    border: branding.cardStyle === 'outlined' ? 1 : 0,
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2
                  }}
                >
                  {branding.instructionsText && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      {branding.instructionsText}
                    </Alert>
                  )}
                  
                  <TextField
                    fullWidth
                    label="Sample Form Field"
                    placeholder="This is how form fields will look"
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root.Mui-focused fieldset': {
                        borderColor: branding.primaryColor
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: branding.primaryColor
                      }
                    }}
                  />
                  
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: branding.accentColor,
                      '&:hover': {
                        backgroundColor: branding.primaryColor
                      }
                    }}
                  >
                    Submit Request
                  </Button>
                </Box>

                {/* Footer Preview */}
                {branding.footerText && (
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: `${branding.fontSize.small}px` }}
                    >
                      {branding.footerText}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PortalBrandingEditor;