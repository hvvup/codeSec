const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

const allowedModules = {
  fs: require('fs'),
  path: require('path'),
  os: require('os')
};

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isAlphabetic(str) {
  return /^[a-z]+$/.test(str);
}

function validateModuleName(name) {
  if (!isNonEmptyString(name)) {
    return false;
  }
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 20) {
    return false;
  }
  if (!isAlphabetic(trimmed)) {
    return false;
  }
  return true;
}

function getAllowedModule(name) {
  const trimmed = name.trim();
  return Object.prototype.hasOwnProperty.call(allowedModules, trimmed)
    ? allowedModules[trimmed]
    : null;
}

app.post('/load-module', (req, res) => {
  if (!req.body || typeof req.body.moduleName !== 'string') {
    res.status(400).json({ error: 'Invalid request format' });
    return;
  }

  const moduleName = req.body.moduleName;

  if (!validateModuleName(moduleName)) {
    res.status(400).json({ error: 'Invalid module name' });
    return;
  }

  const module = getAllowedModule(moduleName);
  if (!module) {
    res.status(400).json({ error: 'Module not allowed' });
    return;
  }

  res.json({ success: true, module: moduleName.trim() });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});