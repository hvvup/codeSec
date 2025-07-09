// app.js

const express = require('express');
const pug = require('pug');
const path = require('path');
const app = express();

// View engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Vulnerable GET /hello route
app.get('/hello', (req, res) => {
  const name = req.query.name;

  // Vulnerable: compiling dynamic pug with unsanitized user input
  const template = `
doctype html
html(lang="en")
  head
    title Hello Page
  body
    h1 Hello ${name}
    script.
      var userInput = "${name}";
      console.log("User input:", userInput);
  `;

  const compiled = pug.compile(template);
  const html = compiled();

  res.send(html);
});

// Vulnerable GET /eval route (CWE-094, CWE-095)
app.get('/eval', (req, res) => {
  const code = req.query.code;
  const result = eval(code); // vulnerable
  res.send(`<p>Result: ${result}</p>`);
});

// Vulnerable GET /func route
app.get('/func', (req, res) => {
  const logic = req.query.logic;
  const fn = new Function('return ' + logic); // vulnerable
  const result = fn();
  res.send(`<p>Computed: ${result}</p>`);
});

// Vulnerable GET /xss route (CWE-079, CWE-116)
app.get('/xss', (req, res) => {
  const msg = req.query.msg;
  res.send('<html><body><h2>' + msg + '</h2></body></html>'); // vulnerable to XSS
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Vulnerable server running at http://localhost:${PORT}`);
});
