#!/usr/bin/env node

// Test script to verify the API proxy configuration is working correctly
const fetch = require('node-fetch');

async function testProxyConfiguration() {
  console.log('Testing API Proxy Configuration...\n');
  
  // Test 1: Direct backend call
  console.log('1. Testing direct backend call to http://localhost:5000/api/import/execute');
  try {
    const directResponse = await fetch('http://localhost:5000/api/import/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'direct' })
    });
    console.log(`   ✓ Direct call status: ${directResponse.status}`);
  } catch (error) {
    console.log(`   ✗ Direct call failed: ${error.message}`);
  }

  // Test 2: Frontend proxy call (when frontend is running on 5174)
  console.log('2. Testing frontend proxy call to http://localhost:5174/api/import/execute');
  try {
    const proxyResponse = await fetch('http://localhost:5174/api/import/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'proxy' })
    });
    console.log(`   ✓ Proxy call status: ${proxyResponse.status}`);
    
    // Check if the backend received the correct URL
    if (proxyResponse.status !== 404) {
      console.log('   ✓ Proxy is correctly forwarding to backend');
    } else {
      console.log('   ✗ Proxy may be creating doubled /api paths');
    }
  } catch (error) {
    console.log(`   ✗ Proxy call failed: ${error.message}`);
  }

  console.log('\n✓ Test completed. If both calls return the same status code, the proxy fix is working correctly.');
}

testProxyConfiguration().catch(console.error);