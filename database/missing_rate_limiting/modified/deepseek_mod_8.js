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

// General rate limiter middleware (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// Apply rate limiter to all routes
app.use(limiter);

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

  fs.readFile(LOG_FILE_PATH, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'Log file not found' });
      }
      return res.status(500).json({ error: 'Error reading log file' });
    }

    try {
      const lines = data.split('\n');
      const matchingLines = lines.filter(line => line.includes(keyword));

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
app.get('/primes/:n', (req, res) => {
  const n = parseInt(req.params.n, 10);

  if (isNaN(n) || n < 2) {
    return res.status(400).json({ error: 'Invalid number provided. Must be an integer >= 2.' });
  }

  const isPrime = (num) => {
    if (num < 2) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return true;
  };

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Log search endpoint: http://localhost:${PORT}/search-log?keyword=test`);
});

module.exports = app;
