// app.js

const express = require('express');
const pug = require('pug');
const path = require('path');
const { evaluate } = require('mathjs');
const escapeHtml = require('escape-html');
const app = express();

// View engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Secure GET /hello route
app.get('/hello', (req, res) => {
  const name = req.query.name || '';
  res.render('hello', { name });
});

// Secure GET /eval route
app.get('/eval', (req, res) => {
  const code = req.query.code;
  try {
    const result = evaluate(code);
    res.send(`<p>Result: ${result}</p>`);
  } catch (e) {
    res.status(400).send('Invalid expression');
  }
});

// Secure GET /func route
app.get('/func', (req, res) => {
  const logic = req.query.logic;
  try {
    const result = evaluate(logic);
    res.send(`<p>Computed: ${result}</p>`);
  } catch (e) {
    res.status(400).send('Invalid logic expression');
  }
});

// Secure GET /xss route
app.get('/xss', (req, res) => {
  const msg = req.query.msg || '';
  res.send(`<html><body><h2>${escapeHtml(msg)}</h2></body></html>`);
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Secure server running at http://localhost:${PORT}`);
});
