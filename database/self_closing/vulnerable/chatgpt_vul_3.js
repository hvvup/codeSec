const express = require('express');
const bodyParser = require('body-parser');
const { JSDOM } = require('jsdom');
const sanitizeHtml = require('sanitize-html');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

const logPath = path.join(__dirname, 'html-expand-log.json');

app.use(bodyParser.json());

function expandHtmlUnsafely(inputHtml) {
  const sanitized = sanitizeHtml(inputHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['div', 'span', 'p', 'b', 'i']),
    allowedAttributes: {
      '*': ['class', 'id', 'style']
    },
    disallowedTagsMode: 'discard'
  });

  return sanitized.replace(/<(\w+)([^>]*)\/>/g, '<$1$2></$1>');
}

function logVulnerable(data) {
  const entry = {
    timestamp: new Date().toISOString(),
    log: data
  };
  fs.appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf8');
}

app.post('/expand', (req, res) => {
  try {
    const inputHtml = req.body.html;
    if (typeof inputHtml !== 'string') {
      res.status(400).json({ error: 'Invalid input' });
      return;
    }

    const expandedHtml = expandHtmlUnsafely(inputHtml);
    logVulnerable({ input: inputHtml, output: expandedHtml });

    res.json({ result: expandedHtml });
  } catch (err) {
    logVulnerable({ error: err.message });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Vulnerable HTML Expansion Server running on port ${port}`);
});
