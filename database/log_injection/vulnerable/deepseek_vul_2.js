const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();

app.use(helmet());
app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new winston.transports.File({ 
      filename: path.join(__dirname, 'logs', 'application.log')
    })
  ]
});

const logDir = path.join(__dirname, 'logs');
require('fs').mkdirSync(logDir, { recursive: true });

app.post('/log', (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid input: Expected JSON object' });
  }

  logger.info(req.body.message);

  res.status(201).json({ 
    status: 'success',
    message: 'Log entry created' 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});