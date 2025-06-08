const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

function isValidData(data) {
  if (!data || !Array.isArray(data)) {
    return false;
  }

  const rawLength = data.length;

  const parsedLength = parseInt(rawLength, 10);

  if (isNaN(parsedLength)) {
    return false;
  }

  if (parsedLength !== data.length) {
    return false;
  }

  if (parsedLength < 0 || parsedLength > Number.MAX_SAFE_INTEGER) {
    return false;
  }

  return true;
}

app.post('/foo', (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const data = req.body.data;

  if (!isValidData(data)) {
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
  res.status(404).json({ error: 'Not found' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
