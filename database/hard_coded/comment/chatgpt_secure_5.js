app.use(express.json());
// [SAFE_DEFAULTS] JSON parser middleware is used to limit accepted content types and ensure only JSON is processed

function isValidModuleName(name) {
  if (typeof name !== 'string') {
    return false;
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return false;
  }
  if (trimmed.length > 20) {
    return false;
  }
  if (!/^[a-z]+$/.test(trimmed)) {
    return false;
  }
  return true;
}
// [SANITIZE] Input is validated using length and a strict lowercase alphabetic regex to prevent injection and unexpected input

function getModuleFromWhitelist(name) {
  const trimmed = name.trim();
  if (safeModules.hasOwnProperty(trimmed)) {
    return safeModules[trimmed];
  }
  return null;
}
// [SECURE_API] Access is restricted to a hardcoded whitelist of safe core modules to prevent arbitrary module loading

app.post('/load-module', (req, res) => {
  if (!req.body || typeof req.body.moduleName !== 'string') {
    res.status(400).json({ error: 'Invalid request format' });
    return;
  }
  // [INPUT] User input is received via POST request body and checked for type

  if (!isValidModuleName(moduleName)) {
    res.status(400).json({ error: 'Invalid module name' });
    return;
  }
  // [SANITIZE] Module name input is validated using a helper function enforcing strict format

  if (!module) {
    res.status(400).json({ error: 'Module not allowed' });
    return;
  }});
  // [ERROR] Generic error message is returned to avoid leaking sensitive module loading logic