import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Button,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Build as BuildIcon,
} from '@mui/icons-material';

export default function VerifyEmail() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmailToken = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. Please check your email and try again.');
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Your email has been successfully verified! You can now log in to your account.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Email verification failed. The link may have expired or is invalid.');
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage('Network error occurred while verifying your email. Please try again.');
      }
    };

    verifyEmailToken();
  }, [searchParams]);

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50',
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 500,
          textAlign: 'center',
          borderRadius: 2,
        }}
      >
        {/* Logo */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              display: 'inline-flex',
              p: 2,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              mb: 2,
            }}
          >
            <BuildIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Elevated Compliance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Email Verification
          </Typography>
        </Box>

        {/* Status Content */}
        {status === 'loading' && (
          <Box>
            <CircularProgress sx={{ mb: 3 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>
              Verifying your email...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we confirm your email address.
            </Typography>
          </Box>
        )}

        {status === 'success' && (
          <Box>
            <CheckCircleIcon 
              sx={{ 
                fontSize: 64, 
                color: 'success.main', 
                mb: 3 
              }} 
            />
            <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                ✅ Email Verified Successfully!
              </Typography>
              <Typography variant="body2">
                {message}
              </Typography>
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleLoginRedirect}
                sx={{ minWidth: 120 }}
              >
                Continue to Login
              </Button>
            </Box>
          </Box>
        )}

        {status === 'error' && (
          <Box>
            <ErrorIcon 
              sx={{ 
                fontSize: 64, 
                color: 'error.main', 
                mb: 3 
              }} 
            />
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                ❌ Email Verification Failed
              </Typography>
              <Typography variant="body2">
                {message}
              </Typography>
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="large"
                onClick={handleLoginRedirect}
                sx={{ minWidth: 120 }}
              >
                Back to Login
              </Button>
              <Button
                component={RouterLink}
                to="/register"
                variant="text"
                size="large"
                sx={{ minWidth: 120 }}
              >
                Create New Account
              </Button>
            </Box>
          </Box>
        )}

        {/* Footer */}
        <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Need help?{' '}
            <Typography 
              component="a" 
              href="mailto:support@elevatedcompliance.tech"
              variant="caption"
              sx={{ 
                color: 'primary.main', 
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Contact Support
            </Typography>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}