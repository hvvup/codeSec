const express = require('express');
const path = require('path');
const { body, validationResult } = require('express-validator');

const app = express();
app.use(express.json());

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.replace(/[^a-zA-Z0-9._-]/g, '');
};

const validateExtension = (extension) => {
  if (typeof extension !== 'string') return false;
  if (extension.length > 10) return false;
  return /^[a-zA-Z0-9]+$/.test(extension);
};

const validateFilename = (filename) => {
  if (typeof filename !== 'string') return false;
  if (filename.length > 255) return false;
  if (filename.includes('..')) return false;
  return /^[a-zA-Z0-9_\-][a-zA-Z0-9_\-\.]*$/.test(filename);
};

app.post('/checkExtension', [
  body('filename').custom(value => {
    if (!validateFilename(value)) throw new Error('Invalid filename');
    return true;
  }),
  body('extension').custom(value => {
    if (!validateExtension(value)) throw new Error('Invalid extension');
    return true;
  })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { filename, extension } = req.body;
    const sanitizedFilename = sanitizeInput(filename);
    const sanitizedExtension = sanitizeInput(extension);

    if (!sanitizedFilename || !sanitizedExtension) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const actualExtension = path.extname(sanitizedFilename).slice(1);
    const matches = actualExtension.toLowerCase() === sanitizedExtension.toLowerCase();

    res.json({
      filename: sanitizedFilename,
      extension: sanitizedExtension,
      matches,
      isValid: matches
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
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