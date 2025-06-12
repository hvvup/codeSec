const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json({ limit: '1kb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many requests from this IP, please try again later'
});
app.use('/cleanup-temp', limiter);

const validateEmptyJson = [
  body().custom(body => {
    if (Object.keys(body).length !== 0) {
      throw new Error('Request body must be empty');
    }
    return true;
  })
];

app.post('/cleanup-temp', validateEmptyJson, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const tempDir = path.join(__dirname, 'temp');
  
  fs.access(tempDir, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ 
        error: 'Temporary directory not found',
        details: `Directory ${tempDir} does not exist`
      });
    }
      const command = os.platform() === 'win32'
      ? `rmdir /s /q "${tempDir}"`
      : `rm -rf "${tempDir}"`;

      exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Cleanup failed: ${error.message}`);
        return res.status(500).json({ 
          error: 'Cleanup failed',
          details: error.message
        });
      }

      if (stderr) {
        console.warn(`Cleanup stderr: ${stderr}`);
      }

      res.status(200).json({
        success: true,
        message: 'Temporary directory successfully deleted',
        directory: tempDir
      });
    });
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Temporary directory: ${path.join(__dirname, 'temp')}`);
  });
}

module.exports = app;