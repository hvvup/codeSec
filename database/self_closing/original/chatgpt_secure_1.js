const express = require('express');
const bodyParser = require('body-parser');
const { JSDOM } = require('jsdom');
const sanitizeHtml = require('sanitize-html');


const app = express();
const port = 3000;



app.use(bodyParser.json());

function expandHtmlSafely(inputHtml) {
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
  try {
    const inputHtml = req.body.html;
    if (typeof inputHtml !== 'string') {
      res.status(400).json({ error: 'Invalid input' });
      return;
    }

    const expandedHtml = expandHtmlSafely(inputHtml);

    res.json({ result: expandedHtml });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  // console.log(`Secure HTML Expansion Server running on port ${port}`);
});
