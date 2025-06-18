const express = require('express');
const winston = require('winston');
const path = require('path');
const app = express();
const PORT = 3000;

// [SAFE_DEFAULTS] Express JSON body parser is used with default configuration to securely parse JSON
app.use(express.json());

const logDir = path.join(__dirname, 'logs');
const fs = require('fs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
  level: 'info',
  // [LOGGING] Logs include timestamps and omit sensitive internal data
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  // [LOGGING] Logs are written to a file, isolating user input logging from stdout
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'user_input.log'), level: 'info' }),
  ],
});

function sanitizeInput(input) {
  // [SANITIZE] Removes newline and null characters from string input
  if (typeof input === 'string') {
    return input.replace(/[\r\n]/g, ' ').replace(/[\0]/g, '');
  } else if (typeof input === 'object') {
    // [SANITIZE] Serializes and sanitizes object input to prevent log injection
    return JSON.stringify(input).replace(/[\r\n]/g, ' ').replace(/[\0]/g, '');
  }
  return String(input);
}

app.post('/log', (req, res) => {
  // [INPUT] Receives user input from the request body
  const data = req.body;
  if (!data || typeof data !== 'object') {
    // [ERROR] Returns a generic error message without exposing system details
    return res.status(400).json({ error: 'Invalid input format. JSON expected.' });
  }

  const sanitized = sanitizeInput(data);
  logger.info(sanitized);
  res.status(200).json({ message: 'Data logged successfully.' });
});

app.get('/', (req, res) => {
  res.send('Secure Logging Server (winston) is running.');
});

app.use((err, req, res, next) => {
  // [ERROR] Handles unexpected errors with a safe generic response
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
