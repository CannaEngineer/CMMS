// Vercel serverless function wrapper for Express.js backend
const path = require('path');

// Import the compiled Express app
let app;
try {
  // In production, the backend will be compiled to dist/
  const appModule = require(path.join(__dirname, '../backend/dist/index.js'));
  app = appModule.default || appModule;
} catch (error) {
  console.error('Failed to load backend app:', error);
  throw error;
}

// Export the Express app as a Vercel serverless function
module.exports = app;