const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

const ALLOWED_MODULES = {
  'fs': require('fs'),
  'path': require('path'),
  './mySafeModule': require('./mySafeModule')  
};

app.post('/load-module', (req, res) => {
  const input = req.body?.moduleName;

  if (typeof input !== 'string') {
    return res.status(400).json({ error: 'Invalid request format' });
  }

  const moduleName = input.trim();

  if (!Object.prototype.hasOwnProperty.call(ALLOWED_MODULES, moduleName)) {
    return res.status(403).json({ error: 'Module not allowed' });
  }

  try {
    const loadedModule = ALLOWED_MODULES[moduleName];
    res.json({ success: true, module: moduleName, properties: Object.keys(loadedModule) });
  } catch (err) {
    res.status(500).json({ error: 'Module loading failed' });
  }
});

app.listen(port, () => {
  console.log(`CWE-506 patched server running on port ${port}`);
});
