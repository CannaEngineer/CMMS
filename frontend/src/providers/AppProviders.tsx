import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from '../theme/theme';
import { queryConfig } from '../hooks/useData';

// Create a stable query client instance
const queryClient = new QueryClient(queryConfig);

// Error boundary for query errors
const QueryErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
};

// Main app providers wrapper
export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryErrorBoundary>
        {children}
      </QueryErrorBoundary>
    </ThemeProvider>
  );
};

export default AppProviders;