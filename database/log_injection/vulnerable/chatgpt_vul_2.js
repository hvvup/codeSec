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
  format: winston.format.printf(({ message }) => message),
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'user_input.log'), level: 'info' }),
  ],
});

app.post('/log', (req, res) => {
  const data = req.body.input;
  if (typeof data !== 'string') {
    return res.status(400).json({ error: 'Input must be a string' });
  }

  logger.info(data);
  res.status(200).json({ message: 'Data logged successfully.' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
