// server.js

const express = require('express');
const path = require('path');
const { execFileSync } = require('child_process');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000;

// Middleware to parse JSON body
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Function to resolve cleanup directory safely
function getCleanupDirectory() {
  const envDir = process.env.CLEAN_DIR;
  if (envDir) {
    // Resolve to absolute path for safety
    return path.resolve(envDir);
  }
  return path.join(__dirname, 'temp');
}

// Ensure cleanup directory is inside allowed base
function isSafeDirectory(targetDir) {
  const baseDir = path.resolve(__dirname);
  const resolvedDir = path.resolve(targetDir);
  return resolvedDir.startsWith(baseDir);
}

// POST /cleanup-temp endpoint
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

    // Execute rm -rf safely without shell interpretation
    execFileSync('rm', ['-rf', cleanupDir]);

    return res.json({ status: 'Directory cleaned successfully' });
  } catch (err) {
    console.error('Cleanup failed:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Secure cleanup server running at http://localhost:${PORT}`);
});
