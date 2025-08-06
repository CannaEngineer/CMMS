// Portals Page - Main portal management interface
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Breadcrumbs,
  Link,
  Alert
} from '@mui/material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PortalManager from '../components/Portal/PortalManager';
import PortalSubmissionsDashboard from '../components/Portal/PortalSubmissionsDashboard';
import { Portal } from '../types/portal';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`portal-tabpanel-${index}`}
      aria-labelledby={`portal-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
};

const PortalsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [selectedTab, setSelectedTab] = useState(() => {
    const tab = searchParams.get('tab');
    switch (tab) {
      case 'submissions':
        return 1;
      case 'analytics':
        return 2;
      default:
        return 0;
    }
  });
  
  const [selectedPortal, setSelectedPortal] = useState<Portal | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    switch (newValue) {
      case 1:
        newParams.set('tab', 'submissions');
        break;
      case 2:
        newParams.set('tab', 'analytics');
        break;
      default:
        newParams.delete('tab');
        break;
    }
    setSearchParams(newParams);
  };

  const handlePortalSelect = (portal: Portal) => {
    // Navigate to portal detail view
    navigate(`/portals/${portal.id}`);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link color="inherit" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
            Home
          </Link>
          <Typography color="text.primary">Portals</Typography>
        </Breadcrumbs>
        
        <Typography variant="h3" component="h1" gutterBottom>
          Portal Management
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Create and manage public portals for external submissions, track requests, and analyze usage.
        </Typography>

        {/* Feature Overview Alert */}
        <Alert severity="info" sx={{ mb: 3 }}>
          Portal system enables external users to submit maintenance requests, register assets, and report issues 
          through mobile-friendly forms accessible via QR codes or URLs. No login required for submitters.
        </Alert>
      </Box>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            label="Portal Management"
            id="portal-tab-0"
            aria-controls="portal-tabpanel-0"
          />
          <Tab
            label="Submissions"
            id="portal-tab-1"
            aria-controls="portal-tabpanel-1"
          />
          <Tab
            label="Analytics & Reports"
            id="portal-tab-2"
            aria-controls="portal-tabpanel-2"
            disabled
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={selectedTab} index={0}>
        <PortalManager onPortalSelect={handlePortalSelect} />
      </TabPanel>

      <TabPanel value={selectedTab} index={1}>
        <PortalSubmissionsDashboard portalId={selectedPortal?.id} />
      </TabPanel>

      <TabPanel value={selectedTab} index={2}>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Analytics & Reports
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Advanced analytics and reporting features coming soon.
            Track portal performance, submission trends, and user engagement.
          </Typography>
        </Box>
      </TabPanel>
    </Container>
  );
};

export default PortalsPage;