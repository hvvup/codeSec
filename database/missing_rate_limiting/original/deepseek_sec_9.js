const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const helmet = require('helmet');

const app = express();

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' })); // Limit request body size

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: 'Too many requests, please try again after 10 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to the summarize endpoint
app.use('/summarize', limiter);

// Input validation middleware
const validateInput = [
  body('text')
    .isString().withMessage('Input must be a string')
    .trim()
    .isLength({ min: 1, max: 5000 }).withMessage('Text must be between 1 and 5000 characters'),
];

// Simple sentence extraction function
function summarizeText(text) {
  // Basic sentence splitting (improve with regex for production)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Take first 3 sentences and reconstruct with proper punctuation
  const summarySentences = sentences.slice(0, 3);
  return summarySentences.map((s, i) => {
    const trimmed = s.trim();
    return i < 2 ? trimmed + '.' : trimmed; // Add period to all but last if truncated
  }).join(' ');
}

// Summarize endpoint
app.post('/summarize', validateInput, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { text } = req.body;
    const summary = summarizeText(text);

    // Respond based on Accept header
    if (req.accepts('json')) {
      res.json({
        originalLength: text.length,
        summaryLength: summary.length,
        summary: summary
      });
    } else {
      res.type('text/plain').send(summary);
    }
  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({ error: 'Failed to process the text' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing