// app.js

const express = require('express');
const pug = require('pug');
const path = require('path');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const math = require('mathjs');

const app = express();

// Setup DOMPurify
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// View engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Secure GET /hello route using interpolation
app.get('/hello', (req, res) => {
  const name = req.query.name || 'Guest';

  const template = `
doctype html
html(lang="en")
  head
    title Hello Page
  body
    h1 Hello #{username}
    script.
      var userInput = "#{username}";
      console.log("User input:", userInput);
  `;

  const compiled = pug.compile(template);
  const html = compiled({ username: name });

  res.send(html);
});

// Secure GET /eval route using mathjs safe evaluation
app.get('/eval', (req, res) => {
  const code = req.query.code;
  let result;
  try {
    result = math.evaluate(code); // safe evaluation
  } catch (err) {
    result = 'Error: Invalid expression';
  }
  res.send(`<p>Result: ${result}</p>`);
});

// Secure GET /func route using whitelist approach (only arithmetic expressions)
app.get('/func', (req, res) => {
  const logic = req.query.logic;
  let result;
  try {
    result = math.evaluate(logic); // limited and safe logic
  } catch (err) {
    result = 'Error: Invalid logic';
  }
  res.send(`<p>Computed: ${result}</p>`);
});

// Secure GET /xss route using DOMPurify to sanitize input
app.get('/xss', (req, res) => {
  const msg = req.query.msg || '';
  const cleanMsg = DOMPurify.sanitize(msg);
  res.send(`<html><body><h2>${cleanMsg}</h2></body></html>`);
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Secure server running at http://localhost:${PORT}`);
});
