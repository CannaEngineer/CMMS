# CMMS Testing Documentation

## Overview

This document provides comprehensive instructions for running and maintaining the automated test suites for the CMMS (Computerized Maintenance Management System) frontend application. The testing strategy covers three critical systems:

1. **Profile & Settings Management System**
2. **Export & Reporting System** 
3. **Technician Time Tracking & Work Management System**

## Table of Contents

- [Quick Start](#quick-start)
- [Testing Framework Overview](#testing-framework-overview)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Industrial Environment Testing](#industrial-environment-testing)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm 8+
- Chrome/Chromium browser (for E2E tests)

### Installation

```bash
# Install dependencies
npm install

# Install Cypress binary (if not already installed)
npx cypress install
```

### Run All Tests

```bash
# Component tests (Vitest + React Testing Library)
npm run test

# E2E tests (Cypress)
npm run test:e2e

# Visual regression tests
npm run test:visual

# Accessibility tests
npm run test:a11y

# Performance tests
npm run test:performance
```

## Testing Framework Overview

### Component Testing Stack

- **Vitest**: Fast test runner with hot reload
- **React Testing Library**: Component testing utilities
- **Jest DOM**: Additional DOM matchers
- **MSW**: API mocking
- **User Event**: Realistic user interaction simulation

### E2E Testing Stack

- **Cypress**: End-to-end testing framework
- **Cypress Axe**: Accessibility testing
- **Custom Commands**: Industrial environment simulation

### Visual Regression Stack

- **Custom Visual Tester**: Screenshot comparison utilities
- **Responsive Testing**: Multi-viewport validation
- **Theme Testing**: Light/dark mode consistency

### Performance Testing Stack

- **Custom Performance Tester**: Component performance monitoring
- **Memory Leak Detection**: Memory usage tracking
- **Load Testing**: Concurrent operation testing

## Test Types

### 1. Unit Tests

Test individual components and functions in isolation.

**Location**: `src/__tests__/components/`

**Example**:
```typescript
import { render, screen } from '@testing-library/react';
import { Profile } from './Profile';

describe('Profile Component', () => {
  it('displays user information', () => {
    render(<Profile user={mockUser} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### 2. Integration Tests

Test component interactions and data flow.

**Location**: `src/__tests__/integration/`

**Example**:
```typescript
describe('Profile Integration', () => {
  it('updates profile and shows success message', async () => {
    render(<ProfileWithProviders />);
    
    await userEvent.type(screen.getByLabelText(/name/i), 'New Name');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    
    expect(await screen.findByText(/profile updated/i)).toBeInTheDocument();
  });
});
```

### 3. E2E Tests

Test complete user workflows across the application.

**Location**: `cypress/e2e/`

**Example**:
```typescript
describe('Technician Dashboard E2E', () => {
  it('completes work order workflow', () => {
    cy.loginAsUser('technician');
    cy.visit('/technician');
    
    cy.get('[data-testid="work-order-1"]')
      .find('[data-testid="start-button"]')
      .click();
      
    cy.get('[data-testid="work-order-1"]')
      .should('contain', 'IN_PROGRESS');
  });
});
```

### 4. Visual Regression Tests

Ensure UI consistency across changes.

**Location**: `src/__tests__/visual/`

**Example**:
```typescript
describe('Profile Visual Tests', () => {
  it('matches baseline screenshot', async () => {
    const { container } = render(<Profile />);
    await expect(container).toMatchVisualBaseline('profile-default');
  });
});
```

### 5. Accessibility Tests

Ensure WCAG compliance and usability.

**Example**:
```typescript
describe('Profile Accessibility', () => {
  it('meets WCAG AA standards', async () => {
    render(<Profile />);
    const results = await accessibilityTester.runAxeTests();
    expect(results).toHaveNoViolations();
  });
});
```

### 6. Performance Tests

Monitor component performance and memory usage.

**Example**:
```typescript
describe('Profile Performance', () => {
  it('renders within performance budget', async () => {
    const metrics = await performanceTester.measureRenderPerformance(
      () => render(<Profile />),
      'Profile'
    );
    
    expect(metrics.renderTime).toBeLessThan(100);
    expect(metrics.memoryUsage.peak).toBeLessThan(50);
  });
});
```

## Running Tests

### Component Tests

```bash
# Run all component tests
npm run test

# Run in watch mode (development)
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test Profile.test.tsx

# Run specific test pattern
npm run test -- --grep "Profile"
```

### E2E Tests

```bash
# Run headless (CI mode)
npm run test:e2e

# Open Cypress GUI (development)
npm run cypress:open

# Run specific spec
npx cypress run --spec "cypress/e2e/profile-settings.cy.ts"

# Run on different browser
npx cypress run --browser firefox
```

### Visual Regression Tests

```bash
# Run visual tests
npm run test:visual

# Update baselines
npm run test:visual:update

# Run specific visual test
npm run test -- --grep "visual"
```

### Accessibility Tests

```bash
# Run accessibility tests
npm run test:a11y

# Run with specific compliance level
npm run test:a11y -- --level AAA

# Generate accessibility report
npm run test:a11y:report
```

### Performance Tests

```bash
# Run performance tests
npm run test:performance

# Run with industrial environment simulation
npm run test:performance:industrial

# Generate performance report
npm run test:performance:report
```

## Writing Tests

### Test Structure

Follow the AAA pattern: Arrange, Act, Assert

```typescript
describe('Component Name', () => {
  beforeEach(() => {
    // Arrange: Setup test environment
    resetAllMocks();
    mockLocalStorageWithUser(createMockUser());
  });

  it('should do something specific', async () => {
    // Arrange: Setup component
    render(<Component />);
    
    // Act: Perform user interaction
    await userEvent.click(screen.getByRole('button'));
    
    // Assert: Verify expected outcome
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

### Using Mock Factories

```typescript
import { 
  createMockUser,
  createMockWorkOrder,
  createMockExportTemplate 
} from '../factories';

// Create test data
const user = createMockTechnician();
const workOrder = createMockWorkOrder({ status: 'PENDING' });
const template = createMockExportTemplate({ format: 'csv' });
```

### Testing Async Operations

```typescript
it('handles async operations', async () => {
  render(<AsyncComponent />);
  
  // Wait for loading to finish
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
  
  // Verify loaded content
  expect(screen.getByText('Loaded Data')).toBeInTheDocument();
});
```

### Testing Error States

```typescript
it('handles errors gracefully', async () => {
  // Mock API error
  simulateNetworkError(mockApiService, 'getData');
  
  render(<Component />);
  
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

### Testing User Interactions

```typescript
it('handles user interactions', async () => {
  const user = userEvent.setup();
  render(<Form />);
  
  // Type in input
  await user.type(screen.getByLabelText(/name/i), 'John Doe');
  
  // Click button
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  // Verify submission
  expect(mockSubmitFunction).toHaveBeenCalledWith({ name: 'John Doe' });
});
```

## Industrial Environment Testing

### Simulating Industrial Conditions

```typescript
describe('Industrial Environment', () => {
  it('works with industrial hardware', () => {
    cy.simulateIndustrialEnvironment();
    cy.visit('/technician');
    
    // Test with simulated vibration and poor lighting
    cy.get('[data-testid="work-order-1"]')
      .clickWithGloves(); // Simulates thick gloves
  });
});
```

### Network Resilience Testing

```typescript
it('handles network interruptions', () => {
  cy.visit('/technician');
  
  // Simulate network failure
  cy.testNetworkConditions('offline');
  
  // Verify offline handling
  cy.get('[data-testid="offline-indicator"]').should('be.visible');
  
  // Restore network
  cy.testNetworkConditions('online');
  
  // Verify recovery
  cy.get('[data-testid="offline-indicator"]').should('not.exist');
});
```

### Touch Interface Testing

```typescript
it('works with touch interfaces', () => {
  cy.simulateMobile();
  cy.visit('/technician');
  
  // Test touch interactions
  cy.get('[data-testid="start-button"]').clickWithGloves();
  
  // Verify touch-friendly interface
  cy.get('[data-testid="touch-target"]').should('have.css', 'min-height', '44px');
});
```

## CI/CD Integration

### GitHub Actions Configuration

```yaml
name: Frontend Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:e2e
      - run: npm run test:a11y
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Test Environments

- **Development**: Hot reload, detailed error messages
- **Staging**: Production-like testing with real APIs
- **Production**: Smoke tests for critical paths

### Coverage Requirements

- **Statements**: 80%+
- **Branches**: 80%+
- **Functions**: 80%+
- **Lines**: 80%+

## Troubleshooting

### Common Issues

#### Tests Failing Locally

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Reset test database
npm run test:db:reset

# Update snapshots
npm run test -- --updateSnapshot
```

#### Cypress Issues

```bash
# Clear Cypress cache
npx cypress cache clear

# Verify Cypress installation
npx cypress verify

# Run Cypress in debug mode
DEBUG=cypress:* npx cypress run
```

#### Performance Test Issues

```bash
# Enable garbage collection for memory tests
node --expose-gc $(npm bin)/vitest

# Increase test timeout for slow tests
npm run test -- --testTimeout=30000
```

### Debug Mode

```bash
# Run tests in debug mode
npm run test:debug

# Run specific test in debug mode
npm run test:debug -- Profile.test.tsx
```

### Logging

```typescript
// Enable detailed logging in tests
import { setLogLevel } from '../utils/logger';

beforeEach(() => {
  setLogLevel('debug');
});
```

## Best Practices

### Test Organization

1. **Group related tests** in describe blocks
2. **Use descriptive test names** that explain the behavior
3. **Follow the AAA pattern** consistently
4. **Keep tests independent** and isolated

### Test Data

1. **Use factories** for consistent test data
2. **Create realistic data** that matches production
3. **Avoid hardcoded values** where possible
4. **Clean up data** between tests

### Assertions

1. **Be specific** in assertions
2. **Test user-visible behavior** over implementation details
3. **Use semantic queries** (getByRole, getByLabelText)
4. **Verify accessibility** attributes

### Performance

1. **Mock external dependencies** to reduce test time
2. **Use beforeEach/afterEach** for common setup
3. **Parallelize tests** where possible
4. **Monitor test suite performance**

### Maintenance

1. **Review and update tests** regularly
2. **Remove obsolete tests** when features change
3. **Keep dependencies updated**
4. **Document test purposes** and requirements

## Test Reports

### Coverage Report

Generated after running tests with coverage:

```bash
npm run test:coverage
open coverage/index.html
```

### Accessibility Report

Generated after running accessibility tests:

```bash
npm run test:a11y:report
open reports/accessibility.html
```

### Performance Report

Generated after running performance tests:

```bash
npm run test:performance:report
open reports/performance.html
```

### Visual Regression Report

Generated after running visual tests:

```bash
npm run test:visual:report
open reports/visual-regression.html
```

## Contributing

### Adding New Tests

1. **Follow existing patterns** and conventions
2. **Add tests for new features** before implementation
3. **Update documentation** for new test utilities
4. **Ensure tests pass** in CI environment

### Test Review Checklist

- [ ] Tests cover happy path scenarios
- [ ] Tests cover error conditions
- [ ] Tests cover edge cases
- [ ] Accessibility requirements tested
- [ ] Performance requirements tested
- [ ] Mobile responsiveness tested
- [ ] Industrial environment considerations
- [ ] Tests are maintainable and readable

---

## Contact

For questions about testing:
- Create an issue in the repository
- Contact the development team
- Check existing documentation and examples

Remember: Good tests are an investment in code quality, maintainability, and user experience. They help catch bugs early and provide confidence when making changes.