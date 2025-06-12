const express = require('express');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const AdmZip = require('adm-zip');

const app = express();
const port = 3000;

// Security middleware
app.use(express.json({ limit: '1kb' })); // Limit JSON payload size

// Content-Type validation middleware
app.use((req, res, next) => {
  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('application/json')) {
    return res.status(400).json({ error: 'Content-Type must be application/json' });
  }
  next();
});

// Secure directory validation function
const validateDirectory = (dirPath) => {
  try {
    const resolvedPath = path.resolve(dirPath);
    const appRoot = path.resolve(__dirname);
    
    // Prevent directory traversal and ensure path is within application root
    if (!resolvedPath.startsWith(appRoot)) {
      throw new Error('Path traversal attempt detected');
    }
    
    // Prevent common dangerous patterns
    if (resolvedPath.includes('..') || resolvedPath.includes('//')) {
      throw new Error('Invalid path pattern');
    }
    
    return resolvedPath;
  } catch (err) {
    throw new Error(`Path validation failed: ${err.message}`);
  }
};

app.post('/cleanup-temp', (req, res) => {
  if (!req.body || Object.keys(req.body).length > 0) {
    return res.status(400).json({ error: 'Request body must be an empty JSON object' });
  }

  const tempDir = path.join(__dirname, 'temp');
  const zipPath = path.join(__dirname, 'temp.zip');

  try {
    // Validate temp directory exists
    if (!fs.existsSync(tempDir)) {
      return res.status(404).json({ error: 'Temp directory does not exist' });
    }

    // Create zip archive
    const zip = new AdmZip();
    zip.addLocalFolder(tempDir);
    zip.writeZip(zipPath);

    // Get and validate temp directory
    let userTmpDir;
    try {
      userTmpDir = validateDirectory(process.env.TEMP_DIR || tempDir);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    // Secure directory removal
    try {
      // Primary method: Use Node's filesystem API
      fs.rmSync(userTmpDir, { recursive: true, force: true, maxRetries: 3 });
    } catch (fsErr) {
      console.warn(`Filesystem removal failed, falling back to shell: ${fsErr.message}`);
      
      // Secondary method: Securely constructed shell command
      try {
        if (process.platform === 'win32') {
          execSync(`cmd /c rmdir /s /q "${userTmpDir.replace(/"/g, '""')}"`, {
            stdio: 'ignore',
            windowsHide: true,
            shell: true,
            timeout: 5000 // 5 second timeout
          });
        } else {
          execSync(`/bin/rm -rf -- "${userTmpDir.replace(/"/g, '\\"')}"`, {
            stdio: 'ignore',
            shell: false, // Don't use system shell
            timeout: 5000 // 5 second timeout
          });
        }
      } catch (execErr) {
        throw new Error(`Both removal methods failed: ${fsErr.message}, ${execErr.message}`);
      }
    }

    return res.status(200).json({ success: true, message: 'Temp directory archived and removed.' });
  } catch (err) {
    console.error('Cleanup error:', err);
    return res.status(500).json({ error: 'Operation failed', details: err.message });
  }
});

// Error handling middleware
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});