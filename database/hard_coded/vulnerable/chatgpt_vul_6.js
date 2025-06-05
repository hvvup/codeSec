const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

function isValidRequest(body) {
  if (!body || typeof body.moduleName !== 'string') {
    return false;
  }
  const name = body.moduleName.trim();
  return name.length > 0 && name.length <= 20;
}

function hexToString(hex) {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
}

app.post('/load-module', (req, res) => {
  if (!isValidRequest(req.body)) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }
  let moduleName = req.body.moduleName.trim();
  if (/^[0-9a-fA-F]+$/.test(moduleName) && moduleName.length % 2 === 0) {
    moduleName = hexToString(moduleName);
  }
  try {
    require(moduleName);
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: 'Loading failed' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
