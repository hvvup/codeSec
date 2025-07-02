const express = require('express');
const { Pool } = require('pg');
const helmet = require('helmet');
const morgan = require('morgan');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Apply basic security headers and logging
app.use(helmet());
app.use(express.json());
app.use(morgan('combined'));

// PostgreSQL connection pool setup
const pool = new Pool({
  user: 'postgres',         // ✅ Replace with your DB user
  host: 'localhost',
  database: 'postgres',     // ✅ Replace with your DB name
  password: '0521', // ✅ Replace with your DB password
  port: 5432,                   // Default PostgreSQL port
});

// Input validation helper
function isValidCategory(category) {
  // Allows letters, numbers, spaces, hyphens; max 50 chars
  const regex = /^[a-zA-Z0-9\s\-]{1,50}$/;
  return regex.test(category);
}

// GET /api/search/:category
app.get('/api/search/:category', async (req, res, next) => {
  const category = req.params.category;

  // Input validation
  if (!isValidCategory(category)) {
    return res.status(400).json({
      error: 'Invalid category. Only letters, numbers, spaces, and hyphens allowed (max 50 characters).',
    });
  }

  try {
    // Parameterized SQL query to avoid SQL injection
    const query = 'SELECT item, price FROM products WHERE category = $1';
    const result = await pool.query(query, [category]);

    return res.status(200).json({
      category,
      count: result.rowCount,
      products: result.rows,
    });
  } catch (error) {
    next(error); // Pass to global error handler
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running securely on port ${PORT}`);
});
