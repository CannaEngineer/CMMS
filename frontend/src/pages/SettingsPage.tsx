import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const SettingsPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="body1">
          This is the settings page. More options will be available here soon.
        </Typography>
      </Paper>
    </Box>
  );
};

export default SettingsPage;