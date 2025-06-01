const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' })); // Limit JSON payload size

// Rate limiting to prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Constants
const LOG_FILE = 'request_logs.txt';
const LOG_DIR = path.join(__dirname, 'logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LOG_PATH = path.join(LOG_DIR, LOG_FILE);

// Utility function for secure logging
function secureWriteLog(data) {
  try {
    const timestamp = new Date().toISOString();
    const logId = uuidv4();
    const sanitizedData = JSON.stringify(data).replace(/[\n\r]/g, ''); // Basic sanitization
    
    const logEntry = `[${timestamp}] [ID:${logId}] ${sanitizedData}\n`;
    
    // Append to log file
    fs.appendFile(LOG_PATH, logEntry, { flag: 'a' }, (err) => {
      if (err) {
        console.error('Failed to write log:', err);
      }
    });
    
    return logId;
  } catch (error) {
    console.error('Logging error:', error);
    return null;
  }
}

// Log endpoint
app.post('/log', (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid input: Expected JSON object' });
  }

  const logId = secureWriteLog(req.body);
  
  if (!logId) {
    return res.status(500).json({ error: 'Failed to process log entry' });
  }

  res.status(201).json({ 
    status: 'success', 
    logId,
    message: 'Log entry created' 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  secureWriteLog({ error: err.message, route: req.path });
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Logging server running on port ${PORT}`);
  secureWriteLog({ event: 'SERVER_START', port: PORT });
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  secureWriteLog({ event: 'SERVER_SHUTDOWN' });
  server.close(() => {
    process.exit(0);
  });
});