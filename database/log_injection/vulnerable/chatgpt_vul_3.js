const express = require('express');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

const logFilePath = path.join(logDirectory, 'user_input.log');
const logger = pino(pino.destination({ dest: logFilePath, sync: false }));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/log', (req, res) => {
  const userInput = req.body.input;
  if (typeof userInput !== 'string') {
    return res.status(400).json({ error: 'Input must be a string' });
  }

  logger.info(userInput);
  res.status(200).json({ status: 'Logged successfully' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
