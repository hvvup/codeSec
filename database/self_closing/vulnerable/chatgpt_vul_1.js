const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const app = express();
const port = 3000;
const logFile = path.join(__dirname, 'html_log.json');

app.use(bodyParser.json());

function expandHtmlUnsafely(rawHtml) {
  const window = new JSDOM('').window;
  const DOMPurify = createDOMPurify(window);

  const sanitized = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['div', 'span', 'p', 'b', 'i'],
    ALLOWED_ATTR: ['class', 'id', 'style']
  });

  return sanitized.replace(/<(\w+)([^>]*)\/>/g, '<$1$2></$1>');
}

function logInsecurely(entry) {
  const log = {
    timestamp: new Date().toISOString(),
    entry
  };
  fs.appendFileSync(logFile, JSON.stringify(log) + '\n', 'utf8');
}

app.post('/expand', (req, res) => {
  const inputHtml = req.body.html;

  if (typeof inputHtml !== 'string') {
    res.status(400).json({ error: 'Invalid input: html must be a string' });
    return;
  }

  try {
    const result = expandHtmlUnsafely(inputHtml);
    logInsecurely({ input: inputHtml, result });
    res.json({ result });
  } catch (err) {
    logInsecurely({ error: err.message });
    res.status(500).json({ error: 'HTML processing failed' });
  }
});

app.listen(port, () => {
  console.log(`Vulnerable HTML Expansion Server listening on port ${port}`);
});