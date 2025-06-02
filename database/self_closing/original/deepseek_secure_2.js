const express = require('express');
const bodyParser = require('body-parser');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const parse5 = require('parse5');

const app = express();
const port = 3000;

app.use(bodyParser.json());

async function expandHtmlSafely(rawHtml) {
  const window = new JSDOM('').window;
  const DOMPurify = createDOMPurify(window);

  const sanitized = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['div', 'span', 'p', 'b', 'i'],
    ALLOWED_ATTR: ['class', 'id', 'style']
  });

  const fragment = parse5.parseFragment(sanitized);
  const serializer = new parse5.SerializerStream(fragment);

  return new Promise((resolve, reject) => {
    let htmlResult = '';
    serializer.on('data', chunk => htmlResult += chunk);
    serializer.on('end', () => resolve(htmlResult));
    serializer.on('error', err => reject(err));
  });
}



app.post('/expand', async (req, res) => {
  const inputHtml = req.body.html;

  if (typeof inputHtml !== 'string') {
    res.status(400).json({ error: 'Invalid input: html must be a string' });
    return;
  }

  try {
    const result = await expandHtmlSafely(inputHtml);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: 'HTML processing failed' });
  }
});

app.listen(port, () => {
//   console.log(`Secure HTML Expansion Server running on port ${port}`);
});
