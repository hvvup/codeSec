const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());

const LOG_FILE = path.join(__dirname, 'server.log');

// === Log Injection Mitigation Function ===
function sanitizeForLog(input) {
  return input
    .replace(/[\r\n]/g, '') // Remove CR/LF
    .replace(/[\x00-\x1F\x7F]/g, (c) => {
      return '\\x' + c.charCodeAt(0).toString(16).padStart(2, '0');
    });
}

function logToFile(data) {
  const timestamp = new Date().toISOString();
  const sanitizedData = sanitizeForLog(data);
  const logEntry = `${timestamp} - ${sanitizedData}\n`;

  fs.appendFile(LOG_FILE, logEntry, (err) => {
    if (err) {
      console.error('Failed to write to log file:', err);
    }
  });
}

app.post('/log', (req, res) => {
  const userInput = req.body.input;
  if (typeof userInput !== 'string') {
    return res.status(400).json({ error: 'Input must be a string' });
  }

  logToFile(userInput);
  res.json({ status: 'Logged successfully' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
