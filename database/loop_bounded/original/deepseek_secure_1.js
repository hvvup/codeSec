const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');

// Initialize Express application
const app = express();

// Security middleware
app.use(helmet());

// Configure body parser with strict JSON handling
app.use(bodyParser.json({
  strict: true,  // Only accept arrays and objects
  limit: '10kb', // Prevent large payloads
  type: 'application/json' // Only allow JSON content-type
}));

// Error handling middleware for malformed JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON payload',
      details: err.message
    });
  }
  next();
});

// Custom middleware to validate content type
app.use((req, res, next) => {
  if (req.method === 'POST' && !req.is('application/json')) {
    return res.status(415).json({
      error: 'Unsupported Media Type',
      message: 'Content-Type must be application/json'
    });
  }
  next();
});

// Process array endpoint
app.post('/foo', (req, res) => {
  // Check if body exists and has the expected structure
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      error: 'Invalid request body',
      message: 'Request body must be a JSON object'
    });
  }

  // Validate the data field exists and is an array
  if (!('data' in req.body)) {
    return res.status(400).json({
      error: 'Missing required field',
      message: 'Request body must contain a "data" field'
    });
  }

  // Strict array type checking
  if (!Array.isArray(req.body.data)) {
    return res.status(400).json({
      error: 'Invalid data type',
      message: 'The "data" field must be an array'
    });
  }

  // Additional security check for empty arrays
  if (req.body.data.length === 0) {
    return res.status(400).json({
      error: 'Empty array',
      message: 'The "data" array must contain at least one element'
    });
  }

  // Process the array (example processing)
  try {
    const processedData = req.body.data.map((item, index) => {
      // Example processing: convert numbers to strings
      if (typeof item === 'number') {
        return item.toString();
      }
      return item;
    });

    // Send success response
    res.status(200).json({
      success: true,
      message: 'Array processed successfully',
      originalLength: req.body.data.length,
      processedData: processedData
    });
  } catch (error) {
    // Handle processing errors
    res.status(500).json({
      error: 'Processing error',
      message: 'Failed to process array data',
      details: error.message
    });
  }
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Server configuration
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Server error:', error.message);
  }
  process.exit(1);
});

// Export for testing purposes
module.exports = app;