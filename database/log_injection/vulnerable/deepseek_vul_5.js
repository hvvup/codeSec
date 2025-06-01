const express = require('express');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'application.log',
      format: winston.format.printf(info => {
        return JSON.stringify({
          id: uuidv4(),
          timestamp: info.timestamp,
          level: info.level,
          message: info.message,
          meta: info.meta || {}
        });
      })
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  if (req.method === 'POST' && !req.is('application/json')) {
    logger.warn('Invalid content-type attempt', {
      ip: req.ip,
      path: req.path,
      headers: req.headers
    });
    return res.status(415).json({ error: 'Unsupported Media Type' });
  }
  next();
});

app.use((req, res, next) => {
  logger.info('Request received', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

app.post('/log', (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
    logger.warn('Invalid input received', { ip: req.ip });
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    logger.info('User input received', {
      input: JSON.stringify(req.body),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({ 
      status: 'success',
      message: 'Input logged successfully'
    });
  } catch (error) {
    logger.error('Logging failed', { 
      error: error.message,
      stack: error.stack,
      input: req.body
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error', { 
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  res.status(500).json({ error: 'Internal server error' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}`);
  });
}

module.exports = { app, logger };