const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Secure notes storage using prototype-less object
const notes = Object.create(null);

// Helper function to check for dangerous property names
const isSafeProperty = (value) => {
  if (typeof value !== 'string') return false;
  const lowerValue = value.toLowerCase();
  return !['__proto__', 'constructor', 'prototype'].includes(lowerValue);
};

// Enhanced input validation with prototype pollution checks
const validateInput = [
  param('userId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('User ID must be a non-empty string')
    .isLength({ max: 100 })
    .withMessage('User ID too long')
    .custom(isSafeProperty)
    .withMessage('Invalid User ID'),
  body('noteId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Note ID must be a non-empty string')
    .isLength({ max: 100 })
    .withMessage('Note ID too long')
    .custom(isSafeProperty)
    .withMessage('Invalid Note ID'),
  body('content')
    .isString()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Content too long (max 5000 characters)')
];

// Secure note storage endpoint
app.post('/notes/:userId', validateInput, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId } = req.params;
  const { noteId, content } = req.body;

  // Initialize user's note storage with prototype-less object
  if (!notes[userId]) {
    notes[userId] = Object.create(null);
  }

  // Safe property assignment
  notes[userId][noteId] = content;

  console.log(`Note stored for user ${userId} with ID ${noteId}`);

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

// Error handling middleware (unchanged)
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
  console.log(`Secure notes server running on port ${PORT}`);
});

module.exports = app;