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

// Export the Express app as a Vercel serverless function
module.exports = app;