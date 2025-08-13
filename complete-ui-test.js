const { chromium } = require('playwright');

async function completeUITest() {
  console.log('🎯 Complete CMMS UI Testing Suite\n');
  
  const results = {
    loginPage: false,
    authentication: false,
    navigation: false,
    dashboard: false,
    workOrders: false,
    assets: false,
    inventory: false,
    maintenance: false,
    responsive: false,
    errors: []
  };
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Test 1: Login Page Load
    console.log('1️⃣ Testing Login Page Load...');
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
    
    const hasEmailInput = await page.locator('input[type="email"]').isVisible();
    const hasPasswordInput = await page.locator('input[type="password"]').isVisible();
    const hasLoginButton = await page.locator('button[type="submit"], button:has-text("Sign In")').isVisible();
    
    results.loginPage = hasEmailInput && hasPasswordInput && hasLoginButton;
    console.log(`✅ Login page elements: ${results.loginPage ? 'PASS' : 'FAIL'}`);
    
    // Test 2: Authentication
    console.log('\n2️⃣ Testing Authentication...');
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'testpass');
    
    const [response] = await Promise.all([
      page.waitForResponse(response => response.url().includes('login')),
      page.click('button[type="submit"], button:has-text("Sign In")')
    ]);
    
    results.authentication = response.status() === 200;
    console.log(`✅ Authentication: ${results.authentication ? 'PASS' : 'FAIL'} (Status: ${response.status()})`);
    
    // Wait for potential redirect
    await page.waitForTimeout(5000);
    
    // Test 3: Post-login Navigation
    console.log('\n3️⃣ Testing Post-login State...');
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Force navigate to dashboard if still on login
    if (currentUrl.includes('login')) {
      console.log('🔄 Manually navigating to dashboard...');
      await page.goto('http://localhost:5174/dashboard');
      await page.waitForLoadState('networkidle');
    }
    
    await page.waitForTimeout(3000);
    
    // Test 4: Dashboard Functionality
    console.log('\n4️⃣ Testing Dashboard...');
    const pageContent = await page.textContent('body');
    
    // Look for dashboard indicators
    const dashboardIndicators = [
      'dashboard', 'work order', 'asset', 'maintenance', 
      'inventory', 'metric', 'chart', 'overview'
    ];
    
    let dashboardScore = 0;
    dashboardIndicators.forEach(indicator => {
      if (pageContent.toLowerCase().includes(indicator)) {
        dashboardScore++;
      }
    });
    
    results.dashboard = dashboardScore >= 3;
    console.log(`✅ Dashboard content: ${results.dashboard ? 'PASS' : 'FAIL'} (Score: ${dashboardScore}/8)`);
    
    // Test 5: Navigation Menu
    console.log('\n5️⃣ Testing Navigation Menu...');
    
    // Try to find navigation links
    const navLinks = await page.locator('a, [role="button"]').allTextContents();
    const requiredPages = ['work orders', 'assets', 'inventory', 'maintenance'];
    let foundPages = 0;
    
    requiredPages.forEach(pageName => {
      const found = navLinks.some(link => 
        link.toLowerCase().includes(pageName.toLowerCase())
      );
      if (found) foundPages++;
    });
    
    results.navigation = foundPages >= 2;
    console.log(`✅ Navigation links: ${results.navigation ? 'PASS' : 'FAIL'} (Found: ${foundPages}/4)`);
    
    // Test 6: Page Navigation
    console.log('\n6️⃣ Testing Page Navigation...');
    
    // Try to navigate to different pages
    const pagesToTest = [
      { name: 'Work Orders', path: '/work-orders' },
      { name: 'Assets', path: '/assets' },
      { name: 'Inventory', path: '/inventory' }
    ];
    
    for (const pageTest of pagesToTest) {
      try {
        console.log(`   📄 Testing ${pageTest.name}...`);
        await page.goto(`http://localhost:5174${pageTest.path}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        const content = await page.textContent('body');
        const hasContent = content.length > 100 && !content.includes('404');
        
        results[pageTest.name.toLowerCase().replace(' ', '')] = hasContent;
        console.log(`   ✅ ${pageTest.name}: ${hasContent ? 'PASS' : 'FAIL'}`);
        
      } catch (error) {
        console.log(`   ❌ ${pageTest.name}: FAIL (${error.message})`);
        results.errors.push(`${pageTest.name}: ${error.message}`);
      }
    }
    
    // Test 7: Responsive Design
    console.log('\n7️⃣ Testing Responsive Design...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5174/dashboard');
    await page.waitForTimeout(2000);
    
    const mobileContent = await page.textContent('body');
    results.responsive = mobileContent.length > 50;
    console.log(`✅ Mobile responsiveness: ${results.responsive ? 'PASS' : 'FAIL'}`);
    
    // Test 8: Error Handling
    console.log('\n8️⃣ Testing Error Handling...');
    await page.goto('http://localhost:5174/nonexistent-page');
    await page.waitForTimeout(2000);
    
    const errorPage = await page.textContent('body');
    const hasErrorHandling = errorPage.includes('404') || errorPage.includes('not found') || errorPage.includes('error');
    console.log(`✅ Error handling: ${hasErrorHandling ? 'PASS' : 'FAIL'}`);
    
    // Final Screenshots
    await page.goto('http://localhost:5174/dashboard');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'final-dashboard.png', fullPage: true });
    
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'final-desktop.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    results.errors.push(error.message);
  } finally {
    await browser.close();
  }
  
  // Print Results Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  Object.entries(results).forEach(([test, result]) => {
    if (test !== 'errors') {
      console.log(`${result ? '✅' : '❌'} ${test}: ${result ? 'PASS' : 'FAIL'}`);
    }
  });
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  const passedTests = Object.values(results).filter(r => r === true).length;
  const totalTests = Object.keys(results).length - 1; // exclude errors array
  console.log(`\n🎯 Overall Score: ${passedTests}/${totalTests} tests passed`);
  
  return results;
}

// Run the complete test suite
completeUITest().catch(console.error);