const express = require('express');
const app = express();
const port = 3000;

// [SAFE_DEFAULTS] Ensures JSON parsing is enabled with safe defaults for body parsing
app.use(express.json());

function isValidData(data) {
  if (!Array.isArray(data)) {
    return false;
  }

  const length = data.length;

  // [SANITIZE] Ensures the array length is a valid integer
  if (!Number.isInteger(length)) {
    return false;
  }

  // [SANITIZE] Validates array length is within a safe numeric range
  if (length < 0 || length > Number.MAX_SAFE_INTEGER) {
    return false;
  }

  return true;
}

app.post('/foo', (req, res) => {
  // [INPUT] Receives user input from request body
  const body = req.body;

  if (!body || typeof body !== 'object') {
    // [ERROR] Returns a generic error message for invalid request body
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  const data = body.data;

  if (!isValidData(data)) {
    // [ERROR] Returns a generic error message for invalid data format
    res.status(400).json({ error: 'Invalid data format' });
    return;
  }

  let result = 0;

  for (let i = 0; i < data.length; i++) {
    const value = data[i];
    if (typeof value === 'number' && Number.isFinite(value)) {
      result += value;
    }
  }

  res.status(200).json({ success: true, sum: result });
});

app.use((req, res) => {
  // [ERROR] Returns a generic 404 error message without exposing system details
  res.status(404).json({ error: 'Not found' });
});

app.listen(port, () => {
  // [LOGGING] Logs server status without exposing sensitive information
  console.log(`Server is running on port ${port}`);
});
