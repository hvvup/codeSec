const express = require('express');
const helmet = require('helmet');
const { body, param, validationResult } = require('express-validator');
const fs = require('fs');

// 1. Express 초기화
const app = express();

// 2. 보안 미들웨어
app.use(helmet());
app.use(express.json({ limit: '10kb' })); // Body 크기 제한 추가

// 3. 안전한 translations 저장소
const translations = Object.create(null);
const MAX_TRANSLATIONS = 1000; // 최대 저장 가능 항목 수

// 4. 검증 규칙
const validateInput = [
  param('lang')
    .isString()
    .matches(/^[a-z]{2}(-[A-Z]{2})?$/)
    .withMessage('Invalid language code'),
  body('phraseKey')
    .isString()
    .trim()
    .matches(/^[a-zA-Z0-9_-]+$/)
    .isLength({ max: 100 })
    .withMessage('Invalid phraseKey'),
  body('translation')
    .isString()
    .trim()
    .escape()
    .isLength({ max: 1000 })
    .withMessage('Invalid translation'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// 5. PUT /translate/:lang 엔드포인트
app.put('/translate/:lang', validateInput, (req, res, next) => {
  try {
    const { lang } = req.params;
    const { phraseKey, translation } = req.body;

    // 언어별 저장소 초기화
    if (!translations[lang]) {
      translations[lang] = Object.create(null);
      console.log(`Initialized new language: ${lang}`);
    }

    // 저장소 용량 체크
    if (Object.keys(translations[lang]).length >= MAX_TRANSLATIONS) {
      throw new Error('Translation storage limit reached');
    }

    // 안전한 저장
    translations[lang][phraseKey] = translation;

    // 변경사항 파일에 백업 (선택적)
    fs.writeFileSync(
      `translations_${lang}.json`,
      JSON.stringify(translations[lang], null, 2)
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