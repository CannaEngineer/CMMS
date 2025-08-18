// Auth endpoints
module.exports = (req, res) => {
  // Always set CORS headers first
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const url = req.url.toLowerCase();
  
  // Login endpoint
  if (url.includes('/login') && req.method === 'POST') {
    return res.status(200).json({
      success: true,
      token: 'mock-jwt-token-12345',
      user: {
        id: 1,
        name: 'Mock User',
        email: 'user@example.com',
        role: 'ADMIN',
        organizationId: 1
      },
      message: 'Login successful (mock data)'
    });
  }
  
  // Register endpoint
  if (url.includes('/register') && req.method === 'POST') {
    return res.status(201).json({
      success: true,
      token: 'mock-jwt-token-12345',
      user: {
        id: Math.floor(Math.random() * 1000),
        ...req.body,
        role: 'USER',
        organizationId: 1
      },
      message: 'Registration successful (mock data)'
    });
  }
  
  // Check organization endpoint
  if (url.includes('/check-organization') && req.method === 'GET') {
    return res.status(200).json({
      exists: true,
      organization: {
        id: 1,
        name: 'Sample Organization',
        type: 'ENTERPRISE'
      }
    });
  }
  
  // Logout endpoint
  if (url.includes('/logout') && req.method === 'POST') {
    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  }
  
  // Me endpoint (current user)
  if (url.includes('/me') && req.method === 'GET') {
    return res.status(200).json({
      id: 1,
      name: 'Mock User',
      email: 'user@example.com',
      role: 'ADMIN',
      organizationId: 1,
      permissions: ['READ', 'WRITE', 'DELETE']
    });
  }
  
  // Default response
  return res.status(404).json({
    error: 'Auth endpoint not found',
    availableEndpoints: ['/login', '/register', '/logout', '/me', '/check-organization']
  });
};