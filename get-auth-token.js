const fetch = require('node-fetch');

async function getAuthToken() {
  try {
    // Try to login with admin credentials (adjust as needed)
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com', // Adjust email as needed
        password: 'admin123' // Adjust password as needed
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Login failed:', response.status, response.statusText, errorText);
      return null;
    }

    const result = await response.json();
    
    if (result.token) {
      console.log('✅ Authentication successful');
      console.log('Token:', result.token);
      console.log('\nTo use this token for importing, run:');
      console.log(`AUTH_TOKEN="${result.token}" node import-csv-files.js`);
      return result.token;
    } else {
      console.error('No token in response:', result);
      return null;
    }

  } catch (error) {
    console.error('Error during authentication:', error.message);
    return null;
  }
}

getAuthToken();