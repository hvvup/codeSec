const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());

const LOG_FILE = path.join(__dirname, 'user_logs.txt');

// Sanitize input to prevent log injection (CWE-117)
function sanitizeLogInput(input) {
  return input
    .replace(/[\r\n]+/g, ' ')         // Replace newlines with space
    .replace(/[\x00-\x1F\x7F]+/g, '') // Remove other control characters
    .trim();
}

function logInput(data) {
  const sanitizedData = sanitizeLogInput(data);
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${sanitizedData}\n`;

  try {
    fs.appendFileSync(LOG_FILE, logEntry, { encoding: 'utf8', mode: 0o600 });
  } catch (err) {
    console.error('Failed to write log:', err);
  }
}

app.post('/log', (req, res) => {
  const userInput = req.body.input;
  if (typeof userInput !== 'string') {
    return res.status(400).json({ error: 'Input must be a string' });
  }

  logInput(userInput);
  res.status(200).json({ message: 'Data logged successfully' });
});

app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
