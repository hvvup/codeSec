const express = require('express');
const pino = require('pino');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const LOG_FILE = path.join(__dirname, 'application.log');

app.use(express.json());

const logger = pino({
  transport: {
    target: 'pino/file',
    options: { destination: LOG_FILE }
  }
});

app.post('/log', (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  logger.info(req.body.message);

  res.status(201).json({ 
    status: 'success',
    message: 'Log entry created' 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});