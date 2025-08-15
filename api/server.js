// Vercel serverless function for CMMS backend
const path = require('path');

// Set the working directory to backend for proper module resolution
process.chdir(path.join(__dirname, '../backend'));

// Import the compiled Express app from the backend dist directory
let app;
try {
  const appModule = require('../backend/dist/src/index.js');
  app = appModule.default || appModule;
} catch (error) {
  console.error('Failed to load backend app:', error);
  throw error;
}

// Export the Express app as a Vercel serverless function
module.exports = app;