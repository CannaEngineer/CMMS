/**
 * Visual Regression Tests for Profile Component
 * Tests visual consistency across different states and viewports
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Profile from '../../pages/Profile';
import { theme } from '../../theme/theme';
import { createMockUser, createMockTechnician, createMockAdmin } from '../factories';
import { mockLocalStorageWithUser, resetAllMocks } from '../mocks/apiMocks';
import { visualTester, visualTestUtils, setupVisualTesting } from '../utils/visualRegression';

// Setup visual testing
setupVisualTesting();

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

const renderProfile = async (user = createMockTechnician()) => {
  mockLocalStorageWithUser(user);
  const result = render(
    <TestWrapper>
      <Profile />
    </TestWrapper>
  );

  // Wait for component to load
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: /profile settings/i })).toBeInTheDocument();
  });

  return result;
};

describe('Profile Visual Regression Tests', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  describe('Basic Layout', () => {
    it('matches baseline for default technician profile', async () => {
      const { container } = await renderProfile();
      
      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z',
        waitForElements: ['[data-testid="profile-heading"]']
      });

      await expect(container).toMatchVisualBaseline('profile-technician-default');
    });

    it('matches baseline for admin profile', async () => {
      const admin = createMockAdmin();
      const { container } = await renderProfile(admin);
      
      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z'
      });

      await expect(container).toMatchVisualBaseline('profile-admin-default');
    });

    it('matches baseline for manager profile', async () => {
      const manager = createMockUser({ 
        role: 'MANAGER', 
        name: 'Manager User',
        email: 'manager@company.com' 
      });
      const { container } = await renderProfile(manager);
      
      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z'
      });

      await expect(container).toMatchVisualBaseline('profile-manager-default');
    });
  });

  describe('Loading States', () => {
    it('matches baseline for loading state', async () => {
      // Render without waiting for data load
      mockLocalStorageWithUser(createMockTechnician());
      const { container } = render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      );

      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z'
      });

      await expect(container).toMatchVisualBaseline('profile-loading');
    });

    it('matches baseline for form submission loading', async () => {
      const { container } = await renderProfile();
      
      // Simulate saving state
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      saveButton.setAttribute('disabled', 'true');
      
      // Add loading indicator
      const loadingSpinner = document.createElement('div');
      loadingSpinner.className = 'MuiCircularProgress-root';
      loadingSpinner.setAttribute('data-testid', 'saving-spinner');
      saveButton.insertBefore(loadingSpinner, saveButton.firstChild);

      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z',
        hideElements: [] // Don't hide loading spinner for this test
      });

      await expect(container).toMatchVisualBaseline('profile-saving');
    });
  });

  describe('Form States', () => {
    it('matches baseline with form validation errors', async () => {
      const { container } = await renderProfile();
      
      // Simulate validation error
      const errorAlert = document.createElement('div');
      errorAlert.className = 'MuiAlert-root MuiAlert-standardError';
      errorAlert.setAttribute('data-testid', 'error-message');
      errorAlert.textContent = 'Failed to update profile';
      
      const profileForm = container.querySelector('form');
      if (profileForm) {
        profileForm.insertBefore(errorAlert, profileForm.firstChild);
      }

      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z'
      });

      await expect(container).toMatchVisualBaseline('profile-validation-error');
    });

    it('matches baseline with success message', async () => {
      const { container } = await renderProfile();
      
      // Simulate success message
      const successAlert = document.createElement('div');
      successAlert.className = 'MuiAlert-root MuiAlert-standardSuccess';
      successAlert.setAttribute('data-testid', 'success-message');
      successAlert.textContent = 'Profile updated successfully';
      
      const profileForm = container.querySelector('form');
      if (profileForm) {
        profileForm.insertBefore(successAlert, profileForm.firstChild);
      }

      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z'
      });

      await expect(container).toMatchVisualBaseline('profile-success-message');
    });

    it('matches baseline with password requirements visible', async () => {
      const { container } = await renderProfile();
      
      // Focus on password field to show requirements
      const passwordInput = screen.getByLabelText(/new password/i);
      passwordInput.focus();

      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z'
      });

      await expect(container).toMatchVisualBaseline('profile-password-requirements');
    });
  });

  describe('User Information Variations', () => {
    it('matches baseline for user without organization', async () => {
      const user = createMockUser({ organization: null });
      const { container } = await renderProfile(user);
      
      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z'
      });

      await expect(container).toMatchVisualBaseline('profile-no-organization');
    });

    it('matches baseline for user with long name', async () => {
      const user = createMockUser({ 
        name: 'Very Long User Name That Might Wrap To Multiple Lines' 
      });
      const { container } = await renderProfile(user);
      
      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z'
      });

      await expect(container).toMatchVisualBaseline('profile-long-name');
    });

    it('matches baseline for user with long email', async () => {
      const user = createMockUser({ 
        email: 'very.long.email.address.that.might.overflow@very-long-company-domain-name.com' 
      });
      const { container } = await renderProfile(user);
      
      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z'
      });

      await expect(container).toMatchVisualBaseline('profile-long-email');
    });
  });

  describe('Role-based Visual Differences', () => {
    it('shows correct role chip colors for different roles', async () => {
      const roles = ['ADMIN', 'MANAGER', 'TECHNICIAN'];
      const results: Record<string, any> = {};

      for (const role of roles) {
        const user = createMockUser({ role: role as any });
        const { container } = await renderProfile(user);
        
        await visualTestUtils.setupVisualTest(container as HTMLElement, {
          mockTime: '2024-01-15T10:00:00Z'
        });

        results[role] = await visualTester.compareScreenshot(
          `profile-role-${role.toLowerCase()}`,
          container as HTMLElement
        );
      }

      // All role variations should match their baselines
      Object.values(results).forEach(result => {
        expect(result.match).toBe(true);
      });
    });
  });

  describe('Responsive Design', () => {
    it('maintains consistency across standard viewports', async () => {
      const { container } = await renderProfile();
      
      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z'
      });

      await expect(container).toBeResponsivelyConsistent('profile-responsive');
    });

    it('maintains consistency across industrial viewports', async () => {
      const { container } = await renderProfile();
      const industrialViewports = visualTestUtils.getIndustrialViewports();
      
      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z'
      });

      const results = await visualTester.compareResponsiveScreenshots(
        'profile-industrial',
        industrialViewports,
        container as HTMLElement
      );

      Object.values(results).forEach(result => {
        expect(result.match).toBe(true);
      });
    });
  });

  describe('Theme Consistency', () => {
    it('maintains consistency across light and dark themes', async () => {
      const { container } = await renderProfile();
      
      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z'
      });

      await expect(container).toBeThemeConsistent('profile-themes', ['light', 'dark']);
    });

    it('maintains consistency with high contrast theme', async () => {
      const { container } = await renderProfile();
      
      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z'
      });

      await expect(container).toBeThemeConsistent(
        'profile-accessibility-themes', 
        ['light', 'dark', 'high-contrast']
      );
    });
  });

  describe('Focus and Interaction States', () => {
    it('matches baseline with focused form elements', async () => {
      const { container } = await renderProfile();
      
      // Focus on name input
      const nameInput = screen.getByLabelText(/full name/i);
      nameInput.focus();
      nameInput.style.outline = '2px solid #1976d2'; // Simulate focus outline

      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z'
      });

      await expect(container).toMatchVisualBaseline('profile-focused-input');
    });

    it('matches baseline with hover states', async () => {
      const { container } = await renderProfile();
      
      // Simulate hover on save button
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      saveButton.style.backgroundColor = '#1565c0'; // Simulate hover color

      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z'
      });

      await expect(container).toMatchVisualBaseline('profile-button-hover');
    });
  });

  describe('Edge Cases', () => {
    it('matches baseline with minimal user data', async () => {
      const user = createMockUser({ 
        name: '',
        email: '',
        organization: null 
      });
      const { container } = await renderProfile(user);
      
      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z'
      });

      await expect(container).toMatchVisualBaseline('profile-minimal-data');
    });

    it('matches baseline with unicode characters in name', async () => {
      const user = createMockUser({ 
        name: '测试用户 José María Øyvind' 
      });
      const { container } = await renderProfile(user);
      
      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z'
      });

      await expect(container).toMatchVisualBaseline('profile-unicode-name');
    });

    it('matches baseline with disabled form state', async () => {
      const { container } = await renderProfile();
      
      // Disable all form inputs
      const inputs = container.querySelectorAll('input, button');
      inputs.forEach(input => {
        (input as HTMLElement).setAttribute('disabled', 'true');
      });

      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z'
      });

      await expect(container).toMatchVisualBaseline('profile-disabled-form');
    });
  });

  describe('Accessibility Visual States', () => {
    it('matches baseline with high contrast colors', async () => {
      const { container } = await renderProfile();
      
      // Apply high contrast styles
      document.body.style.filter = 'contrast(150%)';
      document.body.style.setProperty('--text-primary', '#000000');
      document.body.style.setProperty('--background-primary', '#ffffff');

      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z'
      });

      await expect(container).toMatchVisualBaseline('profile-high-contrast');
    });

    it('matches baseline with reduced motion', async () => {
      const { container } = await renderProfile();
      
      // Apply reduced motion styles
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
      style.setAttribute('data-visual-test', 'true');
      document.head.appendChild(style);

      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z'
      });

      await expect(container).toMatchVisualBaseline('profile-reduced-motion');
    });

    it('matches baseline with large text scale', async () => {
      const { container } = await renderProfile();
      
      // Simulate 200% text scaling
      document.body.style.fontSize = '200%';

      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z'
      });

      await expect(container).toMatchVisualBaseline('profile-large-text');
    });
  });

  describe('Print Styles', () => {
    it('matches baseline for print layout', async () => {
      const { container } = await renderProfile();
      
      // Apply print media styles
      const printStyle = document.createElement('style');
      printStyle.media = 'print';
      printStyle.textContent = `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          * { color: black !important; }
        }
      `;
      printStyle.setAttribute('data-visual-test', 'true');
      document.head.appendChild(printStyle);

      await visualTestUtils.setupVisualTest(container as HTMLElement, {
        mockTime: '2024-01-15T10:00:00Z'
      });

      await expect(container).toMatchVisualBaseline('profile-print-layout');
    });
  });
});