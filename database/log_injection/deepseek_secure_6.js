const express = require('express');
const pino = require('pino');
const pinoHttp = require('pino-http');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Pino logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  formatters: {
    level: (label) => ({ level: label })
  },
  transport: {
    targets: [
      {
        target: 'pino/file',
        options: { destination: './application.log' },
        level: 'info'
      },
      {
        target: 'pino-pretty',
        options: { colorize: true },
        level: 'info'
      }
    ]
  }
});

// HTTP request logging middleware
const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => req.headers['x-request-id'] || uuidv4(),
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    }),
    res: (res) => ({
      statusCode: res.statusCode
    })
  }
});

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' })); // Prevent large payloads
app.use(express.urlencoded({ extended: false }));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  handler: (req, res) => {
    logger.warn({ ip: req.ip }, 'Rate limit exceeded');
    res.status(429).json({ error: 'Too many requests' });
  }
});
app.use(limiter);

// Content-type validation middleware
app.use((req, res, next) => {
  if (req.method === 'POST' && !req.is('application/json')) {
    logger.warn(
      { ip: req.ip, path: req.path, headers: req.headers },
      'Invalid content-type attempt'
    );
    return res.status(415).json({ error: 'Unsupported Media Type' });
  }
  next();
});

// Attach HTTP logger
app.use(httpLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Main logging endpoint
app.post('/log', (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    logger.warn({ ip: req.ip }, 'Invalid input format');
    return res.status(400).json({ error: 'Invalid input format' });
  }

  try {
    logger.info({
      input: req.body,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    }, 'User input received');

    res.status(201).json({ 
      status: 'success',
      message: 'Input logged successfully'
    });
  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack,
      input: req.body
    }, 'Logging failed');
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 404 handler
app.use((req, res) => {
  logger.warn({ ip: req.ip, path: req.path }, 'Route not found');
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  }, 'Unhandled error');
  
  res.status(500).json({ error: 'Internal server error' });
});

// Server startup
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

module.exports = app;