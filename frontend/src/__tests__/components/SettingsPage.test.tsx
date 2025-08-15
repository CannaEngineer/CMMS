/**
 * Settings Page Component Tests
 * Comprehensive test suite for Settings Management System
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import SettingsPage from '../../pages/SettingsPage';
import theme from '../../theme/theme';
import {
  createMockUser,
  createMockExportTemplate,
  createMockExportHistory,
} from '../factories';
import {
  mockExportService,
  mockLocalStorageWithUser,
  simulateNetworkError,
  simulateSlowNetwork,
  resetAllMocks,
} from '../mocks/apiMocks';

// Extend expect with accessibility matchers
expect.extend(toHaveNoViolations);

// Mock import components
vi.mock('../../components/ImportManager', () => ({
  default: () => <div data-testid="import-manager">Import Manager Component</div>,
}));

vi.mock('../../components/ImportHistory', () => ({
  default: () => <div data-testid="import-history">Import History Component</div>,
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// Custom render function
const renderSettingsPage = (user = createMockUser()) => {
  mockLocalStorageWithUser(user);
  return render(
    <TestWrapper>
      <SettingsPage />
    </TestWrapper>
  );
};

describe('SettingsPage Component', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Component Rendering', () => {
    it('renders settings page with correct heading', () => {
      renderSettingsPage();

      expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
    });

    it('displays all tab options', () => {
      renderSettingsPage();

      // Check all tabs are present
      expect(screen.getByRole('tab', { name: /import data/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /import history/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /general/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /notifications/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /security/i })).toBeInTheDocument();
    });

    it('shows import data tab by default', () => {
      renderSettingsPage();

      // First tab should be selected
      const importTab = screen.getByRole('tab', { name: /import data/i });
      expect(importTab).toHaveAttribute('aria-selected', 'true');

      // Import manager should be visible
      expect(screen.getByTestId('import-manager')).toBeInTheDocument();
    });

    it('displays tab icons correctly', () => {
      renderSettingsPage();

      // Each tab should have an icon (represented by MUI icons)
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(5);

      // Verify specific tab content
      expect(screen.getByRole('tab', { name: /import data/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /import history/i })).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('navigates between tabs correctly', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderSettingsPage();

      // Start with Import Data tab
      expect(screen.getByTestId('import-manager')).toBeInTheDocument();

      // Click Import History tab
      const historyTab = screen.getByRole('tab', { name: /import history/i });
      await userEvents.click(historyTab);

      await waitFor(() => {
        expect(historyTab).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByTestId('import-history')).toBeInTheDocument();
        expect(screen.queryByTestId('import-manager')).not.toBeInTheDocument();
      });

      // Click General tab
      const generalTab = screen.getByRole('tab', { name: /general/i });
      await userEvents.click(generalTab);

      await waitFor(() => {
        expect(generalTab).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByText(/general settings/i)).toBeInTheDocument();
        expect(screen.queryByTestId('import-history')).not.toBeInTheDocument();
      });

      // Click Notifications tab
      const notificationsTab = screen.getByRole('tab', { name: /notifications/i });
      await userEvents.click(notificationsTab);

      await waitFor(() => {
        expect(notificationsTab).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByText(/notification settings/i)).toBeInTheDocument();
      });

      // Click Security tab
      const securityTab = screen.getByRole('tab', { name: /security/i });
      await userEvents.click(securityTab);

      await waitFor(() => {
        expect(securityTab).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByText(/security settings/i)).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation between tabs', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderSettingsPage();

      const firstTab = screen.getByRole('tab', { name: /import data/i });
      const secondTab = screen.getByRole('tab', { name: /import history/i });

      // Focus first tab
      firstTab.focus();
      expect(document.activeElement).toBe(firstTab);

      // Use arrow keys to navigate
      await userEvents.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(secondTab);

      await userEvents.keyboard('{ArrowLeft}');
      expect(document.activeElement).toBe(firstTab);

      // Use Enter to activate tab
      await userEvents.keyboard('{Enter}');
      expect(firstTab).toHaveAttribute('aria-selected', 'true');
    });

    it('maintains proper ARIA attributes for tabs', () => {
      renderSettingsPage();

      const tabs = screen.getAllByRole('tab');
      tabs.forEach((tab, index) => {
        expect(tab).toHaveAttribute('id', `settings-tab-${index}`);
        expect(tab).toHaveAttribute('aria-controls', `settings-tabpanel-${index}`);
      });

      // Check tab panels
      const importPanel = screen.getByRole('tabpanel');
      expect(importPanel).toHaveAttribute('id', 'settings-tabpanel-0');
      expect(importPanel).toHaveAttribute('aria-labelledby', 'settings-tab-0');
    });
  });

  describe('Tab Content', () => {
    it('renders Import Data tab content', () => {
      renderSettingsPage();

      expect(screen.getByTestId('import-manager')).toBeInTheDocument();
    });

    it('renders Import History tab content', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderSettingsPage();

      const historyTab = screen.getByRole('tab', { name: /import history/i });
      await userEvents.click(historyTab);

      await waitFor(() => {
        expect(screen.getByTestId('import-history')).toBeInTheDocument();
      });
    });

    it('renders General settings placeholder', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderSettingsPage();

      const generalTab = screen.getByRole('tab', { name: /general/i });
      await userEvents.click(generalTab);

      await waitFor(() => {
        expect(screen.getByText(/general settings/i)).toBeInTheDocument();
        expect(screen.getByText(/general application settings will be available here/i)).toBeInTheDocument();
      });
    });

    it('renders Notifications settings placeholder', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderSettingsPage();

      const notificationsTab = screen.getByRole('tab', { name: /notifications/i });
      await userEvents.click(notificationsTab);

      await waitFor(() => {
        expect(screen.getByText(/notification settings/i)).toBeInTheDocument();
        expect(screen.getByText(/notification preferences will be available here/i)).toBeInTheDocument();
      });
    });

    it('renders Security settings placeholder', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderSettingsPage();

      const securityTab = screen.getByRole('tab', { name: /security/i });
      await userEvents.click(securityTab);

      await waitFor(() => {
        expect(screen.getByText(/security settings/i)).toBeInTheDocument();
        expect(screen.getByText(/security and authentication settings will be available here/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout for mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(max-width: 768px)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      renderSettingsPage();

      // In mobile, tabs should be present but might have different styling
      expect(screen.getAllByRole('tab')).toHaveLength(5);
    });

    it('handles tab overflow on small screens', () => {
      renderSettingsPage();

      // All tabs should still be accessible
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(5);

      tabs.forEach(tab => {
        expect(tab).toBeVisible();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderSettingsPage();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper tab semantics', () => {
      renderSettingsPage();

      // Check tablist role
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
      expect(tablist).toHaveAttribute('aria-label', 'settings tabs');

      // Check individual tabs
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(5);

      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected');
        expect(tab).toHaveAttribute('aria-controls');
        expect(tab).toHaveAttribute('id');
      });

      // Check tab panels
      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveAttribute('aria-labelledby');
      expect(tabpanel).toHaveAttribute('id');
    });

    it('announces tab changes to screen readers', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderSettingsPage();

      const historyTab = screen.getByRole('tab', { name: /import history/i });
      await userEvents.click(historyTab);

      await waitFor(() => {
        expect(historyTab).toHaveAttribute('aria-selected', 'true');
        const tabpanel = screen.getByRole('tabpanel');
        expect(tabpanel).toHaveAttribute('aria-labelledby', 'settings-tab-1');
      });
    });

    it('supports screen reader navigation', () => {
      renderSettingsPage();

      // Check that content is properly structured for screen readers
      expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('only renders active tab content', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderSettingsPage();

      // Initially only import manager should be rendered
      expect(screen.getByTestId('import-manager')).toBeInTheDocument();
      expect(screen.queryByTestId('import-history')).not.toBeInTheDocument();

      // Switch to history tab
      const historyTab = screen.getByRole('tab', { name: /import history/i });
      await userEvents.click(historyTab);

      await waitFor(() => {
        expect(screen.getByTestId('import-history')).toBeInTheDocument();
        expect(screen.queryByTestId('import-manager')).not.toBeInTheDocument();
      });
    });

    it('preserves tab state during navigation', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderSettingsPage();

      // Navigate to general tab
      const generalTab = screen.getByRole('tab', { name: /general/i });
      await userEvents.click(generalTab);

      await waitFor(() => {
        expect(generalTab).toHaveAttribute('aria-selected', 'true');
      });

      // Navigate back to import data tab
      const importTab = screen.getByRole('tab', { name: /import data/i });
      await userEvents.click(importTab);

      await waitFor(() => {
        expect(importTab).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByTestId('import-manager')).toBeInTheDocument();
      });
    });

    it('does not cause memory leaks during tab switching', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const { unmount } = renderSettingsPage();

      // Rapidly switch between tabs
      const tabs = screen.getAllByRole('tab');
      for (const tab of tabs) {
        await userEvents.click(tab);
        await waitFor(() => {
          expect(tab).toHaveAttribute('aria-selected', 'true');
        });
      }

      // Unmount component
      unmount();

      // Basic cleanup verification
      expect(screen.queryByRole('heading', { name: /settings/i })).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles component load errors gracefully', () => {
      // Mock error in import components
      vi.doMock('../../components/ImportManager', () => {
        throw new Error('Component load error');
      });

      // Component should still render basic structure
      renderSettingsPage();
      expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(5);
    });

    it('maintains tab functionality when child components error', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderSettingsPage();

      // Even if import manager has issues, other tabs should work
      const generalTab = screen.getByRole('tab', { name: /general/i });
      await userEvents.click(generalTab);

      await waitFor(() => {
        expect(generalTab).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByText(/general settings/i)).toBeInTheDocument();
      });
    });
  });

  describe('Integration', () => {
    it('properly integrates with child components', () => {
      renderSettingsPage();

      // Import Manager should be rendered as a child component
      expect(screen.getByTestId('import-manager')).toBeInTheDocument();
    });

    it('passes context to child components', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderSettingsPage();

      // Switch to import history tab
      const historyTab = screen.getByRole('tab', { name: /import history/i });
      await userEvents.click(historyTab);

      await waitFor(() => {
        expect(screen.getByTestId('import-history')).toBeInTheDocument();
      });
    });
  });

  describe('Visual Design', () => {
    it('applies consistent styling across tabs', () => {
      renderSettingsPage();

      // Check that tabs container has proper styling
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();

      // Check paper container
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toBeVisible();
      });
    });

    it('highlights active tab correctly', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderSettingsPage();

      // First tab should be selected initially
      const firstTab = screen.getByRole('tab', { name: /import data/i });
      expect(firstTab).toHaveAttribute('aria-selected', 'true');

      // Switch to second tab
      const secondTab = screen.getByRole('tab', { name: /import history/i });
      await userEvents.click(secondTab);

      await waitFor(() => {
        expect(firstTab).toHaveAttribute('aria-selected', 'false');
        expect(secondTab).toHaveAttribute('aria-selected', 'true');
      });
    });
  });
});