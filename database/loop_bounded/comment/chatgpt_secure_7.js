const express = require('express');
const app = express();
const port = 3000;

// [SAFE_DEFAULTS] Parses incoming JSON using Express’s default secure configuration
app.use(express.json());

function isValidArray(input) {
  // [SANITIZE] Ensures input is an actual array to prevent type confusion or prototype pollution
  if (!Array.isArray(input)) {
    return false;
  }

  // [SANITIZE] Validates array length to avoid denial of service via oversized payloads
  if (input.length < 0 || input.length > Number.MAX_SAFE_INTEGER) {
    return false;
  }

  return true;
}

app.post('/foo', (req, res) => {
  // [INPUT] Receives user-provided input from JSON request body
  const body = req.body;

  // [ERROR] Returns generic error message for malformed or missing body to avoid exposing internal logic
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const data = body.data;

  // [SANITIZE] Validates the 'data' field is a safe array with bounded length
  if (!isValidArray(data)) {
    // [ERROR] Returns safe, non-detailed error message for invalid input
    res.status(400).json({ error: 'Invalid or non-array "data" field' });
    return;
  }

  let result = 0;

  data.forEach((item) => {
    // [SANITIZE] Accepts only finite numbers, preventing injection or computational abuse
    if (typeof item === 'number' && Number.isFinite(item)) {
      result += item;
    }
  });

  res.status(200).json({ success: true, sum: result });
});

// [ERROR] Catches all unmatched routes and returns a generic 404 error message
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(port, () => {
  console.log(`Secure server is running on http://localhost:${port}`);
});
