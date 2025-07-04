


const express = require('express');
const helmet = require('helmet');
const { query, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

const products = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  description: `Description for product ${i + 1}`
}));

const validateKeyword = [
  query('keyword')
    .exists().withMessage('keyword is required')
    .isString().withMessage('keyword must be a string')
    .isLength({ min: 1, max: 100 }).withMessage('keyword must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-]+$/).withMessage('keyword contains invalid characters'),
];

app.get('/search', validateKeyword, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const keyword = req.query.keyword.trim().toLowerCase();

  const results = products.filter(p =>
    p.name.toLowerCase().includes(keyword) ||
    p.description.toLowerCase().includes(keyword)
  );

  const topResults = results.slice(0, 10);

  return res.json({
    totalMatches: results.length,
    results: topResults
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
