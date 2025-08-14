import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  Link,
  useTheme,
  useMediaQuery,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fade,
  Collapse,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Build as BuildIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as LoadingIcon,
} from '@mui/icons-material';

export default function Signup() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    createOrganization: true, // New signups create their own organization
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Validation states
  const [emailValidation, setEmailValidation] = useState({
    status: 'idle', // 'idle' | 'checking' | 'valid' | 'invalid'
    message: ''
  });
  const [orgValidation, setOrgValidation] = useState({
    status: 'idle',
    message: ''
  });
  const [passwordValidation, setPasswordValidation] = useState({
    status: 'idle',
    message: ''
  });

  // Debounced validation functions
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const validateEmail = useCallback(async (email: string) => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailValidation({ status: 'idle', message: '' });
      return;
    }

    setEmailValidation({ status: 'checking', message: 'Checking availability...' });
    
    try {
      const response = await fetch(`/api/auth/check-email/${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (response.ok) {
        if (data.available) {
          setEmailValidation({ status: 'valid', message: 'Email is available' });
        } else {
          setEmailValidation({ status: 'invalid', message: 'This email is already registered' });
        }
      } else {
        setEmailValidation({ status: 'invalid', message: data.error || 'Unable to check email' });
      }
    } catch (error) {
      setEmailValidation({ status: 'invalid', message: 'Unable to check email availability' });
    }
  }, []);

  const validateOrganization = useCallback(async (name: string) => {
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      setOrgValidation({ status: 'idle', message: '' });
      return;
    }

    setOrgValidation({ status: 'checking', message: 'Checking availability...' });
    
    try {
      const response = await fetch(`/api/auth/check-organization/${encodeURIComponent(name.trim())}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.available) {
        setOrgValidation({ status: 'valid', message: 'Organization name is available' });
      } else {
        setOrgValidation({ status: 'invalid', message: 'This organization name is taken' });
      }
    } catch (error) {
      console.error('Organization validation error:', error);
      setOrgValidation({ status: 'invalid', message: 'Unable to check organization availability' });
    }
  }, []);

  const validatePassword = useCallback((password: string) => {
    if (!password) {
      setPasswordValidation({ status: 'idle', message: '' });
      return;
    }

    if (password.length < 6) {
      setPasswordValidation({ status: 'invalid', message: 'Password must be at least 6 characters' });
    } else if (password.length < 8) {
      setPasswordValidation({ status: 'valid', message: 'Password is acceptable' });
    } else {
      setPasswordValidation({ status: 'valid', message: 'Strong password' });
    }
  }, []);

  // Debounced versions
  const debouncedEmailValidation = useCallback(debounce(validateEmail, 500), [validateEmail]);
  const debouncedOrgValidation = useCallback(debounce(validateOrganization, 500), [validateOrganization]);
  const debouncedPasswordValidation = useCallback(debounce(validatePassword, 300), [validatePassword]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormData({ ...formData, [field]: value });
    setError('');
    setSuccess('');

    // Trigger real-time validation
    if (field === 'email') {
      debouncedEmailValidation(value);
    } else if (field === 'organizationName' && formData.createOrganization) {
      debouncedOrgValidation(value);
    } else if (field === 'password') {
      debouncedPasswordValidation(value);
    }
  };

  // Helper function to render validation icon
  const getValidationIcon = (status: string) => {
    if (!status || status === 'idle') return null;
    
    switch (status) {
      case 'checking':
        return (
          <LoadingIcon 
            sx={{ 
              color: 'text.secondary',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
              animation: 'spin 1s linear infinite',
            }} 
          />
        );
      case 'valid':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'invalid':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      default:
        return null;
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (formData.createOrganization && !formData.organizationName.trim()) {
      setError('Please enter your organization name');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (emailValidation.status === 'invalid') {
      setError('Please use a different email address');
      return false;
    }
    if (formData.createOrganization && orgValidation.status === 'invalid') {
      setError('Please choose a different organization name');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          organizationName: formData.organizationName.trim(),
          createOrganization: formData.createOrganization,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('🎉 Account created successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              email: formData.email.trim().toLowerCase(),
              message: 'Account created successfully! Please sign in to continue.'
            }
          });
        }, 2000);
      } else {
        // Handle specific error cases with user-friendly messages
        const errorMessage = data.error || 'Registration failed. Please try again.';
        
        if (errorMessage.includes('email already exists')) {
          setError('This email is already registered. Please try signing in instead.');
        } else if (errorMessage.includes('organization name already exists')) {
          setError('This organization name is taken. Please choose a different name.');
        } else if (errorMessage.includes('organization you\'re trying to join does not exist')) {
          setError('The organization code is invalid. Please check with your organization admin.');
        } else if (errorMessage.includes('validation')) {
          setError('Please check your information and try again.');
        } else {
          setError(errorMessage);
        }
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError('Something went wrong. Please try again in a few moments.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.background.default,
        backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.secondary.main}10 100%)`,
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: isMobile ? 3 : 5,
          width: '100%',
          maxWidth: 450,
          borderRadius: 3,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Box
              sx={{
                backgroundColor: theme.palette.primary.main,
                borderRadius: 3,
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BuildIcon sx={{ fontSize: 48, color: 'white' }} />
            </Box>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Create Account
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Join Compass CMMS
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Full Name"
            value={formData.name}
            onChange={handleChange('name')}
            margin="normal"
            required
            autoComplete="name"
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Organization Name"
            value={formData.organizationName}
            onChange={handleChange('organizationName')}
            margin="normal"
            required
            placeholder="Your company or organization name"
            error={orgValidation.status === 'invalid'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BusinessIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: formData.createOrganization && formData.organizationName && formData.organizationName.trim().length > 1 ? (
                <InputAdornment position="end">
                  <Fade in={orgValidation.status !== 'idle'}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getValidationIcon(orgValidation.status)}
                    </Box>
                  </Fade>
                </InputAdornment>
              ) : null,
            }}
            sx={{ mb: 2 }}
          />
          
          {/* Organization validation message */}
          <Collapse in={orgValidation.status !== 'idle' && formData.createOrganization && orgValidation.message !== ''}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: orgValidation.status === 'valid' ? 'success.main' : 'error.main',
                ml: 2,
                mb: 1,
                display: 'block'
              }}
            >
              {orgValidation.message}
            </Typography>
          </Collapse>

          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            margin="normal"
            required
            autoComplete="email"
            error={emailValidation.status === 'invalid'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: formData.email && formData.email.trim() && /\S+@\S+\.\S+/.test(formData.email) ? (
                <InputAdornment position="end">
                  <Fade in={emailValidation.status !== 'idle'}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getValidationIcon(emailValidation.status)}
                    </Box>
                  </Fade>
                </InputAdornment>
              ) : null,
            }}
            sx={{ mb: 2 }}
          />
          
          {/* Email validation message */}
          <Collapse in={emailValidation.status !== 'idle' && emailValidation.message !== ''}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: emailValidation.status === 'valid' ? 'success.main' : 'error.main',
                ml: 2,
                mb: 1,
                display: 'block'
              }}
            >
              {emailValidation.message}
            </Typography>
          </Collapse>

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange('password')}
            margin="normal"
            required
            autoComplete="new-password"
            error={passwordValidation.status === 'invalid'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {formData.password && passwordValidation.status !== 'idle' && (
                      <Fade in={passwordValidation.status !== 'idle'}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getValidationIcon(passwordValidation.status)}
                        </Box>
                      </Fade>
                    )}
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </Box>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          
          {/* Password validation message */}
          <Collapse in={passwordValidation.status !== 'idle' && passwordValidation.message !== ''}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: passwordValidation.status === 'valid' ? 'success.main' : 'error.main',
                ml: 2,
                mb: 1,
                display: 'block'
              }}
            >
              {passwordValidation.message}
            </Typography>
          </Collapse>

          <TextField
            fullWidth
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            margin="normal"
            required
            autoComplete="new-password"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              py: 1.5,
              mb: 3,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link
                component={RouterLink}
                to="/login"
                sx={{ textDecoration: 'none', fontWeight: 600 }}
              >
                Sign in
              </Link>
            </Typography>
          </Box>
        </form>
      </Paper>

      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          textAlign: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          © 2024 Compass CMMS. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}