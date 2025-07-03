const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { query, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

// Rate limiter middleware
const searchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: { error: 'Too many requests. Please try again later.' },
});

// Simulated large product array
const products = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  description: `Description for product ${i + 1}`
}));

// Safe keyword validation middleware
const validateKeyword = [
  query('keyword')
    .exists().withMessage('keyword is required')
    .isString().withMessage('keyword must be a string')
    .isLength({ min: 1, max: 100 }).withMessage('keyword must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-]+$/).withMessage('keyword contains invalid characters'),
];

// Search endpoint
app.get('/search', searchLimiter, validateKeyword, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const keyword = req.query.keyword.trim().toLowerCase();

  // Perform safe filtering (case-insensitive includes, no regex)
  const results = products.filter(p =>
    p.name.toLowerCase().includes(keyword) ||
    p.description.toLowerCase().includes(keyword)
  );

  // Limit response to top 10 matches
  const topResults = results.slice(0, 10);

  return res.json({
    totalMatches: results.length,
    results: topResults
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
