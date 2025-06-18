const express = require('express');
const app = express();
const port = 3000;

// [SAFE_DEFAULTS] Enables built-in JSON parsing with safe defaults
app.use(express.json());

function isValidData(data) {
  // [SANITIZE] Validates that data is a non-null array
  if (!data || !Array.isArray(data)) {
    return false;
  }

  const rawLength = data.length;

  const parsedLength = parseInt(rawLength, 10);

  // [SANITIZE] Ensures parsed length is a valid number
  if (isNaN(parsedLength)) {
    return false;
  }

  // [SANITIZE] Ensures parsed length matches actual array length to detect tampering
  if (parsedLength !== data.length) {
    return false;
  }

  // [SANITIZE] Checks that the array length is within safe numeric bounds
  if (parsedLength < 0 || parsedLength > Number.MAX_SAFE_INTEGER) {
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
