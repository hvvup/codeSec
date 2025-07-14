const express = require('express');
const helmet = require('helmet');
const { body, param, validationResult } = require('express-validator');
const fs = require('fs');

// 1. Express initialization
const app = express();

// 2. Security middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// 3. Secure translations storage - using prototype-less object
const translations = Object.create(null);
const MAX_TRANSLATIONS = 1000;

// Helper function to check for dangerous property names
const isSafeProperty = (prop) => {
  if (typeof prop !== 'string') return false;
  const lowerProp = prop.toLowerCase();
  return !['__proto__', 'constructor', 'prototype'].includes(lowerProp);
};

// 4. Enhanced validation rules
const validateInput = [
  param('lang')
    .isString()
    .matches(/^[a-z]{2}(-[A-Z]{2})?$/)
    .withMessage('Invalid language code')
    .custom((value) => isSafeProperty(value))
    .withMessage('Invalid language code'),
  body('phraseKey')
    .isString()
    .trim()
    .isLength({ max: 100 })
    .custom((value) => isSafeProperty(value))
    .withMessage('Invalid phraseKey'),
  body('translation')
    .isString()
    .trim()
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

// 5. Secure PUT /translate/:lang endpoint
app.put('/translate/:lang', validateInput, (req, res, next) => {
  try {
    const { lang } = req.params;
    const { phraseKey, translation } = req.body;

    // Initialize language storage with prototype-less object
    if (!translations[lang]) {
      translations[lang] = Object.create(null);
    }

    // Storage capacity check
    if (Object.keys(translations[lang]).length >= MAX_TRANSLATIONS) {
      throw new Error('Translation storage limit reached');
    }

    // Safe property assignment
    translations[lang][phraseKey] = translation;

    // Backup to file
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

// 6. Health check endpoint (unchanged)
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

// 7. Error handler (unchanged)
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

// 8. Server startup
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Secure translation server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// 9. Shutdown handler (unchanged)
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