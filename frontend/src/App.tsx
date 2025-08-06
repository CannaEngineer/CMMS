import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import theme from './theme/theme';

// Layout
import DashboardLayout from './components/Layout/DashboardLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WorkOrders from './pages/WorkOrders';
import Assets from './pages/Assets';
import AssetDetail from './pages/AssetDetail';
import WorkOrderDetail from './pages/WorkOrderDetail';
import Maintenance from './pages/Maintenance';
import MaintenanceScheduleDetail from './pages/MaintenanceScheduleDetail';
import Inventory from './pages/Inventory';
import Locations from './pages/Locations';
import Users from './pages/Users';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import PartDetail from './pages/PartDetail';
import ExportCenter from './components/Export/ExportCenter';
import Portals from './pages/Portals';
import PublicPortal from './pages/PublicPortal';
import PortalDetailView from './components/Portal/PortalDetailView';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const isAuthenticated = true; // Temporary bypass for development

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <CssBaseline />
          <Router>
          <Routes>
            {/* Public Portal Routes (no authentication required) */}
            <Route path="/portal/:portalSlug" element={<PublicPortal />} />
            <Route path="/portals/public/:portalSlug" element={<PublicPortal />} />
            <Route path="/p/:portalSlug" element={<PublicPortal />} />
            
            {/* Authentication Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                isAuthenticated ? (
                  <Routes>
                    <Route path="/" element={<DashboardLayout />}>
                      <Route index element={<Navigate to="/dashboard" replace />} />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="work-orders" element={<WorkOrders />} />
                      <Route path="work-orders/:id" element={<WorkOrderDetail />} />
                      <Route path="assets" element={<Assets />} />
                      <Route path="assets/:id" element={<AssetDetail />} />
                      <Route path="maintenance" element={<Maintenance />} />
                      <Route path="maintenance/schedules/:id" element={<MaintenanceScheduleDetail />} />
                      <Route path="inventory" element={<Inventory />} />
                      <Route path="inventory/parts/:id" element={<PartDetail />} />
                      <Route path="locations" element={<Locations />} />
                      <Route path="portals" element={<Portals />} />
                      <Route path="portals/:id" element={<PortalDetailView />} />
                      <Route path="exports" element={<ExportCenter />} />
                      <Route path="users" element={<Users />} />
                      <Route path="profile" element={<ProfilePage />} />
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>
                  </Routes>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
          </Routes>
          </Router>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;