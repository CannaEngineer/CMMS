import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Alert,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  AdminPanelSettings as AdminIcon,
  Engineering as TechnicianIcon,
  Visibility as ViewIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import FormDialog from './FormDialog';
import FormField from './FormField';

// Aligned with User model from database schema
interface UserFormData {
  id?: number;
  legacyId?: number;
  email: string;
  name: string;
  password?: string; // Only for create mode
  role: 'ADMIN' | 'MANAGER' | 'TECHNICIAN';
  organizationId: number;
}

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
  initialData?: Partial<UserFormData>;
  mode: 'create' | 'edit' | 'view';
  loading?: boolean;
}

const roleOptions = [
  { value: 'ADMIN', label: 'Administrator' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'TECHNICIAN', label: 'Technician' },
];

const departmentOptions = [
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OPERATIONS', label: 'Operations' },
  { value: 'ENGINEERING', label: 'Engineering' },
  { value: 'SAFETY', label: 'Safety' },
  { value: 'QUALITY', label: 'Quality Assurance' },
  { value: 'IT', label: 'Information Technology' },
];

const shiftOptions = [
  { value: 'DAY', label: 'Day Shift (6 AM - 6 PM)' },
  { value: 'NIGHT', label: 'Night Shift (6 PM - 6 AM)' },
  { value: 'ROTATING', label: 'Rotating Shifts' },
];

const permissionOptions = [
  { value: 'CREATE_WORK_ORDERS', label: 'Create Work Orders' },
  { value: 'EDIT_WORK_ORDERS', label: 'Edit Work Orders' },
  { value: 'DELETE_WORK_ORDERS', label: 'Delete Work Orders' },
  { value: 'MANAGE_ASSETS', label: 'Manage Assets' },
  { value: 'MANAGE_USERS', label: 'Manage Users' },
  { value: 'VIEW_REPORTS', label: 'View Reports' },
  { value: 'EXPORT_DATA', label: 'Export Data' },
  { value: 'SYSTEM_SETTINGS', label: 'System Settings' },
];

const skillOptions = [
  { value: 'ELECTRICAL', label: 'Electrical Systems' },
  { value: 'MECHANICAL', label: 'Mechanical Systems' },
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'HVAC', label: 'HVAC Systems' },
  { value: 'WELDING', label: 'Welding' },
  { value: 'PNEUMATICS', label: 'Pneumatic Systems' },
  { value: 'HYDRAULICS', label: 'Hydraulic Systems' },
  { value: 'INSTRUMENTATION', label: 'Instrumentation' },
];

const supervisorOptions = [
  { value: '1', label: 'John Manager - Maintenance Manager' },
  { value: '2', label: 'Sarah Director - Operations Director' },
  { value: '3', label: 'Mike Supervisor - Lead Technician' },
];

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return <AdminIcon color="error" />;
    case 'MANAGER':
      return <WorkIcon color="warning" />;
    case 'TECHNICIAN':
      return <TechnicianIcon color="primary" />;
    default:
      return <PersonIcon />;
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'error';
    case 'MANAGER':
      return 'warning';
    case 'TECHNICIAN':
      return 'primary';
    default:
      return 'default';
  }
};

