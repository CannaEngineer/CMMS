// Assets CRUD endpoint
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
  const assetId = urlParts[urlParts.length - 1];
  const hasId = assetId && !isNaN(parseInt(assetId));
  
  switch (req.method) {
    case 'GET':
      if (hasId) {
        // Get single asset
        return res.status(200).json({
          id: parseInt(assetId),
          name: `Sample Asset ${assetId}`,
          description: 'This is a mock asset',
          location: 'Sample Location',
          status: 'ACTIVE',
          model: 'Sample Model',
          serialNumber: `SN${assetId}`,
          purchaseDate: '2023-01-01',
          warrantyExpiration: '2024-01-01',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        // Get all assets
        return res.status(200).json([]);
      }
      
    case 'POST':
      // Create asset
      return res.status(201).json({
        id: Math.floor(Math.random() * 1000),
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        message: 'Asset created successfully (mock data)'
      });
      
    case 'PUT':
      // Update asset
      if (!hasId) {
        return res.status(400).json({ error: 'Asset ID required' });
      }
      return res.status(200).json({
        id: parseInt(assetId),
        ...req.body,
        updatedAt: new Date().toISOString(),
        message: 'Asset updated successfully (mock data)'
      });
      
    case 'DELETE':
      // Delete asset
      if (!hasId) {
        return res.status(400).json({ error: 'Asset ID required' });
      }
      return res.status(200).json({
        message: 'Asset deleted successfully (mock data)',
        id: parseInt(assetId)
      });
      
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
};