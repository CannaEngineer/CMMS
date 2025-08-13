// Test script to verify login routing based on user roles
// Using Node.js built-in fetch (available in Node 18+)

const API_URL = 'http://localhost:5000/api';

// Test users with different roles
const testUsers = [
  {
    email: 'admin@test.com',
    password: 'admin123',
    expectedRole: 'ADMIN',
    expectedRoute: '/dashboard'
  },
  {
    email: 'manager@test.com', 
    password: 'manager123',
    expectedRole: 'MANAGER',
    expectedRoute: '/dashboard'
  },
  {
    email: 'tech@test.com',
    password: 'tech123',
    expectedRole: 'TECHNICIAN',
    expectedRoute: '/tech/dashboard'
  }
];

async function testLogin(user) {
  console.log(`\nTesting login for ${user.email} (${user.expectedRole})...`);
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✓ Login successful`);
      console.log(`  Role: ${data.user.role}`);
      console.log(`  Expected route: ${user.expectedRoute}`);
      
      // Verify role matches expected
      if (data.user.role === user.expectedRole) {
        console.log(`✓ Role matches expected (${user.expectedRole})`);
      } else {
        console.log(`✗ Role mismatch! Got ${data.user.role}, expected ${user.expectedRole}`);
      }
      
      // Check which route they should be directed to
      const actualRoute = data.user.role === 'TECHNICIAN' ? '/tech/dashboard' : '/dashboard';
      if (actualRoute === user.expectedRoute) {
        console.log(`✓ Would route to correct dashboard (${actualRoute})`);
      } else {
        console.log(`✗ Route mismatch! Would route to ${actualRoute}, expected ${user.expectedRoute}`);
      }
      
      return true;
    } else {
      const error = await response.json();
      console.log(`✗ Login failed: ${error.error}`);
      return false;
    }
  } catch (error) {
    console.log(`✗ Error: ${error.message}`);
    return false;
  }
}

async function createTestUsers() {
  console.log('Creating test users...\n');
  
  for (const user of testUsers) {
    console.log(`Creating ${user.expectedRole} user: ${user.email}`);
    
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          password: user.password,
          name: `Test ${user.expectedRole}`,
          role: user.expectedRole,
          organizationId: 1 // Assuming org ID 1 exists
        })
      });
      
      if (response.ok) {
        console.log(`✓ Created ${user.email}`);
      } else {
        const error = await response.json();
        if (error.error && error.error.includes('already exists')) {
          console.log(`→ User ${user.email} already exists`);
        } else {
          console.log(`✗ Failed to create: ${error.error}`);
        }
      }
    } catch (error) {
      console.log(`✗ Error creating user: ${error.message}`);
    }
  }
}

async function runTests() {
  console.log('=================================');
  console.log('Login Routing Test');
  console.log('=================================\n');
  
  // First try to create test users
  await createTestUsers();
  
  console.log('\n=================================');
  console.log('Testing Login Routing');
  console.log('=================================');
  
  // Test login for each user
  for (const user of testUsers) {
    await testLogin(user);
  }
  
  console.log('\n=================================');
  console.log('Test Complete');
  console.log('=================================');
  console.log('\nSummary:');
  console.log('- ADMIN users should route to /dashboard');
  console.log('- MANAGER users should route to /dashboard');
  console.log('- TECHNICIAN users should route to /tech/dashboard');
}

// Run the tests
runTests().catch(console.error);