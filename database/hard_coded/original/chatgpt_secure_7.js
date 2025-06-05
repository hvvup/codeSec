const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

const safeModules = {
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
  if (!/^[a-z]+$/.test(trimmed)) {
    return false;
  }
  return true;
}

function getModule(name) {
  const trimmed = name.trim();
  return Object.prototype.hasOwnProperty.call(safeModules, trimmed)
    ? safeModules[trimmed]
    : null;
}

app.post('/load-module', (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (!req.body || !isString(req.body.moduleName)) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  const name = req.body.moduleName;

  if (!isValidModuleName(name)) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  const loadedModule = getModule(name);
  if (!loadedModule) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  res.status(200).json({ success: true });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});