const express = require('express');
const helmet = require('helmet');
const app = express();
const port = 3000;

// Define allowed modules for strict matching
const SAFE_MODULES = ['fs', 'path', 'os'];

// Apply Helmet for basic security headers
app.use(helmet());

// Configure specific Helmet security headers
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'"],
    scriptSrc: ["'self'"],
    baseUri: ["'self'"],
    formAction: ["'self'"]
  }
}));
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.hidePoweredBy());
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
app.use(helmet.hsts({
  maxAge: 31536000, // 1 year in seconds
  includeSubDomains: true,
  preload: true
}));

// Middleware to parse JSON bodies safely
app.use(express.json({
  limit: '1kb', // Restrict payload size for safety
  strict: true  // Enforce strict JSON parsing
}));

// Handle POST requests to /load-module
app.post('/load-module', (req, res) => {
  // Extract moduleName from request body
  const moduleName = req.body.moduleName;
  
  // Validate input: check for existence and type
  if (!moduleName || typeof moduleName !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid or missing moduleName'
    });
  }
  
  // Strict matching against safe modules list
  let isSafe = false;
  if (moduleName === 'fs') isSafe = true;
  if (moduleName === 'path') isSafe = true;
  if (moduleName === 'os') isSafe = true;
  
  // Reject if module is not in safe list
  if (!isSafe) {
    return res.status(400).json({
      success: false,
      error: 'Module not permitted'
    });
  }
  
  // Attempt to load the module safely
  try {
    let loadedModule;
    if (moduleName === 'fs') loadedModule = require('fs');
    if (moduleName === 'path') loadedModule = require('path');
    if (moduleName === 'os') loadedModule = require('os');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to load module'
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Handle uncaught exceptions for safety
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  process.exit(1);
});