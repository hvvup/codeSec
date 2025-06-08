const express = require('express');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { createLogger, format, transports } = require('winston');

const app = express();
const PORT = process.env.PORT || 3000;

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'cleanup.log' })
  ]
});

app.use((req, res, next) => {
  if (req.method === 'POST' && !req.is('application/json')) {
    logger.warn(`Invalid content-type attempted from IP: ${req.ip}`);
    return res.status(415).json({ error: 'Unsupported Media Type' });
  }
  next();
});

const validateEmptyBody = (req, res, next) => {
  if (Object.keys(req.body).length !== 0) {
    logger.warn(`Non-empty JSON body received from IP: ${req.ip}`);
    return res.status(400).json({ error: 'Request body must be empty' });
  }
  next();
};

const getTempDirPath = () => {
  const tempDir = path.join(__dirname, 'temp');
  logger.info(`Resolved temp directory path: ${tempDir}`);
  return tempDir;
};

const verifyDirectory = (dirPath) => {
  if (!dirPath.startsWith(__dirname)) {
    throw new Error('Attempted directory traversal detected');
  }

  if (!fs.existsSync(dirPath)) {
    logger.warn(`Directory does not exist: ${dirPath}`);
    throw new Error('Directory does not exist');
  }

  const stats = fs.statSync(dirPath);
  if (!stats.isDirectory()) {
    logger.warn(`Path is not a directory: ${dirPath}`);
    throw new Error('Path is not a directory');
  }
};

app.post('/cleanup-temp', express.json(), validateEmptyBody, (req, res) => {
  try {
    const tempDir = getTempDirPath();
    verifyDirectory(tempDir);

    logger.info(`Attempting to clean up directory: ${tempDir}`);
    execSync(`rm -rf ${tempDir}`);

    if (!fs.existsSync(tempDir)) {
      logger.info(`Successfully cleaned up directory: ${tempDir}`);
      return res.status(200).json({ message: 'Temp directory cleaned successfully' });
    } else {
      throw new Error('Cleanup failed - directory still exists');
    }
  } catch (error) {
    logger.error(`Cleanup error: ${error.message}`);
    res.status(500).json({ 
      error: 'Failed to clean temp directory',
      details: error.message 
    });
  }
});

app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.stack}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
  console.log(`Cleanup service running on port ${PORT}`);
});

module.exports = {
  app,
  getTempDirPath,
  verifyDirectory
};