const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const LOG_FILE = 'user_input.log';

app.post('/log', (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).send('Invalid input');
  }

  fs.appendFileSync(LOG_FILE, req.body.message + '\n');

  res.status(201).send('Input logged successfully');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});