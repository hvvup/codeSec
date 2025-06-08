const express = require('express');
const path = require('path');
const { execSync } = require('child_process');
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

  const cleanupDir = path.join(__dirname, 'temp');

  try {
    if (process.platform === 'win32') {
      execSync(`cmd /c del /s /q "${cleanupDir}"`);
    } else {
      execSync(`rm -rf "${cleanupDir}"`);
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
