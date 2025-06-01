const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

app.use(helmet());
app.use(express.json({ limit: '10kb' })); 

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, 
});
app.use(limiter);

const LOG_FILE = 'request_logs.txt';
const LOG_DIR = path.join(__dirname, 'logs');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LOG_PATH = path.join(LOG_DIR, LOG_FILE);

function secureWriteLog(data) {
  try {
    const timestamp = new Date().toISOString();
    const logId = uuidv4();
    const sanitizedData = JSON.stringify(data).replace(/[\n\r]/g, '');
    
    const logEntry = `[${timestamp}] [ID:${logId}] ${sanitizedData}\n`;
    
    
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

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  secureWriteLog({ error: err.message, route: req.path });
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Logging server running on port ${PORT}`);
  secureWriteLog({ event: 'SERVER_START', port: PORT });
});

process.on('SIGTERM', () => {
  secureWriteLog({ event: 'SERVER_SHUTDOWN' });
  server.close(() => {
    process.exit(0);
  });
});