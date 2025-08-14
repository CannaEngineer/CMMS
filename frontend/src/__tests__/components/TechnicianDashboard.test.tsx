/**
 * Technician Dashboard Component Tests
 * Comprehensive test suite for Technician Time Tracking & Work Management System
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'vitest-axe';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import TechnicianDashboard from '../../pages/TechnicianDashboard';
import { theme } from '../../theme/theme';
import {
  createMockUser,
  createMockTechnician,
  createMockWorkOrder,
  createMockWorkOrderList,
  createMockPendingWorkOrder,
  createMockInProgressWorkOrder,
  createMockCompletedWorkOrder,
  createMockOverdueWorkOrder,
  createMockUrgentWorkOrder,
  createMockTimeEntry,
  createMockComment,
  createMockError,
  createMockMobileEnvironment,
  createMockIndustrialEnvironment,
} from '../factories';
import {
  mockWorkOrdersService,
  mockCommentsService,
  mockLocalStorageWithUser,
  simulateNetworkError,
  simulateSlowNetwork,
  simulateServerError,
  resetAllMocks,
} from '../mocks/apiMocks';

// Extend expect with accessibility matchers
expect.extend(toHaveNoViolations);

// Mock API services
vi.mock('../../services/api', () => ({
  workOrdersService: mockWorkOrdersService,
  authService: {
    getCurrentUser: vi.fn().mockResolvedValue(createMockTechnician()),
  },
}));

// Mock hooks
vi.mock('../../hooks/useComments', () => ({
  useComments: vi.fn().mockReturnValue({
    data: [createMockComment()],
    isLoading: false,
    error: null,
  }),
  useCreateComment: vi.fn().mockReturnValue({
    mutate: mockCommentsService.createComment,
    isPending: false,
    error: null,
  }),
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
const renderTechnicianDashboard = (user = createMockTechnician(), workOrders = createMockWorkOrderList(5)) => {
  mockLocalStorageWithUser(user);
  mockWorkOrdersService.getAll.mockResolvedValue(workOrders.map(wo => ({
    ...wo,
    assignedTo: { id: user.id, email: user.email, name: user.name },
    assignedToId: user.id,
  })));

  return render(
    <TestWrapper>
      <TechnicianDashboard />
    </TestWrapper>
  );
};

describe('TechnicianDashboard Component', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Component Rendering', () => {
    it('renders dashboard with correct heading and user welcome', async () => {
      const user = createMockTechnician({ name: 'John Smith' });
      renderTechnicianDashboard(user);

      expect(screen.getByRole('heading', { name: /my work orders/i })).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText(/welcome back, john smith/i)).toBeInTheDocument();
      });
    });

    it('displays loading skeleton initially', () => {
      mockWorkOrdersService.getAll.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderTechnicianDashboard();

      expect(screen.getAllByTestId(/skeleton/i)).toHaveLength(5); // Skeleton components
    });

    it('shows work order statistics correctly', async () => {
      const workOrders = [
        createMockPendingWorkOrder({ id: 1 }),
        createMockInProgressWorkOrder({ id: 2 }),
        createMockCompletedWorkOrder({ id: 3 }),
        createMockOverdueWorkOrder({ id: 4 }),
        createMockPendingWorkOrder({ id: 5 }),
      ];
      
      renderTechnicianDashboard(createMockTechnician(), workOrders);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument(); // Total
        expect(screen.getByText('1')).toBeInTheDocument(); // In Progress
        expect(screen.getByText('2')).toBeInTheDocument(); // Pending (including overdue)
        expect(screen.getByText('1')).toBeInTheDocument(); // Completed
      });
    });

    it('displays action buttons in header', async () => {
      renderTechnicianDashboard();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /qr scanner/i })).toBeInTheDocument();
      });
    });

    it('shows floating QR scanner button', async () => {
      renderTechnicianDashboard();

      await waitFor(() => {
        const qrButton = screen.getByRole('button', { name: /scan/i });
        expect(qrButton).toBeInTheDocument();
      });
    });
  });

  describe('Work Order Display', () => {
    it('displays work orders with correct information', async () => {
      const workOrders = [
        createMockWorkOrder({
          id: 1,
          title: 'Fix Motor',
          description: 'Motor needs repair',
          status: 'PENDING',
          priority: 'HIGH',
          assetName: 'Motor A1',
          estimatedHours: 4,
          dueDate: '2024-02-01T17:00:00Z',
        }),
      ];

      renderTechnicianDashboard(createMockTechnician(), workOrders);

      await waitFor(() => {
        expect(screen.getByText('Fix Motor')).toBeInTheDocument();
        expect(screen.getByText('Motor needs repair')).toBeInTheDocument();
        expect(screen.getByText('PENDING')).toBeInTheDocument();
        expect(screen.getByText('HIGH')).toBeInTheDocument();
        expect(screen.getByText('Motor A1')).toBeInTheDocument();
        expect(screen.getByText('4h')).toBeInTheDocument();
      });
    });

    it('shows overdue work orders with visual indicators', async () => {
      const overdueWorkOrder = createMockOverdueWorkOrder({
        dueDate: '2024-01-01T17:00:00Z', // Past date
      });

      renderTechnicianDashboard(createMockTechnician(), [overdueWorkOrder]);

      await waitFor(() => {
        expect(screen.getByText('OVERDUE')).toBeInTheDocument();
        // Should have red border or error styling
        const workOrderCard = screen.getByText('OVERDUE').closest('[class*="MuiCard"]');
        expect(workOrderCard).toHaveStyle({ borderColor: expect.stringMatching(/error|red/i) });
      });
    });

    it('displays progress indicator for in-progress work orders', async () => {
      const inProgressWorkOrder = createMockInProgressWorkOrder();
      renderTechnicianDashboard(createMockTechnician(), [inProgressWorkOrder]);

      await waitFor(() => {
        expect(screen.getByText(/progress/i)).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    it('shows appropriate action buttons based on work order status', async () => {
      const workOrders = [
        createMockPendingWorkOrder({ id: 1 }),
        createMockInProgressWorkOrder({ id: 2 }),
        createMockWorkOrder({ id: 3, status: 'ON_HOLD' }),
      ];

      renderTechnicianDashboard(createMockTechnician(), workOrders);

      await waitFor(() => {
        // Pending work order should have Start button
        const pendingCard = screen.getByText('#1').closest('[class*="MuiCard"]');
        expect(within(pendingCard!).getByRole('button', { name: /start/i })).toBeInTheDocument();

        // In-progress work order should have Complete and Pause buttons
        const inProgressCard = screen.getByText('#2').closest('[class*="MuiCard"]');
        expect(within(inProgressCard!).getByRole('button', { name: /complete/i })).toBeInTheDocument();
        expect(within(inProgressCard!).getByRole('button', { name: /pause/i })).toBeInTheDocument();

        // On-hold work order should have Resume button
        const onHoldCard = screen.getByText('#3').closest('[class*="MuiCard"]');
        expect(within(onHoldCard!).getByRole('button', { name: /resume/i })).toBeInTheDocument();
      });
    });

    it('displays log time and add note buttons for all work orders', async () => {
      const workOrder = createMockWorkOrder();
      renderTechnicianDashboard(createMockTechnician(), [workOrder]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /log time/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add note/i })).toBeInTheDocument();
      });
    });
  });

  describe('Work Order Status Management', () => {
    it('starts work order successfully', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const workOrder = createMockPendingWorkOrder();
      renderTechnicianDashboard(createMockTechnician(), [workOrder]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      await userEvents.click(startButton);

      await waitFor(() => {
        expect(mockWorkOrdersService.updateStatus).toHaveBeenCalledWith(
          workOrder.id.toString(),
          'IN_PROGRESS'
        );
      });
    });

    it('completes work order with confirmation dialog', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const workOrder = createMockInProgressWorkOrder();
      renderTechnicianDashboard(createMockTechnician(), [workOrder]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument();
      });

      const completeButton = screen.getByRole('button', { name: /complete/i });
      await userEvents.click(completeButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/update work order status/i)).toBeInTheDocument();
      });

      const updateButton = screen.getByRole('button', { name: /update/i });
      await userEvents.click(updateButton);

      await waitFor(() => {
        expect(mockWorkOrdersService.updateStatus).toHaveBeenCalledWith(
          workOrder.id.toString(),
          'COMPLETED'
        );
      });
    });

    it('pauses work order', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const workOrder = createMockInProgressWorkOrder();
      renderTechnicianDashboard(createMockTechnician(), [workOrder]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      });

      const pauseButton = screen.getByRole('button', { name: /pause/i });
      await userEvents.click(pauseButton);

      await waitFor(() => {
        expect(mockWorkOrdersService.updateStatus).toHaveBeenCalledWith(
          workOrder.id.toString(),
          'ON_HOLD'
        );
      });
    });

    it('resumes paused work order', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const workOrder = createMockWorkOrder({ status: 'ON_HOLD' });
      renderTechnicianDashboard(createMockTechnician(), [workOrder]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
      });

      const resumeButton = screen.getByRole('button', { name: /resume/i });
      await userEvents.click(resumeButton);

      await waitFor(() => {
        expect(mockWorkOrdersService.updateStatus).toHaveBeenCalledWith(
          workOrder.id.toString(),
          'IN_PROGRESS'
        );
      });
    });

    it('shows loading state during status updates', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      simulateSlowNetwork(mockWorkOrdersService, 'updateStatus', 1000);
      
      const workOrder = createMockPendingWorkOrder();
      renderTechnicianDashboard(createMockTechnician(), [workOrder]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      await userEvents.click(startButton);

      // Button should be disabled during loading
      expect(startButton).toBeDisabled();

      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(startButton).not.toBeDisabled();
      });
    });
  });

  describe('Time Logging Functionality', () => {
    it('opens time logging dialog', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const workOrder = createMockWorkOrder();
      renderTechnicianDashboard(createMockTechnician(), [workOrder]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /log time/i })).toBeInTheDocument();
      });

      const logTimeButton = screen.getByRole('button', { name: /log time/i });
      await userEvents.click(logTimeButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/log time/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/hours worked/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/work description/i)).toBeInTheDocument();
      });
    });

    it('validates time entry input', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const workOrder = createMockWorkOrder();
      renderTechnicianDashboard(createMockTechnician(), [workOrder]);

      // Open time logging dialog
      const logTimeButton = screen.getByRole('button', { name: /log time/i });
      await userEvents.click(logTimeButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Try to submit without required fields
      const submitButton = screen.getByRole('button', { name: /log time/i });
      expect(submitButton).toBeDisabled();

      // Fill in hours but not description
      const hoursInput = screen.getByLabelText(/hours worked/i);
      await userEvents.type(hoursInput, '2.5');

      expect(submitButton).toBeDisabled();

      // Fill in description
      const descriptionInput = screen.getByLabelText(/work description/i);
      await userEvents.type(descriptionInput, 'Completed motor repair');

      expect(submitButton).not.toBeDisabled();
    });

    it('submits time entry successfully', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const workOrder = createMockWorkOrder();
      renderTechnicianDashboard(createMockTechnician(), [workOrder]);

      // Open time logging dialog
      const logTimeButton = screen.getByRole('button', { name: /log time/i });
      await userEvents.click(logTimeButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill in time entry
      const hoursInput = screen.getByLabelText(/hours worked/i);
      const descriptionInput = screen.getByLabelText(/work description/i);

      await userEvents.type(hoursInput, '3.5');
      await userEvents.type(descriptionInput, 'Replaced motor bearing');

      // Submit
      const submitButton = screen.getByRole('button', { name: /log time/i });
      await userEvents.click(submitButton);

      await waitFor(() => {
        expect(mockWorkOrdersService.logTime).toHaveBeenCalledWith(
          workOrder.id.toString(),
          3.5,
          'Replaced motor bearing',
          'LABOR',
          true
        );
      });

      // Dialog should close
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('handles time logging errors', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      simulateNetworkError(mockWorkOrdersService, 'logTime');
      
      const workOrder = createMockWorkOrder();
      renderTechnicianDashboard(createMockTechnician(), [workOrder]);

      // Open and fill time logging dialog
      const logTimeButton = screen.getByRole('button', { name: /log time/i });
      await userEvents.click(logTimeButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const hoursInput = screen.getByLabelText(/hours worked/i);
      const descriptionInput = screen.getByLabelText(/work description/i);

      await userEvents.type(hoursInput, '2.0');
      await userEvents.type(descriptionInput, 'Work done');

      const submitButton = screen.getByRole('button', { name: /log time/i });
      await userEvents.click(submitButton);

      // Should show error but keep dialog open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('accepts decimal hours input', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const workOrder = createMockWorkOrder();
      renderTechnicianDashboard(createMockTechnician(), [workOrder]);

      const logTimeButton = screen.getByRole('button', { name: /log time/i });
      await userEvents.click(logTimeButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const hoursInput = screen.getByLabelText(/hours worked/i);
      expect(hoursInput).toHaveAttribute('type', 'number');
      expect(hoursInput).toHaveAttribute('step', '0.25');
      expect(hoursInput).toHaveAttribute('min', '0');

      await userEvents.type(hoursInput, '1.75');
      expect(hoursInput).toHaveValue(1.75);
    });
  });

  describe('Comment/Notes Functionality', () => {
    it('opens comment dialog', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const workOrder = createMockWorkOrder();
      renderTechnicianDashboard(createMockTechnician(), [workOrder]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add note/i })).toBeInTheDocument();
      });

      const addNoteButton = screen.getByRole('button', { name: /add note/i });
      await userEvents.click(addNoteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/add note/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/your note/i)).toBeInTheDocument();
      });
    });

    it('submits comment successfully', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const workOrder = createMockWorkOrder();
      renderTechnicianDashboard(createMockTechnician(), [workOrder]);

      // Open comment dialog
      const addNoteButton = screen.getByRole('button', { name: /add note/i });
      await userEvents.click(addNoteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Add comment
      const commentInput = screen.getByLabelText(/your note/i);
      await userEvents.type(commentInput, 'Work progressing well');

      const submitButton = screen.getByRole('button', { name: /add note/i });
      await userEvents.click(submitButton);

      await waitFor(() => {
        expect(mockCommentsService.createComment).toHaveBeenCalledWith({
          entityType: 'workOrder',
          entityId: workOrder.id,
          commentData: {
            content: 'Work progressing well',
            isInternal: false,
          },
        });
      });
    });

    it('requires non-empty comment content', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const workOrder = createMockWorkOrder();
      renderTechnicianDashboard(createMockTechnician(), [workOrder]);

      const addNoteButton = screen.getByRole('button', { name: /add note/i });
      await userEvents.click(addNoteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Submit button should be disabled with empty comment
      const submitButton = screen.getByRole('button', { name: /add note/i });
      expect(submitButton).toBeDisabled();

      // Type spaces only
      const commentInput = screen.getByLabelText(/your note/i);
      await userEvents.type(commentInput, '   ');
      expect(submitButton).toBeDisabled();

      // Type actual content
      await userEvents.clear(commentInput);
      await userEvents.type(commentInput, 'Real comment');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Filtering and Search', () => {
    it('displays filter dropdown', async () => {
      renderTechnicianDashboard();

      await waitFor(() => {
        expect(screen.getByLabelText(/filter/i)).toBeInTheDocument();
      });
    });

    it('filters work orders by status', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const workOrders = [
        createMockPendingWorkOrder({ id: 1 }),
        createMockInProgressWorkOrder({ id: 2 }),
        createMockCompletedWorkOrder({ id: 3 }),
      ];

      renderTechnicianDashboard(createMockTechnician(), workOrders);

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('#2')).toBeInTheDocument();
        expect(screen.getByText('#3')).toBeInTheDocument();
      });

      // Filter by IN_PROGRESS
      const filterSelect = screen.getByLabelText(/filter/i);
      await userEvents.click(filterSelect);

      const inProgressOption = screen.getByRole('option', { name: /in progress/i });
      await userEvents.click(inProgressOption);

      await waitFor(() => {
        expect(screen.getByText('#2')).toBeInTheDocument();
        expect(screen.queryByText('#1')).not.toBeInTheDocument();
        expect(screen.queryByText('#3')).not.toBeInTheDocument();
      });

      // Check filter counter
      expect(screen.getByText(/showing 1 of 3 work orders/i)).toBeInTheDocument();
    });

    it('shows all work orders when filter is set to "All"', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const workOrders = createMockWorkOrderList(5);
      renderTechnicianDashboard(createMockTechnician(), workOrders);

      await waitFor(() => {
        expect(screen.getByText(/showing 5 of 5 work orders/i)).toBeInTheDocument();
      });

      // Filter by completed first
      const filterSelect = screen.getByLabelText(/filter/i);
      await userEvents.click(filterSelect);

      const completedOption = screen.getByRole('option', { name: /completed/i });
      await userEvents.click(completedOption);

      await waitFor(() => {
        expect(screen.getByText(/showing 0 of 5 work orders/i)).toBeInTheDocument();
      });

      // Switch back to all
      await userEvents.click(filterSelect);
      const allOption = screen.getByRole('option', { name: /all orders/i });
      await userEvents.click(allOption);

      await waitFor(() => {
        expect(screen.getByText(/showing 5 of 5 work orders/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('refreshes data automatically', async () => {
      renderTechnicianDashboard();

      await waitFor(() => {
        expect(mockWorkOrdersService.getAll).toHaveBeenCalledTimes(1);
      });

      // Clear mock calls
      mockWorkOrdersService.getAll.mockClear();

      // Advance timer for auto-refresh (30 seconds)
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(mockWorkOrdersService.getAll).toHaveBeenCalledTimes(1);
      });
    });

    it('handles manual refresh', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderTechnicianDashboard();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      });

      // Clear initial calls
      mockWorkOrdersService.getAll.mockClear();

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await userEvents.click(refreshButton);

      await waitFor(() => {
        expect(mockWorkOrdersService.getAll).toHaveBeenCalled();
      });
    });

    it('shows notification badge for pending work orders', async () => {
      const workOrders = [
        createMockPendingWorkOrder({ id: 1 }),
        createMockPendingWorkOrder({ id: 2 }),
        createMockInProgressWorkOrder({ id: 3 }),
      ];

      renderTechnicianDashboard(createMockTechnician(), workOrders);

      await waitFor(() => {
        const notificationButton = screen.getByRole('button', { name: /notifications/i });
        const badge = within(notificationButton).getByText('2'); // 2 pending
        expect(badge).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('displays empty state when no work orders', async () => {
      renderTechnicianDashboard(createMockTechnician(), []);

      await waitFor(() => {
        expect(screen.getByText(/no work orders found/i)).toBeInTheDocument();
        expect(screen.getByText(/you don't have any assigned work orders yet/i)).toBeInTheDocument();
      });
    });

    it('displays empty state message for filtered results', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const workOrders = [createMockPendingWorkOrder()];
      renderTechnicianDashboard(createMockTechnician(), workOrders);

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });

      // Filter by completed (should show empty)
      const filterSelect = screen.getByLabelText(/filter/i);
      await userEvents.click(filterSelect);

      const completedOption = screen.getByRole('option', { name: /completed/i });
      await userEvents.click(completedOption);

      await waitFor(() => {
        expect(screen.getByText(/no work orders found/i)).toBeInTheDocument();
        expect(screen.getByText(/no work orders with status: completed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles work order loading errors', async () => {
      simulateNetworkError(mockWorkOrdersService, 'getAll');
      renderTechnicianDashboard();

      await waitFor(() => {
        expect(screen.getByText(/no work orders found/i)).toBeInTheDocument();
      });
    });

    it('handles status update failures', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      simulateServerError(mockWorkOrdersService, 'updateStatus');
      
      const workOrder = createMockPendingWorkOrder();
      renderTechnicianDashboard(createMockTechnician(), [workOrder]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      await userEvents.click(startButton);

      // Should show error state but component should remain functional
      await waitFor(() => {
        expect(startButton).not.toBeDisabled();
      });
    });

    it('recovers from network failures', async () => {
      // Start with error
      simulateNetworkError(mockWorkOrdersService, 'getAll');
      renderTechnicianDashboard();

      await waitFor(() => {
        expect(screen.getByText(/no work orders found/i)).toBeInTheDocument();
      });

      // Fix the service
      mockWorkOrdersService.getAll.mockClear();
      mockWorkOrdersService.getAll.mockResolvedValue([createMockWorkOrder()]);

      // Manual refresh should work
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await userEvents.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
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

      renderTechnicianDashboard();

      // Should render mobile-friendly version
      expect(screen.getByRole('heading', { name: /my work orders/i })).toBeInTheDocument();
    });

    it('shows condensed action buttons on small screens', async () => {
      // Mock small mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(max-width: 600px)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const workOrder = createMockInProgressWorkOrder();
      renderTechnicianDashboard(createMockTechnician(), [workOrder]);

      await waitFor(() => {
        // On small screens, some buttons might show icons only
        expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderTechnicianDashboard();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /my work orders/i })).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports keyboard navigation', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const workOrder = createMockPendingWorkOrder();
      renderTechnicianDashboard(createMockTechnician(), [workOrder]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
      });

      // Test keyboard navigation through action buttons
      const startButton = screen.getByRole('button', { name: /start/i });
      const logTimeButton = screen.getByRole('button', { name: /log time/i });

      startButton.focus();
      expect(document.activeElement).toBe(startButton);

      await userEvents.tab();
      expect(document.activeElement).toBe(logTimeButton);
    });

    it('provides proper ARIA labels for action buttons', async () => {
      const workOrder = createMockPendingWorkOrder();
      renderTechnicianDashboard(createMockTechnician(), [workOrder]);

      await waitFor(() => {
        const startButton = screen.getByRole('button', { name: /start/i });
        const logTimeButton = screen.getByRole('button', { name: /log time/i });
        const addNoteButton = screen.getByRole('button', { name: /add note/i });

        expect(startButton).toBeInTheDocument();
        expect(logTimeButton).toBeInTheDocument();
        expect(addNoteButton).toBeInTheDocument();
      });
    });

    it('announces status changes to screen readers', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const workOrder = createMockPendingWorkOrder();
      renderTechnicianDashboard(createMockTechnician(), [workOrder]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: /start/i });
      await userEvents.click(startButton);

      // Should provide feedback for screen readers (implementation would depend on actual ARIA live regions)
      await waitFor(() => {
        expect(startButton).toBeDisabled();
      });
    });
  });

  describe('Performance', () => {
    it('loads work orders efficiently', async () => {
      const start = performance.now();
      renderTechnicianDashboard();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /my work orders/i })).toBeInTheDocument();
      });

      const end = performance.now();
      const loadTime = end - start;
      
      // Should load within reasonable time (this is a basic performance check)
      expect(loadTime).toBeLessThan(5000); // 5 seconds max
    });

    it('efficiently handles large work order lists', async () => {
      const manyWorkOrders = Array.from({ length: 50 }, (_, i) => 
        createMockWorkOrder({ id: i + 1 })
      );

      renderTechnicianDashboard(createMockTechnician(), manyWorkOrders);

      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument(); // Total count
      });

      // All work orders should be rendered (in real app, might use virtualization)
      expect(screen.getAllByText(/log time/i)).toHaveLength(50);
    });

    it('cleans up resources on unmount', () => {
      const { unmount } = renderTechnicianDashboard();

      // Unmount component
      unmount();

      // Timers should be cleaned up
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('Industrial Environment Simulation', () => {
    it('handles poor network conditions gracefully', async () => {
      // Simulate slow industrial network
      simulateSlowNetwork(mockWorkOrdersService, 'getAll', 5000);
      renderTechnicianDashboard();

      // Should show loading state
      expect(screen.getAllByTestId(/skeleton/i)).toHaveLength(5);

      // Advance timer
      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /my work orders/i })).toBeInTheDocument();
      });
    });

    it('works with limited touch interactions', async () => {
      // Simulate touch device
      const userEvents = userEvent.setup({ 
        advanceTimers: vi.advanceTimersByTime,
        pointerEventsCheck: 0 // Disable pointer events check for touch simulation
      });
      
      const workOrder = createMockPendingWorkOrder();
      renderTechnicianDashboard(createMockTechnician(), [workOrder]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
      });

      // Should work with touch events
      const startButton = screen.getByRole('button', { name: /start/i });
      await userEvents.click(startButton);

      await waitFor(() => {
        expect(mockWorkOrdersService.updateStatus).toHaveBeenCalled();
      });
    });
  });
});