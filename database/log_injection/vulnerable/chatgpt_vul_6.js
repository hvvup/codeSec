const express = require('express');
const pino = require('pino');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

const logDirectory = path.join(__dirname, 'logs');
const logFile = path.join(logDirectory, 'app.log');

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

const destination = pino.destination({ dest: logFile, sync: false });
const logger = pino({}, destination);

app.use(express.json());

app.post('/log', (req, res) => {
  const userInput = req.body.input;
  if (typeof userInput !== 'string') {
    return res.status(400).json({ error: 'Input must be a string' });
  }

  destination.write(`${userInput}\n`);  // <-- raw write, direct injection point

  res.json({ status: 'Logged successfully' });
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
