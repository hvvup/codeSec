const express = require('express');
const winston = require('winston');
const path = require('path');

const app = express();
const PORT = 3000;

// === Mitigation Function for CWE-117 ===
function sanitizeForLog(input) {
  return input
    .replace(/[\r\n]/g, '') // Remove CR/LF to prevent line injection
    .replace(/[\x00-\x1F\x7F]/g, (char) => {
      return '\\x' + char.charCodeAt(0).toString(16).padStart(2, '0');
    });
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.printf(({ message }) => message),
  transports: [
    new winston.transports.File({ filename: path.join(__dirname, 'app.log') })
  ]
});

app.use(express.json());

app.post('/log', (req, res) => {
  const userInput = req.body.input;
  if (typeof userInput !== 'string') {
    return res.status(400).json({ error: 'Input must be a string' });
  }

  const sanitizedInput = sanitizeForLog(userInput);
  logger.info(sanitizedInput);

  res.json({ status: 'Logged successfully' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  logger.info('Server started and listening on port ' + PORT);
});
