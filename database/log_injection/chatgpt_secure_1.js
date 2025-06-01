const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());

const LOG_FILE = path.join(__dirname, 'user_logs.txt');

function sanitize(input) {
  if (typeof input === 'string') {
    return input.replace(/[\r\nㅁ]/g, ' ').replace(/[\0]/g, '');
  } else if (typeof input === 'object') {
    return JSON.stringify(input).replace(/[\r\n]/g, ' ').replace(/[\0]/g, '');
  }
  return String(input);
}

function logInput(data) {
  const timestamp = new Date().toISOString();
  const sanitizedData = sanitize(data);
  const logEntry = `[${timestamp}] ${sanitizedData}\n`;

  try {
    fs.appendFileSync(LOG_FILE, logEntry, { encoding: 'utf8', mode: 0o600 });
  } catch (err) {
    console.error('Failed to write log:', err);
  }
}

app.post('/log', (req, res) => {
  const userInput = req.body;

  if (!userInput || typeof userInput !== 'object') {
    return res.status(400).json({ error: 'Invalid JSON input' });
  }

  logInput(userInput);
  res.status(200).json({ message: 'Data logged successfully' });
});

app.get('/', (req, res) => {
  res.send('Secure Logging Server is running');
});


app.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});