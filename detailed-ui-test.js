const { chromium } = require('playwright');

async function runDetailedUITest() {
  console.log('🚀 Starting Comprehensive UI Testing...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for better visibility
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Test 1: Login Page Loading
    console.log('📄 Testing Login Page...');
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
    
    // Check page title and basic elements
    const title = await page.title();
    console.log(`✅ Page title: ${title}`);
    
    // Check login form elements
    const emailInput = await page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = await page.locator('input[type="password"], input[name="password"]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("Sign In")').first();
    
    console.log(`✅ Email input visible: ${await emailInput.isVisible()}`);
    console.log(`✅ Password input visible: ${await passwordInput.isVisible()}`);
    console.log(`✅ Login button visible: ${await loginButton.isVisible()}`);
    
    // Test 2: Login Process
    console.log('\n🔐 Testing Login Process...');
    await emailInput.fill('admin@demo.com');
    await passwordInput.fill('testpass');
    
    // Take screenshot before login
    await page.screenshot({ path: 'login-before.png' });
    
    // Click login and wait
    await loginButton.click();
    await page.waitForTimeout(3000); // Wait for navigation
    
    // Check current URL and page content
    const currentUrl = page.url();
    console.log(`✅ Current URL after login: ${currentUrl}`);
    
    // Take screenshot after login
    await page.screenshot({ path: 'login-after.png' });
    
    // Check if we're on dashboard or login page
    const pageContent = await page.textContent('body');
    console.log(`✅ Page contains "dashboard": ${pageContent.toLowerCase().includes('dashboard')}`);
    console.log(`✅ Page contains "work orders": ${pageContent.toLowerCase().includes('work order')}`);
    console.log(`✅ Page contains "assets": ${pageContent.toLowerCase().includes('assets')}`);
    
    // Test 3: Navigation Elements
    console.log('\n🧭 Testing Navigation...');
    
    // Look for common navigation patterns
    const navElements = await page.locator('nav, .navigation, .sidebar, [role="navigation"]').count();
    console.log(`✅ Navigation elements found: ${navElements}`);
    
    // Look for menu items
    const menuItems = await page.locator('a, button').allTextContents();
    console.log(`✅ Menu items found: ${menuItems.slice(0, 10).join(', ')}...`);
    
    // Test 4: Try to find and click on dashboard/menu items
    console.log('\n📊 Testing Dashboard Access...');
    
    // Try different selectors for dashboard
    const dashboardSelectors = [
      'text=Dashboard',
      '[href="/dashboard"]',
      '[href*="dashboard"]',
      'a:has-text("Dashboard")',
      'button:has-text("Dashboard")'
    ];
    
    for (const selector of dashboardSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Found dashboard element with selector: ${selector}`);
          await element.click();
          await page.waitForTimeout(2000);
          break;
        }
      } catch (e) {
        console.log(`⚠️ Selector ${selector} not found`);
      }
    }
    
    // Test 5: Check for error messages
    console.log('\n❌ Checking for Error Messages...');
    const errorSelectors = [
      '.error',
      '[role="alert"]',
      '.alert-error',
      'text=error',
      'text=invalid'
    ];
    
    for (const selector of errorSelectors) {
      try {
        const errorElement = page.locator(selector).first();
        if (await errorElement.isVisible()) {
          const errorText = await errorElement.textContent();
          console.log(`⚠️ Error found: ${errorText}`);
        }
      } catch (e) {
        // Ignore - no error found
      }
    }
    
    // Test 6: Check page source for debugging
    console.log('\n🔍 Page Analysis...');
    const allHeadings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    console.log(`✅ Page headings: ${allHeadings.join(', ')}`);
    
    const allButtons = await page.locator('button').allTextContents();
    console.log(`✅ Page buttons: ${allButtons.slice(0, 5).join(', ')}...`);
    
    // Test 7: Network requests check
    console.log('\n🌐 Checking Network Activity...');
    
    // Listen for failed requests
    page.on('response', response => {
      if (!response.ok()) {
        console.log(`❌ Failed request: ${response.status()} ${response.url()}`);
      }
    });
    
    // Wait a bit more and take final screenshot
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'final-state.png' });
    
    console.log('\n✅ UI Testing Complete!');
    console.log('Screenshots saved: login-before.png, login-after.png, final-state.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
runDetailedUITest().catch(console.error);