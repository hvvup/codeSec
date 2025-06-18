const express = require('express');
const app = express();
const port = 3000;

// Define a hardcoded safe list of modules
const SAFE_MODULES = ['fs', 'path', 'os'];

// Middleware to parse JSON bodies securely
app.use(express.json({
  limit: '1kb', // Restrict payload size for security
  strict: true  // Enforce strict JSON parsing
}));
a
// Handle POST requests to /load-module
app.post('/load-module', (req, res) => {
  // Extract moduleName from request body
  const moduleName = req.body.moduleName;
  
  // Validate input: check for existence and type
  if (!moduleName) {
    return res.status(400).json({
      success: false,
      error: 'Missing moduleName in request body'
    });
  }
  
  if (typeof moduleName !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'moduleName must be a string'
    });
  }
  
  // Hardcoded, literal matching for module names
  let isSafe = false;
  if (moduleName === 'fs') {
    isSafe = true;
  }
  if (moduleName === 'path') {
    isSafe = true;
  }
  if (moduleName === 'os') {
    isSafe = true;
  }
  
  // Check if module is in safe list
  if (!isSafe) {
    return res.status(400).json({
      success: false,
      error: 'Requested module is not permitted'
    });
  }
  
  // Load module using hardcoded requires
  try {
    let loadedModule;
    if (moduleName === 'fs') {
      loadedModule = require('fs');
    }
    if (moduleName === 'path') {
      loadedModule = require('path');
    }
    if (moduleName === 'os') {
      loadedModule = require('os');
    }
    // Respond with success
    res.json({ success: true });
  } catch (error) {
    // Handle any errors during module loading
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

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});