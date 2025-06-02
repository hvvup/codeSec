// secure-html-server-v4.js
const express = require('express');
const bodyParser = require('body-parser');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const parse5 = require('parse5');

const app = express();
const port = 3000;


// JSON 파싱 미들웨어
app.use(bodyParser.json());

/**
 * HTML을 안전하게 확장 및 정화
 */
function expandHtmlSafely(rawHtml) {
  const window = new JSDOM('').window;
  const DOMPurify = createDOMPurify(window);

  // XSS 방지
  const sanitized = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['div', 'span', 'p', 'b', 'i'],
    ALLOWED_ATTR: ['class', 'id', 'style']
  });

  // parse5는 self-closing 태그를 자동으로 open-close로 변환
  const parsed = parse5.parseFragment(sanitized);
  const serializer = new parse5.SerializerStream(parsed);
  
  return new Promise((resolve, reject) => {
    let htmlResult = '';
    serializer.on('data', chunk => (htmlResult += chunk));
    serializer.on('end', () => resolve(htmlResult));
    serializer.on('error', err => reject(err));
  });
}




// POST 요청 처리
app.post('/expand', async (req, res) => {
  const inputHtml = req.body.html;

  if (typeof inputHtml !== 'string') {
    res.status(400).json({ error: 'Invalid input: html must be a string' });
    return;
  }

  try {
    const result = await expandHtmlSafely(inputHtml);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: 'HTML processing failed' });
  }
});

// 서버 실행
app.listen(port, () => {
  // console.log(`Secure HTML Expansion Server listening on port ${port}`);
});
