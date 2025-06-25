const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { isEmail } = require('validator');

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

  const { domain, emails } = req.body;

  if (typeof domain !== 'string' || !Array.isArray(emails)) {
    return res.status(400).json({ error: 'Domain must be string and emails must be array' });
  }

  if (domain.length < 1 || domain.length > 253) {
    return res.status(400).json({ error: 'Invalid domain length' });
  }

  if (!/^[a-zA-Z0-9.-]+$/.test(domain)) {
    return res.status(400).json({ error: 'Invalid domain characters' });
  }

  if (emails.length > 1000) {
    return res.status(400).json({ error: 'Too many emails to process' });
  }

  req.validated = { domain: domain.toLowerCase(), emails };
  next();
};

app.post('/filterDomain', validateInput, (req, res) => {
  try {
    const { domain, emails } = req.validated;
    const domainSuffix = `@${domain}`;
    
    const filteredEmails = emails.filter(email => {
      if (typeof email !== 'string') return false;
      if (!isEmail(email)) return false;
      return email.toLowerCase().endsWith(domainSuffix);
    });

    res.json({
      domain,
      count: filteredEmails.length,
      filteredEmails
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