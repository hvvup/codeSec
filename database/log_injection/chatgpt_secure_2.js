const express = require('express');
const winston = require('winston');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());

const logDir = path.join(__dirname, 'logs');
const fs = require('fs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'user_input.log'), level: 'info' }),
  ],
});

function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input.replace(/[\r\n]/g, ' ').replace(/[\0]/g, '');
  } else if (typeof input === 'object') {
    return JSON.stringify(input).replace(/[\r\n]/g, ' ').replace(/[\0]/g, '');
  }
  return String(input);
}

app.post('/log', (req, res) => {
  const data = req.body;
  if (!data || typeof data !== 'object') {
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
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http:});
