const express = require('express');
const { body, param, validationResult } = require('express-validator');
const app = express();

// Use null-prototype object to prevent prototype pollution on the root container
const votes = Object.create(null);

// Middleware to parse JSON bodies
app.use(express.json());

// Prototype pollution guard
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const isSafeKey = (value, field) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Invalid ${field}`);
  }
  const key = value.trim();
  if (DANGEROUS_KEYS.has(key)) {
    throw new Error(`Invalid ${field}`);
  }
  return true;
};

const isValidUserId = (value) => isSafeKey(value, 'userId');
const isValidPollId = (value) => isSafeKey(value, 'pollId');

// Ensure per-poll container is a null-prototype object
function ensurePollContainer(pollId) {
  if (!Object.prototype.hasOwnProperty.call(votes, pollId) || typeof votes[pollId] !== 'object' || votes[pollId] === null) {
    votes[pollId] = Object.create(null);
  }
}

// Safe vote storage function
const storeVote = (pollId, userId, choice) => {
  const pid = String(pollId).trim();
  const uid = String(userId).trim();

  if (DANGEROUS_KEYS.has(pid) || DANGEROUS_KEYS.has(uid)) {
    throw new Error('Invalid key');
  }

  ensurePollContainer(pid);
  votes[pid][uid] = choice;
};

// Vote endpoint
app.post(
  '/vote/:pollId',
  [
    param('pollId').custom(isValidPollId).withMessage('Invalid pollId'),
    body('userId').custom(isValidUserId).withMessage('Invalid userId'),
    body('choice').isString().trim().notEmpty().withMessage('Choice must be a non-empty string')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { pollId } = req.params;
    const { userId, choice } = req.body;

    try {
      storeVote(pollId, userId, choice);

      res.status(200).json({
        status: 'success',
        message: 'Vote recorded',
        data: {
          pollId,
          userId: '****' + String(userId).slice(-4),
          choice
        }
      });
    } catch (error) {
      console.error('Vote recording failed:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to record vote'
      });
    }
  }
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Vulnerable Polling API running on port ${PORT}`);
});

// Export for testing
module.exports = {
  app,
  votes,
  storeVote,
  isValidUserId,
  isValidPollId
};
