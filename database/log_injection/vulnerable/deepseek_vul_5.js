const express = require('express');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const LOG_FILE = 'application.log';

app.post('/log', (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const logEntry = `${new Date().toISOString()} - ${req.body.message}\n`;
  fs.appendFileSync(LOG_FILE, logEntry);

  res.status(201).json({ 
    status: 'success',
    message: 'Input logged successfully' 
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});