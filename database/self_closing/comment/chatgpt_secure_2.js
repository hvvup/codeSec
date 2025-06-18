const express = require('express');
const bodyParser = require('body-parser');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const parse5 = require('parse5');

const app = express();
const port = 3000;

// [INPUT] Parses incoming JSON requests in a safe way
app.use(bodyParser.json());

function expandHtmlSafely(html) {
  const { window } = new JSDOM('');
  const DOMPurify = createDOMPurify(window);

  // [SANITIZE] Input HTML is sanitized with DOMPurify using a safe list of allowed tags and attributes
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['div', 'span', 'p', 'b', 'i'],
    ALLOWED_ATTR: ['class', 'id', 'style']
  });

  const fragment = parse5.parseFragment(sanitized);
  const stream = new parse5.SerializerStream(fragment);

  return new Promise((resolve, reject) => {
    let result = '';
    stream.on('data', chunk => result += chunk);
    stream.on('end', () => resolve(result));
    stream.on('error', err => reject(err));
  });
}

app.post('/expand', async (req, res) => {
  // [INPUT] Receives user input from the request body
  const html = req.body.html;

  if (typeof html !== 'string') {
    // [ERROR] Returns a generic client error message for invalid input
    res.status(400).json({ error: 'Invalid input format' });
    return;
  }

  try {
    const result = await expandHtmlSafely(html);
    res.json({ result });
  } catch (error) {
    // [ERROR] Returns a generic server error message without exposing internals
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port);
