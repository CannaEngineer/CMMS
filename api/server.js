// Vercel serverless function for CMMS backend
const path = require('path');

console.log('[Vercel API] Starting serverless function (server.js)...');
console.log('[Vercel API] Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL_URL: process.env.VERCEL_URL,
  __dirname: __dirname
});

// Set the working directory to backend for proper module resolution
try {
  process.chdir(path.join(__dirname, '../backend'));
  console.log('[Vercel API] Changed working directory to:', process.cwd());
} catch (error) {
  console.error('[Vercel API] Failed to change working directory:', error);
}

// Import the compiled Express app from the backend dist directory
let app;
try {
  console.log('[Vercel API] Loading backend app from:', path.join(__dirname, '../backend/dist/src/index.js'));
  const appModule = require('../backend/dist/src/index.js');
  app = appModule.default || appModule;
  console.log('[Vercel API] Backend app loaded successfully');
} catch (error) {
  console.error('[Vercel API] Failed to load backend app:', error);
  console.error('[Vercel API] Error stack:', error.stack);
}

// CORS wrapper to ensure headers are always set
const corsWrapper = (req, res) => {
  // Add CORS headers for all requests
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173', 
    'https://cmms-orpin.vercel.app',
    'https://your-cmms-app.vercel.app'
  ];
  
  // Always set CORS headers, even for errors
  if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  
  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[Vercel API] Handling OPTIONS preflight request for:', req.url);
    res.status(200).end();
    return;
  }
  
  // If app loaded successfully, pass the request to it
  if (app && typeof app === 'function') {
    console.log('[Vercel API] Processing request:', req.method, req.url);
    app(req, res);
  } else {
    console.error('[Vercel API] App is not available or not a function');
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Backend service is not available. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? 'Express app failed to load' : undefined
    });
  }
};

// Export the wrapped function
module.exports = corsWrapper;