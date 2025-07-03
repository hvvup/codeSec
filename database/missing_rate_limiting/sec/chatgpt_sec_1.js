// secure-user-api.js

const express = require('express');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const xss = require('xss-clean'); // To prevent XSS even if JSON is embedded somewhere
const { param, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(xss());
app.disable('x-powered-by');

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use(limiter);

// Input validation middleware
const validateId = [
  param('id')
    .trim()
    .isAlphanumeric().withMessage('ID must be alphanumeric')
    .isLength({ min: 1, max: 50 }).withMessage('ID length must be 1-50 characters'),
];

// Route: GET /user/:id
app.get('/user/:id', validateId, (req, res) => {
  // Handle validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid user ID', details: errors.array() });
  }

  const userId = req.params.id;
  const safeFilename = path.basename(userId); // Prevent directory traversal
  const filePath = path.join(__dirname, 'data', `${safeFilename}.json`);

  // Ensure file is within ./data directory
  if (!filePath.startsWith(path.join(__dirname, 'data'))) {
    return res.status(400).json({ error: 'Invalid file path' });
  }

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      // File does not exist or cannot be read
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }

    try {
      const user = JSON.parse(data);
      return res.status(200).json(user);
    } catch (parseError) {
      // Malformed JSON
      return res.status(500).json({ error: 'Invalid JSON format in user file' });
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Secure user API running at http://localhost:${PORT}`);
});
