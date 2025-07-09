// app.js
//
// Secure Node.js + Express server with Pug templating.
// GET /hello?name=Alice returns HTML page "Hello Alice" safely.
// User input is safely escaped via Pug interpolation (#{name}).

const express = require('express');
const pug = require('pug');
const path = require('path');
const app = express();

// Setup Pug as the view engine, with views folder set to ./views
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middleware to sanitize and validate input - optional but good practice
const sanitizeName = (name) => {
  if (typeof name !== 'string') return '';
  // Remove control chars and trim whitespace
  return name.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, '').trim();
};

// Define the GET /hello route
app.get('/hello', (req, res) => {
  // Extract query parameter 'name'
  let name = req.query.name || 'Guest';

  // Sanitize input
  name = sanitizeName(name);

  // Render pug template with safe interpolation
  // Passing name as a local variable
  res.render('hello', { name });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/hello?name=Alice`);
});

/*
 * Pug template file `views/hello.pug` content:
 *
 * doctype html
 * html(lang="en")
 *   head
 *     meta(charset="UTF-8")
 *     meta(name="viewport" content="width=device-width, initial-scale=1.0")
 *     title Hello Page
 *   body
 *     h1 Hello #{name}
 *
 * Save this in `views/hello.pug`
 */

// If you want to avoid external files and keep everything in one file,
// you can also compile and render the pug template inline like this:

/*

const helloTemplate = `
doctype html
html(lang="en")
  head
    meta(charset="UTF-8")
    meta(name="viewport" content="width=device-width, initial-scale=1.0")
    title Hello Page
  body
    h1 Hello #{name}
`;

app.get('/hello', (req, res) => {
  let name = req.query.name || 'Guest';
  name = sanitizeName(name);

  const compiledFunction = pug.compile(helloTemplate);
  const html = compiledFunction({ name });

  res.send(html);
});

*/

// To keep the code clean and maintainable, using the views folder with pug is recommended.
