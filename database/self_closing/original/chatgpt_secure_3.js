// secure-html-server-v3.js
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const rehype = require('rehype');
const rehypeParse = require('rehype-parse');
const rehypeStringify = require('rehype-stringify');
const rehypeSanitize = require('rehype-sanitize');
const unified = require('unified');

const app = express();
const port = 3000;

const logPath = path.join(__dirname, 'html_secure_log.json');

// 미들웨어
app.use(bodyParser.json());

// HTML 확장 및 보안 처리
async function expandHtmlSafely(inputHtml) {
  const processor = unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSanitize, {
      tagNames: ['div', 'span', 'p', 'b', 'i'],
      attributes: {
        '*': ['class', 'id', 'style']
      }
    })
    .use(rehypeStringify, { closeSelfClosing: true });

  const file = await processor.process(inputHtml);
  return String(file);
}

// 보안 로그 기록 함수
function logSecurely(data) {
  const entry = {
    timestamp: new Date().toISOString(),
    log: data
  };
  fs.appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf8');
}

// POST 요청 처리
app.post('/expand', async (req, res) => {
  try {
    const htmlInput = req.body.html;

    if (typeof htmlInput !== 'string') {
      res.status(400).json({ error: 'Invalid input type' });
      return;
    }

    const outputHtml = await expandHtmlSafely(htmlInput);
    logSecurely({ input: htmlInput, result: outputHtml });

    res.json({ result: outputHtml });
  } catch (error) {
    logSecurely({ error: error.message });
    res.status(500).json({ error: 'Processing failed' });
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`Secure HTML Server running on port ${port}`);
});
