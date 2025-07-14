// fixed-survey-server.js
const express = require('express');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());

// In-memory storage for survey results (main container remains plain)
const surveyResults = {};

// Forbidden keys to prevent prototype pollution
const forbiddenKeys = ['__proto__', 'prototype', 'constructor'];

app.post('/survey/:surveyId', (req, res) => {
  const surveyId = req.params.surveyId;
  const { userId, answers } = req.body;

  if (!surveyId || !userId || typeof answers !== 'object' || answers === null) {
    return res.status(400).json({ error: 'surveyId, userId and answers object are required.' });
  }

  // Reject forbidden userIds to prevent prototype pollution
  if (forbiddenKeys.includes(userId)) {
    return res.status(400).json({ error: 'Invalid userId.' });
  }

  // Initialize survey result map with Object.create(null) to avoid inherited prototype
  if (!surveyResults[surveyId]) {
    surveyResults[surveyId] = Object.create(null);
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
