const express = require('express');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

const logFilePath = path.join(logDirectory, 'user_input.log');
const destination = pino.destination({ dest: logFilePath, sync: false });
const logger = pino({}, destination);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// === Log Injection Mitigation Function ===
function sanitizeForLog(input) {
  return input
    .replace(/[\r\n]/g, '')        // remove newline and carriage return
    .replace(/[\x00-\x1F\x7F]/g, (c) => { // optionally escape control characters
      return '\\x' + c.charCodeAt(0).toString(16).padStart(2, '0');
    });
}

app.post('/log', (req, res) => {
  const userInput = req.body.input;
  if (typeof userInput !== 'string') {
    return res.status(400).json({ error: 'Input must be a string' });
  }

  const sanitizedInput = sanitizeForLog(userInput);
  destination.write(`${sanitizedInput}\n`);

  res.status(200).json({ status: 'Logged successfully' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});