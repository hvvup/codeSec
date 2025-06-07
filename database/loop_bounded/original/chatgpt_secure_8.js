const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const port = 3000;

app.use(helmet());

app.use(bodyParser.json());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,  max: 60,});
app.use(limiter);

app.post('/foo', (req, res) => {
  try {
    const inputData = req.body.data;
    if (!Array.isArray(inputData)) {
      return res.status(400).json({ error: 'Invalid data: expected an array' });
    }

    const limitedData = inputData.slice(0, 100);

    const processed = [];

    for (let i = 0; i < limitedData.length; i++) {
      const item = limitedData[i];

      if (typeof item !== 'string') {
        return res.status(400).json({ error: `Invalid item at index ${i}: must be a string` });
      }

      const result = item.trim().toUpperCase();
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
