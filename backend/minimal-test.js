// Minimal test file for Vercel deployment
console.log('Starting minimal test server...');

const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.json({ 
    message: 'Minimal test server is working!',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Minimal server running on port ${port}`);
  });
}

module.exports = app;