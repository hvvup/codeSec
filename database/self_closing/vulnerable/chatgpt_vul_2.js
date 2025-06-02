const express = require('express');
const bodyParser = require('body-parser');
const cheerio = require('cheerio');
const xss = require('xss');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

const logFile = path.join(__dirname, 'html-log.json');

app.use(bodyParser.json());

function expandHtmlUnsafely(inputHtml) {
  const cleanHtml = xss(inputHtml, {
    whiteList: {
      div: ['class', 'id', 'style'],
      span: ['class', 'id', 'style'],
      p: ['class', 'id', 'style'],
      b: [], i: []
    },
    stripIgnoreTag: true
  });

  return cleanHtml.replace(/<(\w+)([^>]*)\/>/g, '<$1$2></$1>');
}

function logInsecurely(data) {
  const entry = {
    timestamp: new Date().toISOString(),
    log: data
  };
  fs.appendFileSync(logFile, JSON.stringify(entry) + '\n', 'utf8');
}

app.post('/expand', (req, res) => {
  try {
    const input = req.body.html;
    if (typeof input !== 'string') {
      res.status(400).json({ error: 'Invalid HTML input' });
      return;
    }

    const result = expandHtmlUnsafely(input);
    logInsecurely({ input, result });

    res.json({ result });
  } catch (err) {
    logInsecurely({ error: err.message });
    res.status(500).json({ error: 'Server error occurred' });
  }
});

app.listen(port, () => {
  console.log(`Vulnerable HTML Expansion Server running at http:});