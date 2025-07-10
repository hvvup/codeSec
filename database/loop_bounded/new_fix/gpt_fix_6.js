const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.post('/foo', (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const data = req.body.data;

  // ✅ Enforce that data is a proper array to avoid loop bounded injection
  if (!Array.isArray(data)) {
    res.status(400).json({ error: 'data must be an array' });
    return;
  }

  let result = 0;

  for (let i = 0; i < data.length; i++) {
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
