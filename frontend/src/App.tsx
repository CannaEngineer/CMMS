import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import theme from './theme/theme';

// Providers
import { CriticalErrorBoundary, PageErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { ToastProvider } from './components/Toast/ToastProvider';

// Layout
import DashboardLayout from './components/Layout/DashboardLayout';
import TechnicianLayout from './components/Layout/TechnicianLayout';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import WorkOrders from './pages/WorkOrders';
import Assets from './pages/Assets';
import AssetDetail from './pages/AssetDetail';
import WorkOrderDetail from './pages/WorkOrderDetail';
import Maintenance from './pages/Maintenance';
import MaintenanceScheduleDetail from './pages/MaintenanceScheduleDetail';
import Inventory from './pages/Inventory';
import Locations from './pages/Locations';
import Users from './pages/Users';
import Profile from './pages/Profile';
import SettingsPage from './pages/SettingsPage';
import EmailTest from './pages/EmailTest';
import PartDetail from './pages/PartDetail';
import ExportCenter from './components/Export/ExportCenter';
import Portals from './pages/Portals';
import PublicPortal from './pages/PublicPortal';
import PortalDetailView from './components/Portal/PortalDetailView';
import PublicWorkOrderShare from './pages/PublicWorkOrderShare';
import TimeTracking from './pages/TimeTracking';

// Create a client with enhanced error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on client errors (4xx) except for specific cases
        if (error?.status >= 400 && error?.status < 500) {
          return error?.status === 408 || error?.status === 429;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});

function App() {
  // Check for authentication based on token and user data
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user && token !== 'mock-jwt-token');
  };

  // Check if user is a technician
  const isTechnician = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    try {
      const user = JSON.parse(userStr);
      return user.role === 'TECHNICIAN' || user.role === 'Technician';
    } catch {
      return false;
    }
  };

  return (
    <CriticalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <CssBaseline />
            <ToastProvider>
                <Router>
          <Routes>
            {/* Public Routes (no authentication required) */}
            <Route path="/portal/:portalSlug" element={<PublicPortal />} />
            <Route path="/portals/public/:portalSlug" element={<PublicPortal />} />
            <Route path="/p/:portalSlug" element={<PublicPortal />} />
            <Route path="/public/share/:shareToken" element={<PublicWorkOrderShare />} />
            
            {/* Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/verify-email" element={<VerifyEmail />} />
            
            {/* Technician-only routes with strict access control */}
            <Route path="/tech/*" element={
              <PageErrorBoundary>
                {isAuthenticated() ? (
                  isTechnician() ? (
                    <TechnicianLayout />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                ) : (
                  <Navigate to="/login" />
                )}
              </PageErrorBoundary>
            }>
              <Route index element={<Navigate to="/tech/dashboard" replace />} />
              <Route path="dashboard" element={<TechnicianDashboard />} />
              <Route path="time" element={<TimeTracking />} />
              <Route path="work-orders/:id" element={<WorkOrderDetail />} />
              <Route path="assets" element={<Assets />} />
              <Route path="assets/:id" element={<AssetDetail />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="inventory/parts/:id" element={<PartDetail />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Admin/Manager-only routes with strict access control */}
            <Route path="/*" element={
              <PageErrorBoundary>
                {isAuthenticated() ? (
                  !isTechnician() ? (
                    <DashboardLayout />
                  ) : (
                    <Navigate to="/tech/dashboard" replace />
                  )
                ) : (
                  <Navigate to="/login" />
                )}
              </PageErrorBoundary>
            }>
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
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="settings/email-test" element={<EmailTest />} />
            </Route>
          </Routes>
                </Router>
            </ToastProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </CriticalErrorBoundary>
  );
}

export default App;