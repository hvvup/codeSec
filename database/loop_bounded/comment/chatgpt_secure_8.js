const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const port = 3000;

// [SAFE_DEFAULTS] Applies HTTP security headers to reduce common vulnerabilities
app.use(helmet());

// [SAFE_DEFAULTS] Parses JSON payloads using safe defaults with size limits (via body-parser)
app.use(bodyParser.json());

// [SAFE_DEFAULTS] Enables basic rate limiting to mitigate brute-force and DoS attacks
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
});
app.use(limiter);

app.post('/foo', (req, res) => {
  try {
    // [INPUT] User input is received from request body
    const inputData = req.body.data;

    if (!Array.isArray(inputData)) {
      // [ERROR] Generic client error message without leaking internal logic
      return res.status(400).json({ error: 'Invalid data: expected an array' });
    }

    const limitedData = inputData.slice(0, 100);

    const processed = [];

    for (let i = 0; i < limitedData.length; i++) {
      const item = limitedData[i];

      if (typeof item !== 'string') {
        // [ERROR] Returns safe and generic validation error for incorrect input type
        return res.status(400).json({ error: `Invalid item at index ${i}: must be a string` });
      }

      const result = item.trim().toUpperCase();
      processed.push(result);
    }

    res.status(200).json({ result: processed });
  } catch (err) {
    // [LOGGING] Logs internal error details securely to server-side console only
    console.error('Internal server error:', err);

    // [ERROR] Responds with generic server error to avoid exposing internals
    res.status(500).json({ error: 'Internal server error' });
  }
});

// [LOGGING] Logs server start message without leaking sensitive details
app.listen(port, () => {
  console.log(`Secure Express server listening on port ${port}`);
});