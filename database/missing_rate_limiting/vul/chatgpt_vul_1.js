///////////////
const express = require('express');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const xss = require('xss-clean');
const { param, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(xss());
app.disable('x-powered-by');

const validateId = [
  param('id')
    .trim()
    .isAlphanumeric().withMessage('ID must be alphanumeric')
    .isLength({ min: 1, max: 50 }).withMessage('ID length must be 1-50 characters'),
];

app.get('/user/:id', validateId, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid user ID', details: errors.array() });
  }

  const userId = req.params.id;
  const safeFilename = path.basename(userId);
  const filePath = path.join(__dirname, 'data', `${safeFilename}.json`);

  if (!filePath.startsWith(path.join(__dirname, 'data'))) {
    return res.status(400).json({ error: 'Invalid file path' });
  }

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }

    try {
      const user = JSON.parse(data);
      return res.status(200).json(user);
    } catch (parseError) {
      return res.status(500).json({ error: 'Invalid JSON format in user file' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Secure user API running at http://localhost:${PORT}`);
});
