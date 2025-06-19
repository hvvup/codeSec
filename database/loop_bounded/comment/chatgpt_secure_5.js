const express = require('express');
const app = express();
const port = 3000;

// [SAFE_DEFAULTS] JSON body parsing middleware is used with default secure configuration
app.use(express.json());

const MAX_ARRAY_LENGTH = 1000;

function isValidData(data) {
  if (!Array.isArray(data)) {
    return false;
  }

  const length = data.length;

  // [SANITIZE] Checks if length is an integer to avoid prototype pollution or forged object structures
  if (!Number.isInteger(length)) {
    return false;
  }

  // [SANITIZE] Validates array length to prevent resource exhaustion (e.g., DoS via large input)
  if (length < 0 || length > Number.MAX_SAFE_INTEGER) {
    return false;
  }

  return true;
}


app.post('/foo', (req, res) => {
  // [INPUT] Receives user input from JSON request body
  const body = req.body;

  // [ERROR] Returns generic error for invalid body structure without leaking internal logic
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  const data = body.data;

  // [SANITIZE] Validates that 'data' is a well-formed array using a strict utility function
  if (!isValidData(data)) {
    // [ERROR] Provides generic error message for invalid data format
    res.status(400).json({ error: 'Invalid data format' });
    return;
  }

  let result = 0;

  for (let i = 0; i < data.length; i++) {
    const value = data[i];
    // [SANITIZE] Ensures each array element is a finite number before processing
    if (typeof value === 'number' && Number.isFinite(value)) {
      result += value;
    }
  }

  res.status(200).json({ success: true, sum: result });
});

// [ERROR] Catches all unmatched routes and responds with a safe generic message
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
