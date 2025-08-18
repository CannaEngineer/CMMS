// Work orders endpoint with mock data
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
  
  // Check if this is for recent work orders
  if (req.url.includes('/recent')) {
    // Return empty array for recent work orders
    return res.status(200).json([]);
  }
  
  // Return empty array for all work orders
  res.status(200).json([]);
};