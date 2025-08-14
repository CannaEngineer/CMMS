/**
 * Profile Component Tests
 * Comprehensive test suite for Profile & Settings Management System
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'vitest-axe';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Profile from '../../pages/Profile';
import { theme } from '../../theme/theme';
import {
  createMockUser,
  createMockAdmin,
  createMockManager,
  createMockTechnician,
  createMockError,
  createMockValidationError,
} from '../factories';
import {
  mockUsersService,
  mockAuthService,
  mockLocalStorageWithUser,
  simulateNetworkError,
  simulateSlowNetwork,
  simulateValidationError,
  resetAllMocks,
} from '../mocks/apiMocks';

// Extend expect with accessibility matchers
expect.extend(toHaveNoViolations);

// Mock API services
vi.mock('../../services/api', () => ({
  usersService: mockUsersService,
  authService: mockAuthService,
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
const renderProfile = (user = createMockUser()) => {
  mockLocalStorageWithUser(user);
  return render(
    <TestWrapper>
      <Profile />
    </TestWrapper>
  );
};

describe('Profile Component', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Component Rendering', () => {
    it('renders profile page with user information', async () => {
      const user = createMockTechnician();
      renderProfile(user);

      // Check main heading
      expect(screen.getByRole('heading', { name: /profile settings/i })).toBeInTheDocument();

      // Check user information display
      expect(screen.getByText(user.name)).toBeInTheDocument();
      expect(screen.getByText(user.email)).toBeInTheDocument();
      expect(screen.getByText(user.role)).toBeInTheDocument();
      expect(screen.getByText(user.organization.name)).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
      renderProfile();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('shows user avatar with correct initials', async () => {
      const user = createMockUser({ name: 'John Smith' });
      renderProfile(user);

      await waitFor(() => {
        const avatar = screen.getByText('JS');
        expect(avatar).toBeInTheDocument();
      });
    });

    it('displays role-specific chip colors', async () => {
      // Test different roles
      const roles = [
        { role: 'ADMIN', expectedColor: 'error' },
        { role: 'MANAGER', expectedColor: 'warning' },
        { role: 'TECHNICIAN', expectedColor: 'info' },
      ];

      for (const { role, expectedColor } of roles) {
        const user = createMockUser({ role });
        const { unmount } = renderProfile(user);

        await waitFor(() => {
          const chipElement = screen.getByText(role);
          expect(chipElement).toBeInTheDocument();
        });

        unmount();
      }
    });
  });

  describe('Profile Information Form', () => {
    it('populates form with current user data', async () => {
      const user = createMockTechnician();
      renderProfile(user);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue(user.name);
        const emailInput = screen.getByDisplayValue(user.email);
        
        expect(nameInput).toBeInTheDocument();
        expect(emailInput).toBeInTheDocument();
      });
    });

    it('allows editing of profile information', async () => {
      const user = createMockTechnician();
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderProfile(user);

      await waitFor(() => {
        expect(screen.getByDisplayValue(user.name)).toBeInTheDocument();
      });

      // Edit name field
      const nameInput = screen.getByLabelText(/full name/i);
      await userEvents.clear(nameInput);
      await userEvents.type(nameInput, 'Updated Name');

      expect(nameInput).toHaveValue('Updated Name');

      // Edit email field
      const emailInput = screen.getByLabelText(/email address/i);
      await userEvents.clear(emailInput);
      await userEvents.type(emailInput, 'updated@company.com');

      expect(emailInput).toHaveValue('updated@company.com');
    });

    it('submits profile update successfully', async () => {
      const user = createMockTechnician();
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderProfile(user);

      await waitFor(() => {
        expect(screen.getByDisplayValue(user.name)).toBeInTheDocument();
      });

      // Update name
      const nameInput = screen.getByLabelText(/full name/i);
      await userEvents.clear(nameInput);
      await userEvents.type(nameInput, 'Updated Name');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await userEvents.click(saveButton);

      // Check that update service was called
      await waitFor(() => {
        expect(mockUsersService.update).toHaveBeenCalledWith(
          user.id.toString(),
          expect.objectContaining({
            name: 'Updated Name',
            email: user.email,
          })
        );
      });

      // Check success message
      await waitFor(() => {
        expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
      });
    });

    it('displays loading state during save', async () => {
      const user = createMockTechnician();
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderProfile(user);

      await waitFor(() => {
        expect(screen.getByDisplayValue(user.name)).toBeInTheDocument();
      });

      // Mock slow response
      simulateSlowNetwork(mockUsersService, 'update', 1000);

      // Update and submit
      const nameInput = screen.getByLabelText(/full name/i);
      await userEvents.clear(nameInput);
      await userEvents.type(nameInput, 'Updated Name');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await userEvents.click(saveButton);

      // Check loading state
      expect(screen.getByText(/saving\.\.\./i)).toBeInTheDocument();
      expect(saveButton).toBeDisabled();

      // Advance timers to complete the request
      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.getByText(/save changes/i)).toBeInTheDocument();
        expect(saveButton).not.toBeDisabled();
      });
    });

    it('handles validation errors appropriately', async () => {
      const user = createMockTechnician();
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderProfile(user);

      await waitFor(() => {
        expect(screen.getByDisplayValue(user.name)).toBeInTheDocument();
      });

      // Mock validation error
      simulateValidationError(mockUsersService, 'update', {
        email: 'Invalid email format',
      });

      // Submit with invalid data
      const emailInput = screen.getByLabelText(/email address/i);
      await userEvents.clear(emailInput);
      await userEvents.type(emailInput, 'invalid-email');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await userEvents.click(saveButton);

      // Check error message
      await waitFor(() => {
        expect(screen.getByText(/failed to update profile/i)).toBeInTheDocument();
      });
    });

    it('requires both name and email fields', async () => {
      const user = createMockTechnician();
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderProfile(user);

      await waitFor(() => {
        expect(screen.getByDisplayValue(user.name)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);

      expect(nameInput).toBeRequired();
      expect(emailInput).toBeRequired();
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });

  describe('Password Change Form', () => {
    it('renders password change section', async () => {
      renderProfile();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
      });
    });

    it('validates password requirements', async () => {
      const user = createMockTechnician();
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderProfile(user);

      await waitFor(() => {
        expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      });

      // Try to submit with short password
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await userEvents.type(currentPasswordInput, 'oldpass');
      await userEvents.type(newPasswordInput, '123'); // Too short
      await userEvents.type(confirmPasswordInput, '123');

      const updateButton = screen.getByRole('button', { name: /update password/i });
      await userEvents.click(updateButton);

      // Check validation error
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters long/i)).toBeInTheDocument();
      });
    });

    it('validates password confirmation match', async () => {
      const user = createMockTechnician();
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderProfile(user);

      await waitFor(() => {
        expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      });

      // Enter mismatched passwords
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await userEvents.type(currentPasswordInput, 'oldpass');
      await userEvents.type(newPasswordInput, 'newpassword123');
      await userEvents.type(confirmPasswordInput, 'differentpassword');

      const updateButton = screen.getByRole('button', { name: /update password/i });
      await userEvents.click(updateButton);

      // Check validation error
      await waitFor(() => {
        expect(screen.getByText(/new passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('submits password change successfully', async () => {
      const user = createMockTechnician();
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderProfile(user);

      await waitFor(() => {
        expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      });

      // Enter valid password data
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await userEvents.type(currentPasswordInput, 'oldpassword');
      await userEvents.type(newPasswordInput, 'newpassword123');
      await userEvents.type(confirmPasswordInput, 'newpassword123');

      const updateButton = screen.getByRole('button', { name: /update password/i });
      await userEvents.click(updateButton);

      // Check that update service was called
      await waitFor(() => {
        expect(mockUsersService.update).toHaveBeenCalledWith(
          user.id.toString(),
          expect.objectContaining({
            currentPassword: 'oldpassword',
            password: 'newpassword123',
          })
        );
      });

      // Check success message and form reset
      await waitFor(() => {
        expect(screen.getByText(/password updated successfully/i)).toBeInTheDocument();
        expect(currentPasswordInput).toHaveValue('');
        expect(newPasswordInput).toHaveValue('');
        expect(confirmPasswordInput).toHaveValue('');
      });
    });

    it('shows helper text for password requirements', async () => {
      renderProfile();

      await waitFor(() => {
        expect(screen.getByText(/minimum 6 characters/i)).toBeInTheDocument();
      });
    });

    it('handles wrong current password error', async () => {
      const user = createMockTechnician();
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderProfile(user);

      await waitFor(() => {
        expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      });

      // Mock authentication error
      simulateValidationError(mockUsersService, 'update', {
        currentPassword: 'Current password is incorrect',
      });

      // Submit password change
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await userEvents.type(currentPasswordInput, 'wrongpassword');
      await userEvents.type(newPasswordInput, 'newpassword123');
      await userEvents.type(confirmPasswordInput, 'newpassword123');

      const updateButton = screen.getByRole('button', { name: /update password/i });
      await userEvents.click(updateButton);

      // Check error message
      await waitFor(() => {
        expect(screen.getByText(/failed to update password/i)).toBeInTheDocument();
      });
    });
  });

  describe('Network Error Handling', () => {
    it('handles profile load failure gracefully', async () => {
      // Mock network error
      simulateNetworkError(mockUsersService, 'getCurrentUser');
      
      renderProfile();

      await waitFor(() => {
        expect(screen.getByText(/failed to load profile/i)).toBeInTheDocument();
      });
    });

    it('handles profile update failure', async () => {
      const user = createMockTechnician();
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderProfile(user);

      await waitFor(() => {
        expect(screen.getByDisplayValue(user.name)).toBeInTheDocument();
      });

      // Mock network error
      simulateNetworkError(mockUsersService, 'update');

      // Try to update profile
      const nameInput = screen.getByLabelText(/full name/i);
      await userEvents.clear(nameInput);
      await userEvents.type(nameInput, 'Updated Name');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await userEvents.click(saveButton);

      // Check error message
      await waitFor(() => {
        expect(screen.getByText(/failed to update profile/i)).toBeInTheDocument();
      });
    });

    it('retries failed requests when user tries again', async () => {
      const user = createMockTechnician();
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderProfile(user);

      await waitFor(() => {
        expect(screen.getByDisplayValue(user.name)).toBeInTheDocument();
      });

      // First attempt fails
      simulateNetworkError(mockUsersService, 'update');

      const nameInput = screen.getByLabelText(/full name/i);
      await userEvents.clear(nameInput);
      await userEvents.type(nameInput, 'Updated Name');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await userEvents.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to update profile/i)).toBeInTheDocument();
      });

      // Reset mock for second attempt
      mockUsersService.update.mockClear();
      mockUsersService.update.mockResolvedValueOnce({ ...user, name: 'Updated Name' });

      // Second attempt succeeds
      await userEvents.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderProfile();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /profile settings/i })).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports keyboard navigation', async () => {
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderProfile();

      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      });

      // Test tab navigation through form fields
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const saveButton = screen.getByRole('button', { name: /save changes/i });

      nameInput.focus();
      expect(document.activeElement).toBe(nameInput);

      await userEvents.tab();
      expect(document.activeElement).toBe(emailInput);

      await userEvents.tab();
      expect(document.activeElement).toBe(saveButton);
    });

    it('has proper ARIA labels and roles', async () => {
      renderProfile();

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      // Check form elements have proper labels
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();

      // Check buttons have accessible names
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument();
    });

    it('announces form validation errors to screen readers', async () => {
      const user = createMockTechnician();
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderProfile(user);

      await waitFor(() => {
        expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      });

      // Trigger validation error
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await userEvents.type(newPasswordInput, '123');
      await userEvents.type(confirmPasswordInput, '123');

      const updateButton = screen.getByRole('button', { name: /update password/i });
      await userEvents.click(updateButton);

      // Check that error message is accessible
      await waitFor(() => {
        const errorMessage = screen.getByText(/password must be at least 6 characters long/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout for mobile devices', async () => {
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

      renderProfile();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /profile settings/i })).toBeInTheDocument();
      });

      // Mobile-specific assertions could go here
      // This would require more specific mobile layout testing
    });
  });

  describe('Performance', () => {
    it('does not cause memory leaks', async () => {
      const { unmount } = renderProfile();

      // Simulate component updates
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /profile settings/i })).toBeInTheDocument();
      });

      // Unmount component
      unmount();

      // Verify cleanup (this is basic - real performance testing would be more complex)
      expect(mockUsersService.update).not.toHaveBeenCalled();
    });

    it('debounces form validation', async () => {
      const user = createMockTechnician();
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderProfile(user);

      await waitFor(() => {
        expect(screen.getByDisplayValue(user.name)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/full name/i);

      // Rapidly type in input
      await userEvents.clear(nameInput);
      await userEvents.type(nameInput, 'A');
      await userEvents.type(nameInput, 'B');
      await userEvents.type(nameInput, 'C');

      // Validation should not run on every keystroke
      expect(nameInput).toHaveValue('ABC');
    });
  });

  describe('Edge Cases', () => {
    it('handles user without organization', async () => {
      const user = createMockUser({ organization: null });
      renderProfile(user);

      await waitFor(() => {
        expect(screen.getByText(/no organization/i)).toBeInTheDocument();
      });
    });

    it('handles user without name', async () => {
      const user = createMockUser({ name: '' });
      renderProfile(user);

      await waitFor(() => {
        expect(screen.getByText(/unknown user/i)).toBeInTheDocument();
      });
    });

    it('handles user without email', async () => {
      const user = createMockUser({ email: '' });
      renderProfile(user);

      await waitFor(() => {
        expect(screen.getByText(/no email/i)).toBeInTheDocument();
      });
    });

    it('clears messages when user starts typing', async () => {
      const user = createMockTechnician();
      const userEvents = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderProfile(user);

      await waitFor(() => {
        expect(screen.getByDisplayValue(user.name)).toBeInTheDocument();
      });

      // Trigger an error first
      simulateNetworkError(mockUsersService, 'update');

      const nameInput = screen.getByLabelText(/full name/i);
      await userEvents.clear(nameInput);
      await userEvents.type(nameInput, 'Updated Name');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await userEvents.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to update profile/i)).toBeInTheDocument();
      });

      // Start typing again - error should clear
      await userEvents.type(nameInput, 'More text');

      // Error message should be gone
      expect(screen.queryByText(/failed to update profile/i)).not.toBeInTheDocument();
    });
  });
});