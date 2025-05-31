const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pino = require('pino');
const pinoHttp = require('pino-http');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' })); // Limit JSON payload size

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// Configure Pino logger
const logDir = path.join(__dirname, 'logs');
const logFile = path.join(logDir, 'application.log');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  formatters: {
    level: (label) => ({ level: label })
  }
}, pino.destination({
  dest: logFile,
  minLength: 4096, // Buffer before writing
  sync: false // Asynchronous logging
}));

// HTTP request logging middleware
const httpLogger = pinoHttp({
  logger: logger,
  genReqId: (req) => req.headers['x-request-id'] || uuidv4(),
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        referer: req.headers['referer']
      },
      remoteAddress: req.ip
    }),
    res: (res) => ({
      statusCode: res.statusCode
    })
  }
});
app.use(httpLogger);

// Log endpoint
app.post('/log', (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    logger.warn({ 
      message: 'Invalid input received',
      body: req.body 
    });
    return res.status(400).json({ error: 'Invalid input: Expected JSON object' });
  }

  const logEntry = {
    id: uuidv4(),
    data: req.body,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  };

  logger.info(logEntry, 'New log entry received');

  res.status(201).json({ 
    status: 'success', 
    logId: logEntry.id,
    message: 'Log entry created' 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    statusCode: err.status || 500
  }, 'Server error');
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  logger.info('Server shutting down');
  server.close(() => {
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
});

process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught exception');
  process.exit(1);
});

// Log flush interval for production
setInterval(() => {
  logger.flush();
}, 10000).unref();