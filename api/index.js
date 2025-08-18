// Vercel serverless function wrapper for Express.js backend
const path = require('path');

console.log('[Vercel API] Starting serverless function...');
console.log('[Vercel API] Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL_URL: process.env.VERCEL_URL,
  __dirname: __dirname
});

// Import the compiled Express app
let app;
try {
  console.log('[Vercel API] Attempting to load main.js from:', path.join(__dirname, './main.js'));
  // Load the main app file (will be copied during build)
  const appModule = require('./main.js');
  app = appModule.default || appModule;
  console.log('[Vercel API] Successfully loaded main.js');
} catch (error) {
  console.error('[Vercel API] Failed to load main.js:', error.message);
  try {
    const fallbackPath = path.join(__dirname, '../backend/dist/index.js');
    console.log('[Vercel API] Attempting fallback path:', fallbackPath);
    // Fallback to original path
    const appModule = require(fallbackPath);
    app = appModule.default || appModule;
    console.log('[Vercel API] Successfully loaded from fallback path');
  } catch (fallbackError) {
    console.error('[Vercel API] Failed to load backend app from both locations');
    console.error('Primary error:', error);
    console.error('Fallback error:', fallbackError);
    
    // Return a basic error handler instead of crashing
    app = (req, res) => {
      console.error('[Vercel API] Request received but app not loaded properly');
      res.status(500).json({
        error: 'Server initialization failed',
        message: 'Failed to load backend application',
        details: process.env.NODE_ENV === 'development' ? {
          primaryError: error.message,
          fallbackError: fallbackError.message
        } : undefined
      });
    };
  }
}

// Ensure CORS headers are added even if the app fails to load
const corsWrapper = (req, res) => {
  // Add CORS headers for all requests
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://cmms-orpin.vercel.app',
    'https://your-cmms-app.vercel.app'
  ];
  
  // Check if origin is allowed or is a Vercel preview
  if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  
  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[Vercel API] Handling OPTIONS preflight request');
    res.status(200).end();
    return;
  }
  
  // Pass to the Express app
  if (typeof app === 'function') {
    app(req, res);
  } else {
    console.error('[Vercel API] App is not a function');
    res.status(500).json({ error: 'Server initialization failed' });
  }
};

// Export the wrapped function
module.exports = corsWrapper;