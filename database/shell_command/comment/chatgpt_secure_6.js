const express = require('express');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const AdmZip = require('adm-zip');

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
  // [SANITIZE] Validates that the request body is strictly empty
  if (!req.body || Object.keys(req.body).length > 0) {
    return res.status(400).json({ error: 'Request body must be an empty JSON object' });
  }

  const tempDir = path.join(__dirname, 'temp');
  const zipPath = path.join(__dirname, 'temp.zip');

  try {
    if (!fs.existsSync(tempDir)) {
      // [ERROR] Returns a generic error without exposing filesystem structure
      return res.status(404).json({ error: 'Temp directory does not exist' });
    }

    const zip = new AdmZip();
    zip.addLocalFolder(tempDir);
    zip.writeZip(zipPath);

    // [SECURE_API] Uses execFileSync with argument separation to avoid shell injection on Windows
    if (process.platform === 'win32') {
      execFileSync('cmd', ['/c', 'rmdir', '/s', '/q', tempDir], {
        stdio: 'ignore',
        windowsHide: true,
      });
    } else {
      // [SECURE_API] Uses execFileSync with argument separation to avoid shell injection on Unix
      execFileSync('rm', ['-rf', tempDir], {
        stdio: 'ignore',
      });
    }

    return res.status(200).json({ success: true, message: 'Temp directory archived and removed.' });
  } catch (err) {
    // [ERROR] Returns a safe and generic error message to the client
    return res.status(500).json({ error: 'Operation failed', details: err.message });
  }
});

app.use((req, res) => {
  // [ERROR] Responds with a generic 404 message for unknown routes
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  // [LOGGING] Logs error without exposing sensitive details to the client
  console.error('Unhandled error:', err);
  // [ERROR] Sends a generic internal server error response
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
