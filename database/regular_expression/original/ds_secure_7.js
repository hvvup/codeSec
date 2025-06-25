const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const validateInput = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { id, prefix } = req.body;

  if (typeof id !== 'string' || typeof prefix !== 'string') {
    return res.status(400).json({ error: 'Both id and prefix must be strings' });
  }

  if (id.length === 0 || prefix.length === 0) {
    return res.status(400).json({ error: 'Neither id nor prefix can be empty' });
  }

  req.validated = { id, prefix };
  next();
};

app.post('/checkIdPrefix', validateInput, (req, res) => {
  try {
    const { id, prefix } = req.validated;
    const startsWithPrefix = id.startsWith(prefix);
    
    res.json({
      result: startsWithPrefix,
      id: id,
      prefix: prefix,
      length: id.length,
      prefixLength: prefix.length
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