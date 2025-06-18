app.use(express.json());
// [SAFE_DEFAULTS] Only JSON payloads are accepted, reducing the risk of unexpected input formats

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
// [SANITIZE] Checks that input is a non-empty trimmed string to prevent empty or whitespace-only input

function isAlphabetic(str) {
  return /^[a-z]+$/.test(str);
}
// [SANITIZE] Validates that input contains only lowercase alphabetic characters to avoid injection risks

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
// [SANITIZE] Module name is validated for type, length, and character restrictions to enforce strict input format

function getAllowedModule(name) {
  const trimmed = name.trim();
  return Object.prototype.hasOwnProperty.call(allowedModules, trimmed)
    ? allowedModules[trimmed]
    : null;
}
// [SECURE_API] Module access is restricted to a predefined whitelist using safe property checking

app.post('/load-module', (req, res) => {
  if (!req.body || typeof req.body.moduleName !== 'string') {
    res.status(400).json({ error: 'Invalid request format' });
    return;
  }
  // [INPUT] Receives user input from POST request body and ensures it's a string

  if (!validateModuleName(moduleName)) {
    res.status(400).json({ error: 'Invalid module name' });
    return;
  }
  // [SANITIZE] Validates the module name using strict checks on format, length, and characters

  if (!module) {
    res.status(400).json({ error: 'Module not allowed' });
    return;
  }});
  // [ERROR] Returns a generic error when the requested module is not whitelisted, avoiding system detail leakage
