const { chromium } = require('playwright');

async function debugLoginTest() {
  console.log('🔍 Debugging Login Process...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Capture console messages
    page.on('console', msg => {
      console.log(`🖥️ Console [${msg.type()}]: ${msg.text()}`);
    });
    
    // Capture network requests
    page.on('request', request => {
      if (request.url().includes('auth') || request.url().includes('login')) {
        console.log(`📤 Request: ${request.method()} ${request.url()}`);
      }
    });
    
    // Capture network responses
    page.on('response', response => {
      if (response.url().includes('auth') || response.url().includes('login')) {
        console.log(`📥 Response: ${response.status()} ${response.url()}`);
      }
    });
    
    // Go to login page
    console.log('📄 Loading login page...');
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
    
    // Fill login form
    console.log('✏️ Filling login form...');
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'testpass');
    
    console.log('🖱️ Clicking login button...');
    
    // Wait for the network request
    const [response] = await Promise.all([
      page.waitForResponse(response => response.url().includes('login') || response.url().includes('auth')),
      page.click('button[type="submit"], button:has-text("Sign In")')
    ]);
    
    console.log(`✅ Login response status: ${response.status()}`);
    
    if (response.status() === 200) {
      const responseBody = await response.json();
      console.log('✅ Login successful! Response:', JSON.stringify(responseBody, null, 2));
    } else {
      const responseText = await response.text();
      console.log(`❌ Login failed with status ${response.status()}: ${responseText}`);
    }
    
    // Wait a bit and check current state
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Check if we have a token in localStorage
    const token = await page.evaluate(() => localStorage.getItem('token') || sessionStorage.getItem('token'));
    console.log(`🔑 Token in storage: ${token ? 'Found' : 'Not found'}`);
    
    // Check page content for clues
    const pageText = await page.textContent('body');
    if (pageText.includes('error') || pageText.includes('invalid')) {
      console.log('❌ Error message detected on page');
    }
    
    // Take screenshot for analysis
    await page.screenshot({ path: 'debug-login.png', fullPage: true });
    console.log('📸 Screenshot saved as debug-login.png');
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the debug test
debugLoginTest().catch(console.error);