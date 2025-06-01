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
const logger = pino(
  pino.destination({ dest: logFilePath, sync: false })
);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(bodyParser.json({ limit: '1mb' }));

app.post('/log', (req, res) => {
  const userInput = req.body;

  if (typeof userInput !== 'object' || userInput === null) {
    return res.status(400).json({ error: 'Invalid JSON input' });
  }

  const timestamp = new Date().toISOString();
  logger.info({ timestamp, input: JSON.stringify(userInput) });

  res.status(200).json({ status: 'Logged successfully' });
});

app.get('/', (req, res) => {
  res.send('Secure logging server is running.');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
