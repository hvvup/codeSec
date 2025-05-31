const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

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

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: path.join(__dirname, 'logs', 'application.log'),
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(__dirname, 'logs', 'rejections.log') 
    })
  ]
});

// Ensure log directory exists
const logDir = path.join(__dirname, 'logs');
require('fs').mkdirSync(logDir, { recursive: true });

// Middleware to log requests
app.use((req, res, next) => {
  logger.info({
    message: 'Request received',
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// Log endpoint
app.post('/log', (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    logger.warn('Invalid input received');
    return res.status(400).json({ error: 'Invalid input: Expected JSON object' });
  }

  const logEntry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    data: req.body,
    ip: req.ip
  };

  logger.info('New log entry', logEntry);

  res.status(201).json({ 
    status: 'success', 
    logId: logEntry.id,
    message: 'Log entry created' 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Server error', { 
    error: err.message, 
    stack: err.stack,
    path: req.path 
  });
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
  logger.error('Unhandled rejection', { reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});