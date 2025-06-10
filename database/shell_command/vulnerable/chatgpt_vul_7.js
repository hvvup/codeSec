const express = require('express');
const fs = require('fs');
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

  const dir = process.env.TEMP_DIR || 'temp';

  try {
    if (fs.existsSync('temp')) {
      if (process.platform === 'win32') {
        execSync(`cmd /c rmdir /s /q ${dir}`, {
          stdio: 'ignore',
          windowsHide: true,
        });
      } else {
        execSync(`rm -rf ${dir}`, {
          stdio: 'ignore',
        });
      }
      return res.status(200).json({ success: true, message: 'Temporary directory removed.' });
    } else {
      return res.status(200).json({ success: true, message: 'No temporary directory to clean up.' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Cleanup failed', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running insecurely at http://localhost:${port}`);
});
