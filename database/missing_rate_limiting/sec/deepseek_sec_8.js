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
  max: 20, // Limit each IP to 20 requests per windowMs
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all requests
app.use(limiter);

// Constants for security configuration
const MAX_KEYWORD_LENGTH = 100;
const LOG_FILE_PATH = path.resolve(__dirname, './server.log');

// Middleware to validate and sanitize input
const validateSearchInput = (req, res, next) => {
  const { keyword } = req.query;
  
  if (!keyword || typeof keyword !== 'string') {
    return res.status(400).json({ error: 'Keyword parameter is required and must be a string' });
  }

  if (keyword.length > MAX_KEYWORD_LENGTH) {
    return res.status(400).json({ error: `Keyword must be less than ${MAX_KEYWORD_LENGTH} characters` });
  }

  // Sanitize the keyword to prevent injection attacks
  req.sanitizedKeyword = escape(keyword).trim();
  next();
};

// Search endpoint
app.get('/search-log', validateSearchInput, (req, res) => {
  const { sanitizedKeyword } = req;
  const results = [];

  try {
    // Verify the log file exists and is accessible
    if (!fs.existsSync(LOG_FILE_PATH)) {
      return res.status(500).json({ error: 'Log file not accessible' });
    }

    // Read file line by line to minimize memory usage
    const fileStream = fs.createReadStream(LOG_FILE_PATH, { encoding: 'utf8' });
    let remaining = '';

    fileStream.on('data', (chunk) => {
      remaining += chunk;
      const lines = remaining.split('\n');
      remaining = lines.pop(); // Last incomplete line

      for (const line of lines) {
        if (line.includes(sanitizedKeyword)) {
          results.push(line);
        }
      }
    });

    fileStream.on('end', () => {
      // Check the last remaining line
      if (remaining.includes(sanitizedKeyword)) {
        results.push(remaining);
      }
      
      // Return results in JSON format
      res.json({ 
        keyword: sanitizedKeyword,
        count: results.length,
        results 
      });
    });

    fileStream.on('error', (err) => {
      console.error('File read error:', err);
      res.status(500).json({ error: 'Error reading log file' });
    });

  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Log file path: ${LOG_FILE_PATH}`);
});

// Export for testing purposes
module.exports = app;