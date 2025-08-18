// Vercel serverless function for CMMS backend
const path = require('path');

console.log('[Vercel API] Starting serverless function (server.js)...');

// CORS middleware function
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
};

// Try to load the Express app
let app = null;
let loadError = null;

try {
  // Set the working directory to backend for proper module resolution
  const backendPath = path.join(__dirname, '../backend');
  if (require('fs').existsSync(backendPath)) {
    process.chdir(backendPath);
    console.log('[Vercel API] Changed working directory to:', process.cwd());
  }
  
  // Try to load the compiled Express app
  const indexPath = path.join(__dirname, '../backend/dist/src/index.js');
  console.log('[Vercel API] Attempting to load:', indexPath);
  
  if (require('fs').existsSync(indexPath)) {
    const appModule = require(indexPath);
    app = appModule.default || appModule;
    console.log('[Vercel API] Backend app loaded successfully');
  } else {
    loadError = new Error(`Backend file not found at: ${indexPath}`);
    console.error('[Vercel API] Backend file not found');
  }
} catch (error) {
  loadError = error;
  console.error('[Vercel API] Failed to load backend app:', error.message);
  console.error('[Vercel API] Stack:', error.stack);
}

// Main handler
module.exports = (req, res) => {
  // Always set CORS headers
  setCorsHeaders(res);
  
  // Log the request
  console.log(`[Vercel API] ${req.method} ${req.url}`);
  
  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[Vercel API] Handling OPTIONS preflight request');
    res.status(200).end();
    return;
  }
  
  // If app loaded successfully, use it
  if (app && typeof app === 'function') {
    try {
      app(req, res);
    } catch (error) {
      console.error('[Vercel API] Error handling request:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred while processing your request'
      });
    }
  } else {
    // App failed to load, return error with details
    console.error('[Vercel API] App not available');
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Backend service is not available',
      details: loadError ? loadError.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
};