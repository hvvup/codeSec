const express = require('express');
const fs = require('fs');
const path = require('path');
const { escape } = require('validator');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Constants for security configuration
const MAX_KEYWORD_LENGTH = 100;
const LOG_FILE_PATH = path.join(__dirname, 'server.log');

// Apply general rate limiting (100 requests per 15 minutes per IP)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply stricter limiter for resource-heavy endpoints
const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 10, // limit each IP to 10 requests per window
  message: {
    error: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter); // Global limit

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
app.get('/search-log', strictLimiter, validateKeyword, (req, res) => {
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

// GET /primes/:n endpoint - returns all prime numbers <= n
app.get('/primes/:n', strictLimiter, (req, res) => {
  const n = parseInt(req.params.n, 10);

  if (isNaN(n) || n < 2) {
    return res.status(400).json({ error: 'Invalid number provided. Must be an integer >= 2.' });
  }

  // Helper function to check if a number is prime
  const isPrime = (num) => {
    if (num < 2) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return true;
  };

  // Generate list of primes <= n
  const primes = [];
  for (let i = 2; i <= n; i++) {
    if (isPrime(i)) primes.push(i);
  }

  res.json({
    limit: n,
    primes: primes,
    count: primes.length
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Log search endpoint: http://localhost:${PORT}/search-log?keyword=test`);
});

// Export for testing purposes
module.exports = app;
