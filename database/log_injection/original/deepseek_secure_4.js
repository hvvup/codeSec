const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const LOG_FILE = 'user_input.log';

app.use(express.json({ limit: '10kb' }));app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  if (req.method === 'POST' && !req.is('application/json')) {
    return res.status(415).send('Unsupported Media Type: JSON expected');
  }
  next();
});

async function secureWriteToFile(data) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      id: uuidv4(),
      timestamp,
      data,
      ip: this.ip    };

    const logString = JSON.stringify(logEntry) + '\n';

    await fs.promises.appendFile(
      path.join(__dirname, LOG_FILE),
      logString,
      { flag: 'a', encoding: 'utf8' }
    );

    return true;
  } catch (error) {
    console.error('Failed to write to log file:', error);
    return false;
  }
}

app.post('/log', async (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).send('Invalid input: expected JSON object');
  }

  try {
    const writeWithContext = secureWriteToFile.bind({ ip: req.ip });
    
    const success = await writeWithContext(req.body);
    
    if (success) {
      res.status(201).send('Input logged successfully');
    } else {
      res.status(500).send('Failed to log input');
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('An unexpected error occurred');
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Logging to file: ${path.join(__dirname, LOG_FILE)}`);
  });
}

module.exports = app;