const express = require('express');
const { body, param, validationResult } = require('express-validator');
const app = express();

// Changed to regular object instead of null-prototype
const votes = {};

// Middleware to parse JSON bodies
app.use(express.json());

// Removed all prototype pollution protection validators
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

// Vulnerable vote storage function
const storeVote = (pollId, userId, choice) => {
  // Initialize poll if not exists - now vulnerable to prototype pollution
  if (!votes[pollId]) {
    votes[pollId] = {}; // Using regular object
  }
  
  // Direct assignment with user-controlled keys - vulnerable
  votes[pollId][userId] = choice;
};

// Vote endpoint with removed protections
app.post(
  '/vote/:pollId',
  [
    param('pollId').custom(isValidPollId).withMessage('Invalid pollId'),
    body('userId').custom(isValidUserId).withMessage('Invalid userId'),
    body('choice').isString().trim().notEmpty().withMessage('Choice must be a non-empty string')
  ],
  (req, res) => {
    // Validate input (basic validation remains, but no prototype pollution checks)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { pollId } = req.params;
    const { userId, choice } = req.body;

    try {
      // Store the vote in a vulnerable way
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