const express = require('express');
const bodyParser = require('body-parser');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const parse5 = require('parse5');

const app = express();
const port = 3000;

// [SAFE_DEFAULTS] Parses JSON request bodies using a standard middleware with secure defaults
app.use(bodyParser.json());

function expandHtmlSafely(rawHtml) {
  const window = new JSDOM('').window;
  const DOMPurify = createDOMPurify(window);

  // [SANITIZE] Sanitizes untrusted HTML input using DOMPurify to remove dangerous tags and attributes
  const sanitized = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['div', 'span', 'p', 'b', 'i'],
    ALLOWED_ATTR: ['class', 'id', 'style']
  });

  const parsed = parse5.parseFragment(sanitized);
  const result = parse5.serialize(parsed);

  return result;
}

app.post('/expand', (req, res) => {
  // [INPUT] Receives untrusted HTML input from user-supplied JSON body
  const inputHtml = req.body.html;

  // [ERROR] Returns a generic error message when input type is incorrect
  if (typeof inputHtml !== 'string') {
    res.status(400).json({ error: 'Invalid input: html must be a string' });
    return;
  }

  try {
    const result = expandHtmlSafely(inputHtml);
    res.json({ result });
  } catch (err) {
    // [ERROR] Handles unexpected failures with a non-revealing message
    res.status(500).json({ error: 'HTML processing failed' });
  }
});

app.listen(port, () => {
});
