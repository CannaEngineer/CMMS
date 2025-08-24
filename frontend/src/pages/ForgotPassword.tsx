import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  Link,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import {
  Email as EmailIcon,
  Build as BuildIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send password reset email');
      }
    } catch (err: any) {
      setError('Network error. Please check your connection and try again.');
      console.error('Forgot password error:', err);
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
            Elevated Compliance
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Reset Your Password
          </Typography>
        </Box>

        {success ? (
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                📧 Password Reset Email Sent!
              </Typography>
              <Typography variant="body2">
                We've sent a password reset link to <strong>{getValues('email')}</strong>.
                Please check your inbox and follow the instructions to reset your password.
              </Typography>
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              The reset link will expire in 1 hour for security reasons.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
              <Button
                variant="text"
                onClick={() => window.open('https://gmail.com', '_blank')}
              >
                Open Gmail
              </Button>
            </Box>
          </Box>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              Enter your email address and we'll send you a link to reset your password.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

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
                  sx={{ mb: 3 }}
                />
              )}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting}
              sx={{
                py: 1.5,
                mb: 3,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Send Reset Link'
              )}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link
                component={RouterLink}
                to="/login"
                variant="body2"
                sx={{ 
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <ArrowBackIcon fontSize="small" />
                Back to Login
              </Link>
            </Box>
          </form>
        )}
      </Paper>

      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          textAlign: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          © 2024 Elevated Compliance. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}