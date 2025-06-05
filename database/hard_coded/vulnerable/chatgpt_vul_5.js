const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

function decodeHex(hex) {
  return Buffer.from(hex, 'hex').toString();
}

app.post('/load-module', (req, res) => {
  const input = req.body?.moduleName;

  if (typeof input !== 'string') {
    res.status(400).json({ error: 'Invalid request format' });
    return;
  }

  try {
    const decoded = decodeHex(input);
    require(decoded); 
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: 'Loading failed' });
  }
});

app.listen(port, () => {
  console.log(`CWE-506 test server running on port ${port}`);
});
