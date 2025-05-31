const express = require('express');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const bodyParser = require('body-parser');

// Create logs directory if it doesn't exist
const logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

// Create a Pino logger that writes to a file
const logFilePath = path.join(logDirectory, 'user_input.log');
const logger = pino(
  pino.destination({ dest: logFilePath, sync: false })
);

// Express app setup
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for security and body parsing
app.use(helmet());
app.use(bodyParser.json({ limit: '1mb' }));

// POST endpoint
app.post('/log', (req, res) => {
  const userInput = req.body;

  // Validate input is an object
  if (typeof userInput !== 'object' || userInput === null) {
    return res.status(400).json({ error: 'Invalid JSON input' });
  }

  const timestamp = new Date().toISOString();

  // Securely stringify input to avoid log injection
  const sanitizedInput = JSON.stringify(userInput)
    .replace(/[\r\n]/g, '');

  // Log with timestamp
  logger.info({ timestamp, input: sanitizedInput });

  res.status(200).json({ status: 'Logged successfully' });
});

// Basic route
app.get('/', (req, res) => {
  res.send('Secure logging server is running.');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});