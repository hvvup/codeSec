// server.js

const express = require('express');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

function getCleanupDirectory() {
  return process.env.CLEAN_DIR || path.join(__dirname, 'temp');
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

    // Vulnerable: uses shell with environment value
    execSync(`rm -rf ${cleanupDir}`);

    return res.json({ status: 'Directory cleaned successfully' });
  } catch (err) {
    console.error('Cleanup failed:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Secure cleanup server running at http://localhost:${PORT}`);
});
