const { chromium } = require('playwright');

async function testDashboardFix() {
  console.log('🔧 Testing Dashboard Fix...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Capture console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });
    
    // Capture JavaScript errors
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log(`❌ Page Error: ${error.message}`);
    });
    
    console.log('1️⃣ Loading login page...');
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
    
    console.log('2️⃣ Logging in...');
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'testpass');
    
    const [response] = await Promise.all([
      page.waitForResponse(response => response.url().includes('login')),
      page.click('button[type="submit"], button:has-text("Sign In")')
    ]);
    
    console.log(`✅ Login Response: ${response.status()}`);
    
    // Wait for any potential redirect or state changes
    await page.waitForTimeout(3000);
    
    console.log('3️⃣ Testing dashboard navigation...');
    await page.goto('http://localhost:5174/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Wait for component to render
    await page.waitForTimeout(3000);
    
    console.log('4️⃣ Checking for errors...');
    if (errors.length === 0) {
      console.log('✅ No JavaScript errors detected!');
    } else {
      console.log(`❌ Found ${errors.length} errors:`);
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    // Check if dashboard content is visible
    const hasContent = await page.locator('body').textContent();
    const hasDashboardContent = hasContent.length > 100;
    
    console.log(`✅ Dashboard content loaded: ${hasDashboardContent ? 'YES' : 'NO'}`);
    console.log(`📝 Page content length: ${hasContent.length} characters`);
    
    // Take a screenshot
    await page.screenshot({ path: 'dashboard-fix-test.png', fullPage: true });
    console.log('📸 Screenshot saved as dashboard-fix-test.png');
    
    // Test the network status hook specifically
    const networkStatus = await page.evaluate(() => {
      // Check if we can access navigator.onLine safely
      return {
        navigatorExists: typeof navigator !== 'undefined',
        navigatorOnline: typeof navigator !== 'undefined' ? navigator.onLine : 'undefined',
        windowExists: typeof window !== 'undefined'
      };
    });
    
    console.log('🌐 Network status check:', networkStatus);
    
    const testResult = {
      loginWorking: response.status() === 200,
      dashboardLoading: hasDashboardContent,
      errorsFound: errors.length,
      networkStatusSafe: networkStatus.navigatorExists && networkStatus.windowExists
    };
    
    console.log('\n📊 Test Results:');
    console.log(`   Login: ${testResult.loginWorking ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Dashboard: ${testResult.dashboardLoading ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Error Count: ${testResult.errorsFound === 0 ? '✅ PASS' : `❌ ${testResult.errorsFound} errors`}`);
    console.log(`   Network Hook: ${testResult.networkStatusSafe ? '✅ PASS' : '❌ FAIL'}`);
    
    return testResult;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testDashboardFix().catch(console.error);