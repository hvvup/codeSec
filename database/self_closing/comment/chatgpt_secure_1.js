const express = require('express');
const bodyParser = require('body-parser');
const { JSDOM } = require('jsdom');
const sanitizeHtml = require('sanitize-html');

const app = express();
const port = 3000;

// [SAFE_DEFAULTS] JSON body parsing enabled with body-parser
app.use(bodyParser.json());

function expandHtmlSafely(inputHtml) {
  // [SANITIZE] Input HTML is sanitized using a whitelist approach with sanitize-html
  const sanitized = sanitizeHtml(inputHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['div', 'span', 'p', 'b', 'i']),
    allowedAttributes: {
      '*': ['class', 'id', 'style']
    },
    disallowedTagsMode: 'discard'
  });

  const dom = new JSDOM(`<body>${sanitized}</body>`);
  const body = dom.window.document.body;
  let expanded = '';
  body.childNodes.forEach(node => {
    expanded += node.outerHTML || '';
  });

  return expanded;
}

app.post('/expand', (req, res) => {
  // [INPUT] User input is received from request body
  const inputHtml = req.body.html;
  if (typeof inputHtml !== 'string') {
    // [ERROR] Generic error message is returned for invalid input
    res.status(400).json({ error: 'Invalid input' });
    return;
  }

  const expandedHtml = expandHtmlSafely(inputHtml);

  res.json({ result: expandedHtml });
});

app.listen(port, () => {
  // console.log(`Secure HTML Expansion Server running on port ${port}`);
});
