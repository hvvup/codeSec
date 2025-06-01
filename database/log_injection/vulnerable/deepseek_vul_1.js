const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const LOG_FILE = 'request_logs.txt';
const LOG_DIR = path.join(__dirname, 'logs');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LOG_PATH = path.join(LOG_DIR, LOG_FILE);

function writeLog(data) {
  const timestamp = new Date().toISOString();
  const logId = uuidv4();
  const logEntry = `[${timestamp}] [ID:${logId}] ${data}\n`;
  fs.appendFileSync(LOG_PATH, logEntry);
  return logId;
}

app.post('/log', (req, res) => {
  if (!req.body || !req.body.message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  const logId = writeLog(req.body.message);
  res.json({ 
    status: 'success',
    logId,
    message: req.body.message
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});