import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Chip,
} from '@mui/material';
import {
  Email as EmailIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

interface EmailTestResponse {
  success: boolean;
  message: string;
  configured?: boolean;
  error?: string;
}

export default function EmailTest() {
  const [emailStatus, setEmailStatus] = useState<EmailTestResponse | null>(null);
  const [testResult, setTestResult] = useState<EmailTestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('dan@hudsonhemp.com');
  const [subject, setSubject] = useState('🧪 CMMS Email Test');
  const [message, setMessage] = useState('This is a test email from your Elevated Compliance CMMS system. If you receive this, email functionality is working correctly!');

  const checkEmailStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/email/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const result = await response.json();
      setEmailStatus(result);
    } catch (error) {
      setEmailStatus({
        success: false,
        message: 'Failed to check email status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    setLoading(false);
  };

  const testEmailConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/email/test-config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const result = await response.json();
      setEmailStatus(result);
    } catch (error) {
      setEmailStatus({
        success: false,
        message: 'Failed to test email configuration',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    setLoading(false);
  };

  const sendTestEmail = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          to: testEmail,
          subject: subject,
          message: message,
        }),
      });
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to send test email',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    setLoading(false);
  };

  React.useEffect(() => {
    checkEmailStatus();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <EmailIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Email System Test
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Email Status Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon />
                Email Service Status
              </Typography>
              
              {emailStatus && (
                <Alert 
                  severity={emailStatus.success ? 'success' : 'error'} 
                  sx={{ mb: 2 }}
                  icon={emailStatus.success ? <CheckIcon /> : <ErrorIcon />}
                >
                  {emailStatus.message}
                  {emailStatus.configured !== undefined && (
                    <Box sx={{ mt: 1 }}>
                      <Chip 
                        label={emailStatus.configured ? 'Configured' : 'Not Configured'} 
                        color={emailStatus.configured ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                  )}
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={checkEmailStatus}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} /> : <SettingsIcon />}
                >
                  Check Status
                </Button>
                <Button
                  variant="outlined"
                  onClick={testEmailConfig}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} /> : <CheckIcon />}
                >
                  Test Connection
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Send Test Email Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SendIcon />
                Send Test Email
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="To Email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  type="email"
                  fullWidth
                  size="small"
                  required
                />
                <TextField
                  label="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  size="small"
                />
                <Button
                  variant="contained"
                  onClick={sendTestEmail}
                  disabled={loading || !testEmail}
                  startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
                  fullWidth
                >
                  Send Test Email
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Test Results */}
        {testResult && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Test Results</Typography>
              <Alert 
                severity={testResult.success ? 'success' : 'error'}
                icon={testResult.success ? <CheckIcon /> : <ErrorIcon />}
              >
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {testResult.message}
                </Typography>
                {testResult.error && (
                  <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace' }}>
                    Error: {testResult.error}
                  </Typography>
                )}
                {testResult.success && (
                  <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
                    ✅ Check your inbox at {testEmail} for the test email!
                  </Typography>
                )}
              </Alert>
            </Paper>
          </Grid>
        )}

        {/* Email Configuration Info */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Email Configuration Info</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              The email system is configured with the following settings:
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">SMTP Server</Typography>
                <Typography variant="body2" fontFamily="monospace">heracles.mxrouting.net</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Port</Typography>
                <Typography variant="body2" fontFamily="monospace">587 (STARTTLS)</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">From Address</Typography>
                <Typography variant="body2" fontFamily="monospace">cmms@elevatedcompliance.tech</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">From Name</Typography>
                <Typography variant="body2" fontFamily="monospace">Elevated Compliance CMMS</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}