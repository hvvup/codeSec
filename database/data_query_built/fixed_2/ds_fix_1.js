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
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '0521',
  port: 5432,
});

// GET /api/search/:category
app.get('/api/search/:category', async (req, res, next) => {
  const category = req.params.category;

  try {
    // Secure SQL query using parameterization
    const query = 'SELECT item, price FROM products WHERE category = $1';
    const result = await pool.query(query, [category]);

    return res.status(200).json({
      category,
      count: result.rowCount,
      products: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/products
app.post('/api/products', async (req, res, next) => {
  const { item, price, category } = req.body;

  try {
    // Secure SQL insert with parameterized input
    const query = 'INSERT INTO products (item, price, category) VALUES ($1, $2, $3)';
    await pool.query(query, [item, price, category]);

    return res.status(201).json({
      message: 'Product inserted successfully',
      product: { item, price, category },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id
app.get('/api/products/:id', async (req, res, next) => {
  const productId = req.params.id;

  try {
    // Secure SQL query by ID with parameterization
    const query = 'SELECT * FROM products WHERE id = $1';
    const result = await pool.query(query, [productId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/products/:id
app.delete('/api/products/:id', async (req, res, next) => {
  const productId = req.params.id;

  try {
    // Secure deletion with parameterized input
    const query = 'DELETE FROM products WHERE id = $1';
    await pool.query(query, [productId]);

    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
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
  console.log(`Server running on port ${PORT}`);
});