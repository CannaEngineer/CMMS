const fetch = require('node-fetch');

async function testAPIs() {
  try {
    // Login
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@demo.com', password: 'admin123!' })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login successful, token:', loginData.token?.substring(0, 20) + '...');
    
    if (!loginData.token) {
      console.error('No token received');
      return;
    }
    
    // Test work orders API
    const workOrdersResponse = await fetch('http://localhost:5000/api/work-orders', {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    
    const workOrders = await workOrdersResponse.json();
    console.log('Work orders count:', Array.isArray(workOrders) ? workOrders.length : 'Error');
    console.log('Work orders:', workOrders);
    
    // Test assets API
    const assetsResponse = await fetch('http://localhost:5000/api/assets', {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    
    const assets = await assetsResponse.json();
    console.log('Assets count:', Array.isArray(assets) ? assets.length : 'Error');
    console.log('Assets:', assets);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPIs();