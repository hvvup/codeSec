const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// [SAFE_DEFAULTS] JSON body parser is used with default safe configuration
app.use(express.json());

const LOG_FILE = path.join(__dirname, 'user_logs.txt');

function sanitize(input) {
  // [SANITIZE] Input is sanitized to remove newline and null characters
  if (typeof input === 'string') {
    return input.replace(/[\r\n]/g, ' ').replace(/[\0]/g, '');
  } else if (typeof input === 'object') {
    // [SANITIZE] Object input is stringified and sanitized
    return JSON.stringify(input).replace(/[\r\n]/g, ' ').replace(/[\0]/g, '');
  }
  return String(input);
}

function logInput(data) {
  const timestamp = new Date().toISOString();
  const sanitizedData = sanitize(data);
  const logEntry = `[${timestamp}] ${sanitizedData}\n`;

  try {
    // [LOGGING] Logs are written with restricted file permissions (mode 0o600)
    fs.appendFileSync(LOG_FILE, logEntry, { encoding: 'utf8', mode: 0o600 });
  } catch (err) {
    console.error('Failed to write log:', err);
  }
}

app.post('/log', (req, res) => {
  // [INPUT] Receives user input from JSON body
  const userInput = req.body;

  if (!userInput || typeof userInput !== 'object') {
    // [ERROR] Returns a generic error message for invalid input
    return res.status(400).json({ error: 'Invalid JSON input' });
  }

  logInput(userInput);
  res.status(200).json({ message: 'Data logged successfully' });
});

app.get('/', (req, res) => {
  res.send('Secure Logging Server is running');
});

app.use((err, req, res, next) => {
  // [ERROR] Generic internal server error message avoids leaking stack trace
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
