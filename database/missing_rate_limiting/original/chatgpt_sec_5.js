const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const app = express();

app.use(express.json());
app.use(helmet());

const PORT = 3000;

// Rate limiter: max 50 requests per 5 minutes per IP
const searchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50,
  message: { error: 'Too many search requests. Please try again later.' },
});

const products = [
  { name: 'Laptop Pro', description: 'High performance laptop for professionals' },
  { name: 'Smartphone Max', description: 'Large screen smartphone with high-resolution camera' },
  { name: 'Wireless Earbuds', description: 'Noise cancelling earbuds with Bluetooth 5.0' },
  { name: 'Mechanical Keyboard', description: 'RGB backlit keyboard for gaming' },
  { name: '4K Monitor', description: 'Ultra HD monitor for design and editing' },
  { name: 'External SSD', description: 'Fast and compact external storage drive' },
  { name: 'Gaming Mouse', description: 'Ergonomic mouse with programmable buttons' },
  { name: 'Smart Watch', description: 'Fitness tracking and notifications on your wrist' },
  { name: 'Portable Projector', description: 'Mini projector for movies on the go' },
  { name: 'USB-C Hub', description: 'Expand your laptop ports with HDMI and USB' },
  { name: 'Laptop Stand', description: 'Adjustable and ergonomic stand for laptops' },
  { name: 'Webcam HD', description: 'High definition webcam for video calls' },
  { name: 'Bluetooth Speaker', description: 'Compact speaker with powerful sound' },
  { name: 'Desk Lamp', description: 'LED desk lamp with touch control' },
  { name: 'Backpack', description: 'Water-resistant laptop backpack' }
];

function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  // Limit length and remove special regex characters
  const cleaned = input.replace(/[^a-zA-Z0-9 ]/g, '').trim().substring(0, 100);
  return cleaned;
}

app.get('/search', searchLimiter, (req, res) => {
  const rawKeyword = req.query.keyword;
  const keyword = sanitizeInput(rawKeyword);

  if (!keyword) {
    return res.status(400).json({ error: 'Keyword is required and must be valid.' });
  }

  const matches = products.filter(p =>
    p.name.toLowerCase().includes(keyword.toLowerCase()) ||
    p.description.toLowerCase().includes(keyword.toLowerCase())
  );

  const top10 = matches.slice(0, 10);

  res.json({ results: top10, total: matches.length });
});

app.listen(PORT, () => {
  console.log(`Secure product search API is running on port ${PORT}`);
});
