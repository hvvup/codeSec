const express = require('express');
const bodyParser = require('body-parser');

// 취약점: 일반 객체 사용 (프로토타입 체인이 활성화됨)
const ratings = {};

const app = express();
app.use(bodyParser.json());

// 취약점: 프로토타입 오염 검증 로직 제거
const validateInput = (req, res, next) => {
    const { movieId } = req.params;
    const { username, stars } = req.body;

    // 취약점: __proto__, constructor 등에 대한 필터링 없음
    const starsNum = Number(stars);
    if (isNaN(starsNum)) {
        return res.status(400).json({ error: 'Stars must be a number' });
    }

    req.validated = { movieId, username, stars: starsNum };  // 'validated'로 통일
    next();
};

// 기존 기능: 평점 저장 (프로토타입 오염 가능)
app.post('/ratings/:movieId', validateInput, (req, res) => {
    const { movieId, username, stars } = req.validated;  // 'validated' 사용

    if (!ratings[movieId]) {
        ratings[movieId] = {}; // 취약점: 일반 객체 사용
    }

    // 프로토타입 오염 가능한 할당
    ratings[movieId][username] = stars;

    // 로그로 오염 시도 감지
    if (movieId === '__proto__' || username.includes('__proto__') || username.includes('constructor')) {
        console.log(`[WARN] Prototype pollution attempt: ${movieId}.${username} = ${stars}`);
    }

    res.status(201).json({
        success: true,
        message: 'Rating submitted',
        data: { movieId, username, stars }
    });
});

// 추가된 기능: 프로토타입 오염 확인용 엔드포인트
app.get('/check-pollution', (req, res) => {
    const testObj = {};
    res.json({
        isObjectPolluted: 'isPolluted' in testObj, // __proto__ 오염 확인
        isConstructorPolluted: 'isHacked' in testObj.constructor.prototype, // constructor 오염 확인
        testObj
    });
});

// 서버 시작
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Vulnerable Server running on http://localhost:${PORT}`);
    console.log(`Test Prototype Pollution with:`);
    console.log(`POST /ratings/__proto__ { "username": "isPolluted", "stars": 5 }`);
    console.log(`GET /check-pollution`);
});

module.exports = app;