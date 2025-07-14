const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const port = 3000;

app.use(helmet());
app.use(bodyParser.json());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
});
app.use(limiter);

app.post('/foo', (req, res) => {
  try {
    const inputData = req.body.data;

    // ✅ Enforce that inputData is an array to prevent loop bounded injection
    if (!Array.isArray(inputData)) {
      return res.status(400).json({ error: 'Invalid input: expected an array' });
    }

    const processed = [];

    for (let i = 0; i < inputData.length; i++) {
      const item = inputData[i];

      const result = String(item).trim().toUpperCase();
      processed.push(result);
    }

    res.status(200).json({ result: processed });
  } catch (err) {
    console.error('Internal server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Secure Express server listening on port ${port}`);
});
