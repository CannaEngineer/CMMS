import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  Divider,
  Link,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Build as BuildIcon,
  Email as EmailIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { authService } from '../services/api';
import { loginSchema, LoginFormData } from '../utils/validationSchemas';
import FormErrorDisplay from '../components/Common/FormErrorDisplay';

export default function Login() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    clearErrors();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const responseData = await response.json();
        localStorage.setItem('token', responseData.token);
        localStorage.setItem('user', JSON.stringify(responseData.user));
        
        // Route based on user role
        if (responseData.user.role === 'TECHNICIAN') {
          navigate('/tech/dashboard');
        } else {
          // ADMIN and MANAGER go to main dashboard
          navigate('/dashboard');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Invalid email or password');
      }
    } catch (err: any) {
      setError('Network error. Please check your connection and try again.');
      console.error('Login error:', err);
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
            Compass CMMS
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Maintenance Management System
          </Typography>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <FormErrorDisplay 
            errors={errors} 
            title="Please check your login details:"
          />

          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="Email Address"
                type="email"
                margin="normal"
                required
                autoComplete="email"
                autoFocus
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
                onChange={(e) => {
                  field.onChange(e);
                  if (error) setError('');
                }}
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                margin="normal"
                required
                autoComplete="current-password"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
                onChange={(e) => {
                  field.onChange(e);
                  if (error) setError('');
                }}
              />
            )}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isSubmitting || !isValid}
            sx={{
              py: 1.5,
              mb: 2,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
            }}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Link
              component="button"
              variant="body2"
              onClick={(e) => {
                e.preventDefault();
                // Handle forgot password
              }}
              sx={{ textDecoration: 'none' }}
            >
              Forgot password?
            </Link>
            <Link
              component={RouterLink}
              to="/signup"
              variant="body2"
              sx={{ textDecoration: 'none' }}
            >
              Create account
            </Link>
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