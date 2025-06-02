const express = require('express');
const bodyParser = require('body-parser');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
app.use(helmet());
app.use(bodyParser.json({ limit: '10kb' }));
app.use(morgan('combined'));

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const sanitizeConfig = {
  ALLOWED_TAGS: ['div', 'span', 'p', 'a', 'ul', 'ol', 'li', 'br', 'img'],
  ALLOWED_ATTR: ['class', 'style', 'href', 'src', 'alt'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'on*'],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  ADD_ATTR: [],
  ADD_TAGS: []
};

function processHtml(html) {
  const cleanHtml = DOMPurify.sanitize(html, sanitizeConfig);
  
  const dom = new JSDOM(cleanHtml);
  const document = dom.window.document;
  
  const walker = document.createTreeWalker(
    document.body,
    dom.window.NodeFilter.SHOW_ELEMENT
  );
  
  const elements = [];
  while (walker.nextNode()) {
    elements.push(walker.currentNode);
  }
  
  elements.forEach(el => {
    if (el.outerHTML.endsWith('/>') && 
        !['br', 'img', 'hr', 'input'].includes(el.tagName.toLowerCase())) {
      const newEl = document.createElement(el.tagName);
      
      Array.from(el.attributes).forEach(attr => {
        newEl.setAttribute(attr.name, attr.value);
      });
      
      el.parentNode.replaceChild(newEl, el);
    }
  });
  
  return document.body.innerHTML;
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
    res.json({ result: processed });
  } catch (err) {
    console.error('Processing error:', err);
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
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(3000, () => {
  console.log('Secure HTML processor running on port 3000');
  console.log('Security features:');
  console.log('- DOMPurify XSS protection');
  console.log('- Self-closing tag expansion');
  console.log('- Input size limits (10KB)');
  console.log('- Helmet security headers');
});

module.exports = app;