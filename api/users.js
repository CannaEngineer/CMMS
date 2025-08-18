// Users CRUD endpoint
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
  
  // Parse URL to get ID if present
  const urlParts = req.url.split('/');
  const userId = urlParts[urlParts.length - 1];
  const hasId = userId && !isNaN(parseInt(userId));
  
  switch (req.method) {
    case 'GET':
      if (hasId) {
        // Get single user
        return res.status(200).json({
          id: parseInt(userId),
          name: `Sample User ${userId}`,
          email: `user${userId}@example.com`,
          role: 'TECHNICIAN',
          department: 'Maintenance',
          phone: '555-0123',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        // Get all users
        return res.status(200).json([]);
      }
      
    case 'POST':
      // Create user
      return res.status(201).json({
        id: Math.floor(Math.random() * 1000),
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        message: 'User created successfully (mock data)'
      });
      
    case 'PUT':
      // Update user
      if (!hasId) {
        return res.status(400).json({ error: 'User ID required' });
      }
      return res.status(200).json({
        id: parseInt(userId),
        ...req.body,
        updatedAt: new Date().toISOString(),
        message: 'User updated successfully (mock data)'
      });
      
    case 'DELETE':
      // Delete user
      if (!hasId) {
        return res.status(400).json({ error: 'User ID required' });
      }
      return res.status(200).json({
        message: 'User deleted successfully (mock data)',
        id: parseInt(userId)
      });
      
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
};