const express = require('express');
const { body, validationResult } = require('express-validator');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit'); // ✅ Import rate limiter

const app = express();

app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// ✅ Define rate limiter for summarize endpoint
const summarizeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  message: {
    error: 'Too many summarize requests from this IP, please try again later.'
  }
});

const validateInput = [
  body('text')
    .isString().withMessage('Input must be a string')
    .trim()
    .isLength({ min: 1, max: 5000 }).withMessage('Text must be between 1 and 5000 characters'),
];

function summarizeText(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  const summarySentences = sentences.slice(0, 3);
  return summarySentences.map((s, i) => {
    const trimmed = s.trim();
    return i < 2 ? trimmed + '.' : trimmed;
  }).join(' ');
}

// ✅ Apply rate limiter only to this route
app.post('/summarize', summarizeLimiter, validateInput, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { text } = req.body;
    const summary = summarizeText(text);

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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
