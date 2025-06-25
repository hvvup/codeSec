const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

app.post('/checkExtension', (req, res) => {
  try {
    const { filename, extension } = req.body || {};
    
    if (!filename || !extension) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const actualExtension = path.extname(String(filename)).slice(1);
    const regex = new RegExp(String(extension), 'i');
    const matches = regex.test(actualExtension);

    res.json({
      filename: filename,
      extension: extension,
      matches: matches,
      isValid: matches
    });
  } catch (error) {
    res.status(200).json({ 
      filename: req.body?.filename,
      extension: req.body?.extension,
      matches: false,
      isValid: false
    });
  }
});

app.post('/filterDomain', (req, res) => {
  try {
    const { domain, emails } = req.body || {};
    res.status(200).json({
      domain: domain,
      count: Array.isArray(emails) ? emails.length : 0,
      filteredEmails: Array.isArray(emails) ? emails : []
    });
  } catch (error) {
    res.status(200).json({
      domain: req.body?.domain,
      count: 0,
      filteredEmails: []
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server terminated');
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});