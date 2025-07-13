const express = require('express');
const pug = require('pug');
const path = require('path');
const escapeHtml = require('escape-html');
const { VM } = require('vm2'); // For safe sandboxing
const app = express();

// View engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Fixed GET /hello route
app.get('/hello', (req, res) => {
  const name = req.query.name || 'Guest';
  
  // Use proper template file instead of dynamic template string
  res.render('hello', { 
    name: escapeHtml(name),
    safeName: JSON.stringify(escapeHtml(name)) // For script context
  });
});

// Fixed GET /eval route - using VM2 sandbox instead of eval
app.get('/eval', (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Code parameter is required');
  }

  try {
    const vm = new VM({
      timeout: 1000,
      sandbox: {}
    });
    const result = vm.run(code);
    res.send(`<p>Result: ${escapeHtml(String(result))}</p>`);
  } catch (err) {
    res.status(400).send(`<p>Error: ${escapeHtml(err.message)}</p>`);
  }
});

// Fixed GET /func route - using VM2 sandbox instead of Function constructor
app.get('/func', (req, res) => {
  const logic = req.query.logic;
  if (!logic) {
    return res.status(400).send('Logic parameter is required');
  }

  try {
    const vm = new VM({
      timeout: 1000,
      sandbox: {}
    });
    const result = vm.run(`(function() { return ${logic} })()`);
    res.send(`<p>Computed: ${escapeHtml(String(result))}</p>`);
  } catch (err) {
    res.status(400).send(`<p>Error: ${escapeHtml(err.message)}</p>`);
  }
});

// Fixed GET /xss route - proper output encoding
app.get('/xss', (req, res) => {
  const msg = req.query.msg || '';
  res.send(`<html><body><h2>${escapeHtml(msg)}</h2></body></html>`);
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Secure server running at http://localhost:${PORT}`);
});