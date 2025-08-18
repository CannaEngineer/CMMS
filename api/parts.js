// Parts CRUD endpoint
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
  const partId = urlParts[urlParts.length - 1];
  const hasId = partId && !isNaN(parseInt(partId));
  
  switch (req.method) {
    case 'GET':
      if (hasId) {
        // Get single part
        return res.status(200).json({
          id: parseInt(partId),
          name: `Sample Part ${partId}`,
          description: 'This is a mock part',
          partNumber: `PN-${partId}`,
          stockLevel: 10,
          reorderPoint: 5,
          unitCost: 25.99,
          supplier: 'Sample Supplier',
          location: 'Warehouse A',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        // Get all parts
        return res.status(200).json([]);
      }
      
    case 'POST':
      // Create part
      return res.status(201).json({
        id: Math.floor(Math.random() * 1000),
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        message: 'Part created successfully (mock data)'
      });
      
    case 'PUT':
      // Update part
      if (!hasId) {
        return res.status(400).json({ error: 'Part ID required' });
      }
      return res.status(200).json({
        id: parseInt(partId),
        ...req.body,
        updatedAt: new Date().toISOString(),
        message: 'Part updated successfully (mock data)'
      });
      
    case 'DELETE':
      // Delete part
      if (!hasId) {
        return res.status(400).json({ error: 'Part ID required' });
      }
      return res.status(200).json({
        message: 'Part deleted successfully (mock data)',
        id: parseInt(partId)
      });
      
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
};