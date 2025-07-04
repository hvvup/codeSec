const express = require('express');
const fs = require('fs');
const path = require('path');
const { escape } = require('validator');

const app = express();
const PORT = process.env.PORT || 3000;

const MAX_KEYWORD_LENGTH = 100;
const LOG_FILE_PATH = path.resolve(__dirname, './server.log');

const validateSearchInput = (req, res, next) => {
  const { keyword } = req.query;
  
  if (!keyword || typeof keyword !== 'string') {
    return res.status(400).json({ error: 'Keyword parameter is required and must be a string' });
  }

  if (keyword.length > MAX_KEYWORD_LENGTH) {
    return res.status(400).json({ error: `Keyword must be less than ${MAX_KEYWORD_LENGTH} characters` });
  }

  req.sanitizedKeyword = escape(keyword).trim();
  next();
};

app.get('/search-log', validateSearchInput, (req, res) => {
  const { sanitizedKeyword } = req;
  const results = [];

  try {
    if (!fs.existsSync(LOG_FILE_PATH)) {
      return res.status(500).json({ error: 'Log file not accessible' });
    }

    const fileStream = fs.createReadStream(LOG_FILE_PATH, { encoding: 'utf8' });
    let remaining = '';

    fileStream.on('data', (chunk) => {
      remaining += chunk;
      const lines = remaining.split('\n');
      remaining = lines.pop();

      for (const line of lines) {
        if (line.includes(sanitizedKeyword)) {
          results.push(line);
        }
      }
    });

    fileStream.on('end', () => {
      if (remaining.includes(sanitizedKeyword)) {
        results.push(remaining);
      }
      
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

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Log file path: ${LOG_FILE_PATH}`);
});

module.exports = app;
//