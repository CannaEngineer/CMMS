/**
 * E2E Tests for Profile & Settings Management System
 * Tests the complete user journey for profile management and settings
 */

describe('Profile & Settings Management System', () => {
  beforeEach(() => {
    // Seed test data
    cy.seedTestData();
    
    // Login as technician
    cy.loginAsUser('technician');
    
    // Mark performance start
    cy.markPerformance('profile-page-start');
  });

  describe('Profile Management', () => {
    it('displays user profile information correctly', () => {
      cy.visit('/profile');
      cy.waitForPageLoad();
      
      // Mark performance end
      cy.markPerformance('profile-page-loaded');
      cy.measurePerformance('profile-page-start', 'profile-page-loaded');

      // Verify profile page loads
      cy.get('[data-testid="profile-heading"]').should('contain', 'Profile Settings');
      
      // Verify user information is displayed
      cy.get('[data-testid="user-name"]').should('contain', 'Test Technician');
      cy.get('[data-testid="user-email"]').should('contain', 'test.technician@company.com');
      cy.get('[data-testid="user-role"]').should('contain', 'TECHNICIAN');
      cy.get('[data-testid="user-organization"]').should('contain', 'Test Company');
      
      // Verify avatar with initials
      cy.get('[data-testid="user-avatar"]').should('contain', 'TT');
    });

    it('allows editing profile information', () => {
      cy.visit('/profile');
      cy.waitForPageLoad();

      // Mock successful update
      cy.intercept('PUT', '**/api/users/*', {
        statusCode: 200,
        body: {
          id: 1,
          name: 'Updated Test Technician',
          email: 'updated.technician@company.com',
          role: 'TECHNICIAN'
        }
      }).as('updateProfile');

      // Edit name field
      cy.get('[data-testid="name-input"]')
        .clear()
        .type('Updated Test Technician');

      // Edit email field
      cy.get('[data-testid="email-input"]')
        .clear()
        .type('updated.technician@company.com');

      // Submit form
      cy.get('[data-testid="save-profile-button"]').click();

      // Wait for API call
      cy.wait('@updateProfile');

      // Verify success message
      cy.get('[data-testid="success-message"]').should('contain', 'Profile updated successfully');
      
      // Verify form is updated with new values
      cy.get('[data-testid="name-input"]').should('have.value', 'Updated Test Technician');
      cy.get('[data-testid="email-input"]').should('have.value', 'updated.technician@company.com');
    });

    it('validates profile form inputs', () => {
      cy.visit('/profile');
      cy.waitForPageLoad();

      // Clear required fields
      cy.get('[data-testid="name-input"]').clear();
      cy.get('[data-testid="email-input"]').clear();

      // Try to submit
      cy.get('[data-testid="save-profile-button"]').should('be.disabled');

      // Add invalid email
      cy.get('[data-testid="email-input"]').type('invalid-email');
      cy.get('[data-testid="save-profile-button"]').should('be.disabled');

      // Add valid data
      cy.get('[data-testid="name-input"]').type('Valid Name');
      cy.get('[data-testid="email-input"]').clear().type('valid@email.com');
      cy.get('[data-testid="save-profile-button"]').should('not.be.disabled');
    });

    it('handles profile update errors gracefully', () => {
      cy.visit('/profile');
      cy.waitForPageLoad();

      // Mock error response
      cy.intercept('PUT', '**/api/users/*', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('updateProfileError');

      // Edit and submit
      cy.get('[data-testid="name-input"]').clear().type('New Name');
      cy.get('[data-testid="save-profile-button"]').click();

      // Wait for error
      cy.wait('@updateProfileError');

      // Verify error message
      cy.get('[data-testid="error-message"]').should('contain', 'Failed to update profile');
      
      // Verify form is still editable
      cy.get('[data-testid="name-input"]').should('not.be.disabled');
    });

    it('changes password successfully', () => {
      cy.visit('/profile');
      cy.waitForPageLoad();

      // Mock successful password change
      cy.intercept('PUT', '**/api/users/*', {
        statusCode: 200,
        body: { success: true }
      }).as('changePassword');

      // Fill password form
      cy.get('[data-testid="current-password-input"]').type('oldpassword');
      cy.get('[data-testid="new-password-input"]').type('newpassword123');
      cy.get('[data-testid="confirm-password-input"]').type('newpassword123');

      // Submit password change
      cy.get('[data-testid="update-password-button"]').click();

      // Wait for API call
      cy.wait('@changePassword');

      // Verify success message
      cy.get('[data-testid="success-message"]').should('contain', 'Password updated successfully');
      
      // Verify form is cleared
      cy.get('[data-testid="current-password-input"]').should('have.value', '');
      cy.get('[data-testid="new-password-input"]').should('have.value', '');
      cy.get('[data-testid="confirm-password-input"]').should('have.value', '');
    });

    it('validates password requirements', () => {
      cy.visit('/profile');
      cy.waitForPageLoad();

      // Test password length validation
      cy.get('[data-testid="current-password-input"]').type('oldpass');
      cy.get('[data-testid="new-password-input"]').type('123'); // Too short
      cy.get('[data-testid="confirm-password-input"]').type('123');
      
      cy.get('[data-testid="update-password-button"]').click();
      cy.get('[data-testid="error-message"]').should('contain', 'Password must be at least 6 characters long');

      // Test password mismatch
      cy.get('[data-testid="new-password-input"]').clear().type('newpassword123');
      cy.get('[data-testid="confirm-password-input"]').clear().type('differentpassword');
      
      cy.get('[data-testid="update-password-button"]').click();
      cy.get('[data-testid="error-message"]').should('contain', 'New passwords do not match');
    });
  });

  describe('Settings Page', () => {
    it('navigates between settings tabs', () => {
      cy.visit('/settings');
      cy.waitForPageLoad();

      // Verify settings page loads with default tab
      cy.get('[data-testid="settings-heading"]').should('contain', 'Settings');
      cy.get('[data-testid="import-data-tab"]').should('have.attr', 'aria-selected', 'true');

      // Navigate to Import History tab
      cy.get('[data-testid="import-history-tab"]').click();
      cy.get('[data-testid="import-history-tab"]').should('have.attr', 'aria-selected', 'true');
      cy.get('[data-testid="import-history-content"]').should('be.visible');

      // Navigate to General tab
      cy.get('[data-testid="general-tab"]').click();
      cy.get('[data-testid="general-tab"]').should('have.attr', 'aria-selected', 'true');
      cy.get('[data-testid="general-content"]').should('be.visible');

      // Navigate to Notifications tab
      cy.get('[data-testid="notifications-tab"]').click();
      cy.get('[data-testid="notifications-tab"]').should('have.attr', 'aria-selected', 'true');
      cy.get('[data-testid="notifications-content"]').should('be.visible');

      // Navigate to Security tab
      cy.get('[data-testid="security-tab"]').click();
      cy.get('[data-testid="security-tab"]').should('have.attr', 'aria-selected', 'true');
      cy.get('[data-testid="security-content"]').should('be.visible');
    });

    it('displays import data management interface', () => {
      cy.visit('/settings');
      cy.waitForPageLoad();

      // Should be on Import Data tab by default
      cy.get('[data-testid="import-manager"]').should('be.visible');
      cy.get('[data-testid="import-data-tab"]').should('have.attr', 'aria-selected', 'true');
    });

    it('shows import history when navigated to', () => {
      cy.visit('/settings');
      cy.waitForPageLoad();

      // Navigate to Import History tab
      cy.get('[data-testid="import-history-tab"]').click();
      
      // Should show import history component
      cy.get('[data-testid="import-history"]').should('be.visible');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('works correctly on mobile devices', () => {
      cy.simulateMobile();
      cy.visit('/profile');
      cy.waitForPageLoad();

      // Verify mobile layout
      cy.get('[data-testid="profile-heading"]').should('be.visible');
      cy.get('[data-testid="user-avatar"]').should('be.visible');
      
      // Test form interactions with touch
      cy.get('[data-testid="name-input"]').should('be.visible').clickWithGloves();
      cy.get('[data-testid="name-input"]').typeWithGloves('Mobile Test User');
      
      // Verify mobile-specific features
      cy.get('[data-testid="save-profile-button"]').should('be.visible');
    });

    it('adapts settings tabs for mobile', () => {
      cy.simulateMobile();
      cy.visit('/settings');
      cy.waitForPageLoad();

      // Tabs should be scrollable on mobile
      cy.get('[data-testid="settings-tabs"]').should('be.visible');
      
      // Test tab navigation on mobile
      cy.get('[data-testid="import-history-tab"]').clickWithGloves();
      cy.get('[data-testid="import-history-tab"]').should('have.attr', 'aria-selected', 'true');
    });
  });

  describe('Accessibility', () => {
    it('meets accessibility standards on profile page', () => {
      cy.visit('/profile');
      cy.waitForPageLoad();
      
      // Check accessibility
      cy.checkA11y();
      
      // Test keyboard navigation
      cy.get('[data-testid="name-input"]').focus();
      cy.get('[data-testid="name-input"]').should('have.focus');
      
      cy.get('body').tab();
      cy.get('[data-testid="email-input"]').should('have.focus');
      
      cy.get('body').tab();
      cy.get('[data-testid="save-profile-button"]').should('have.focus');
    });

    it('meets accessibility standards on settings page', () => {
      cy.visit('/settings');
      cy.waitForPageLoad();
      
      // Check accessibility
      cy.checkA11y();
      
      // Test tab navigation with keyboard
      cy.get('[data-testid="import-data-tab"]').focus();
      cy.get('[data-testid="import-data-tab"]').should('have.focus');
      
      // Navigate tabs with arrow keys
      cy.get('[data-testid="import-data-tab"]').type('{rightarrow}');
      cy.get('[data-testid="import-history-tab"]').should('have.focus');
    });
  });

  describe('Performance', () => {
    it('loads profile page within acceptable time', () => {
      cy.visit('/profile');
      cy.measurePageLoadTime();
      cy.waitForPageLoad();

      // Verify page performance
      cy.window().then((win) => {
        const loadTime = win.performance.timing.loadEventEnd - win.performance.timing.navigationStart;
        expect(loadTime).to.be.lessThan(5000); // 5 seconds for industrial environment
      });
    });

    it('handles slow network conditions gracefully', () => {
      cy.simulateSlowNetwork();
      cy.visit('/profile');
      
      // Should show loading state
      cy.get('[data-testid="loading-indicator"]').should('be.visible');
      
      // Eventually loads content
      cy.waitForPageLoad();
      cy.get('[data-testid="profile-heading"]').should('be.visible');
    });
  });

  describe('Industrial Environment Conditions', () => {
    it('works under industrial environment conditions', () => {
      cy.simulateIndustrialEnvironment();
      cy.visit('/profile');
      cy.waitForPageLoad();

      // Test form interactions with simulated gloves
      cy.get('[data-testid="name-input"]').clickWithGloves();
      cy.get('[data-testid="name-input"]').typeWithGloves('Industrial Test User');
      
      // Verify interactions work despite simulated vibration and poor lighting
      cy.get('[data-testid="save-profile-button"]').clickWithGloves();
    });

    it('handles network interruptions gracefully', () => {
      cy.visit('/profile');
      cy.waitForPageLoad();

      // Fill form
      cy.get('[data-testid="name-input"]').clear().type('Test Name');
      
      // Simulate network failure during save
      cy.testNetworkConditions('offline');
      cy.get('[data-testid="save-profile-button"]').click();
      
      // Should handle gracefully (show offline message or retry)
      cy.get('[data-testid="error-message"]').should('exist');
      
      // Restore network and retry
      cy.testNetworkConditions('online');
      cy.intercept('PUT', '**/api/users/*', {
        statusCode: 200,
        body: { success: true }
      }).as('retryUpdate');
      
      cy.get('[data-testid="save-profile-button"]').click();
      cy.wait('@retryUpdate');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });

  describe('Error Recovery', () => {
    it('recovers from API errors', () => {
      cy.visit('/profile');
      cy.waitForPageLoad();

      // Mock initial error
      cy.intercept('PUT', '**/api/users/*', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('initialError');

      // Try to update
      cy.get('[data-testid="name-input"]').clear().type('New Name');
      cy.get('[data-testid="save-profile-button"]').click();
      cy.wait('@initialError');

      // Should show error
      cy.get('[data-testid="error-message"]').should('be.visible');

      // Mock successful retry
      cy.intercept('PUT', '**/api/users/*', {
        statusCode: 200,
        body: { success: true }
      }).as('successfulRetry');

      // Retry should work
      cy.get('[data-testid="save-profile-button"]').click();
      cy.wait('@successfulRetry');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('maintains form state during errors', () => {
      cy.visit('/profile');
      cy.waitForPageLoad();

      // Fill form
      const testName = 'Test Name That Should Persist';
      const testEmail = 'persistent@test.com';
      
      cy.get('[data-testid="name-input"]').clear().type(testName);
      cy.get('[data-testid="email-input"]').clear().type(testEmail);

      // Mock error
      cy.intercept('PUT', '**/api/users/*', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('saveError');

      // Submit and get error
      cy.get('[data-testid="save-profile-button"]').click();
      cy.wait('@saveError');

      // Form values should persist
      cy.get('[data-testid="name-input"]').should('have.value', testName);
      cy.get('[data-testid="email-input"]').should('have.value', testEmail);
    });
  });

  describe('Cross-browser Compatibility', () => {
    it('works consistently across different viewports', () => {
      // Test different screen sizes
      const viewports = [
        { width: 1920, height: 1080 }, // Desktop
        { width: 1024, height: 768 },  // Tablet
        { width: 375, height: 667 }    // Mobile
      ];

      viewports.forEach((viewport) => {
        cy.viewport(viewport.width, viewport.height);
        cy.visit('/profile');
        cy.waitForPageLoad();

        // Core functionality should work at all sizes
        cy.get('[data-testid="profile-heading"]').should('be.visible');
        cy.get('[data-testid="name-input"]').should('be.visible');
        cy.get('[data-testid="save-profile-button"]').should('be.visible');
      });
    });
  });

  describe('Data Persistence', () => {
    it('maintains user session across page reloads', () => {
      cy.visit('/profile');
      cy.waitForPageLoad();

      // Verify user is logged in
      cy.get('[data-testid="user-name"]').should('contain', 'Test Technician');

      // Reload page
      cy.reload();
      cy.waitForPageLoad();

      // Should still be logged in
      cy.get('[data-testid="user-name"]').should('contain', 'Test Technician');
      cy.url().should('include', '/profile');
    });

    it('handles session expiration gracefully', () => {
      cy.visit('/profile');
      cy.waitForPageLoad();

      // Mock session expiration
      cy.intercept('PUT', '**/api/users/*', {
        statusCode: 401,
        body: { error: 'Unauthorized' }
      }).as('sessionExpired');

      // Try to update profile
      cy.get('[data-testid="name-input"]').clear().type('New Name');
      cy.get('[data-testid="save-profile-button"]').click();
      cy.wait('@sessionExpired');

      // Should redirect to login or show appropriate message
      cy.url().should('include', '/login');
    });
  });
});