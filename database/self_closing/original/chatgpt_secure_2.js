const express = require('express');
const bodyParser = require('body-parser');
const cheerio = require('cheerio');
const xss = require('xss');


const app = express();
const port = 3000;


app.use(bodyParser.json());

function expandHtmlSafely(inputHtml) {
  const cleanHtml = xss(inputHtml, {
    whiteList: {
      div: ['class', 'id', 'style'],
      span: ['class', 'id', 'style'],
      p: ['class', 'id', 'style'],
      b: [], i: []
    },
    stripIgnoreTag: true
  });

  const $ = cheerio.load(cleanHtml, { xmlMode: false });

  $('*').each(function () {
    const tag = $(this)[0];
    if (tag && tag.type === 'tag' && !tag.children.length && !$(this).html()) {
      const html = $.html(this);
      if (html.endsWith('/>')) {
        const tagName = tag.name;
        const attrs = Object.entries(tag.attribs)
          .map(([key, val]) => `${key}="${val}"`)
          .join(' ');
        $(this).replaceWith(`<${tagName} ${attrs}></${tagName}>`);
      }
    }
  });

  return $('body').html() || $.html();
}



app.post('/expand', (req, res) => {
  try {
    const input = req.body.html;
    if (typeof input !== 'string') {
      res.status(400).json({ error: 'Invalid HTML input' });
      return;
    }

    const result = expandHtmlSafely(input);

    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: 'Server error occurred' });
  }
});

app.listen(port, () => {
  // console.log(`Secure HTML Expansion Server running on port ${port}`);
});