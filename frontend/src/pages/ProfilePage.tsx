import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const ProfilePage: React.FC = () => {
  // In a real application, you would fetch the user's data here
  // For now, we'll use placeholder data based on the User model
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'ADMIN',
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        User Profile
      </Typography>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6">Name: {user.name}</Typography>
        <Typography variant="h6">Email: {user.email}</Typography>
        <Typography variant="h6">Role: {user.role}</Typography>
      </Paper>
    </Box>
  );
};

export default ProfilePage;