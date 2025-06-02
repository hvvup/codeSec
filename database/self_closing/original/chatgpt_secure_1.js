// secure-html-server.js
const express = require('express');
const bodyParser = require('body-parser');
const { JSDOM } = require('jsdom');
const sanitizeHtml = require('sanitize-html');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// 로그 파일 경로 지정
const logPath = path.join(__dirname, 'html-expand-log.json');
const logger = pino(pino.destination(logPath));

app.use(bodyParser.json());

/**
 * HTML을 안전하게 확장하는 함수
 */
function expandHtmlSafely(inputHtml) {
  // XSS 방지용 sanitize
  const sanitized = sanitizeHtml(inputHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['div', 'span', 'p', 'b', 'i']),
    allowedAttributes: {
      '*': ['class', 'id', 'style']
    },
    disallowedTagsMode: 'discard'
  });

  // DOM 파싱 후 self-closing 태그 확장
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
    logger.info({ timestamp: new Date().toISOString(), input: inputHtml, output: expandedHtml });

    res.json({ result: expandedHtml });
  } catch (err) {
    logger.error({ timestamp: new Date().toISOString(), error: err.message });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Secure HTML Expansion Server running on port ${port}`);
});
