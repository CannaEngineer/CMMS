// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Import cypress-axe for accessibility testing
import 'cypress-axe';

// Global before hook for all tests
beforeEach(() => {
  // Inject axe-core for accessibility testing
  cy.injectAxe();
  
  // Set up viewport for consistent testing
  cy.viewport(1280, 720);
  
  // Clear local storage and session storage
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // Intercept common API calls to prevent external dependencies
  cy.intercept('GET', '**/api/health', { status: 'ok' }).as('healthCheck');
});

// Global after hook
afterEach(() => {
  // Check for console errors (except known ones)
  cy.window().then((win) => {
    const errors = win.console.error.getCalls?.() || [];
    const filteredErrors = errors.filter((error: any) => {
      const message = error.args?.[0]?.toString() || '';
      // Filter out known React/MUI warnings in development
      return !message.includes('React does not recognize') &&
             !message.includes('Warning:') &&
             !message.includes('deprecated');
    });
    
    if (filteredErrors.length > 0) {
      cy.log('Console errors detected:', filteredErrors);
    }
  });
});

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent Cypress from failing the test
  // on uncaught exceptions (like network errors in development)
  if (err.message.includes('Network Error') || 
      err.message.includes('Loading chunk') ||
      err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});

// Performance monitoring
let performanceMarks: string[] = [];

Cypress.Commands.add('markPerformance', (name: string) => {
  performanceMarks.push(name);
  cy.window().then((win) => {
    win.performance.mark(name);
  });
});

Cypress.Commands.add('measurePerformance', (startMark: string, endMark: string) => {
  cy.window().then((win) => {
    const measure = win.performance.measure(`${startMark}-to-${endMark}`, startMark, endMark);
    cy.log(`Performance: ${startMark} to ${endMark} took ${measure.duration}ms`);
    
    // Assert performance thresholds
    if (measure.duration > 5000) {
      cy.log(`⚠️ Performance warning: ${startMark} to ${endMark} took ${measure.duration}ms (>5s)`);
    }
  });
});