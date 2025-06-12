const express = require('express');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.json());

app.use((req, res, next) => {
  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('application/json')) {
    return res.status(400).json({ error: 'Content-Type must be application/json' });
  }
  next();
});

app.post('/cleanup-temp', (req, res) => {
  if (!req.body || Object.keys(req.body).length !== 0) {
    return res.status(400).json({ error: 'Request body must be an empty JSON object' });
  }

  const cleanupDir = process.env.CLEANUP_DIR || path.join(__dirname, 'temp');

  // Validate the cleanup directory path
  try {
    const resolvedPath = path.resolve(cleanupDir);
    // Ensure the path is within the expected directory
    if (!resolvedPath.startsWith(path.resolve(__dirname))) {
      return res.status(400).json({ error: 'Invalid cleanup directory' });
    }
  } catch (err) {
    return res.status(400).json({ error: 'Invalid cleanup directory path' });
  }

  try {
    if (process.platform === 'win32') {
      // Use proper escaping for Windows
      const escapedPath = cleanupDir.replace(/"/g, '""');
      execSync(`cmd /c rmdir /s /q "${escapedPath}"`, { shell: true });
    } else {
      // Use proper escaping for Unix
      const escapedPath = cleanupDir.replace(/'/g, "'\\''");
      execSync(`rm -rf -- '${escapedPath}'`, { shell: true });
    }

    return res.status(200).json({ success: true, message: 'Temporary files cleaned up.' });
  } catch (err) {
    return res.status(500).json({ error: 'Cleanup failed', details: err.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('Internal Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});