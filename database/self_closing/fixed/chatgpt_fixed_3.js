// deepseek_vul_3을 chatgpt로 수정

const express = require('express');
const bodyParser = require('body-parser');
const { JSDOM } = require('jsdom');
const helmet = require('helmet');

const app = express();
app.use(helmet());
app.use(bodyParser.json({ limit: '10kb' }));

function processHtml(html) {
  const dom = new JSDOM(`<!DOCTYPE html><body>${html}</body>`, { contentType: 'text/html' });
  const document = dom.window.document;

  const elements = document.body.querySelectorAll('*');
  elements.forEach(el => {
    if (el.outerHTML.endsWith('/>')) {
      const newEl = document.createElement(el.tagName);
      Array.from(el.attributes).forEach(attr => {
        newEl.setAttribute(attr.name, attr.value);
      });
      el.parentNode.replaceChild(newEl, el);
    }
  });

  return document.body.innerHTML;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function validateInput(req, res, next) {
  if (!req.body || typeof req.body.html !== 'string') {
    return res.status(400).json({ error: 'Invalid input format' });
  }
  if (req.body.html.length > 10000) {
    return res.status(413).json({ error: 'Input too large' });
  }
  next();
}

app.post('/process-html', validateInput, (req, res) => {
  try {
    const processed = processHtml(req.body.html);
    const safeOutput = escapeHTML(processed); 
    res.json({ result: safeOutput });
  } catch {
    res.status(500).json({ error: 'HTML processing failed' });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    security: {
      xssProtection: true,
      tagExpansion: true,
      inputValidation: true
    }
  });
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(3000, () => {
  console.log('HTML processor running on port 3000');
});

module.exports = app;

