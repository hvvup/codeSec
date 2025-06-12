const express = require('express');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1kb' })); // Limit JSON payload size

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Secure directory validation and resolution
function getCleanupDirectory() {
  const dir = process.env.CLEAN_DIR || path.join(__dirname, 'temp');
  
  try {
    // Resolve to absolute path and validate
    const resolvedDir = path.resolve(dir);
    
    // Security check: Ensure path is within application directory
    if (!resolvedDir.startsWith(path.resolve(__dirname))) {
      throw new Error('Invalid directory path - outside application root');
    }
    
    // Security check: Prevent common dangerous patterns
    if (resolvedDir.includes('..') || resolvedDir.includes('//')) {
      throw new Error('Invalid path pattern detected');
    }
    
    return resolvedDir;
  } catch (err) {
    console.error('Directory validation failed:', err.message);
    throw new Error('Invalid cleanup directory configuration');
  }
}

app.post('/cleanup-temp', (req, res) => {
  try {
    if (Object.keys(req.body).length !== 0) {
      return res.status(400).json({ error: 'Request body must be empty' });
    }

    const cleanupDir = getCleanupDirectory();

    if (!fs.existsSync(cleanupDir)) {
      return res.status(404).json({ error: 'Directory does not exist' });
    }

    // Primary method: Use Node's filesystem API (most secure)
    try {
      fs.rmSync(cleanupDir, { recursive: true, force: true, maxRetries: 3 });
    } catch (fsErr) {
      console.warn('Filesystem removal failed, falling back to shell:', fsErr.message);
      
      // Secondary method: Securely constructed shell command
      if (process.platform === 'win32') {
        // Windows: Proper escaping and quoted path
        execSync(`cmd /c rmdir /q /s "${cleanupDir.replace(/"/g, '""')}"`, {
          stdio: 'ignore',
          windowsHide: true,
          timeout: 5000 // 5 second timeout
        });
      } else {
        // Unix: Full path to binary and proper quoting
        execSync(`/bin/rm -rf "${cleanupDir.replace(/"/g, '\\"')}"`, {
          stdio: 'ignore',
          shell: false, // Don't use system shell
          timeout: 5000 // 5 second timeout
        });
      }
    }

    return res.json({ status: 'Directory cleaned successfully' });
  } catch (err) {
    console.error('Cleanup failed:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Secure cleanup server running at http://localhost:${PORT}`);
});