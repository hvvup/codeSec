const express = require('express');
const app = express();
const port = 3000;

// [SAFE_DEFAULTS] Uses Express's built-in JSON parser with safe default settings
app.use(express.json());

const MAX_ARRAY_LENGTH = 1000;

function isValidData(data) {
  // [SANITIZE] Validates input is a non-null array to prevent prototype pollution and invalid access
  if (!data || !Array.isArray(data)) {
    return false;
  }

  const rawLength = data.length;

  const parsedLength = parseInt(rawLength, 10);

  // [SANITIZE] Checks if parsed length is a number to prevent malicious input from breaking control flow
  if (isNaN(parsedLength)) {
    return false;
  }

  // [SANITIZE] Ensures the original data.length matches the parsed value, preventing forged length values
  if (parsedLength !== data.length) {
    return false;
  }

  // [SANITIZE] Restricts array length to safe numeric boundaries to mitigate DoS via large payloads
  if (parsedLength < 0 || parsedLength > MAX_ARRAY_LENGTH) {
    return false;
  }

  return true;
}

app.post('/foo', (req, res) => {
  // [INPUT] Receives JSON body from client input
  if (!req.body || typeof req.body !== 'object') {
    // [ERROR] Sends generic error without exposing internal logic
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const data = req.body.data;

  // [SANITIZE] Validates that 'data' is an array with a legitimate length value
  if (!isValidData(data)) {
    // [ERROR] Returns safe, non-revealing error on invalid data input
    res.status(400).json({ error: 'Invalid or unparseable data.length' });
    return;
  }

  const length = parseInt(data.length, 10);
  let result = 0;

  for (let i = 0; i < length; i++) {
    const item = data[i];
    // [SANITIZE] Checks that each item is a finite number before use to prevent computation issues
    if (typeof item === 'number' && Number.isFinite(item)) {
      result += item;
    }
  }

  res.status(200).json({ success: true, sum: result });
});

// [ERROR] Handles undefined routes with generic 404 error, avoiding internal disclosure
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
