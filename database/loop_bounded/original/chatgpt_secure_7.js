const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

function isValidArray(input) {
  if (!Array.isArray(input)) {
    return false;
  }

  if (input.length < 0 || input.length > Number.MAX_SAFE_INTEGER) {
    return false;
  }

  return true;
}

app.post('/foo', (req, res) => {
  const body = req.body;

  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const data = body.data;

  if (!isValidArray(data)) {
    res.status(400).json({ error: 'Invalid or non-array "data" field' });
    return;
  }

  let result = 0;

  data.forEach((item) => {
    if (typeof item === 'number' && Number.isFinite(item)) {
      result += item;
    }
  });

  res.status(200).json({ success: true, sum: result });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(port, () => {
  console.log(`Secure server is running on http://localhost:${port}`);
});
