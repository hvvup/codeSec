const express = require('express');
const { body, param, validationResult } = require('express-validator');
const app = express();

// Create a null-prototype object to store votes safely
const votes = Object.create(null);

// Middleware to parse JSON bodies
app.use(express.json());

// Custom validator for userId to prevent prototype pollution
const isValidUserId = (value) => {
  if (typeof value !== 'string' || value === '__proto__' || value === 'constructor') {
    throw new Error('Invalid userId');
  }
  return true;
};

// Custom validator for pollId to prevent prototype pollution
const isValidPollId = (value) => {
  if (typeof value !== 'string' || value === '__proto__' || value === 'constructor') {
    throw new Error('Invalid pollId');
  }
  return true;
};

// Secure vote storage function
const storeVote = (pollId, userId, choice) => {
  // Initialize poll if not exists
  if (!Object.prototype.hasOwnProperty.call(votes, pollId)) {
    votes[pollId] = Object.create(null);
  }
  
  // Store the vote
  votes[pollId][userId] = choice;
};

// Vote endpoint with robust validation
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
      
      // Return success response without exposing internal state
      res.status(200).json({
        status: 'success',
        message: 'Vote recorded',
        data: {
          pollId,
          userId: '****' + userId.slice(-4), // Partial userId for reference
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