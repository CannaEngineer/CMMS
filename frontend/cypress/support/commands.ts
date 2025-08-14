/// <reference types="cypress" />
/// <reference types="cypress-axe" />

// ***********************************************
// Custom Commands for CMMS Testing
// ***********************************************

// Login command
Cypress.Commands.add('loginAsUser', (userType: 'technician' | 'admin' | 'manager') => {
  const users = {
    technician: Cypress.env('testUser'),
    admin: Cypress.env('testAdmin'),
    manager: { email: 'test.manager@company.com', password: 'managerpass123', name: 'Test Manager', role: 'MANAGER' }
  };
  
  const user = users[userType];
  
  // Mock the authentication API
  cy.intercept('POST', '**/api/auth/login', {
    statusCode: 200,
    body: {
      user: {
        id: 1,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: { id: 1, name: 'Test Company' }
      },
      token: 'fake-jwt-token'
    }
  }).as('login');
  
  // Visit login page
  cy.visit('/login');
  
  // Fill login form
  cy.get('[data-testid="email-input"]').type(user.email);
  cy.get('[data-testid="password-input"]').type(user.password);
  cy.get('[data-testid="login-button"]').click();
  
  // Wait for login to complete
  cy.wait('@login');
  
  // Verify login success
  cy.url().should('not.include', '/login');
  
  // Store user data in localStorage
  cy.window().then((win) => {
    win.localStorage.setItem('user', JSON.stringify({
      id: 1,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: { id: 1, name: 'Test Company' }
    }));
    win.localStorage.setItem('token', 'fake-jwt-token');
  });
});

// Seed test data command
Cypress.Commands.add('seedTestData', () => {
  // Mock work orders
  const mockWorkOrders = [
    {
      id: 1,
      title: 'Repair Conveyor Belt',
      description: 'Fix motor bearing on Line A conveyor',
      status: 'PENDING',
      priority: 'HIGH',
      assignedTo: { id: 1, name: 'Test Technician', email: 'test.technician@company.com' },
      assignedToId: 1,
      assetName: 'Conveyor Belt A1',
      dueDate: '2024-02-01T17:00:00Z',
      estimatedHours: 4
    },
    {
      id: 2,
      title: 'Maintenance Check',
      description: 'Monthly maintenance for pump B2',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      assignedTo: { id: 1, name: 'Test Technician', email: 'test.technician@company.com' },
      assignedToId: 1,
      assetName: 'Pump B2',
      dueDate: '2024-01-25T17:00:00Z',
      estimatedHours: 2
    }
  ];
  
  cy.intercept('GET', '**/api/work-orders', {
    statusCode: 200,
    body: mockWorkOrders
  }).as('getWorkOrders');
  
  // Mock export templates
  const mockTemplates = [
    {
      id: 'template-1',
      name: 'Work Orders Report',
      description: 'Weekly work orders summary',
      format: 'csv',
      isActive: true
    }
  ];
  
  cy.intercept('GET', '**/api/export/templates', {
    statusCode: 200,
    body: mockTemplates
  }).as('getTemplates');
});

// Wait for page load command
Cypress.Commands.add('waitForPageLoad', () => {
  // Wait for React to hydrate
  cy.get('[data-testid="app-loaded"]', { timeout: 10000 }).should('exist');
  
  // Wait for any loading indicators to disappear
  cy.get('[data-testid="loading"]', { timeout: 5000 }).should('not.exist');
  
  // Ensure page is interactive
  cy.window().should('have.property', 'document');
});

// Accessibility check command
Cypress.Commands.add('checkA11y', () => {
  cy.injectAxe();
  cy.checkA11y(null, {
    rules: {
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true },
      'aria-labels': { enabled: true }
    }
  }, (violations) => {
    if (violations.length > 0) {
      cy.log('Accessibility violations found:', violations);
    }
  });
});

// Mobile simulation command
Cypress.Commands.add('simulateMobile', () => {
  cy.viewport('iphone-8');
  
  // Mock mobile user agent
  cy.window().then((win) => {
    Object.defineProperty(win.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A5341f Safari/604.1',
      configurable: true
    });
  });
  
  // Mock touch events
  cy.window().then((win) => {
    win.ontouchstart = () => {};
  });
});

// Slow network simulation command
Cypress.Commands.add('simulateSlowNetwork', () => {
  // Intercept all API calls with delay
  cy.intercept('**', (req) => {
    req.reply((res) => {
      // Add 2-5 second delay to simulate slow network
      return new Promise((resolve) => {
        setTimeout(() => resolve(res), Math.random() * 3000 + 2000);
      });
    });
  });
});

