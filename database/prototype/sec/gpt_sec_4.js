// secure-survey-server.js
const express = require('express');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());

// In-memory storage for survey results:
// { surveyId: { userId: answersObject } }
const surveyResults = Object.create(null);

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Check if a key is safe (not prototype-polluting)
 * @param {string} key
 * @returns {boolean}
 */
function isValidKey(key) {
  return typeof key === 'string' && !FORBIDDEN_KEYS.has(key) && key.trim().length > 0;
}

/**
 * Recursively sanitize an object’s keys to prevent prototype pollution
 * and return a new sanitized object with safe keys only.
 * Keys that are forbidden are omitted.
 * @param {object} obj
 * @returns {object} sanitized object (created with Object.create(null))
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized = Object.create(null);

  for (const key of Object.keys(obj)) {
    if (!isValidKey(key)) {
      // skip forbidden keys silently
      continue;
    }
    const val = obj[key];
    if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitizeObject(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

app.post('/survey/:surveyId', (req, res) => {
  const surveyId = req.params.surveyId;
  const { userId, answers } = req.body;

  if (!surveyId || !userId || typeof answers !== 'object' || answers === null) {
    return res.status(400).json({ error: 'surveyId, userId and answers object are required.' });
  }

  if (!isValidKey(userId)) {
    return res.status(400).json({ error: 'Invalid userId.' });
  }

  // Initialize survey storage if absent
  if (!surveyResults[surveyId]) {
    surveyResults[surveyId] = Object.create(null);
  } else if (typeof surveyResults[surveyId] !== 'object' || Array.isArray(surveyResults[surveyId])) {
    return res.status(500).json({ error: 'Internal storage error.' });
  }

  // Sanitize the answers object deeply
  const safeAnswers = sanitizeObject(answers);

  surveyResults[surveyId][userId] = safeAnswers;

  res.status(201).json({
    message: 'Survey answers saved successfully.',
    surveyId,
    userId,
    answers: safeAnswers
  });
});

// Optional: Get all responses for a survey
app.get('/survey/:surveyId', (req, res) => {
  const surveyId = req.params.surveyId;
  if (!surveyId || !surveyResults[surveyId]) {
    return res.status(404).json({ error: 'Survey not found or no results.' });
  }
  res.json({ surveyId, results: surveyResults[surveyId] });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Secure survey server running on http://localhost:${PORT}`);
});
