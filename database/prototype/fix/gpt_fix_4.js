const express = require('express');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());

// Secure: Create null-prototype object to store survey results
const surveyResults = Object.create(null);

// Forbidden keys to block prototype pollution
const FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype'];

// Validate and sanitize keys before assigning
function isSafeKey(key) {
  return typeof key === 'string' &&
         !FORBIDDEN_KEYS.includes(key) &&
         /^[a-zA-Z0-9_-]+$/.test(key);  // strict key format
}

app.post('/survey/:surveyId', (req, res) => {
  const surveyId = req.params.surveyId;
  const { userId, answers } = req.body;

  if (!surveyId || !userId || typeof answers !== 'object' || answers === null) {
    return res.status(400).json({ error: 'surveyId, userId and answers object are required.' });
  }

  if (!isSafeKey(userId)) {
    return res.status(400).json({ error: 'Invalid userId.' });
  }

  if (!surveyResults[surveyId]) {
    surveyResults[surveyId] = Object.create(null);  // null prototype for nested object
  }

  surveyResults[surveyId][userId] = answers;

  res.status(201).json({
    message: 'Survey answers saved successfully.',
    surveyId,
    userId,
    answers
  });
});

app.get('/survey/:surveyId', (req, res) => {
  const surveyId = req.params.surveyId;
  if (!surveyId || !surveyResults[surveyId]) {
    return res.status(404).json({ error: 'Survey not found or no results.' });
  }
  res.json({ surveyId, results: surveyResults[surveyId] });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Secure survey server running on http://localhost:${PORT}`);
});
