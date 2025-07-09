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

const notes = {};

// Improved helper function to check for prototype pollution attempts
const isPrototypePollutionAttempt = (key) => {
  if (typeof key !== 'string') return false;
  
  // Check for exact matches
  if (['__proto__', 'constructor', 'prototype'].includes(key)) {
    return true;
  }

  // Check for nested pollution attempts
  const lowerKey = key.toLowerCase();
  const pollutionPatterns = ['__proto__', 'constructor', 'prototype'];
  return pollutionPatterns.some(pattern => lowerKey.includes(pattern));
};

// Enhanced input validation
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
    .custom((value) => {
      if (isPrototypePollutionAttempt(value)) {
        throw new Error('Potential prototype pollution attempt detected');
      }
      return true;
    }),
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

  // Initialize user's note storage with null-prototype object
  if (!notes[userId]) {
    notes[userId] = Object.create(null); // Creates object without prototype
  }

  // Safe property assignment
  notes[userId][noteId] = content;

  console.log(`Note stored for user ${userId} with ID ${noteId}`);

  // Proper response for resource creation
  return res.status(201).json({
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

module.exports = app;