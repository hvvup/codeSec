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

app.post('/log', (req, res) => {
  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid input format. JSON expected.' });
  }

  logger.info(JSON.stringify(data));
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
  console.log(`Server listening on http://localhost:${PORT}`);
});
