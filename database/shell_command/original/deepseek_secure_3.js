const express = require('express');
const path = require('path');
const { spawnSync } = require('child_process');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '1kb' })); // Limit JSON payload size

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per window
  message: 'Too many cleanup requests from this IP, please try again later'
});
app.use('/cleanup-temp', limiter);

// Request validation middleware
const validateCleanupRequest = (req, res, next) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (Object.keys(req.body).length !== 0) {
    return res.status(400).json({ error: 'Request body must be empty' });
  }

  next();
};

// Logging middleware
const requestLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
};
app.use(requestLogger);

// Cleanup endpoint
app.post('/cleanup-temp', validateCleanupRequest, (req, res) => {
  try {
    const tempDir = path.resolve(__dirname, 'temp');
    
    // Verify the directory exists before attempting deletion
    if (!fs.existsSync(tempDir)) {
      return res.status(404).json({ error: 'Temp directory not found' });
    }

    // Security check: ensure we're not deleting something outside our intended scope
    const dirCheck = path.normalize(tempDir);
    if (!dirCheck.startsWith(path.resolve(__dirname))) {
      return res.status(403).json({ error: 'Invalid directory path' });
    }
    //수정--추가가
    const isWindows = process.platform === 'win32';
    const deleteCommand = isWindows ? 'cmd' : 'rm';
    const deleteArgs = isWindows
      ? ['/c', 'rmdir', '/s', '/q', tempDir] // Windows용
      : ['-rf', tempDir];                   // Linux/macOS용

    const result = spawnSync(deleteCommand, deleteArgs, {
      stdio: 'pipe',
      shell: false
    });

    // // Perform the deletion
    // const result = spawnSync('rm', ['-rf', tempDir], {
    //   stdio: 'pipe',
    //   shell: false // Critical security setting
    // });

    if (result.status !== 0) {
      // const error = result.stderr ? result.stderr.toString() : 'Unknown error during cleanup';

      // 수정 코드 -- 추가가
      let error = 'Unknown error during cleanup';
      
      if (result.stderr && result.stderr.length > 0) {
        error = result.stderr.toString();
      } else if (result.error) {
        error = result.error.message;
      }

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`Unhandled error: ${err.stack}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Temp directory location: ${path.resolve(__dirname, 'temp')}`);
});

// Export for testing purposes
module.exports = app;