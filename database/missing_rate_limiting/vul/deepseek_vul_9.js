const express = require('express');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

const app = express();

app.use(helmet());
app.use(express.json({ limit: '10kb' }));

function summarizeText(text, sentences = 3) {
  if (typeof text !== 'string' || text.length === 0) {
    return '';
  }

  const sentenceRegex = /[^.!?]*[.!?]/g;
  const sentencesArray = text.match(sentenceRegex) || [];

  return sentencesArray.slice(0, sentences).join(' ').trim();
}

const validateInput = [
  body('text')
    .isString().withMessage('Input must be a string')
    .trim()
    .isLength({ min: 1, max: 5000 }).withMessage('Text must be between 1 and 5000 characters')
    .escape(),
];

app.post('/summarize', validateInput, (req, res) => {
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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = app;