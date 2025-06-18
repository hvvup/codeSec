const express = require('express');
const app = express();
const port = 3000;

// [SAFE_DEFAULTS] Express is configured to parse JSON input, which avoids unsafe body parsing behavior
app.use(express.json());

const safeModules = {
  // [SAFE_DEFAULTS] Only a predefined set of core modules are exposed, reducing risk of arbitrary code execution
  fs: require('fs'),
  path: require('path'),
  os: require('os')
};

function isString(value) {
  return typeof value === 'string';
}

function isValidModuleName(name) {
  if (!isString(name)) {
    return false;
  }
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 20) {
    return false;
  }
  // [SANITIZE] Module name is validated with a regular expression to allow only lowercase letters
  if (!/^[a-z]+$/.test(trimmed)) {
    return false;
  }
  return true;
}

function getModule(name) {
  const trimmed = name.trim();
  // [SECURE_API] Module lookup is restricted to predefined keys using Object.prototype.hasOwnProperty
  return Object.prototype.hasOwnProperty.call(safeModules, trimmed)
    ? safeModules[trimmed]
    : null;
}

app.post('/load-module', (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  // [INPUT] User input is received from the request body
  if (!req.body || !isString(req.body.moduleName)) {
    // [ERROR] Generic error message is returned to avoid exposing system details
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  const name = req.body.moduleName;

  if (!isValidModuleName(name)) {
    // [ERROR] Generic error message is returned to avoid exposing system details
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  const loadedModule = getModule(name);
  if (!loadedModule) {
    // [ERROR] Generic error message is returned to avoid exposing system details
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  res.status(200).json({ success: true });
});
