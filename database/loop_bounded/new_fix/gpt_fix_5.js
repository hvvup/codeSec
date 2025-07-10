const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.post('/foo', (req, res) => {
  const body = req.body;

  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  const data = body.data;

  if (!Array.isArray(data)) {
    res.status(400).json({ error: 'Invalid data: must be an array' });
    return;
  }

  let result = 0;

  for (let i = 0; i < data.length; i++) {
    const value = data[i];
    if (typeof value === 'number' && Number.isFinite(value)) {
      result += value;
    }
  }

  res.status(200).json({ success: true, sum: result });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
