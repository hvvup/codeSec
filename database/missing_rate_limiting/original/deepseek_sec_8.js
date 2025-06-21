const express = require('express');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { escape } = require('validator');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests, please try again after 15 minutes'
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all requests
app.use(limiter);

// Constants for security configuration
const MAX_KEYWORD_LENGTH = 100;
const LOG_FILE_PATH = path.join(__dirname, 'server.log');

// Middleware to validate and sanitize keyword parameter
const validateKeyword = (req, res, next) => {
  const keyword = req.query.keyword;
  
  if (!keyword) {
    return res.status(400).json({ error: 'Keyword parameter is required' });
  }
  
  if (keyword.length > MAX_KEYWORD_LENGTH) {
    return res.status(400).json({ 
      error: `Keyword too long. Maximum length is ${MAX_KEYWORD_LENGTH} characters` 
    });
  }
  
  // Sanitize the keyword to prevent injection attacks
  req.sanitizedKeyword = escape(keyword);
  next();
};

// GET endpoint for log search
app.get('/search-log', validateKeyword, (req, res) => {
  const keyword = req.sanitizedKeyword;
  
  // Read the log file securely with fixed path
  fs.readFile(LOG_FILE_PATH, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'Log file not found' });
      }
      return res.status(500).json({ error: 'Error reading log file' });
    }
    
    try {
      // Split file into lines and filter those containing the keyword
      const lines = data.split('\n');
      const matchingLines = lines.filter(line => line.includes(keyword));
      
      // Return results in JSON format
      res.json({
        keyword: keyword,
        matches: matchingLines,
        count: matchingLines.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Error processing log file' });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Log search endpoint: http://localhost:${PORT}/search-log?keyword=test`);
});

// Export for testing purposes
module.exports = app;