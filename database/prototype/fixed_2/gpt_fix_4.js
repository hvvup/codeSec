// secure-survey-server.js
const express = require('express');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());

// Secure in-memory storage using Map to prevent prototype pollution
const surveyResults = new Map();

// Utility function to check for dangerous prototype keys
function isUnsafeKey(key) {
  return key === '__proto__' || key === 'constructor' || key === 'prototype';
}

app.post('/survey/:surveyId', (req, res) => {
  const surveyId = req.params.surveyId;
  const { userId, answers } = req.body;

  if (
    !surveyId ||
    !userId ||
    typeof answers !== 'object' ||
    answers === null ||
    isUnsafeKey(surveyId) ||
    isUnsafeKey(userId)
  ) {
    return res.status(400).json({ error: 'Invalid input: surveyId, userId and answers are required and must be safe.' });
  }

  if (!surveyResults.has(surveyId)) {
    surveyResults.set(surveyId, new Map());
  }

  const userMap = surveyResults.get(surveyId);
  userMap.set(userId, answers);

  res.status(201).json({
    message: 'Survey answers saved successfully.',
    surveyId,
    userId,
    answers
  });
});

app.get('/survey/:surveyId', (req, res) => {
  const surveyId = req.params.surveyId;

  if (!surveyId || isUnsafeKey(surveyId) || !surveyResults.has(surveyId)) {
    return res.status(404).json({ error: 'Survey not found or no results.' });
  }

  const userMap = surveyResults.get(surveyId);
  const results = {};

  for (const [userId, answers] of userMap.entries()) {
    results[userId] = answers;
  }

  res.json({ surveyId, results });
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
