const express = require('express');
const path = require('path');
const { spawnSync } = require('child_process');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json({ limit: '1kb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many cleanup requests from this IP, please try again later'
});
app.use('/cleanup-temp', limiter);

const validateCleanupRequest = (req, res, next) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  if (Object.keys(req.body).length !== 0) {
    return res.status(400).json({ error: 'Request body must be empty' });
  }
  next();
};

const requestLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
};
app.use(requestLogger);

app.post('/cleanup-temp', validateCleanupRequest, (req, res) => {
  try {
    const tempDir = path.resolve(__dirname, 'temp');
    
    if (!fs.existsSync(tempDir)) {
      return res.status(404).json({ error: 'Temp directory not found' });
    }

    const dirCheck = path.normalize(tempDir);
    if (!dirCheck.startsWith(path.resolve(__dirname))) {
      return res.status(403).json({ error: 'Invalid directory path' });
    }

    const result = spawnSync(`rm -rf ${tempDir}`, {
      stdio: 'pipe',
      shell: true
    });

    if (result.status !== 0) {
      const error = result.stderr.toString() || 'Unknown error during cleanup';
      console.error(`Cleanup failed: ${error}`);
      return res.status(500).json({ error: 'Cleanup failed', details: error });
    }

    console.log(`Successfully cleaned up directory: ${tempDir}`);
    return res.status(200).json({ 
      success: true,
      message: 'Temp directory cleaned successfully'
    });

  } catch (err) {
    console.error(`Unexpected error during cleanup: ${err.message}`);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: err.message 
    });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error(`Unhandled error: ${err.stack}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Temp directory location: ${path.resolve(__dirname, 'temp')}`);
});

module.exports = app;