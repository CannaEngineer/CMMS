// Minimal serverless function for debugging
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
  
  // For now, just return a simple response for all routes
  res.status(200).json({
    message: 'API is running but backend not loaded',
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    note: 'The Express backend is not loading properly. Check Vercel logs for details.'
  });
};