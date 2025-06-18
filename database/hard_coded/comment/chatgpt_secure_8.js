const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Only allow these exact module names
const allowedModules = ['fs', 'path', 'os'];

// [SAFE_DEFAULTS] Use body-parser middleware to safely parse JSON bodies
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

  // [SANITIZE] Detects and rejects hex-encoded strings to prevent obfuscated input
  if (isHexEncoded(input)) return true;

  // [SANITIZE] Detects and rejects base64-encoded strings to prevent obfuscated input
  if (isBase64Encoded(input)) return true;

  // [SANITIZE] Detects and rejects Unicode escape sequences to prevent obfuscated input
  if (containsUnicodeEscape(input)) return true;

  return false;
}

app.post('/load-module', (req, res) => {
  // [INPUT] Receiving user input from request body

  const moduleName = req.body.moduleName;

  if (typeof moduleName !== 'string') {
    // [ERROR] Return generic error message for invalid input type
    return res.status(400).json({ error: 'Invalid moduleName type' });
  }

  if (isObfuscated(moduleName)) {
    // [ERROR] Reject obfuscated inputs with a generic error message
    return res.status(400).json({ error: 'Obfuscated input not allowed' });
  }

  if (!allowedModules.includes(moduleName)) {
    // [AUTHZ] Enforce strict whitelist authorization on allowed module names
    return res.status(403).json({ error: 'Module not allowed' });
  }

  // Dummy placeholder: module loading is not executed to prevent actual eval
  res.json({
    message: `Request accepted for module: ${moduleName}`
  });
});

// Catch-all 404 handler
app.use((req, res) => {
  // [ERROR] Generic error message for undefined routes without leaking server info
  res.status(404).json({ error: 'Endpoint not found' });
});

// Generic error handler
app.use((err, req, res, next) => {
  // [LOGGING] Logs error internally without exposing details to client
  console.error('Server error:', err);
  // [ERROR] Return generic 500 error message to client
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Secure server listening on port ${PORT}`);
});
