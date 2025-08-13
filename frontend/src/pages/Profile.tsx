import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { authService, usersService } from '../services/api';

export default function Profile() {
  const theme = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setProfileData({
          name: userData.name || '',
          email: userData.email || '',
        });
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({ ...profileData, [field]: event.target.value });
    setMessage(null);
  };

  const handlePasswordChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [field]: event.target.value });
    setMessage(null);
  };

  const handleProfileUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setMessage(null);

      const updatedUser = await usersService.update(user.id.toString(), {
        name: profileData.name,
        email: profileData.email,
      });

      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      await usersService.update(user.id.toString(), {
        currentPassword: passwordData.currentPassword,
        password: passwordData.newPassword,
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setMessage({ type: 'success', text: 'Password updated successfully' });
    } catch (error) {
      console.error('Failed to update password:', error);
      setMessage({ type: 'error', text: 'Failed to update password' });
    } finally {
      setSaving(false);
    }
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'MANAGER':
        return 'warning';
      case 'TECHNICIAN':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Profile Settings
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Overview */}
        <Grid xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '2rem',
                }}
              >
                {getUserInitials()}
              </Avatar>
              <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                {user?.name || 'Unknown User'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {user?.email || 'No email'}
              </Typography>
              <Chip
                label={user?.role || 'UNKNOWN'}
                color={getRoleColor(user?.role)}
                size="small"
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                <BusinessIcon sx={{ fontSize: 16, mr: 1 }} />
                {user?.organization?.name || 'No organization'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Information */}
        <Grid xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Personal Information</Typography>
            </Box>

            <form onSubmit={handleProfileUpdate}>
              <Grid container spacing={2}>
                <Grid xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={profileData.name}
                    onChange={handleProfileChange('name')}
                    required
                    InputProps={{
                      startAdornment: <AccountCircleIcon sx={{ mr: 1, color: 'action.disabled' }} />,
                    }}
                  />
                </Grid>
                <Grid xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={profileData.email}
                    onChange={handleProfileChange('email')}
                    required
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.disabled' }} />,
                    }}
                  />
                </Grid>
                <Grid xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={saving}
                    sx={{ mt: 1 }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>

          {/* Change Password */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Change Password</Typography>
            </Box>

            <form onSubmit={handlePasswordUpdate}>
              <Grid container spacing={2}>
                <Grid xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange('currentPassword')}
                    required
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange('newPassword')}
                    required
                    helperText="Minimum 6 characters"
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange('confirmPassword')}
                    required
                  />
                </Grid>
                <Grid xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <SecurityIcon />}
                    disabled={saving}
                    sx={{ mt: 1 }}
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}