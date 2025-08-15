// Vercel serverless function wrapper for Express.js backend
const path = require('path');

// Import the compiled Express app
let app;
try {
  // Load the main app file (will be copied during build)
  const appModule = require('./main.js');
  app = appModule.default || appModule;
} catch (error) {
  try {
    // Fallback to original path
    const appModule = require(path.join(__dirname, '../backend/dist/index.js'));
    app = appModule.default || appModule;
  } catch (fallbackError) {
    console.error('Failed to load backend app from both locations:', error, fallbackError);
    throw error;
  }
}

// Export the Express app as a Vercel serverless function
module.exports = app;