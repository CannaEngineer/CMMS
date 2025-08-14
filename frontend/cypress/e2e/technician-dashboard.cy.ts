/**
 * E2E Tests for Technician Time Tracking & Work Management System
 * Tests the complete technician workflow for work order management
 */

describe('Technician Time Tracking & Work Management System', () => {
  beforeEach(() => {
    // Mock work orders for technician
    const mockWorkOrders = [
      {
        id: 1,
        title: 'Repair Conveyor Belt Motor',
        description: 'Motor bearing replacement required for Line A conveyor',
        status: 'PENDING',
        priority: 'HIGH',
        assignedTo: { id: 1, name: 'Test Technician', email: 'test.technician@company.com' },
        assignedToId: 1,
        assetName: 'Conveyor Belt A1',
        assetId: 1,
        dueDate: '2024-02-01T17:00:00Z',
        estimatedHours: 4,
        createdAt: '2024-01-15T08:00:00Z'
      },
      {
        id: 2,
        title: 'Monthly Pump Maintenance',
        description: 'Routine maintenance check for pump B2',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        assignedTo: { id: 1, name: 'Test Technician', email: 'test.technician@company.com' },
        assignedToId: 1,
        assetName: 'Pump B2',
        assetId: 2,
        dueDate: '2024-01-25T17:00:00Z',
        estimatedHours: 2,
        createdAt: '2024-01-14T10:00:00Z'
      },
      {
        id: 3,
        title: 'Overdue Safety Inspection',
        description: 'Safety inspection for equipment C3',
        status: 'PENDING',
        priority: 'URGENT',
        assignedTo: { id: 1, name: 'Test Technician', email: 'test.technician@company.com' },
        assignedToId: 1,
        assetName: 'Equipment C3',
        assetId: 3,
        dueDate: '2024-01-10T17:00:00Z', // Overdue
        estimatedHours: 1,
        createdAt: '2024-01-05T09:00:00Z'
      }
    ];

    cy.mockWorkOrders(mockWorkOrders);

    // Login as technician
    cy.loginAsUser('technician');
    
    // Mark performance start
    cy.markPerformance('dashboard-start');
  });

  describe('Dashboard Overview', () => {
    it('displays technician dashboard with work order statistics', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();
      
      // Mark performance end
      cy.markPerformance('dashboard-loaded');
      cy.measurePerformance('dashboard-start', 'dashboard-loaded');

      // Verify dashboard loads
      cy.get('[data-testid="dashboard-heading"]').should('contain', 'My Work Orders');
      cy.get('[data-testid="welcome-message"]').should('contain', 'Welcome back, Test Technician');

      // Verify statistics
      cy.get('[data-testid="total-stat"]').should('contain', '3'); // Total work orders
      cy.get('[data-testid="in-progress-stat"]').should('contain', '1'); // In progress
      cy.get('[data-testid="pending-stat"]').should('contain', '2'); // Pending
      cy.get('[data-testid="completed-stat"]').should('contain', '0'); // Completed
    });

    it('displays action buttons and navigation', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Verify action buttons
      cy.get('[data-testid="refresh-button"]').should('be.visible');
      cy.get('[data-testid="notifications-button"]').should('be.visible');
      cy.get('[data-testid="qr-scanner-button"]').should('be.visible');

      // Verify floating QR scanner button
      cy.get('[data-testid="floating-qr-button"]').should('be.visible');

      // Verify notification badge for pending work orders
      cy.get('[data-testid="notifications-button"]')
        .find('[data-testid="notification-badge"]')
        .should('contain', '2'); // 2 pending work orders
    });

    it('shows work orders with correct information', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // High priority pending work order
      cy.get('[data-testid="work-order-1"]').should('be.visible');
      cy.get('[data-testid="work-order-1"]').should('contain', 'Repair Conveyor Belt Motor');
      cy.get('[data-testid="work-order-1"]').should('contain', 'HIGH');
      cy.get('[data-testid="work-order-1"]').should('contain', 'PENDING');
      cy.get('[data-testid="work-order-1"]').should('contain', 'Conveyor Belt A1');

      // In-progress work order with progress indicator
      cy.get('[data-testid="work-order-2"]').should('be.visible');
      cy.get('[data-testid="work-order-2"]').should('contain', 'Monthly Pump Maintenance');
      cy.get('[data-testid="work-order-2"]').should('contain', 'IN_PROGRESS');
      cy.get('[data-testid="work-order-2"]').find('[data-testid="progress-indicator"]').should('be.visible');

      // Overdue work order with visual indicators
      cy.get('[data-testid="work-order-3"]').should('be.visible');
      cy.get('[data-testid="work-order-3"]').should('contain', 'Overdue Safety Inspection');
      cy.get('[data-testid="work-order-3"]').should('contain', 'URGENT');
      cy.get('[data-testid="work-order-3"]').should('contain', 'OVERDUE');
      cy.get('[data-testid="work-order-3"]').should('have.class', 'overdue');
    });
  });

  describe('Work Order Status Management', () => {
    it('starts a pending work order', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Mock status update
      cy.intercept('PUT', '**/api/work-orders/1/status', {
        statusCode: 200,
        body: {
          id: 1,
          title: 'Repair Conveyor Belt Motor',
          status: 'IN_PROGRESS'
        }
      }).as('startWorkOrder');

      // Click start button on pending work order
      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="start-button"]')
        .click();

      // Wait for status update
      cy.wait('@startWorkOrder');

      // Verify work order status changed
      cy.get('[data-testid="work-order-1"]').should('contain', 'IN_PROGRESS');
      cy.get('[data-testid="work-order-1"]').find('[data-testid="progress-indicator"]').should('be.visible');

      // Statistics should update
      cy.get('[data-testid="in-progress-stat"]').should('contain', '2');
      cy.get('[data-testid="pending-stat"]').should('contain', '1');
    });

    it('completes an in-progress work order', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Mock status update
      cy.intercept('PUT', '**/api/work-orders/2/status', {
        statusCode: 200,
        body: {
          id: 2,
          title: 'Monthly Pump Maintenance',
          status: 'COMPLETED'
        }
      }).as('completeWorkOrder');

      // Click complete button on in-progress work order
      cy.get('[data-testid="work-order-2"]')
        .find('[data-testid="complete-button"]')
        .click();

      // Should open status confirmation dialog
      cy.get('[data-testid="status-update-dialog"]').should('be.visible');
      cy.get('[data-testid="status-update-dialog"]').should('contain', 'Update Work Order Status');

      // Confirm completion
      cy.get('[data-testid="status-select"]').click();
      cy.get('[data-testid="status-option-completed"]').click();
      cy.get('[data-testid="confirm-status-button"]').click();

      // Wait for completion
      cy.wait('@completeWorkOrder');

      // Dialog should close
      cy.get('[data-testid="status-update-dialog"]').should('not.exist');

      // Verify work order status changed
      cy.get('[data-testid="work-order-2"]').should('contain', 'COMPLETED');

      // Statistics should update
      cy.get('[data-testid="completed-stat"]').should('contain', '1');
      cy.get('[data-testid="in-progress-stat"]').should('contain', '0');
    });

    it('pauses an in-progress work order', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Mock status update
      cy.intercept('PUT', '**/api/work-orders/2/status', {
        statusCode: 200,
        body: {
          id: 2,
          title: 'Monthly Pump Maintenance',
          status: 'ON_HOLD'
        }
      }).as('pauseWorkOrder');

      // Click pause button
      cy.get('[data-testid="work-order-2"]')
        .find('[data-testid="pause-button"]')
        .click();

      // Wait for status update
      cy.wait('@pauseWorkOrder');

      // Verify work order status changed
      cy.get('[data-testid="work-order-2"]').should('contain', 'ON_HOLD');

      // Should show resume button instead
      cy.get('[data-testid="work-order-2"]')
        .find('[data-testid="resume-button"]')
        .should('be.visible');
    });

    it('handles status update errors gracefully', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Mock error response
      cy.intercept('PUT', '**/api/work-orders/1/status', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('statusError');

      // Try to start work order
      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="start-button"]')
        .click();

      // Wait for error
      cy.wait('@statusError');

      // Should show error message but maintain functionality
      cy.get('[data-testid="error-toast"]').should('be.visible');
      
      // Button should not be disabled permanently
      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="start-button"]')
        .should('not.be.disabled');
    });
  });

  describe('Time Logging Functionality', () => {
    it('logs time for a work order', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Mock time logging
      cy.intercept('POST', '**/api/work-orders/1/time', {
        statusCode: 200,
        body: {
          id: 1,
          workOrderId: 1,
          hours: 2.5,
          description: 'Replaced motor bearing',
          type: 'LABOR'
        }
      }).as('logTime');

      // Click log time button
      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="log-time-button"]')
        .click();

      // Should open time logging dialog
      cy.get('[data-testid="time-log-dialog"]').should('be.visible');
      cy.get('[data-testid="time-log-dialog"]').should('contain', 'Log Time');

      // Fill time entry form
      cy.get('[data-testid="hours-input"]').type('2.5');
      cy.get('[data-testid="description-input"]').type('Replaced motor bearing and tested system');

      // Submit time entry
      cy.get('[data-testid="submit-time-button"]').click();

      // Wait for time logging
      cy.wait('@logTime');

      // Dialog should close
      cy.get('[data-testid="time-log-dialog"]').should('not.exist');

      // Should show success message
      cy.get('[data-testid="success-toast"]').should('contain', 'Time logged successfully');
    });

    it('validates time entry input', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Open time logging dialog
      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="log-time-button"]')
        .click();

      cy.get('[data-testid="time-log-dialog"]').should('be.visible');

      // Submit button should be disabled initially
      cy.get('[data-testid="submit-time-button"]').should('be.disabled');

      // Add hours but no description
      cy.get('[data-testid="hours-input"]').type('2.0');
      cy.get('[data-testid="submit-time-button"]').should('be.disabled');

      // Add description
      cy.get('[data-testid="description-input"]').type('Work completed');
      cy.get('[data-testid="submit-time-button"]').should('not.be.disabled');

      // Test invalid hours
      cy.get('[data-testid="hours-input"]').clear().type('-1');
      cy.get('[data-testid="submit-time-button"]').should('be.disabled');

      // Test valid decimal hours
      cy.get('[data-testid="hours-input"]').clear().type('1.25');
      cy.get('[data-testid="submit-time-button"]').should('not.be.disabled');
    });

    it('accepts decimal hour increments', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Open time logging dialog
      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="log-time-button"]')
        .click();

      // Hours input should accept decimal values
      cy.get('[data-testid="hours-input"]').should('have.attr', 'type', 'number');
      cy.get('[data-testid="hours-input"]').should('have.attr', 'step', '0.25');
      cy.get('[data-testid="hours-input"]').should('have.attr', 'min', '0');

      // Test various decimal inputs
      cy.get('[data-testid="hours-input"]').type('0.5');
      cy.get('[data-testid="hours-input"]').should('have.value', '0.5');

      cy.get('[data-testid="hours-input"]').clear().type('1.75');
      cy.get('[data-testid="hours-input"]').should('have.value', '1.75');
    });
  });

  describe('Comment/Notes Functionality', () => {
    it('adds a note to a work order', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Mock comment creation
      cy.intercept('POST', '**/api/comments', {
        statusCode: 200,
        body: {
          id: 1,
          content: 'Work progressing well, should be completed by end of day',
          entityType: 'workOrder',
          entityId: 1,
          author: { name: 'Test Technician' }
        }
      }).as('createComment');

      // Click add note button
      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="add-note-button"]')
        .click();

      // Should open comment dialog
      cy.get('[data-testid="comment-dialog"]').should('be.visible');
      cy.get('[data-testid="comment-dialog"]').should('contain', 'Add Note');

      // Add comment
      cy.get('[data-testid="comment-input"]').type('Work progressing well, should be completed by end of day');

      // Submit comment
      cy.get('[data-testid="submit-comment-button"]').click();

      // Wait for comment creation
      cy.wait('@createComment');

      // Dialog should close
      cy.get('[data-testid="comment-dialog"]').should('not.exist');

      // Should show success message
      cy.get('[data-testid="success-toast"]').should('contain', 'Note added successfully');
    });

    it('validates comment content', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Open comment dialog
      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="add-note-button"]')
        .click();

      cy.get('[data-testid="comment-dialog"]').should('be.visible');

      // Submit button should be disabled with empty comment
      cy.get('[data-testid="submit-comment-button"]').should('be.disabled');

      // Type spaces only
      cy.get('[data-testid="comment-input"]').type('   ');
      cy.get('[data-testid="submit-comment-button"]').should('be.disabled');

      // Type actual content
      cy.get('[data-testid="comment-input"]').clear().type('Actual comment content');
      cy.get('[data-testid="submit-comment-button"]').should('not.be.disabled');
    });
  });

  describe('Filtering and Search', () => {
    it('filters work orders by status', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Should show all work orders initially
      cy.get('[data-testid="work-order-1"]').should('be.visible');
      cy.get('[data-testid="work-order-2"]').should('be.visible');
      cy.get('[data-testid="work-order-3"]').should('be.visible');

      // Filter by IN_PROGRESS
      cy.get('[data-testid="status-filter"]').click();
      cy.get('[data-testid="filter-option-in-progress"]').click();

      // Should only show in-progress work order
      cy.get('[data-testid="work-order-2"]').should('be.visible');
      cy.get('[data-testid="work-order-1"]').should('not.exist');
      cy.get('[data-testid="work-order-3"]').should('not.exist');

      // Filter counter should update
      cy.get('[data-testid="filter-counter"]').should('contain', 'Showing 1 of 3 work orders');

      // Reset filter
      cy.get('[data-testid="status-filter"]').click();
      cy.get('[data-testid="filter-option-all"]').click();

      // Should show all work orders again
      cy.get('[data-testid="filter-counter"]').should('contain', 'Showing 3 of 3 work orders');
    });

    it('shows empty state when no matching filters', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Filter by COMPLETED (none exist)
      cy.get('[data-testid="status-filter"]').click();
      cy.get('[data-testid="filter-option-completed"]').click();

      // Should show empty state
      cy.get('[data-testid="empty-state"]').should('be.visible');
      cy.get('[data-testid="empty-state"]').should('contain', 'No work orders found');
      cy.get('[data-testid="empty-state"]').should('contain', 'No work orders with status: completed');
    });
  });

  describe('Real-time Updates', () => {
    it('refreshes data automatically', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Mock updated work order data
      cy.intercept('GET', '**/api/work-orders', {
        statusCode: 200,
        body: [
          {
            id: 1,
            title: 'Repair Conveyor Belt Motor',
            status: 'IN_PROGRESS', // Status changed
            priority: 'HIGH'
          }
        ]
      }).as('autoRefresh');

      // Wait for auto-refresh (simulate with manual trigger for testing)
      cy.get('[data-testid="refresh-button"]').click();
      cy.wait('@autoRefresh');

      // Should show updated status
      cy.get('[data-testid="work-order-1"]').should('contain', 'IN_PROGRESS');
    });

    it('handles manual refresh', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Mock refreshed data
      cy.intercept('GET', '**/api/work-orders', {
        statusCode: 200,
        body: []
      }).as('manualRefresh');

      // Click refresh button
      cy.get('[data-testid="refresh-button"]').click();

      // Wait for refresh
      cy.wait('@manualRefresh');

      // Should show empty state
      cy.get('[data-testid="empty-state"]').should('be.visible');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('works correctly on mobile devices', () => {
      cy.simulateMobile();
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Should adapt layout for mobile
      cy.get('[data-testid="dashboard-heading"]').should('be.visible');
      cy.get('[data-testid="stats-grid"]').should('be.visible');

      // Work order cards should stack vertically
      cy.get('[data-testid="work-order-1"]').should('be.visible');

      // Action buttons should be touch-friendly
      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="start-button"]')
        .clickWithGloves();

      // Floating QR button should be accessible
      cy.get('[data-testid="floating-qr-button"]').should('be.visible');
      cy.get('[data-testid="floating-qr-button"]').clickWithGloves();
    });

    it('condenses action buttons on small screens', () => {
      cy.viewport(375, 667); // Small mobile
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Some buttons might show icons only on very small screens
      cy.get('[data-testid="work-order-2"]')
        .find('[data-testid="action-buttons"]')
        .should('be.visible');

      // Should still be functional
      cy.get('[data-testid="work-order-2"]')
        .find('[data-testid="log-time-button"]')
        .should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('meets accessibility standards', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Check accessibility
      cy.checkA11y();

      // Test keyboard navigation
      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="start-button"]')
        .focus();

      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="start-button"]')
        .should('have.focus');

      // Tab to next button
      cy.get('body').tab();
      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="log-time-button"]')
        .should('have.focus');
    });

    it('provides proper ARIA labels for actions', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Action buttons should have descriptive labels
      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="start-button"]')
        .should('have.attr', 'aria-label')
        .and('contain', 'Start work order');

      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="log-time-button"]')
        .should('have.attr', 'aria-label')
        .and('contain', 'Log time for work order');
    });

    it('announces status changes to screen readers', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Mock status update
      cy.intercept('PUT', '**/api/work-orders/1/status', {
        statusCode: 200,
        body: { id: 1, status: 'IN_PROGRESS' }
      }).as('statusUpdate');

      // Start work order
      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="start-button"]')
        .click();

      cy.wait('@statusUpdate');

      // Should announce change via aria-live region
      cy.get('[data-testid="status-announcement"]')
        .should('contain', 'Work order status updated to In Progress');
    });
  });

  describe('Performance', () => {
    it('loads dashboard within acceptable time', () => {
      cy.visit('/technician');
      cy.measurePageLoadTime();
      cy.waitForPageLoad();

      // Should load efficiently even with multiple work orders
      cy.window().then((win) => {
        const loadTime = win.performance.timing.loadEventEnd - win.performance.timing.navigationStart;
        expect(loadTime).to.be.lessThan(6000); // 6 seconds for industrial environment
      });
    });

    it('handles large work order lists efficiently', () => {
      // Mock large work order list
      const manyWorkOrders = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        title: `Work Order ${i + 1}`,
        description: `Description ${i + 1}`,
        status: 'PENDING',
        priority: 'MEDIUM',
        assignedToId: 1
      }));

      cy.mockWorkOrders(manyWorkOrders);

      cy.visit('/technician');
      cy.waitForPageLoad();

      // Should still load reasonably fast
      cy.get('[data-testid="total-stat"]').should('contain', '50');
      
      // Should render all work orders (or implement virtualization)
      cy.get('[data-testid^="work-order-"]').should('have.length', 50);
    });
  });

  describe('Industrial Environment Conditions', () => {
    it('works under industrial environment conditions', () => {
      cy.simulateIndustrialEnvironment();
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Test interactions with simulated vibration and poor lighting
      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="start-button"]')
        .clickWithGloves();

      // Test form interactions with gloves
      cy.get('[data-testid="work-order-2"]')
        .find('[data-testid="log-time-button"]')
        .clickWithGloves();

      cy.get('[data-testid="time-log-dialog"]').should('be.visible');
      
      cy.get('[data-testid="hours-input"]').typeWithGloves('2.5');
      cy.get('[data-testid="description-input"]').typeWithGloves('Work completed in industrial environment');

      // Should work despite environmental conditions
      cy.get('[data-testid="hours-input"]').should('have.value', '2.5');
    });

    it('handles network interruptions during work', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Start a work order
      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="start-button"]')
        .click();

      // Simulate network failure during time logging
      cy.testNetworkConditions('offline');

      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="log-time-button"]')
        .click();

      cy.get('[data-testid="time-log-dialog"]').should('be.visible');
      cy.get('[data-testid="hours-input"]').type('1.5');
      cy.get('[data-testid="description-input"]').type('Work done offline');

      // Try to submit while offline
      cy.get('[data-testid="submit-time-button"]').click();

      // Should show appropriate offline message
      cy.get('[data-testid="offline-message"]').should('be.visible');

      // When network returns, should allow retry
      cy.testNetworkConditions('online');
      
      // Mock successful time logging after network recovery
      cy.intercept('POST', '**/api/work-orders/1/time', {
        statusCode: 200,
        body: { success: true }
      }).as('offlineTimeLog');

      cy.get('[data-testid="retry-submit-button"]').click();
      cy.wait('@offlineTimeLog');

      // Should succeed
      cy.get('[data-testid="success-toast"]').should('be.visible');
    });

    it('maintains work state during connectivity issues', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Fill time log form
      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="log-time-button"]')
        .click();

      const timeValue = '3.25';
      const descriptionValue = 'Important work that must not be lost';

      cy.get('[data-testid="hours-input"]').type(timeValue);
      cy.get('[data-testid="description-input"]').type(descriptionValue);

      // Simulate network failure
      cy.testNetworkConditions('offline');

      // Form data should persist
      cy.get('[data-testid="hours-input"]').should('have.value', timeValue);
      cy.get('[data-testid="description-input"]').should('have.value', descriptionValue);

      // Close and reopen dialog
      cy.get('[data-testid="cancel-button"]').click();
      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="log-time-button"]')
        .click();

      // Data should still be there (if implemented with local storage)
      // This would depend on actual implementation
      cy.get('[data-testid="time-log-dialog"]').should('be.visible');
    });
  });

  describe('Error Recovery', () => {
    it('recovers from API errors gracefully', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Mock initial error
      cy.intercept('PUT', '**/api/work-orders/1/status', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('statusError');

      // Try to start work order
      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="start-button"]')
        .click();

      cy.wait('@statusError');

      // Should show error but maintain functionality
      cy.get('[data-testid="error-toast"]').should('be.visible');

      // Mock successful retry
      cy.intercept('PUT', '**/api/work-orders/1/status', {
        statusCode: 200,
        body: { id: 1, status: 'IN_PROGRESS' }
      }).as('statusSuccess');

      // Retry should work
      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="start-button"]')
        .click();

      cy.wait('@statusSuccess');
      cy.get('[data-testid="success-toast"]').should('be.visible');
    });

    it('handles session expiration during work', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Mock session expiration
      cy.intercept('PUT', '**/api/work-orders/1/status', {
        statusCode: 401,
        body: { error: 'Unauthorized' }
      }).as('sessionExpired');

      // Try to update work order
      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="start-button"]')
        .click();

      cy.wait('@sessionExpired');

      // Should redirect to login or show re-authentication dialog
      cy.url().should('include', '/login');
    });
  });

  describe('Data Persistence', () => {
    it('maintains dashboard state across page reloads', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Apply filter
      cy.get('[data-testid="status-filter"]').click();
      cy.get('[data-testid="filter-option-pending"]').click();

      // Reload page
      cy.reload();
      cy.waitForPageLoad();

      // Filter state should persist (if implemented)
      cy.get('[data-testid="status-filter"]').should('contain', 'PENDING');
    });

    it('preserves work in progress across browser sessions', () => {
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Start work order
      cy.intercept('PUT', '**/api/work-orders/1/status', {
        statusCode: 200,
        body: { id: 1, status: 'IN_PROGRESS' }
      }).as('startWork');

      cy.get('[data-testid="work-order-1"]')
        .find('[data-testid="start-button"]')
        .click();

      cy.wait('@startWork');

      // Simulate browser restart by clearing cache and visiting again
      cy.clearLocalStorage();
      cy.clearCookies();
      
      // Re-login
      cy.loginAsUser('technician');
      cy.visit('/technician');
      cy.waitForPageLoad();

      // Work order should still show as in progress
      cy.get('[data-testid="work-order-1"]').should('contain', 'IN_PROGRESS');
    });
  });
});