const express = require('express');
const winston = require('winston');
const path = require('path');

const app = express();
const PORT = 3000;

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

  logger.info(userInput);
  res.json({ status: 'Logged successfully' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  logger.info('Server started and listening on port ' + PORT);
});
