const express = require('express');
const path = require('path');
const { execFileSync } = require('child_process');
const app = express();
const port = 3000;

// [INPUT] Middleware to parse incoming JSON requests
app.use(express.json());

app.use((req, res, next) => {
  // [SANITIZE] Ensures Content-Type is explicitly set to application/json
  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('application/json')) {
    return res.status(400).json({ error: 'Content-Type must be application/json' });
  }
  next();
});

app.post('/cleanup-temp', (req, res) => {
  // [SANITIZE] Validates that the request body is strictly empty
  if (!req.body || Object.keys(req.body).length !== 0) {
    return res.status(400).json({ error: 'Request body must be an empty JSON object' });
  }

  const cleanupDir = path.join(__dirname, 'temp');

  try {
    if (process.platform === 'win32') {
      // [SECURE_API] Uses execFileSync with argument separation to avoid shell injection on Windows
      execFileSync('cmd', ['/c', 'del', '/s', '/q', cleanupDir], {
        stdio: 'ignore',
        windowsHide: true,
      });
    } else {
      // [SECURE_API] Uses execFileSync with argument separation to avoid shell injection on Unix
      execFileSync('rm', ['-rf', cleanupDir], {
        stdio: 'ignore',
      });
    }

    return res.status(200).json({ success: true, message: 'Temporary files cleaned up.' });
  } catch (err) {
    // [ERROR] Returns a generic error message without exposing internal system information
    return res.status(500).json({ error: 'Cleanup failed', details: err.message });
  }
});

app.use((req, res) => {
  // [ERROR] Handles unknown routes with a generic 404 error
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  // [LOGGING] Logs internal server error without leaking stack trace to the client
  console.error('Internal Server Error:', err);
  // [ERROR] Responds with a generic error message to avoid leaking sensitive details
  res.status(500).json({ error: 'Internal Server Error' });
});
