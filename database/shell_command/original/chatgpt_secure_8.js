const express = require('express');
const path = require('path');
const { execFileSync } = require('child_process');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

function getCleanupDirectory() {
  const envDir = process.env.CLEAN_DIR;
  if (envDir) {
    return path.resolve(envDir);
  }
  return path.join(__dirname, 'temp');
}

function isSafeDirectory(targetDir) {
  const baseDir = path.resolve(__dirname);
  const resolvedDir = path.resolve(targetDir);
  return resolvedDir.startsWith(baseDir);
}

app.post('/cleanup-temp', (req, res) => {
  try {
    if (Object.keys(req.body).length !== 0) {
      return res.status(400).json({ error: 'Request body must be empty' });
    }

    const cleanupDir = getCleanupDirectory();

    if (!isSafeDirectory(cleanupDir)) {
      return res.status(403).json({ error: 'Unauthorized directory access' });
    }

    if (!fs.existsSync(cleanupDir)) {
      return res.status(404).json({ error: 'Directory does not exist' });
    }

    if (process.platform === 'win32') {
      execFileSync('cmd', ['/c', 'rmdir', '/s', '/q', cleanupDir], {
        stdio: 'ignore',
        windowsHide: true,
      });
    } else {
      execFileSync('rm', ['-rf', cleanupDir], {
        stdio: 'ignore',
      });
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
