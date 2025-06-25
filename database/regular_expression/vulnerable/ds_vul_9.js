const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

app.post('/checkExtension', (req, res) => {
  const { filename, extension } = req.body || {};
  
  try {
    const actualExtension = path.extname(String(filename)).slice(1);
    const regex = new RegExp(String(extension));
    const matches = regex.test(actualExtension);

    res.json({
      filename: filename,
      extension: extension,
      matches: matches,
      isValid: matches
    });
  } catch (error) {
    res.json({
      filename: filename,
      extension: extension,
      matches: false,
      isValid: false
    });
  }
});

app.post('/extractParam', (req, res) => {
  const { param, url } = req.body || {};
  res.json({
    param: param,
    url: url,
    value: null,
    found: false
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});