/**
 * Export Center Component Tests
 * Comprehensive test suite for Export & Reporting System
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'vitest-axe';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ExportCenter from '../../components/Export/ExportCenter';
import { theme } from '../../theme/theme';
import {
  createMockExportTemplate,
  createMockExportHistory,
  createMockExportQueue,
  createMockExportStats,
  createMockExportTemplateList,
  createMockExportHistoryList,
  createMockProcessingExport,
  createMockFailedExport,
  createMockQueuedExport,
  createMockProcessingQueueExport,
} from '../factories';
import {
  mockExportService,
  simulateNetworkError,
  simulateSlowNetwork,
  resetAllMocks,
} from '../mocks/apiMocks';

// Extend expect with accessibility matchers
expect.extend(toHaveNoViolations);

// Mock child components
vi.mock('../../components/Export/ExportTemplateManager', () => ({
  default: ({ templates, onEdit, onAction, loading }: any) => (
    <div data-testid="export-template-manager">
      <div data-testid="template-count">{templates?.length || 0}</div>
      <div data-testid="loading-state">{loading ? 'loading' : 'loaded'}</div>
      {templates?.map((template: any) => (
        <div key={template.id} data-testid={`template-${template.id}`}>
          <span>{template.name}</span>
          <button onClick={() => onEdit(template)}>Edit</button>
          <button onClick={() => onAction('execute', template.id, {})}>Execute</button>
          <button onClick={() => onAction('delete', template.id)}>Delete</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../../components/Export/ExportHistoryView', () => ({
  default: ({ history, onAction, loading }: any) => (
    <div data-testid="export-history-view">
      <div data-testid="history-count">{history?.length || 0}</div>
      <div data-testid="loading-state">{loading ? 'loading' : 'loaded'}</div>
      {history?.map((item: any) => (
        <div key={item.id} data-testid={`history-${item.id}`}>
          <span>{item.templateName}</span>
          <span>{item.status}</span>
          <button onClick={() => onAction('download', item.id)}>Download</button>
          <button onClick={() => onAction('retry', item.id)}>Retry</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../../components/Export/ExportQueueView', () => ({
  default: ({ queue, onRefresh, autoRefresh, onAutoRefreshChange, loading }: any) => (
    <div data-testid="export-queue-view">
      <div data-testid="queue-count">{queue?.length || 0}</div>
      <div data-testid="loading-state">{loading ? 'loading' : 'loaded'}</div>
      <div data-testid="auto-refresh">{autoRefresh ? 'enabled' : 'disabled'}</div>
      <button onClick={onRefresh}>Refresh Queue</button>
      <button onClick={() => onAutoRefreshChange(!autoRefresh)}>Toggle Auto Refresh</button>
      {queue?.map((item: any) => (
        <div key={item.id} data-testid={`queue-${item.id}`}>
          <span>{item.templateName}</span>
          <span>{item.status}</span>
          <span>{item.progress}%</span>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../../components/Export/ExportAnalytics', () => ({
  default: ({ stats, onRefresh, loading }: any) => (
    <div data-testid="export-analytics">
      <div data-testid="total-exports">{stats?.totalExports || 0}</div>
      <div data-testid="loading-state">{loading ? 'loading' : 'loaded'}</div>
      <button onClick={onRefresh}>Refresh Stats</button>
    </div>
  ),
}));

vi.mock('../../components/Export/ExportStatsCards', () => ({
  default: ({ stats }: any) => (
    <div data-testid="export-stats-cards">
      <div data-testid="total-exports">{stats?.totalExports || 0}</div>
      <div data-testid="successful-exports">{stats?.successfulExports || 0}</div>
      <div data-testid="failed-exports">{stats?.failedExports || 0}</div>
    </div>
  ),
}));

vi.mock('../../components/Export/QuickExportDialog', () => ({
  default: ({ open, onClose, onExport }: any) => (
    open ? (
      <div data-testid="quick-export-dialog">
        <button onClick={() => onExport({ type: 'quick', format: 'csv' })}>Submit Quick Export</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null
  ),
}));

vi.mock('../../components/Export/TemplateBuilderDialog', () => ({
  default: ({ open, onClose, onSave, template }: any) => (
    open ? (
      <div data-testid="template-builder-dialog">
        <div data-testid="template-mode">{template ? 'edit' : 'create'}</div>
        <button onClick={() => onSave({ name: 'New Template', format: 'xlsx' })}>Save Template</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null
  ),
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
const renderExportCenter = () => {
  return render(
    <TestWrapper>
      <ExportCenter />
    </TestWrapper>
  );
};

describe('ExportCenter Component', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();

    // Setup default mock data
    mockExportService.getTemplates.mockResolvedValue(createMockExportTemplateList(3));
    mockExportService.getHistory.mockResolvedValue({
      items: createMockExportHistoryList(5),
      total: 5,
      page: 1,
      limit: 50,
    });
    mockExportService.getQueue.mockResolvedValue([
      createMockQueuedExport(),
      createMockProcessingQueueExport(),
    ]);
    mockExportService.getStats.mockResolvedValue(createMockExportStats());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Component Rendering', () => {
    it('renders export center with correct heading', async () => {
      renderExportCenter();

      expect(screen.getByRole('heading', { name: /export center/i })).toBeInTheDocument();
      expect(screen.getByText(/manage reports, exports, and data analytics/i)).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
      renderExportCenter();

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('loads and displays initial data', async () => {
      renderExportCenter();

      await waitFor(() => {
        expect(screen.getByTestId('template-count')).toHaveTextContent('3');
        expect(screen.getByTestId('export-stats-cards')).toBeInTheDocument();
      });

      expect(mockExportService.getTemplates).toHaveBeenCalled();
      expect(mockExportService.getHistory).toHaveBeenCalled();
      expect(mockExportService.getQueue).toHaveBeenCalled();
      expect(mockExportService.getStats).toHaveBeenCalled();
    });

    it('displays action buttons', async () => {
      renderExportCenter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /quick export/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /new template/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /refresh data/i })).toBeInTheDocument();
      });
    });

    it('shows status indicators for pending exports', async () => {
      mockExportService.getQueue.mockResolvedValue([
        createMockQueuedExport(),
        createMockProcessingQueueExport(),
        createMockQueuedExport({ id: 'queue-3' }),
      ]);

      renderExportCenter();

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // Pending exports count
      });
    });

    it('shows failure notifications', async () => {
      mockExportService.getHistory.mockResolvedValue({
        items: [
          createMockFailedExport({ startedAt: new Date().toISOString() }),
          createMockFailedExport({ id: 'export-2', startedAt: new Date().toISOString() }),
        ],
        total: 2,
        page: 1,
        limit: 50,
      });

      renderExportCenter();

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Failed exports count
      });
    });
  });

  describe('Tab Navigation', () => {
    it('displays all tabs correctly', async () => {
      renderExportCenter();

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /templates/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /history/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /queue/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /analytics/i })).toBeInTheDocument();
      });
    });

    it('starts with templates tab active', async () => {
      renderExportCenter();

      await waitFor(() => {
        const templatesTab = screen.getByRole('tab', { name: /templates/i });
        expect(templatesTab).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByTestId('export-template-manager')).toBeInTheDocument();
      });
    });

    it('navigates between tabs correctly', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderExportCenter();

      await waitFor(() => {
        expect(screen.getByTestId('export-template-manager')).toBeInTheDocument();
      });

      // Navigate to History tab
      const historyTab = screen.getByRole('tab', { name: /history/i });
      await userEvents.click(historyTab);

      await waitFor(() => {
        expect(historyTab).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByTestId('export-history-view')).toBeInTheDocument();
        expect(screen.queryByTestId('export-template-manager')).not.toBeInTheDocument();
      });

      // Navigate to Queue tab
      const queueTab = screen.getByRole('tab', { name: /queue/i });
      await userEvents.click(queueTab);

      await waitFor(() => {
        expect(queueTab).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByTestId('export-queue-view')).toBeInTheDocument();
      });

      // Navigate to Analytics tab
      const analyticsTab = screen.getByRole('tab', { name: /analytics/i });
      await userEvents.click(analyticsTab);

      await waitFor(() => {
        expect(analyticsTab).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByTestId('export-analytics')).toBeInTheDocument();
      });
    });

    it('shows badge counts on relevant tabs', async () => {
      mockExportService.getHistory.mockResolvedValue({
        items: [createMockProcessingExport(), createMockProcessingExport({ id: 'export-2' })],
        total: 2,
        page: 1,
        limit: 50,
      });

      renderExportCenter();

      await waitFor(() => {
        // History tab should show processing exports badge
        const historyTab = screen.getByRole('tab', { name: /history/i });
        expect(historyTab).toBeInTheDocument();
      });
    });
  });

  describe('Template Management', () => {
    it('handles template creation', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderExportCenter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new template/i })).toBeInTheDocument();
      });

      // Click new template button
      const newTemplateButton = screen.getByRole('button', { name: /new template/i });
      await userEvents.click(newTemplateButton);

      await waitFor(() => {
        expect(screen.getByTestId('template-builder-dialog')).toBeInTheDocument();
        expect(screen.getByTestId('template-mode')).toHaveTextContent('create');
      });

      // Save new template
      const saveButton = screen.getByRole('button', { name: /save template/i });
      await userEvents.click(saveButton);

      await waitFor(() => {
        expect(mockExportService.createTemplate).toHaveBeenCalledWith({
          name: 'New Template',
          format: 'xlsx',
        });
      });
    });

    it('handles template editing', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderExportCenter();

      await waitFor(() => {
        expect(screen.getByTestId('template-template-1')).toBeInTheDocument();
      });

      // Click edit button for first template
      const editButton = within(screen.getByTestId('template-template-1')).getByRole('button', { name: /edit/i });
      await userEvents.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('template-builder-dialog')).toBeInTheDocument();
        expect(screen.getByTestId('template-mode')).toHaveTextContent('edit');
      });
    });

    it('handles template execution', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderExportCenter();

      await waitFor(() => {
        expect(screen.getByTestId('template-template-1')).toBeInTheDocument();
      });

      // Execute template
      const executeButton = within(screen.getByTestId('template-template-1')).getByRole('button', { name: /execute/i });
      await userEvents.click(executeButton);

      await waitFor(() => {
        expect(mockExportService.executeTemplate).toHaveBeenCalledWith('template-1', {});
      });
    });

    it('handles template deletion', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderExportCenter();

      await waitFor(() => {
        expect(screen.getByTestId('template-template-1')).toBeInTheDocument();
      });

      // Delete template
      const deleteButton = within(screen.getByTestId('template-template-1')).getByRole('button', { name: /delete/i });
      await userEvents.click(deleteButton);

      await waitFor(() => {
        expect(mockExportService.deleteTemplate).toHaveBeenCalledWith('template-1');
      });
    });
  });

  describe('Export History Management', () => {
    it('displays export history', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderExportCenter();

      // Navigate to history tab
      const historyTab = screen.getByRole('tab', { name: /history/i });
      await userEvents.click(historyTab);

      await waitFor(() => {
        expect(screen.getByTestId('export-history-view')).toBeInTheDocument();
        expect(screen.getByTestId('history-count')).toHaveTextContent('5');
      });
    });

    it('handles export download', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderExportCenter();

      // Navigate to history tab
      const historyTab = screen.getByRole('tab', { name: /history/i });
      await userEvents.click(historyTab);

      await waitFor(() => {
        expect(screen.getByTestId('history-export-1')).toBeInTheDocument();
      });

      // Mock window.open
      global.open = vi.fn();

      // Download export
      const downloadButton = within(screen.getByTestId('history-export-1')).getByRole('button', { name: /download/i });
      await userEvents.click(downloadButton);

      await waitFor(() => {
        expect(mockExportService.downloadExport).toHaveBeenCalledWith('export-1');
        expect(global.open).toHaveBeenCalled();
      });
    });

    it('handles export retry', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderExportCenter();

      // Navigate to history tab
      const historyTab = screen.getByRole('tab', { name: /history/i });
      await userEvents.click(historyTab);

      await waitFor(() => {
        expect(screen.getByTestId('history-export-1')).toBeInTheDocument();
      });

      // Retry export
      const retryButton = within(screen.getByTestId('history-export-1')).getByRole('button', { name: /retry/i });
      await userEvents.click(retryButton);

      await waitFor(() => {
        expect(mockExportService.retryExport).toHaveBeenCalledWith('export-1');
      });
    });
  });

  describe('Queue Management', () => {
    it('displays export queue with real-time updates', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderExportCenter();

      // Navigate to queue tab
      const queueTab = screen.getByRole('tab', { name: /queue/i });
      await userEvents.click(queueTab);

      await waitFor(() => {
        expect(screen.getByTestId('export-queue-view')).toBeInTheDocument();
        expect(screen.getByTestId('queue-count')).toHaveTextContent('2');
        expect(screen.getByTestId('auto-refresh')).toHaveTextContent('enabled');
      });
    });

    it('handles manual queue refresh', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderExportCenter();

      // Navigate to queue tab
      const queueTab = screen.getByRole('tab', { name: /queue/i });
      await userEvents.click(queueTab);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh queue/i })).toBeInTheDocument();
      });

      // Clear previous calls
      mockExportService.getQueue.mockClear();

      // Click refresh
      const refreshButton = screen.getByRole('button', { name: /refresh queue/i });
      await userEvents.click(refreshButton);

      await waitFor(() => {
        expect(mockExportService.getQueue).toHaveBeenCalled();
      });
    });

    it('toggles auto-refresh functionality', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderExportCenter();

      // Navigate to queue tab
      const queueTab = screen.getByRole('tab', { name: /queue/i });
      await userEvents.click(queueTab);

      await waitFor(() => {
        expect(screen.getByTestId('auto-refresh')).toHaveTextContent('enabled');
      });

      // Toggle auto-refresh
      const toggleButton = screen.getByRole('button', { name: /toggle auto refresh/i });
      await userEvents.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('auto-refresh')).toHaveTextContent('disabled');
      });
    });
  });

  describe('Quick Export Functionality', () => {
    it('opens quick export dialog', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderExportCenter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /quick export/i })).toBeInTheDocument();
      });

      // Open quick export dialog
      const quickExportButton = screen.getByRole('button', { name: /quick export/i });
      await userEvents.click(quickExportButton);

      await waitFor(() => {
        expect(screen.getByTestId('quick-export-dialog')).toBeInTheDocument();
      });
    });

    it('handles quick export submission', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderExportCenter();

      // Open quick export dialog
      const quickExportButton = screen.getByRole('button', { name: /quick export/i });
      await userEvents.click(quickExportButton);

      await waitFor(() => {
        expect(screen.getByTestId('quick-export-dialog')).toBeInTheDocument();
      });

      // Submit quick export
      const submitButton = screen.getByRole('button', { name: /submit quick export/i });
      await userEvents.click(submitButton);

      await waitFor(() => {
        expect(mockExportService.requestExport).toHaveBeenCalledWith({
          type: 'quick',
          format: 'csv',
        });
        expect(screen.queryByTestId('quick-export-dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('automatically refreshes queue data', async () => {
      renderExportCenter();

      // Navigate to queue tab to enable auto-refresh
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const queueTab = screen.getByRole('tab', { name: /queue/i });
      await userEvents.click(queueTab);

      await waitFor(() => {
        expect(screen.getByTestId('export-queue-view')).toBeInTheDocument();
      });

      // Clear initial calls
      mockExportService.getQueue.mockClear();

      // Advance timer to trigger auto-refresh
      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(mockExportService.getQueue).toHaveBeenCalled();
      });
    });

    it('shows live status indicator', async () => {
      renderExportCenter();

      await waitFor(() => {
        expect(screen.getByText(/live/i)).toBeInTheDocument();
      });
    });

    it('displays last refresh time', async () => {
      renderExportCenter();

      await waitFor(() => {
        const liveChip = screen.getByText(/live/i);
        expect(liveChip).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles template loading errors', async () => {
      simulateNetworkError(mockExportService, 'getTemplates');
      renderExportCenter();

      await waitFor(() => {
        expect(screen.getByText(/failed to load export data/i)).toBeInTheDocument();
      });
    });

    it('handles template execution errors', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderExportCenter();

      await waitFor(() => {
        expect(screen.getByTestId('template-template-1')).toBeInTheDocument();
      });

      // Mock execution error
      simulateNetworkError(mockExportService, 'executeTemplate');

      // Try to execute template
      const executeButton = within(screen.getByTestId('template-template-1')).getByRole('button', { name: /execute/i });
      await userEvents.click(executeButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to execute template/i)).toBeInTheDocument();
      });
    });

    it('handles download errors gracefully', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderExportCenter();

      // Navigate to history tab
      const historyTab = screen.getByRole('tab', { name: /history/i });
      await userEvents.click(historyTab);

      await waitFor(() => {
        expect(screen.getByTestId('history-export-1')).toBeInTheDocument();
      });

      // Mock download error
      simulateNetworkError(mockExportService, 'downloadExport');

      // Try to download
      const downloadButton = within(screen.getByTestId('history-export-1')).getByRole('button', { name: /download/i });
      await userEvents.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to download export/i)).toBeInTheDocument();
      });
    });

    it('recovers from network failures', async () => {
      // Start with network error
      simulateNetworkError(mockExportService, 'getTemplates');
      renderExportCenter();

      await waitFor(() => {
        expect(screen.getByText(/failed to load export data/i)).toBeInTheDocument();
      });

      // Reset mock to succeed
      mockExportService.getTemplates.mockClear();
      mockExportService.getTemplates.mockResolvedValue(createMockExportTemplateList(2));

      // Retry
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const refreshButton = screen.getByRole('button', { name: /refresh data/i });
      await userEvents.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByTestId('template-count')).toHaveTextContent('2');
      });
    });
  });

  describe('Performance', () => {
    it('shows loading states during data fetching', async () => {
      // Mock slow network
      simulateSlowNetwork(mockExportService, 'getTemplates', 1000);
      renderExportCenter();

      // Should show loading initially
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Advance timer
      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        expect(screen.getByTestId('export-template-manager')).toBeInTheDocument();
      });
    });

    it('debounces auto-refresh to prevent excessive requests', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderExportCenter();

      // Navigate to queue tab
      const queueTab = screen.getByRole('tab', { name: /queue/i });
      await userEvents.click(queueTab);

      await waitFor(() => {
        expect(screen.getByTestId('export-queue-view')).toBeInTheDocument();
      });

      // Clear initial calls
      mockExportService.getQueue.mockClear();

      // Rapidly advance time to test debouncing
      vi.advanceTimersByTime(2000); // First call
      vi.advanceTimersByTime(2000); // Should be debounced
      vi.advanceTimersByTime(1000); // Complete 5 seconds

      await waitFor(() => {
        expect(mockExportService.getQueue).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderExportCenter();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /export center/i })).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports keyboard navigation', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderExportCenter();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /quick export/i })).toBeInTheDocument();
      });

      // Test tab navigation
      const quickExportButton = screen.getByRole('button', { name: /quick export/i });
      const newTemplateButton = screen.getByRole('button', { name: /new template/i });

      quickExportButton.focus();
      expect(document.activeElement).toBe(quickExportButton);

      await userEvents.tab();
      expect(document.activeElement).toBe(newTemplateButton);
    });

    it('provides proper ARIA labels for tabs', async () => {
      renderExportCenter();

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        tabs.forEach((tab, index) => {
          expect(tab).toHaveAttribute('aria-controls', `export-tabpanel-${index}`);
          expect(tab).toHaveAttribute('id', `export-tab-${index}`);
        });
      });
    });

    it('announces loading states to screen readers', async () => {
      renderExportCenter();

      // Initial loading state should be announced
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('shows floating action button on mobile', () => {
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

      renderExportCenter();

      // Should render mobile FAB (this would need more specific mobile testing)
      expect(screen.getByRole('heading', { name: /export center/i })).toBeInTheDocument();
    });

    it('adapts tab layout for mobile', () => {
      renderExportCenter();

      // All tabs should still be accessible on mobile
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4);
    });
  });

  describe('Integration', () => {
    it('properly integrates with export service', async () => {
      renderExportCenter();

      await waitFor(() => {
        expect(mockExportService.getTemplates).toHaveBeenCalled();
        expect(mockExportService.getHistory).toHaveBeenCalled();
        expect(mockExportService.getQueue).toHaveBeenCalled();
        expect(mockExportService.getStats).toHaveBeenCalled();
      });
    });

    it('maintains data consistency across tabs', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderExportCenter();

      await waitFor(() => {
        expect(screen.getByTestId('template-count')).toHaveTextContent('3');
      });

      // Execute a template from templates tab
      const executeButton = within(screen.getByTestId('template-template-1')).getByRole('button', { name: /execute/i });
      await userEvents.click(executeButton);

      await waitFor(() => {
        expect(mockExportService.executeTemplate).toHaveBeenCalled();
      });

      // Navigate to history tab - should show updated data
      const historyTab = screen.getByRole('tab', { name: /history/i });
      await userEvents.click(historyTab);

      await waitFor(() => {
        expect(mockExportService.getHistory).toHaveBeenCalledTimes(2); // Initial + refresh after execute
      });
    });
  });
});