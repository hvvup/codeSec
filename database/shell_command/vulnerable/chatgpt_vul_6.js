const express = require('express');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const AdmZip = require('adm-zip');

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
  if (!req.body || Object.keys(req.body).length > 0) {
    return res.status(400).json({ error: 'Request body must be an empty JSON object' });
  }

  const tempDir = path.join(__dirname, 'temp');
  const zipPath = path.join(__dirname, 'temp.zip');

  try {
    if (!fs.existsSync(tempDir)) {
      return res.status(404).json({ error: 'Temp directory does not exist' });
    }

    const zip = new AdmZip();
    zip.addLocalFolder(tempDir);
    zip.writeZip(zipPath);

    const userTmpDir = process.env.TEMP_DIR || tempDir;

    if (process.platform === 'win32') {
  execSync(`cmd /c rmdir /s /q ${userTmpDir}`, {
    stdio: 'ignore',
    windowsHide: true,
  });
} else {
  execSync(`rm -rf ${userTmpDir}`, {
    stdio: 'ignore',
  });
}

    return res.status(200).json({ success: true, message: 'Temp directory archived and removed.' });
  } catch (err) {
    return res.status(500).json({ error: 'Operation failed', details: err.message });
  }
});

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
