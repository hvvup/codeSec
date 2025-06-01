const express = require('express');
const winston = require('winston');
const path = require('path');

const app = express();
const PORT = 3000;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: path.join(__dirname, 'app.log') })
  ]
});

app.use(express.json());

app.post('/log', (req, res) => {
  try {
    const userInput = req.body;

    if (!userInput || Object.keys(userInput).length === 0) {
      return res.status(400).json({ error: 'No input provided' });
    }

    logger.info(`Received input: ${JSON.stringify(userInput)}`);

    res.json({ status: 'Logged successfully' });
  } catch (error) {
    logger.error(`Error handling request: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
  res.send('Server is running. Use POST /log to send data.');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  logger.info('Server started and listening on port ' + PORT);
});
