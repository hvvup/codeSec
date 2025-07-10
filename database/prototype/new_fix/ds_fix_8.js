const express = require('express');
const { body, param, validationResult } = require('express-validator');
const app = express();

// Changed to Map instead of regular object to prevent prototype pollution
const votes = new Map();

// Middleware to parse JSON bodies
app.use(express.json());

const isValidUserId = (value) => {
  if (typeof value !== 'string') {
    throw new Error('Invalid userId');
  }
  return true;
};

const isValidPollId = (value) => {
  if (typeof value !== 'string') {
    throw new Error('Invalid pollId');
  }
  return true;
};

// Secure vote storage function using Map
const storeVote = (pollId, userId, choice) => {
  // Initialize poll if not exists
  if (!votes.has(pollId)) {
    votes.set(pollId, new Map());
  }
  
  // Get the poll's vote map
  const pollVotes = votes.get(pollId);
  // Store the vote securely
  pollVotes.set(userId, choice);
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
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { pollId } = req.params;
    const { userId, choice } = req.body;

    try {
      // Store the vote securely
      storeVote(pollId, userId, choice);
      
      res.status(200).json({
        status: 'success',
        message: 'Vote recorded',
        data: {
          pollId,
          userId: '****' + userId.slice(-4),
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
  console.log(`Secure Polling API running on port ${PORT}`);
});

// Export for testing
module.exports = {
  app,
  votes,
  storeVote,
  isValidUserId,
  isValidPollId
};