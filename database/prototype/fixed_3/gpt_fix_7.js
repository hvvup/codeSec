const express = require('express');
const bodyParser = require('body-parser');

const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

// 안전한 빈 맵(프로토타입 없음)
const createDict = () => Object.create(null);

// 안전한 전역 저장소
const ratings = createDict();

const app = express();
app.use(bodyParser.json());

// 입력 검증 및 키 차단
const validateInput = (req, res, next) => {
  const movieId = String(req.params.movieId);
  const username = typeof req.body.username === 'string' ? req.body.username : '';
  const starsNum = Number(req.body.stars);

  if (DANGEROUS_KEYS.has(movieId) || DANGEROUS_KEYS.has(username)) {
    return res.status(400).json({ error: 'Invalid key' });
  }

  if (!username.trim()) {
    return res.status(400).json({ error: 'Username required' });
  }

  if (Number.isNaN(starsNum)) {
    return res.status(400).json({ error: 'Stars must be a number' });
  }

  req.validated = { movieId, username, stars: starsNum };
  next();
};

// 평점 저장
app.post('/ratings/:movieId', validateInput, (req, res) => {
  const { movieId, username, stars } = req.validated;

  if (!ratings[movieId]) {
    ratings[movieId] = createDict(); // 프로토타입 없는 안전한 컨테이너
  }

  ratings[movieId][username] = stars;

  if (movieId === '__proto__' || username.includes('__proto__') || username.includes('constructor')) {
    console.log(`[WARN] Prototype pollution attempt: ${movieId}.${username} = ${stars}`);
  }

  res.status(201).json({
    success: true,
    message: 'Rating submitted',
    data: { movieId, username, stars }
  });
});

// 프로토타입 오염 확인용 엔드포인트
app.get('/check-pollution', (req, res) => {
  const testObj = {};
  res.json({
    isObjectPolluted: 'isPolluted' in testObj,
    isConstructorPolluted: 'isHacked' in testObj.constructor.prototype,
    testObj
  });
});

// 서버 시작
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Test Prototype Pollution with:`);
  console.log(`POST /ratings/__proto__ { "username": "isPolluted", "stars": 5 }`);
  console.log(`GET /check-pollution`);
});

module.exports = app;
