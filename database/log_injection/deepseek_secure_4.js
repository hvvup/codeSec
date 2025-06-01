const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const LOG_FILE = 'user_input.log';

// Security middleware
app.use(express.json({ limit: '10kb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: false }));

// Validate content type is JSON for POST requests
app.use((req, res, next) => {
  if (req.method === 'POST' && !req.is('application/json')) {
    return res.status(415).send('Unsupported Media Type: JSON expected');
  }
  next();
});

// Helper function for secure file writing
async function secureWriteToFile(data) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      id: uuidv4(),
      timestamp,
      data,
      ip: this.ip // Context-bound IP from the request
    };

    const logString = JSON.stringify(logEntry) + '\n';

    await fs.promises.appendFile(
      path.join(__dirname, LOG_FILE),
      logString,
      { flag: 'a', encoding: 'utf8' }
    );

    return true;
  } catch (error) {
    console.error('Failed to write to log file:', error);
    return false;
  }
}

// POST endpoint for receiving and logging user input
app.post('/log', async (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).send('Invalid input: expected JSON object');
  }

  try {
    // Create a bound version of the function with request context
    const writeWithContext = secureWriteToFile.bind({ ip: req.ip });
    
    const success = await writeWithContext(req.body);
    
    if (success) {
      res.status(201).send('Input logged successfully');
    } else {
      res.status(500).send('Failed to log input');
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('An unexpected error occurred');
});

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Logging to file: ${path.join(__dirname, LOG_FILE)}`);
  });
}

module.exports = app; // For testing purposes