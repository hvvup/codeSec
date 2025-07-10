const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' })); // Limit JSON body size

// Rate limiting to prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Create a prototype-less object to store notes
const notes = Object.create(null);

// List of forbidden keys that could lead to prototype pollution
const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];

// Middleware to validate and sanitize input
const validateInput = [
  param('userId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('User ID must be a non-empty string')
    .isLength({ max: 100 })
    .withMessage('User ID too long'),
  body('noteId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Note ID must be a non-empty string')
    .isLength({ max: 100 })
    .withMessage('Note ID too long')
    .custom(value => !DANGEROUS_KEYS.includes(value))
    .withMessage('Note ID contains dangerous keywords'),
  body('content')
    .isString()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Content too long (max 5000 characters)')
];

// Secure note storage endpoint
app.post('/notes/:userId', validateInput, (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId } = req.params;
  const { noteId, content } = req.body;

  // Initialize user's note storage if it doesn't exist
  if (!notes[userId]) {
    notes[userId] = Object.create(null); // Prototype-less object
  }

  // Store the note content
  notes[userId][noteId] = content;

  // Log the action (in a real app, use a proper logger)
  console.log(`Note stored for user ${userId} with ID ${noteId}`);

  // Respond with success
  res.status(201).json({
    status: 'success',
    message: 'Note stored successfully',
    data: {
      userId,
      noteId,
      contentLength: content.length
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    status: 'error',
    message: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export for testing purposes
module.exports = app;