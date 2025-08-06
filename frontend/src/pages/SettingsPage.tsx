import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Divider 
} from '@mui/material';
import { 
  Upload as ImportIcon,
  History as HistoryIcon,
  Settings as GeneralIcon,
  Notifications as NotificationIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import ImportManager from '../components/ImportManager';
import ImportHistory from '../components/ImportHistory';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SettingsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Paper elevation={1} sx={{ mt: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="settings tabs"
            sx={{ px: 2 }}
          >
            <Tab 
              icon={<ImportIcon />} 
              label="Import Data" 
              id="settings-tab-0"
              aria-controls="settings-tabpanel-0"
            />
            <Tab 
              icon={<HistoryIcon />} 
              label="Import History" 
              id="settings-tab-1"
              aria-controls="settings-tabpanel-1"
            />
            <Tab 
              icon={<GeneralIcon />} 
              label="General" 
              id="settings-tab-2"
              aria-controls="settings-tabpanel-2"
            />
            <Tab 
              icon={<NotificationIcon />} 
              label="Notifications" 
              id="settings-tab-3"
              aria-controls="settings-tabpanel-3"
            />
            <Tab 
              icon={<SecurityIcon />} 
              label="Security" 
              id="settings-tab-4"
              aria-controls="settings-tabpanel-4"
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <ImportManager />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <ImportHistory />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              General Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              General application settings will be available here.
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notification Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Notification preferences will be available here.
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Security Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Security and authentication settings will be available here.
            </Typography>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default SettingsPage;