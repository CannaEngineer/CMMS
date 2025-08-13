const { test, expect } = require('@playwright/test');

// Test configuration
const FRONTEND_URL = 'http://localhost:5174';
const TEST_CREDENTIALS = {
  email: 'admin@demo.com',
  password: 'testpass'
};

test.describe('CMMS System UI Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto(FRONTEND_URL);
  });

  test('should load login page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/CMMS/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill login form
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Verify dashboard elements are visible
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should display dashboard metrics correctly', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Check for key dashboard elements
    await expect(page.locator('text=Work Orders')).toBeVisible();
    await expect(page.locator('text=Assets')).toBeVisible();
    await expect(page.locator('text=Inventory')).toBeVisible();
    
    // Check for metric cards
    await expect(page.locator('[data-testid="work-orders-card"], .metric-card')).toBeVisible();
  });

  test('should navigate to work orders page', async ({ page }) => {
    // Login and navigate
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Navigate to work orders
    await page.click('text=Work Orders');
    await page.waitForURL('**/work-orders');
    
    // Verify work orders page
    await expect(page.locator('text=Work Orders')).toBeVisible();
    await expect(page.locator('table, .work-order-list')).toBeVisible();
  });

  test('should navigate to assets page', async ({ page }) => {
    // Login and navigate
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Navigate to assets
    await page.click('text=Assets');
    await page.waitForURL('**/assets');
    
    // Verify assets page
    await expect(page.locator('text=Assets')).toBeVisible();
    await expect(page.locator('table, .asset-list')).toBeVisible();
  });

  test('should navigate to inventory page', async ({ page }) => {
    // Login and navigate
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Navigate to inventory
    await page.click('text=Inventory');
    await page.waitForURL('**/inventory');
    
    // Verify inventory page
    await expect(page.locator('text=Inventory')).toBeVisible();
    await expect(page.locator('table, .parts-list')).toBeVisible();
  });

  test('should test responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Check if mobile navigation works
    const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu, button[aria-label="menu"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.locator('nav, .navigation-menu')).toBeVisible();
    }
  });

  test('should test maintenance scheduling functionality', async ({ page }) => {
    // Login and navigate
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Navigate to maintenance
    await page.click('text=Maintenance');
    await page.waitForURL('**/maintenance');
    
    // Verify maintenance page
    await expect(page.locator('text=Maintenance')).toBeVisible();
    await expect(page.locator('.calendar, [data-testid="pm-calendar"]')).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test invalid login
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials, .error, [role="alert"]')).toBeVisible();
  });

  test('should test portal functionality', async ({ page }) => {
    // Test public portal access (should work without login)
    await page.goto(`${FRONTEND_URL}/portal/maintenance-request`);
    
    // Should see portal form
    await expect(page.locator('form, .portal-form')).toBeVisible();
    await expect(page.locator('input, textarea')).toBeVisible();
  });

});