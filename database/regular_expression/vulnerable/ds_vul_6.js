const express = require('express');
const path = require('path');
const { body, validationResult } = require('express-validator');

const app = express();
app.use(express.json());

app.post('/checkExtension', (req, res) => {
  try {
    const { filename, extension } = req.body;
    
    if (!filename || !extension) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const actualExtension = path.extname(filename).slice(1);
    const regex = new RegExp(`^${extension}$`, 'i');
    const matches = regex.test(actualExtension);

    res.json({
      filename: filename,
      extension: extension,
      matches,
      isValid: matches
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;