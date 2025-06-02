// secure-html-server-v2.js
const express = require('express');
const bodyParser = require('body-parser');
const cheerio = require('cheerio');
const xss = require('xss');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// 로그 파일 경로
const logFile = path.join(__dirname, 'html-log.json');

// JSON 파싱 미들웨어
app.use(bodyParser.json());

/**
 * HTML에서 self-closing 태그를 확장하고 XSS 방지
 */
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

/**
 * 보안 로그 기록
 */
function logSecurely(data) {
  const entry = {
    timestamp: new Date().toISOString(),
    log: data
  };
  fs.appendFileSync(logFile, JSON.stringify(entry) + '\n', 'utf8');
}

// POST 라우트
app.post('/expand', (req, res) => {
  try {
    const input = req.body.html;
    if (typeof input !== 'string') {
      res.status(400).json({ error: 'Invalid HTML input' });
      return;
    }

    const result = expandHtmlSafely(input);
    logSecurely({ input, result });

    res.json({ result });
  } catch (err) {
    logSecurely({ error: err.message });
    res.status(500).json({ error: 'Server error occurred' });
  }
});

// 서버 실행
app.listen(port, () => {
  console.log(`Secure HTML Expansion Server running at http://localhost:${port}`);
});