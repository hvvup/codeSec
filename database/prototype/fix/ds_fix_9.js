const express = require('express');
const helmet = require('helmet');
const { body, param, validationResult } = require('express-validator');
const fs = require('fs');

// 1. Express 초기화
const app = express();

// 2. 보안 미들웨어
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// 3. 안전한 translations 저장소 (null 프로토타입 객체 사용)
const translations = Object.create(null);
const MAX_TRANSLATIONS = 1000;

// 4. 강화된 검증 규칙
const validateInput = [
  param('lang')
    .isString()
    .matches(/^[a-z]{2}(-[A-Z]{2})?$/)
    .withMessage('Invalid language code'),
  body('phraseKey')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .custom(value => {
      // 프로토타입 오염 시도 차단
      const forbiddenKeys = ['__proto__', 'constructor', 'prototype'];
      if (forbiddenKeys.includes(value)) {
        throw new Error('Invalid phraseKey');
      }
      // 추가적인 위험 키워드 검사
      if (value.includes('__') || value.toLowerCase().includes('proto')) {
        throw new Error('Invalid phraseKey format');
      }
      return true;
    })
    .withMessage('Invalid phraseKey'),
  body('translation')
    .isString()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Invalid translation'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// 5. PUT /translate/:lang 엔드포인트 (안전한 버전)
app.put('/translate/:lang', validateInput, (req, res, next) => {
  try {
    const { lang } = req.params;
    const { phraseKey, translation } = req.body;

    // 언어별 저장소 초기화 (null 프로토타입 객체 사용)
    if (!translations[lang]) {
      translations[lang] = Object.create(null);
    }

    // 저장소 용량 체크
    if (Object.keys(translations[lang]).length >= MAX_TRANSLATIONS) {
      return res.status(429).json({ 
        error: 'Translation storage limit reached' 
      });
    }

    // 안전한 할당
    translations[lang][phraseKey] = translation;

    // 변경사항 파일에 백업 (비동기 방식으로 변경)
    fs.writeFile(
      `translations_${lang}.json`,
      JSON.stringify(translations[lang], null, 2),
      (err) => {
        if (err) {
          console.error('⚠️ 백업 저장 실패:', err);
          // 백업 실패해도 주요 기능은 유지
        }
      }
    );

    res.status(201).json({
      success: true,
      data: { lang, phraseKey, translation }
    });

  } catch (err) {
    console.error('⚠️ Translation save error:', err);
    next(err);
  }
});

// 6. 상태 확인 엔드포인트
app.get('/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.status(200).json({
    status: 'healthy',
    translationsCount: Object.keys(translations).length,
    memoryUsage: {
      rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`
    }
  });
});

// 7. 에러 핸들러
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && {
      message: err.message,
      stack: err.stack
    })
  });
});

// 8. 서버 시작
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Secure translation server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// 9. 종료 시 처리
process.on('SIGTERM', () => {
  console.log('Saving final translations backup...');
  fs.writeFileSync(
    'translations_final.json',
    JSON.stringify(translations, null, 2)
  );
  server.close(() => {
    console.log('Server shutdown complete');
    process.exit(0);
  });
});

module.exports = { app, translations };