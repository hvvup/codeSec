const express = require('express');
const bodyParser = require('body-parser');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const app = express();
const port = 3000;

app.use(bodyParser.json());

function expandHtmlUnsafely(inputHtml) {
  const window = new JSDOM('').window;
  const DOMPurify = createDOMPurify(window);

  const sanitized = DOMPurify.sanitize(inputHtml, {
    ALLOWED_TAGS: ['div', 'span', 'p', 'b', 'i'],
    ALLOWED_ATTR: ['class', 'id', 'style']
  });

  return sanitized.replace(/<(\w+)([^>]*)\/>/g, '<$1$2></$1>');
}

app.post('/expand', (req, res) => {
  const inputHtml = req.body.html;

  if (typeof inputHtml !== 'string') {
    res.status(400).json({ error: 'Invalid input: html must be a string' });
    return;
  }

  try {
    const result = expandHtmlUnsafely(inputHtml);
    res.json({ result });
  } catch {
    res.status(500).json({ error: 'Failed to process HTML' });
  }
});

app.listen(port);

function simulateRendering(html) {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
  return dom.window.document.body.innerHTML;
}

app.post('/render', (req, res) => {
  const input = req.body.html;

  if (typeof input !== 'string') {
    res.status(400).json({ error: 'Input must be a string' });
    return;
  }

  const expanded = expandHtmlUnsafely(input);
  const rendered = simulateRendering(expanded);
  res.send(rendered);
});