// Mock work orders command
Cypress.Commands.add('mockWorkOrders', (workOrders: any[]) => {
  cy.intercept('GET', '**/api/work-orders', {
    statusCode: 200,
    body: workOrders
  }).as('getWorkOrders');
  
  // Mock individual work order endpoints
  workOrders.forEach((wo) => {
    cy.intercept('GET', `**/api/work-orders/${wo.id}`, {
      statusCode: 200,
      body: wo
    }).as(`getWorkOrder${wo.id}`);
    
    cy.intercept('PUT', `**/api/work-orders/${wo.id}/status`, {
      statusCode: 200,
      body: { ...wo, status: 'updated' }
    }).as(`updateWorkOrder${wo.id}Status`);
  });
});

// Mock export data command
Cypress.Commands.add('mockExportData', (data: any) => {
  cy.intercept('GET', '**/api/export/templates', {
    statusCode: 200,
    body: data.templates || []
  }).as('getExportTemplates');
  
  cy.intercept('GET', '**/api/export/history', {
    statusCode: 200,
    body: data.history || { items: [], total: 0 }
  }).as('getExportHistory');
  
  cy.intercept('GET', '**/api/export/queue', {
    statusCode: 200,
    body: data.queue || []
  }).as('getExportQueue');
  
  cy.intercept('GET', '**/api/export/stats', {
    statusCode: 200,
    body: data.stats || { totalExports: 0 }
  }).as('getExportStats');
});

// Industrial environment simulation command
Cypress.Commands.add('simulateIndustrialEnvironment', () => {
  // Simulate vibration (add slight CSS transforms)
  cy.window().then((win) => {
    const style = win.document.createElement('style');
    style.textContent = `
      @keyframes industrialVibration {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(0.5px); }
        75% { transform: translateX(-0.5px); }
      }
      body {
        animation: industrialVibration 0.1s infinite;
      }
    `;
    win.document.head.appendChild(style);
  });
  
  // Simulate poor lighting (reduce contrast slightly)
  cy.window().then((win) => {
    win.document.body.style.filter = 'contrast(0.9) brightness(0.95)';
  });
  
  // Mock offline/online events
  cy.window().then((win) => {
    // Randomly go offline/online to simulate unstable connection
    let isOnline = true;
    setInterval(() => {
      isOnline = !isOnline;
      Object.defineProperty(win.navigator, 'onLine', {
        value: isOnline,
        configurable: true
      });
      
      if (isOnline) {
        win.dispatchEvent(new Event('online'));
      } else {
        win.dispatchEvent(new Event('offline'));
      }
    }, 30000); // Switch every 30 seconds
  });
});

// Enhanced element interaction commands for industrial use
Cypress.Commands.add('clickWithGloves', { prevSubject: 'element' }, (subject) => {
  // Simulate less precise clicking (as if wearing thick gloves)
  cy.wrap(subject)
    .should('be.visible')
    .click({ force: true, timeout: 5000 });
});

Cypress.Commands.add('typeWithGloves', { prevSubject: 'element' }, (subject, text) => {
  // Simulate slower, less accurate typing
  cy.wrap(subject)
    .should('be.visible')
    .focus()
    .clear({ force: true })
    .type(text, { delay: 200, force: true });
});

// Network condition testing
Cypress.Commands.add('testNetworkConditions', (conditions: 'online' | 'offline' | 'slow') => {
  switch (conditions) {
    case 'offline':
      cy.intercept('**', { forceNetworkError: true });
      break;
    case 'slow':
      cy.simulateSlowNetwork();
      break;
    default:
      // Online - no interception
      break;
  }
});

// Performance testing helpers
Cypress.Commands.add('measurePageLoadTime', () => {
  cy.window().then((win) => {
    const navigationStart = win.performance.timing.navigationStart;
    const loadComplete = win.performance.timing.loadEventEnd;
    const pageLoadTime = loadComplete - navigationStart;
    
    cy.log(`Page load time: ${pageLoadTime}ms`);
    
    // Assert reasonable load time for industrial environment
    expect(pageLoadTime).to.be.lessThan(10000); // 10 seconds max
  });
});

// Declare global types for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      loginAsUser(userType: 'technician' | 'admin' | 'manager'): Chainable<Element>;
      seedTestData(): Chainable<Element>;
      waitForPageLoad(): Chainable<Element>;
      checkA11y(): Chainable<Element>;
      simulateMobile(): Chainable<Element>;
      simulateSlowNetwork(): Chainable<Element>;
      mockWorkOrders(workOrders: any[]): Chainable<Element>;
      mockExportData(data: any): Chainable<Element>;
      simulateIndustrialEnvironment(): Chainable<Element>;
      clickWithGloves(): Chainable<Element>;
      typeWithGloves(text: string): Chainable<Element>;
      testNetworkConditions(conditions: 'online' | 'offline' | 'slow'): Chainable<Element>;
      measurePageLoadTime(): Chainable<Element>;
      markPerformance(name: string): Chainable<Element>;
      measurePerformance(startMark: string, endMark: string): Chainable<Element>;
    }
  }
}