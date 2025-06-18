const express = require('express');
const app = express();
const port = 3000;

// [SAFE_DEFAULTS] Enables built-in JSON parsing with safe defaults
app.use(express.json());

const MAX_ARRAY_LENGTH = 1000;  // 실제 현실적인 제한값

function isValidData(data) {
  if (!Array.isArray(data)) {
    return false;
  }

  if (!Number.isInteger(data.length)) {
    return false;
  }

  if (data.length < 0 || data.length > MAX_ARRAY_LENGTH) {
    return false;
  }

  return true;
}

app.post('/foo', (req, res) => {
  // [INPUT] Receives user input from request body
  if (!req.body || typeof req.body !== 'object') {
    // [ERROR] Responds with a generic error message on invalid JSON
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const data = req.body.data;

  if (!isValidData(data)) {
    // [ERROR] Returns generic error for invalid or tampered input
    res.status(400).json({ error: 'Invalid or unparseable data.length' });
    return;
  }

  const length = parseInt(data.length, 10);
  let result = 0;

  for (let i = 0; i < length; i++) {
    const item = data[i];
    if (typeof item === 'number' && Number.isFinite(item)) {
      result += item;
    }
  }

  res.status(200).json({ success: true, sum: result });
});

app.use((req, res) => {
  // [ERROR] Sends generic 404 error without leaking information
  res.status(404).json({ error: 'Not found' });
});

// [LOGGING] Logs server status message without revealing sensitive data
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
