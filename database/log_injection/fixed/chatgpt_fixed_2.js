const express = require('express');
const winston = require('winston');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(express.json());

const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.printf(({ message }) => message),
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'user_input.log'), level: 'info' }),
  ],
});

function sanitizeForLog(input) {
  return input
    .replace(/[\r\n]+/g, ' ')        
    .replace(/[\x00-\x1F\x7F]+/g, '') 
    .trim();                         
}

app.post('/log', (req, res) => {
  const data = req.body.input;
  if (typeof data !== 'string') {
    return res.status(400).json({ error: 'Input must be a string' });
  }

  const sanitized = sanitizeForLog(data);
  logger.info(sanitized);
  res.status(200).json({ message: 'Data logged successfully.' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
