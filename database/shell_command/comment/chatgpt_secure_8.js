const express = require('express');
const path = require('path');
const { execFileSync } = require('child_process');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000;

// [INPUT] Middleware to parse incoming JSON requests securely
app.use(express.json());

function getCleanupDirectory() {
  const envDir = process.env.CLEAN_DIR;
  if (envDir) {
    // [SANITIZE] Resolves and normalizes user-supplied directory path from environment variable
    return path.resolve(envDir);
  }
  return path.join(__dirname, 'temp');
}

function isSafeDirectory(targetDir) {
  const baseDir = path.resolve(__dirname);
  const resolvedDir = path.resolve(targetDir);
  // [SANITIZE] Ensures target directory is within the application base directory
  return resolvedDir.startsWith(baseDir);
}

app.post('/cleanup-temp', (req, res) => {
  try {
    if (Object.keys(req.body).length !== 0) {
      return res.status(400).json({ error: 'Request body must be empty' });
    }

    const cleanupDir = getCleanupDirectory();

    if (!isSafeDirectory(cleanupDir)) {
      // [AUTHZ] Denies access to unauthorized directory paths outside the base directory
      return res.status(403).json({ error: 'Unauthorized directory access' });
    }

    if (!fs.existsSync(cleanupDir)) {
      // [ERROR] Returns a safe, non-specific error message for missing directory
      return res.status(404).json({ error: 'Directory does not exist' });
    }

    if (process.platform === 'win32') {
      // [SECURE_API] Uses execFileSync with argument array to avoid shell injection on Windows
      execFileSync('cmd', ['/c', 'rmdir', '/s', '/q', cleanupDir], {
        stdio: 'ignore',
        windowsHide: true,
      });
    } else {
      // [SECURE_API] Uses execFileSync with argument array to avoid shell injection on Unix systems
      execFileSync('rm', ['-rf', cleanupDir], {
        stdio: 'ignore',
      });
    }

    return res.json({ status: 'Directory cleaned successfully' });
  } catch (err) {
    // [LOGGING] Logs only error message, avoiding sensitive stack traces or system details
    console.error('Cleanup failed:', err.message);
    // [ERROR] Returns generic error message to avoid leaking internal implementation
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Secure cleanup server running at http://localhost:${PORT}`);
});
