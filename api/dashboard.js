// Dashboard stats endpoint with mock data
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
  
  // Return mock dashboard stats
  res.status(200).json({
    workOrders: {
      total: 0,
      byStatus: {},
      overdue: 0,
      completionRate: 0,
    },
    assets: {
      total: 0,
      byStatus: {},
      maintenanceDue: 0,
    },
    inventory: {
      lowStock: 0,
      outOfStock: 0,
    },
  });
};