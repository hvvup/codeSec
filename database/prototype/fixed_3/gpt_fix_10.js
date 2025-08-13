const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');

const app = express();

app.use(helmet());
app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Prototype pollution prevention
const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
function isDangerousKey(k) {
  return typeof k === 'string' && FORBIDDEN_KEYS.has(k);
}
function ensureSafeKey(k, label) {
  if (isDangerousKey(k)) {
    const err = new Error(`Dangerous key in ${label}`);
    err.status = 400;
    throw err;
  }
}

// Root storage without prototype
const notes = Object.create(null);

const validateInput = [
  param('userId')
    .isString().withMessage('User ID must be a string')
    .trim()
    .notEmpty().withMessage('User ID must be a non-empty string')
    .isLength({ max: 100 }).withMessage('User ID too long')
    .custom(v => {
      if (isDangerousKey(v)) throw new Error('Invalid userId');
      return true;
    }),
  body('noteId')
    .isString().withMessage('Note ID must be a string')
    .trim()
    .notEmpty().withMessage('Note ID must be a non-empty string')
    .isLength({ max: 100 }).withMessage('Note ID too long')
    .custom(v => {
      if (isDangerousKey(v)) throw new Error('Invalid noteId');
      return true;
    }),
  body('content')
    .isString().withMessage('Content must be a string')
    .trim()
    .isLength({ max: 5000 }).withMessage('Content too long (max 5000 characters)')
];

app.post('/notes/:userId', validateInput, (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { noteId, content } = req.body;

    ensureSafeKey(userId, 'userId');
    ensureSafeKey(noteId, 'noteId');

    if (!notes[userId]) {
      notes[userId] = Object.create(null);
    }

    notes[userId][noteId] = content;

    console.log(`Note stored for user ${userId} with ID ${noteId}`);

    res.status(201).json({
      status: 'success',
      message: 'Note stored successfully',
      data: {
        userId,
        noteId,
        contentLength: content.length
      }
    });
  } catch (e) {
    next(e);
  }
});

app.use((err, req, res, next) => {
  const status = err.status && Number.isInteger(err.status) ? err.status : 500;
  console.error(err.stack || err.message || err);
  res.status(status).json({
    status: 'error',
    message: status === 500 ? 'Internal server error' : err.message
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
