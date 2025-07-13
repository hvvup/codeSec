const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const validator = require('validator');

const app = express();
app.use(helmet());
app.disable('x-powered-by');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);
app.use(bodyParser.json({ limit: '10kb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '10kb' }));

// Escape special characters for RegExp
const escapeRegExp = (str) => {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const validateInput = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { text, idPattern } = req.body;

  if (typeof text !== 'string' || typeof idPattern !== 'string') {
    return res.status(400).json({ error: 'Both text and idPattern must be strings' });
  }

  if (text.length > 10000 || idPattern.length > 100) {
    return res.status(400).json({ error: 'Input too long' });
  }

  if (!validator.isAlphanumeric(idPattern.replace(/_/g, ''))) {
    return res.status(400).json({ error: 'Invalid idPattern format' });
  }

  req.validated = { text, idPattern };
  next();
};

const safePatternMatcher = (text, idPattern) => {
  const escapedPattern = escapeRegExp(idPattern);
  const regex = new RegExp(`id=${escapedPattern}(?:\\b|$)`, 'i');
  return regex.test(text);
};

app.post('/matchId', validateInput, (req, res) => {
  try {
    const { text, idPattern } = req.validated;
    const isMatch = safePatternMatcher(text, idPattern);

    res.json({
      match: isMatch,
      textLength: text.length,
      idPattern,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server terminated');
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

module.exports = app;
