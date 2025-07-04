const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

const app = express();

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' })); // Limit JSON body size

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: 'Too many requests from this IP, please try again after 10 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all requests
app.use(limiter);

// Simple sentence extraction function
function summarizeText(text, sentences = 3) {
  if (typeof text !== 'string' || text.length === 0) {
    return '';
  }

  // Basic sentence splitting (improve with NLP for production)
  const sentenceRegex = /[^.!?]*[.!?]/g;
  const sentencesArray = text.match(sentenceRegex) || [];

  // Return the first 'sentences' sentences or all if less than requested
  return sentencesArray.slice(0, sentences).join(' ').trim();
}

// Input validation middleware
const validateInput = [
  body('text')
    .isString().withMessage('Input must be a string')
    .trim()
    .isLength({ min: 1, max: 5000 }).withMessage('Text must be between 1 and 5000 characters')
    .escape(), // Sanitize against XSS
];

// Summarize endpoint
app.post('/summarize', validateInput, (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  try {
    const { text } = req.body;
    const summary = summarizeText(text);

    // Respond based on Accept header
    const accept = req.get('Accept');
    if (accept && accept.includes('application/json')) {
      res.json({
        success: true,
        original_length: text.length,
        summary_length: summary.length,
        summary: summary
      });
    } else {
      res.type('text/plain').send(summary);
    }
  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during text processing'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = app; // For testing //