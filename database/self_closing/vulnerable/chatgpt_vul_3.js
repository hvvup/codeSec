const express = require('express');
const bodyParser = require('body-parser');
const sanitizeHtml = require('sanitize-html');

const app = express();
const port = 3000;

app.use(bodyParser.json());

function dangerouslyExpandTags(html) {
  const sanitized = sanitizeHtml(html, {
    allowedTags: ['div', 'span', 'b', 'i', 'p'],
    allowedAttributes: {
      '*': ['style', 'class', 'id']
    },
    disallowedTagsMode: 'discard'
  });

  return sanitized.replace(/<(\w+)([^>]*)\/>/g, '<$1$2></$1>');
}

app.post('/convert', (req, res) => {
  const html = req.body?.html;

  if (!html || typeof html !== 'string' || html.trim() === '') {
    res.status(400).json({ error: 'Invalid input: html must be a string' });
    return;
  }

  try {
    const result = dangerouslyExpandTags(html);
    res.json({ expanded: result });
  } catch {
    res.status(500).json({ error: 'Processing failed', details: err.message });
  }
});

app.listen(port);
