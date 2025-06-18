const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Only allow these exact module names
const allowedModules = ['fs', 'path', 'os'];

app.use(bodyParser.json());

// Utility: Check if string is hex-encoded
function isHexEncoded(str) {
  return /^[0-9a-fA-F]+$/.test(str) && str.length >= 4;
}

// Utility: Check if string is base64 encoded
function isBase64Encoded(str) {
  return /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/.test(str);
}

// Utility: Check if string contains Unicode escapes (e.g., \u0066\u0073 for 'fs')
function containsUnicodeEscape(str) {
  return /\\u[0-9a-fA-F]{4}/.test(str);
}

// Utility: Validate input against known bad patterns
function isObfuscated(input) {
  if (!input || typeof input !== 'string') return true;

  // Disallow hex-encoded (like 6673 for 'fs')
  if (isHexEncoded(input)) return true;

  // Disallow base64 (like ZnM= for 'fs')
  if (isBase64Encoded(input)) return true;

  // Disallow any Unicode escape (like \u0066\u0073)
  if (containsUnicodeEscape(input)) return true;

  return false;
}

app.post('/load-module', (req, res) => {
  const moduleName = req.body.moduleName;

  if (typeof moduleName !== 'string') {
    return res.status(400).json({ error: 'Invalid moduleName type' });
  }

  if (isObfuscated(moduleName)) {
    return res.status(400).json({ error: 'Obfuscated input not allowed' });
  }

  if (!allowedModules.includes(moduleName)) {
    return res.status(403).json({ error: 'Module not allowed' });
  }

  // Dummy placeholder: module loading is not executed to prevent actual eval
  res.json({
    message: `Request accepted for module: ${moduleName}`
  });
});

// Catch-all 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Secure server listening on port ${PORT}`);
});
