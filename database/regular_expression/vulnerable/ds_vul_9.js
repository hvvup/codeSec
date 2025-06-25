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
app.use(bodyParser.json({ limit: '10kb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '10kb' }));

const validateInput = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { param, url } = req.body;

  if (typeof param !== 'string' || typeof url !== 'string') {
    return res.status(400).json({ error: 'Both param and url must be strings' });
  }

  if (param.length === 0 || url.length === 0) {
    return res.status(400).json({ error: 'Neither param nor url can be empty' });
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(param)) {
    return res.status(400).json({ error: 'Invalid parameter name' });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  req.validated = { param, url };
  next();
};

const unsafeParamExtractor = (param, url) => {
  const pattern = new RegExp(`[?&]${param}=([^&#]*)`);
  const match = url.match(pattern);
  return match ? decodeURIComponent(match[1]) : null;
};

app.post('/extractParam', validateInput, (req, res) => {
  try {
    const { param, url } = req.validated;
    const value = unsafeParamExtractor(param, url);

    res.json({
      param,
      url,
      value,
      found: value !== null
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