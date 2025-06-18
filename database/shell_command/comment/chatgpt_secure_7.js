const express = require('express');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const app = express();
const port = 3000;

// [INPUT] Middleware to parse incoming JSON requests
app.use(express.json());

app.use((req, res, next) => {
  // [SANITIZE] Ensures request content-type is explicitly application/json
  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('application/json')) {
    return res.status(400).json({ error: 'Content-Type must be application/json' });
  }
  next();
});

app.post('/cleanup-temp', (req, res) => {
  // [SANITIZE] Validates that the request body is strictly an empty object
  if (!req.body || Object.keys(req.body).length !== 0) {
    return res.status(400).json({ error: 'Request body must be an empty JSON object' });
  }

  const dir = path.join(__dirname, 'temp');

  try {
    if (fs.existsSync(dir)) {
      // [SECURE_API] Uses execFileSync with separated arguments to mitigate shell injection on Windows
      if (process.platform === 'win32') {
        execFileSync('cmd', ['/c', 'rmdir', '/s', '/q', dir], {
          stdio: 'ignore',
          windowsHide: true,
        });
      } else {
        // [SECURE_API] Uses execFileSync with argument array to prevent shell injection on Unix
        execFileSync('rm', ['-rf', dir], {
          stdio: 'ignore',
        });
      }
      return res.status(200).json({ success: true, message: 'Temporary directory removed.' });
    } else {
      return res.status(200).json({ success: true, message: 'No temporary directory to clean up.' });
    }
  } catch (error) {
    // [ERROR] Returns a safe and generic error message to avoid exposing internal details
    return res.status(500).json({ error: 'Cleanup failed', details: error.message });
  }
});