export default function UserForm({
  open,
  onClose,
  onSubmit,
  initialData = {},
  mode,
  loading = false,
}: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'TECHNICIAN',
    organizationId: 1,
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPasswordFields, setShowPasswordFields] = useState(mode === 'create');

  useEffect(() => {
    if (initialData) {
      setFormData({ ...formData, ...initialData });
    }
  }, [initialData]);

  const handleFieldChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }

    // Auto-set permissions based on role
    if (name === 'role') {
      let defaultPermissions: string[] = [];
      switch (value) {
        case 'ADMIN':
          defaultPermissions = permissionOptions.map(p => p.value);
          break;
        case 'MANAGER':
          defaultPermissions = [
            'CREATE_WORK_ORDERS',
            'EDIT_WORK_ORDERS',
            'MANAGE_ASSETS',
            'VIEW_REPORTS',
            'EXPORT_DATA',
          ];
          break;
        case 'TECHNICIAN':
          defaultPermissions = ['CREATE_WORK_ORDERS', 'VIEW_REPORTS'];
          break;
      }
      setFormData(prev => ({ ...prev, [name]: value, permissions: defaultPermissions }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.role) newErrors.role = 'Role is required';
    if (mode === 'create' && !formData.password) newErrors.password = 'Password is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const renderViewMode = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: formData.isActive ? 'success.main' : 'error.main',
                    border: '2px solid white',
                  }}
                />
              }
            >
              <Avatar
                src={typeof formData.avatar === 'string' ? formData.avatar : undefined}
                sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
              >
                {formData.name.split(' ').map(n => n[0]).join('')}
              </Avatar>
            </Badge>
            
            <Typography variant="h6" gutterBottom>
              {formData.name}
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
              <Chip
                icon={getRoleIcon(formData.role)}
                label={formData.role}
                color={getRoleColor(formData.role) as any}
                size="small"
              />
              <Chip
                label={formData.isActive ? 'Active' : 'Inactive'}
                color={formData.isActive ? 'success' : 'error'}
                size="small"
              />
            </Box>

            <Typography variant="body2" color="text.secondary">
              {formData.jobTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {departmentOptions.find(d => d.value === formData.department)?.label}
            </Typography>
            
            {formData.employeeId && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Employee ID: {formData.employeeId}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Contact Information</Typography>
            <List>
              <ListItem>
                <ListItemIcon><EmailIcon /></ListItemIcon>
                <ListItemText primary="Email" secondary={formData.email} />
              </ListItem>
              {formData.phone && (
                <ListItem>
                  <ListItemIcon><PhoneIcon /></ListItemIcon>
                  <ListItemText primary="Phone" secondary={formData.phone} />
                </ListItem>
              )}
              {formData.emergencyContact && (
                <ListItem>
                  <ListItemIcon><PersonIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Emergency Contact" 
                    secondary={`${formData.emergencyContact} - ${formData.emergencyPhone}`} 
                  />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Work Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Work Shift</Typography>
                <Typography variant="body1">
                  {shiftOptions.find(s => s.value === formData.workShift)?.label}
                </Typography>
              </Grid>
              {formData.supervisor && (
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Supervisor</Typography>
                  <Typography variant="body1">
                    {supervisorOptions.find(s => s.value === formData.supervisor)?.label}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {formData.skills && formData.skills.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Skills</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.skills.map((skill) => (
                  <Chip
                    key={skill}
                    label={skillOptions.find(s => s.value === skill)?.label || skill}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {formData.permissions && formData.permissions.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Permissions</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.permissions.map((permission) => (
                  <Chip
                    key={permission}
                    label={permissionOptions.find(p => p.value === permission)?.label || permission}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  );

  const renderFormMode = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <FormField
          type="text"
          name="name"
          label="Full Name"
          value={formData.name}
          onChange={handleFieldChange}
          required
          error={errors.name}
          disabled={mode === 'view'}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormField
          type="email"
          name="email"
          label="Email Address"
          value={formData.email}
          onChange={handleFieldChange}
          required
          error={errors.email}
          disabled={mode === 'view'}
        />
      </Grid>
      {mode === 'create' && (
        <Grid item xs={12} md={6}>
          <FormField
            type="password"
            name="password"
            label="Password"
            value={formData.password}
            onChange={handleFieldChange}
            required
            error={errors.password}
            disabled={mode === 'view'}
          />
        </Grid>
      )}
      <Grid item xs={12} md={6}>
        <FormField
          type="select"
          name="role"
          label="Role"
          value={formData.role}
          onChange={handleFieldChange}
          options={roleOptions}
          required
          error={errors.role}
          disabled={mode === 'view'}
        />
      </Grid>
    </Grid>
  );

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={
        mode === 'create' ? 'Add New User' :
        mode === 'edit' ? 'Edit User' :
        `User Profile - ${formData.name}`
      }
      submitText={mode === 'view' ? undefined : mode === 'edit' ? 'Update User' : 'Create User'}
      loading={loading}
      maxWidth="lg"
      hideActions={mode === 'view'}
      submitDisabled={mode === 'view'}
    >
      {Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Please fix the errors below before saving.
        </Alert>
      )}

      {mode === 'view' ? renderViewMode() : renderFormMode()}
    </FormDialog>
  );
}