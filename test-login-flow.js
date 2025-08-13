const { chromium } = require('playwright');

async function testLoginFlow() {
  console.log('🔐 Testing Complete Login Flow...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('1️⃣ Loading login page...');
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
    
    console.log('2️⃣ Filling login form...');
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'testpass');
    
    console.log('3️⃣ Submitting login...');
    const [response] = await Promise.all([
      page.waitForResponse(response => response.url().includes('login')),
      page.click('button[type="submit"], button:has-text("Sign In")')
    ]);
    
    console.log(`✅ Login Response: ${response.status()}`);
    
    // Wait for potential redirect
    console.log('4️⃣ Waiting for navigation...');
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Check if redirected to dashboard
    const isOnDashboard = currentUrl.includes('/dashboard') || currentUrl === 'http://localhost:5174/';
    const isStillOnLogin = currentUrl.includes('/login');
    
    console.log(`✅ Redirected away from login: ${!isStillOnLogin ? 'YES' : 'NO'}`);
    console.log(`✅ On dashboard/home: ${isOnDashboard ? 'YES' : 'NO'}`);
    
    // Try navigation to dashboard manually if needed
    if (isStillOnLogin) {
      console.log('5️⃣ Manual navigation to dashboard...');
      await page.goto('http://localhost:5174/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    // Test dashboard functionality
    console.log('6️⃣ Testing dashboard content...');
    const dashboardContent = await page.textContent('body');
    const hasMetrics = dashboardContent.toLowerCase().includes('work order') || 
                     dashboardContent.toLowerCase().includes('asset') ||
                     dashboardContent.toLowerCase().includes('dashboard');
    
    console.log(`✅ Dashboard has expected content: ${hasMetrics ? 'YES' : 'NO'}`);
    
    // Test navigation to other pages
    console.log('7️⃣ Testing page navigation...');
    const testPages = [
      { name: 'Work Orders', url: '/work-orders' },
      { name: 'Assets', url: '/assets' },
      { name: 'Inventory', url: '/inventory' }
    ];
    
    const navigationResults = {};
    
    for (const testPage of testPages) {
      try {
        await page.goto(`http://localhost:5174${testPage.url}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        const content = await page.textContent('body');
        const isWorking = content.length > 100 && !content.includes('error');
        navigationResults[testPage.name] = isWorking;
        
        console.log(`   ${testPage.name}: ${isWorking ? '✅ PASS' : '❌ FAIL'}`);
      } catch (error) {
        navigationResults[testPage.name] = false;
        console.log(`   ${testPage.name}: ❌ FAIL (${error.message})`);
      }
    }
    
    // Final summary
    console.log('\n📊 FINAL TEST RESULTS:');
    console.log(`✅ Login Authentication: ${response.status() === 200 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Post-Login State: ${!isStillOnLogin ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Dashboard Content: ${hasMetrics ? 'PASS' : 'FAIL'}`);
    
    const passedNavigation = Object.values(navigationResults).filter(r => r).length;
    const totalNavigation = Object.keys(navigationResults).length;
    console.log(`✅ Page Navigation: ${passedNavigation}/${totalNavigation} PASS`);
    
    // Take final screenshot
    await page.screenshot({ path: 'login-flow-final.png', fullPage: true });
    console.log('📸 Screenshot saved as login-flow-final.png');
    
    const allPassed = response.status() === 200 && !isStillOnLogin && hasMetrics && passedNavigation === totalNavigation;
    console.log(`\n🎯 OVERALL RESULT: ${allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️ Some issues remain'}`);
    
    return {
      loginWorking: response.status() === 200,
      redirectWorking: !isStillOnLogin,
      dashboardWorking: hasMetrics,
      navigationWorking: passedNavigation === totalNavigation,
      overall: allPassed
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { error: error.message };
  } finally {
    await browser.close();
  }
}

// Run the test
testLoginFlow().catch(console.error);