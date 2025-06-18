const express = require('express');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

const logFilePath = path.join(logDirectory, 'user_input.log');
// [LOGGING] Log destination is written to a file to avoid leaking to stdout/stderr
const logger = pino(
  pino.destination({ dest: logFilePath, sync: false })
);

const app = express();
const PORT = process.env.PORT || 3000;

// [SAFE_DEFAULTS] Helmet sets secure HTTP headers to reduce common web vulnerabilities
app.use(helmet());

// [SAFE_DEFAULTS] Body parser limits JSON payload size to mitigate DoS via large bodies
app.use(bodyParser.json({ limit: '1mb' }));

app.post('/log', (req, res) => {
  // [INPUT] User input is received from request body
  const userInput = req.body;

  if (typeof userInput !== 'object' || userInput === null) {
    // [ERROR] Returns a safe, generic error message for invalid JSON input
    return res.status(400).json({ error: 'Invalid JSON input' });
  }

  const timestamp = new Date().toISOString();

  // [SANITIZE] Removes newline characters to prevent log injection
  const sanitizedInput = JSON.stringify(userInput)
    .replace(/[\r\n]/g, '');

  // [LOGGING] Logs structured data with sanitized input and timestamp
  logger.info({ timestamp, input: sanitizedInput });

  res.status(200).json({ status: 'Logged successfully' });
});

app.get('/', (req, res) => {
  res.send('Secure logging server is running.');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
