// Maintenance stats endpoint with mock data
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
  
  // Return mock maintenance stats
  res.status(200).json({
    totalSchedules: 0,
    activeSchedules: 0,
    overdueItems: 0,
    upcomingItems: 0
  });
};