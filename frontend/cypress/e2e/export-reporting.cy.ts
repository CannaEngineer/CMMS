/**
 * E2E Tests for Export & Reporting System
 * Tests the complete user journey for export management and reporting
 */

describe('Export & Reporting System', () => {
  beforeEach(() => {
    // Mock export data
    cy.mockExportData({
      templates: [
        {
          id: 'template-1',
          name: 'Work Orders Report',
          description: 'Weekly work orders summary',
          format: 'csv',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          lastExecuted: '2024-01-15T10:00:00Z',
          executionCount: 25
        },
        {
          id: 'template-2',
          name: 'Asset Maintenance Report',
          description: 'Monthly asset maintenance summary',
          format: 'xlsx',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          lastExecuted: '2024-01-10T14:00:00Z',
          executionCount: 12
        }
      ],
      history: {
        items: [
          {
            id: 'export-1',
            templateName: 'Work Orders Report',
            status: 'completed',
            startedAt: '2024-01-15T10:00:00Z',
            completedAt: '2024-01-15T10:05:00Z',
            recordCount: 150,
            fileSize: 25600
          },
          {
            id: 'export-2',
            templateName: 'Asset Maintenance Report',
            status: 'failed',
            startedAt: '2024-01-14T15:00:00Z',
            error: 'Database connection timeout'
          }
        ],
        total: 2
      },
      queue: [
        {
          id: 'queue-1',
          templateName: 'Work Orders Report',
          status: 'processing',
          progress: 75,
          requestedAt: '2024-01-15T11:00:00Z'
        }
      ],
      stats: {
        totalExports: 156,
        successfulExports: 142,
        failedExports: 14,
        totalRecords: 15670
      }
    });

    // Login as admin (has export permissions)
    cy.loginAsUser('admin');
    
    // Mark performance start
    cy.markPerformance('export-center-start');
  });

  describe('Export Center Navigation', () => {
    it('loads export center with all tabs', () => {
      cy.visit('/export');
      cy.waitForPageLoad();
      
      // Mark performance end
      cy.markPerformance('export-center-loaded');
      cy.measurePerformance('export-center-start', 'export-center-loaded');

      // Verify export center loads
      cy.get('[data-testid="export-center-heading"]').should('contain', 'Export Center');
      cy.get('[data-testid="export-center-description"]').should('contain', 'Manage reports, exports, and data analytics');

      // Verify all tabs are present
      cy.get('[data-testid="templates-tab"]').should('be.visible');
      cy.get('[data-testid="history-tab"]').should('be.visible');
      cy.get('[data-testid="queue-tab"]').should('be.visible');
      cy.get('[data-testid="analytics-tab"]').should('be.visible');

      // Default should be templates tab
      cy.get('[data-testid="templates-tab"]').should('have.attr', 'aria-selected', 'true');
    });

    it('displays action buttons and status indicators', () => {
      cy.visit('/export');
      cy.waitForPageLoad();

      // Verify action buttons
      cy.get('[data-testid="quick-export-button"]').should('contain', 'Quick Export');
      cy.get('[data-testid="new-template-button"]').should('contain', 'New Template');
      cy.get('[data-testid="refresh-button"]').should('be.visible');

      // Verify status indicators
      cy.get('[data-testid="pending-exports-indicator"]').should('contain', '1'); // Processing export
      cy.get('[data-testid="live-indicator"]').should('contain', 'Live');
    });

    it('navigates between tabs correctly', () => {
      cy.visit('/export');
      cy.waitForPageLoad();

      // Start on Templates tab
      cy.get('[data-testid="template-manager"]').should('be.visible');

      // Navigate to History tab
      cy.get('[data-testid="history-tab"]').click();
      cy.get('[data-testid="history-tab"]').should('have.attr', 'aria-selected', 'true');
      cy.get('[data-testid="export-history-view"]').should('be.visible');

      // Navigate to Queue tab
      cy.get('[data-testid="queue-tab"]').click();
      cy.get('[data-testid="queue-tab"]').should('have.attr', 'aria-selected', 'true');
      cy.get('[data-testid="export-queue-view"]').should('be.visible');

      // Navigate to Analytics tab
      cy.get('[data-testid="analytics-tab"]').click();
      cy.get('[data-testid="analytics-tab"]').should('have.attr', 'aria-selected', 'true');
      cy.get('[data-testid="export-analytics"]').should('be.visible');
    });

    it('displays statistics cards on templates tab', () => {
      cy.visit('/export');
      cy.waitForPageLoad();

      // Should show stats cards on templates tab
      cy.get('[data-testid="export-stats-cards"]').should('be.visible');
      cy.get('[data-testid="total-exports-stat"]').should('contain', '156');
      cy.get('[data-testid="successful-exports-stat"]').should('contain', '142');
      cy.get('[data-testid="failed-exports-stat"]').should('contain', '14');
    });
  });

  describe('Template Management', () => {
    it('displays existing templates', () => {
      cy.visit('/export');
      cy.waitForPageLoad();

      // Should show template list
      cy.get('[data-testid="template-work-orders-report"]').should('be.visible');
      cy.get('[data-testid="template-work-orders-report"]').should('contain', 'Work Orders Report');
      cy.get('[data-testid="template-work-orders-report"]').should('contain', 'Weekly work orders summary');

      cy.get('[data-testid="template-asset-maintenance-report"]').should('be.visible');
      cy.get('[data-testid="template-asset-maintenance-report"]').should('contain', 'Asset Maintenance Report');
    });

    it('creates new template', () => {
      cy.visit('/export');
      cy.waitForPageLoad();

      // Mock template creation
      cy.intercept('POST', '**/api/export/templates', {
        statusCode: 201,
        body: {
          id: 'template-new',
          name: 'New Test Template',
          description: 'Test template description',
          format: 'xlsx',
          isActive: true
        }
      }).as('createTemplate');

      // Click new template button
      cy.get('[data-testid="new-template-button"]').click();

      // Should open template builder dialog
      cy.get('[data-testid="template-builder-dialog"]').should('be.visible');
      cy.get('[data-testid="template-builder-title"]').should('contain', 'Create New Template');

      // Fill template form
      cy.get('[data-testid="template-name-input"]').type('New Test Template');
      cy.get('[data-testid="template-description-input"]').type('Test template description');
      cy.get('[data-testid="template-format-select"]').click();
      cy.get('[data-testid="format-option-xlsx"]').click();

      // Save template
      cy.get('[data-testid="save-template-button"]').click();

      // Wait for creation
      cy.wait('@createTemplate');

      // Should close dialog and show success message
      cy.get('[data-testid="template-builder-dialog"]').should('not.exist');
      cy.get('[data-testid="success-message"]').should('contain', 'Template created successfully');
    });

    it('edits existing template', () => {
      cy.visit('/export');
      cy.waitForPageLoad();

      // Mock template update
      cy.intercept('PUT', '**/api/export/templates/template-1', {
        statusCode: 200,
        body: {
          id: 'template-1',
          name: 'Updated Work Orders Report',
          description: 'Updated description',
          format: 'csv',
          isActive: true
        }
      }).as('updateTemplate');

      // Click edit button for first template
      cy.get('[data-testid="template-work-orders-report"]')
        .find('[data-testid="edit-template-button"]')
        .click();

      // Should open template builder in edit mode
      cy.get('[data-testid="template-builder-dialog"]').should('be.visible');
      cy.get('[data-testid="template-builder-title"]').should('contain', 'Edit Template');

      // Verify form is pre-filled
      cy.get('[data-testid="template-name-input"]').should('have.value', 'Work Orders Report');

      // Update template
      cy.get('[data-testid="template-name-input"]').clear().type('Updated Work Orders Report');
      cy.get('[data-testid="template-description-input"]').clear().type('Updated description');

      // Save changes
      cy.get('[data-testid="save-template-button"]').click();

      // Wait for update
      cy.wait('@updateTemplate');

      // Should show success message
      cy.get('[data-testid="success-message"]').should('contain', 'Template updated successfully');
    });

    it('executes template', () => {
      cy.visit('/export');
      cy.waitForPageLoad();

      // Mock template execution
      cy.intercept('POST', '**/api/export/templates/template-1/execute', {
        statusCode: 200,
        body: {
          exportId: 'export-new',
          status: 'queued'
        }
      }).as('executeTemplate');

      // Click execute button
      cy.get('[data-testid="template-work-orders-report"]')
        .find('[data-testid="execute-template-button"]')
        .click();

      // Wait for execution
      cy.wait('@executeTemplate');

      // Should show success message
      cy.get('[data-testid="success-message"]').should('contain', 'Export started successfully');
    });

    it('deletes template', () => {
      cy.visit('/export');
      cy.waitForPageLoad();

      // Mock template deletion
      cy.intercept('DELETE', '**/api/export/templates/template-1', {
        statusCode: 200,
        body: { success: true }
      }).as('deleteTemplate');

      // Click delete button
      cy.get('[data-testid="template-work-orders-report"]')
        .find('[data-testid="delete-template-button"]')
        .click();

      // Should show confirmation dialog
      cy.get('[data-testid="delete-confirmation-dialog"]').should('be.visible');
      cy.get('[data-testid="confirm-delete-button"]').click();

      // Wait for deletion
      cy.wait('@deleteTemplate');

      // Should show success message
      cy.get('[data-testid="success-message"]').should('contain', 'Template deleted successfully');
    });
  });

  describe('Export History Management', () => {
    it('displays export history', () => {
      cy.visit('/export');
      cy.waitForPageLoad();

      // Navigate to history tab
      cy.get('[data-testid="history-tab"]').click();

      // Should show history items
      cy.get('[data-testid="history-export-1"]').should('be.visible');
      cy.get('[data-testid="history-export-1"]').should('contain', 'Work Orders Report');
      cy.get('[data-testid="history-export-1"]').should('contain', 'completed');

      cy.get('[data-testid="history-export-2"]').should('be.visible');
      cy.get('[data-testid="history-export-2"]').should('contain', 'Asset Maintenance Report');
      cy.get('[data-testid="history-export-2"]').should('contain', 'failed');
    });

    it('downloads completed export', () => {
      cy.visit('/export');
      cy.waitForPageLoad();

      // Navigate to history tab
      cy.get('[data-testid="history-tab"]').click();

      // Mock download endpoint
      cy.intercept('GET', '**/api/export/exports/export-1/download', {
        statusCode: 200,
        body: { url: '/downloads/export-1.csv' }
      }).as('downloadExport');

      // Mock window.open
      cy.window().then((win) => {
        cy.stub(win, 'open').as('windowOpen');
      });

      // Click download button
      cy.get('[data-testid="history-export-1"]')
        .find('[data-testid="download-button"]')
        .click();

      // Wait for download request
      cy.wait('@downloadExport');

      // Should open download URL
      cy.get('@windowOpen').should('have.been.calledWith', '/downloads/export-1.csv', '_blank');

      // Should show success message
      cy.get('[data-testid="success-message"]').should('contain', 'Download started');
    });

    it('retries failed export', () => {
      cy.visit('/export');
      cy.waitForPageLoad();

      // Navigate to history tab
      cy.get('[data-testid="history-tab"]').click();

      // Mock retry endpoint
      cy.intercept('POST', '**/api/export/exports/export-2/retry', {
        statusCode: 200,
        body: {
          exportId: 'export-retry',
          status: 'queued'
        }
      }).as('retryExport');

      // Click retry button on failed export
      cy.get('[data-testid="history-export-2"]')
        .find('[data-testid="retry-button"]')
        .click();

      // Wait for retry
      cy.wait('@retryExport');

      // Should show success message
      cy.get('[data-testid="success-message"]').should('contain', 'Export retry initiated');
    });
  });

  describe('Queue Management', () => {
    it('displays real-time queue updates', () => {
      cy.visit('/export');
      cy.waitForPageLoad();

      // Navigate to queue tab
      cy.get('[data-testid="queue-tab"]').click();

      // Should show queue items
      cy.get('[data-testid="queue-queue-1"]').should('be.visible');
      cy.get('[data-testid="queue-queue-1"]').should('contain', 'Work Orders Report');
      cy.get('[data-testid="queue-queue-1"]').should('contain', 'processing');
      cy.get('[data-testid="queue-queue-1"]').should('contain', '75%');

      // Should show auto-refresh indicator
      cy.get('[data-testid="auto-refresh-indicator"]').should('contain', 'enabled');
    });

    it('refreshes queue manually', () => {
      cy.visit('/export');
      cy.waitForPageLoad();

      // Navigate to queue tab
      cy.get('[data-testid="queue-tab"]').click();

      // Mock refreshed queue data
      cy.intercept('GET', '**/api/export/queue', {
        statusCode: 200,
        body: [
          {
            id: 'queue-1',
            templateName: 'Work Orders Report',
            status: 'processing',
            progress: 90,
            requestedAt: '2024-01-15T11:00:00Z'
          }
        ]
      }).as('refreshQueue');

      // Click refresh button
      cy.get('[data-testid="refresh-queue-button"]').click();

      // Wait for refresh
      cy.wait('@refreshQueue');

      // Should show updated progress
      cy.get('[data-testid="queue-queue-1"]').should('contain', '90%');
    });

    it('toggles auto-refresh', () => {
      cy.visit('/export');
      cy.waitForPageLoad();

      // Navigate to queue tab
      cy.get('[data-testid="queue-tab"]').click();

      // Should start with auto-refresh enabled
      cy.get('[data-testid="auto-refresh-indicator"]').should('contain', 'enabled');

      // Toggle auto-refresh
      cy.get('[data-testid="toggle-auto-refresh-button"]').click();

      // Should show disabled
      cy.get('[data-testid="auto-refresh-indicator"]').should('contain', 'disabled');

      // Toggle back
      cy.get('[data-testid="toggle-auto-refresh-button"]').click();
      cy.get('[data-testid="auto-refresh-indicator"]').should('contain', 'enabled');
    });
  });

  describe('Quick Export Functionality', () => {
    it('performs quick export', () => {
      cy.visit('/export');
      cy.waitForPageLoad();

      // Mock quick export
      cy.intercept('POST', '**/api/export/quick', {
        statusCode: 200,
        body: {
          exportId: 'quick-export-1',
          status: 'queued'
        }
      }).as('quickExport');

      // Click quick export button
      cy.get('[data-testid="quick-export-button"]').click();

      // Should open quick export dialog
      cy.get('[data-testid="quick-export-dialog"]').should('be.visible');

      // Fill quick export form
      cy.get('[data-testid="export-type-select"]').click();
      cy.get('[data-testid="export-type-work-orders"]').click();

      cy.get('[data-testid="export-format-select"]').click();
      cy.get('[data-testid="format-csv"]').click();

      cy.get('[data-testid="date-range-select"]').click();
      cy.get('[data-testid="date-range-week"]').click();

      // Submit quick export
      cy.get('[data-testid="submit-quick-export-button"]').click();

      // Wait for export
      cy.wait('@quickExport');

      // Should close dialog and show success
      cy.get('[data-testid="quick-export-dialog"]').should('not.exist');
      cy.get('[data-testid="success-message"]').should('contain', 'Quick export started successfully');
    });

    it('validates quick export form', () => {
      cy.visit('/export');
      cy.waitForPageLoad();

      // Open quick export dialog
      cy.get('[data-testid="quick-export-button"]').click();
      cy.get('[data-testid="quick-export-dialog"]').should('be.visible');

      // Submit button should be disabled initially
      cy.get('[data-testid="submit-quick-export-button"]').should('be.disabled');

      // Fill required fields
      cy.get('[data-testid="export-type-select"]').click();
      cy.get('[data-testid="export-type-work-orders"]').click();

      // Should still be disabled without format
      cy.get('[data-testid="submit-quick-export-button"]').should('be.disabled');

      // Add format
      cy.get('[data-testid="export-format-select"]').click();
      cy.get('[data-testid="format-csv"]').click();

      // Should now be enabled
      cy.get('[data-testid="submit-quick-export-button"]').should('not.be.disabled');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('works correctly on mobile devices', () => {
      cy.simulateMobile();
      cy.visit('/export');
      cy.waitForPageLoad();

      // Should show mobile FAB for quick export
      cy.get('[data-testid="mobile-export-fab"]').should('be.visible');

      // Tabs should be scrollable
      cy.get('[data-testid="export-tabs"]').should('be.visible');

      // Test navigation on mobile
      cy.get('[data-testid="history-tab"]').clickWithGloves();
      cy.get('[data-testid="export-history-view"]').should('be.visible');

      // Test FAB interaction
      cy.get('[data-testid="mobile-export-fab"]').clickWithGloves();
      cy.get('[data-testid="quick-export-dialog"]').should('be.visible');
    });

    it('adapts content layout for mobile', () => {
      cy.simulateMobile();
      cy.visit('/export');
      cy.waitForPageLoad();

      // Template cards should stack vertically on mobile
      cy.get('[data-testid="template-list"]').should('be.visible');

      // Action buttons should be mobile-friendly
      cy.get('[data-testid="new-template-button"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('meets accessibility standards', () => {
      cy.visit('/export');
      cy.waitForPageLoad();

      // Check accessibility
      cy.checkA11y();

      // Test keyboard navigation through tabs
      cy.get('[data-testid="templates-tab"]').focus();
      cy.get('[data-testid="templates-tab"]').should('have.focus');

      cy.get('body').type('{rightarrow}');
      cy.get('[data-testid="history-tab"]').should('have.focus');

      cy.get('body').type('{enter}');
      cy.get('[data-testid="history-tab"]').should('have.attr', 'aria-selected', 'true');
    });

    it('provides proper ARIA labels for actions', () => {
      cy.visit('/export');
      cy.waitForPageLoad();

      // Template actions should have proper labels
      cy.get('[data-testid="template-work-orders-report"]')
        .find('[data-testid="execute-template-button"]')
        .should('have.attr', 'aria-label')
        .and('contain', 'Execute');

      cy.get('[data-testid="template-work-orders-report"]')
        .find('[data-testid="edit-template-button"]')
        .should('have.attr', 'aria-label')
        .and('contain', 'Edit');
    });
  });

  describe('Performance', () => {
    it('loads export center efficiently', () => {
      cy.visit('/export');
      cy.measurePageLoadTime();
      cy.waitForPageLoad();

      // Should load within reasonable time
      cy.window().then((win) => {
        const loadTime = win.performance.timing.loadEventEnd - win.performance.timing.navigationStart;
        expect(loadTime).to.be.lessThan(7000); // 7 seconds for complex export interface
      });
    });

    it('handles large template lists efficiently', () => {
      // Mock large template list
      const manyTemplates = Array.from({ length: 100 }, (_, i) => ({
        id: `template-${i}`,
        name: `Template ${i}`,
        description: `Description ${i}`,
        format: 'csv',
        isActive: true
      }));

      cy.mockExportData({ templates: manyTemplates });

      cy.visit('/export');
      cy.waitForPageLoad();

      // Should still load reasonably fast
      cy.get('[data-testid="template-list"]').should('be.visible');
      
      // Should show all templates (or implement virtualization)
      cy.get('[data-testid^="template-"]').should('have.length.greaterThan', 50);
    });
  });

  describe('Error Handling', () => {
    it('handles template loading errors', () => {
      // Mock error response
      cy.intercept('GET', '**/api/export/templates', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('templateError');

      cy.visit('/export');

      // Wait for error
      cy.wait('@templateError');

      // Should show error message
      cy.get('[data-testid="error-message"]').should('contain', 'Failed to load export data');

      // Should still show basic interface
      cy.get('[data-testid="export-center-heading"]').should('be.visible');
    });

    it('handles export execution errors', () => {
      cy.visit('/export');
      cy.waitForPageLoad();

      // Mock execution error
      cy.intercept('POST', '**/api/export/templates/template-1/execute', {
        statusCode: 500,
        body: { error: 'Execution failed' }
      }).as('executeError');

      // Try to execute template
      cy.get('[data-testid="template-work-orders-report"]')
        .find('[data-testid="execute-template-button"]')
        .click();

      // Wait for error
      cy.wait('@executeError');

      // Should show error message
      cy.get('[data-testid="error-message"]').should('contain', 'Failed to execute template');
    });

    it('recovers from network failures', () => {
      cy.visit('/export');
      cy.waitForPageLoad();

      // Simulate network failure
      cy.testNetworkConditions('offline');

      // Try to refresh
      cy.get('[data-testid="refresh-button"]').click();

      // Should handle gracefully
      cy.get('[data-testid="error-message"]').should('exist');

      // Restore network
      cy.testNetworkConditions('online');

      // Mock successful retry
      cy.intercept('GET', '**/api/export/templates', {
        statusCode: 200,
        body: []
      }).as('recoveryRequest');

      // Retry should work
      cy.get('[data-testid="refresh-button"]').click();
      cy.wait('@recoveryRequest');
    });
  });

  describe('Real-time Features', () => {
    it('updates queue status in real-time', () => {
      cy.visit('/export');
      cy.waitForPageLoad();

      // Navigate to queue tab
      cy.get('[data-testid="queue-tab"]').click();

      // Initial state
      cy.get('[data-testid="queue-queue-1"]').should('contain', '75%');

      // Mock updated progress
      cy.intercept('GET', '**/api/export/queue', {
        statusCode: 200,
        body: [
          {
            id: 'queue-1',
            templateName: 'Work Orders Report',
            status: 'completed',
            progress: 100,
            requestedAt: '2024-01-15T11:00:00Z'
          }
        ]
      }).as('queueUpdate');

      // Wait for auto-refresh (simulated with manual trigger)
      cy.get('[data-testid="refresh-queue-button"]').click();
      cy.wait('@queueUpdate');

      // Should show updated status
      cy.get('[data-testid="queue-queue-1"]').should('contain', 'completed');
      cy.get('[data-testid="queue-queue-1"]').should('contain', '100%');
    });

    it('shows live status indicator', () => {
      cy.visit('/export');
      cy.waitForPageLoad();

      // Should show live indicator
      cy.get('[data-testid="live-indicator"]').should('be.visible');
      cy.get('[data-testid="live-indicator"]').should('contain', 'Live');

      // Should show last refresh time
      cy.get('[data-testid="live-indicator"]')
        .trigger('mouseenter');
      
      cy.get('[data-testid="last-refresh-tooltip"]').should('be.visible');
    });
  });

  describe('Industrial Environment Conditions', () => {
    it('works under industrial conditions', () => {
      cy.simulateIndustrialEnvironment();
      cy.visit('/export');
      cy.waitForPageLoad();

      // Test interactions with simulated vibration and poor lighting
      cy.get('[data-testid="new-template-button"]').clickWithGloves();
      cy.get('[data-testid="template-builder-dialog"]').should('be.visible');

      // Test form filling with gloves
      cy.get('[data-testid="template-name-input"]').typeWithGloves('Industrial Test Template');
      cy.get('[data-testid="template-description-input"]').typeWithGloves('Created in industrial environment');

      // Should work despite environmental conditions
      cy.get('[data-testid="template-name-input"]').should('have.value', 'Industrial Test Template');
    });

    it('handles unstable network conditions', () => {
      cy.visit('/export');
      cy.waitForPageLoad();

      // Start template execution
      cy.get('[data-testid="template-work-orders-report"]')
        .find('[data-testid="execute-template-button"]')
        .click();

      // Simulate network interruption
      cy.testNetworkConditions('offline');

      // Should show appropriate feedback
      cy.get('[data-testid="network-status-indicator"]').should('exist');

      // When network returns, should resume
      cy.testNetworkConditions('online');
      
      // Mock successful execution after network recovery
      cy.intercept('POST', '**/api/export/templates/template-1/execute', {
        statusCode: 200,
        body: { exportId: 'export-recovery', status: 'queued' }
      }).as('recoveredExecution');

      // Retry should work
      cy.get('[data-testid="template-work-orders-report"]')
        .find('[data-testid="execute-template-button"]')
        .click();
      
      cy.wait('@recoveredExecution');
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });
});