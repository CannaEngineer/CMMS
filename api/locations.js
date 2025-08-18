// Locations CRUD endpoint
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
  const locationId = urlParts[urlParts.length - 1];
  const hasId = locationId && !isNaN(parseInt(locationId));
  
  switch (req.method) {
    case 'GET':
      if (hasId) {
        // Get single location
        return res.status(200).json({
          id: parseInt(locationId),
          name: `Sample Location ${locationId}`,
          description: 'This is a mock location',
          address: '123 Sample Street',
          type: 'FACILITY',
          parentId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        // Get all locations
        return res.status(200).json([]);
      }
      
    case 'POST':
      // Create location
      return res.status(201).json({
        id: Math.floor(Math.random() * 1000),
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        message: 'Location created successfully (mock data)'
      });
      
    case 'PUT':
      // Update location
      if (!hasId) {
        return res.status(400).json({ error: 'Location ID required' });
      }
      return res.status(200).json({
        id: parseInt(locationId),
        ...req.body,
        updatedAt: new Date().toISOString(),
        message: 'Location updated successfully (mock data)'
      });
      
    case 'DELETE':
      // Delete location
      if (!hasId) {
        return res.status(400).json({ error: 'Location ID required' });
      }
      return res.status(200).json({
        message: 'Location deleted successfully (mock data)',
        id: parseInt(locationId)
      });
      
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
};