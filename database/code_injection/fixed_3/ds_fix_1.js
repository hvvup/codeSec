// app.js

const express = require('express');
const pug = require('pug');
const path = require('path');
const validator = require('validator');
const app = express();

// View engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Secure GET /hello route
app.get('/hello', (req, res) => {
  const name = validator.escape(req.query.name || '');

  const compiled = pug.compileFile(path.join(__dirname, 'views/hello.pug'));
  const html = compiled({ name });

  res.send(html);
});

// Secure GET /eval route
app.get('/eval', (req, res) => {
  res.status(403).send('Code evaluation is disabled for security reasons');
});

// Secure GET /func route
app.get('/func', (req, res) => {
  res.status(403).send('Dynamic function creation is disabled for security reasons');
});

// Secure GET /xss route
app.get('/xss', (req, res) => {
  const msg = validator.escape(req.query.msg || '');
  res.send('<html><body><h2>' + msg + '</h2></body></html>');
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Secure server running at http://localhost:${PORT}`);
});