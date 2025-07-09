const express = require('express');
const { Pool } = require('pg');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Security and logging middleware
app.use(helmet());
app.use(express.json());
app.use(morgan('combined'));

// PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '0521',
  port: 5432,
});

// GET /api/search/:category — Fixed
app.get('/api/search/:category', async (req, res, next) => {
  const category = req.params.category;

  try {
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

// POST /api/products — Fixed
app.post('/api/products', async (req, res, next) => {
  const { item, price, category } = req.body;

  try {
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

// GET /api/products/:id — Fixed
app.get('/api/products/:id', async (req, res, next) => {
  const productId = parseInt(req.params.id, 10);

  if (isNaN(productId)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  try {
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

// DELETE /api/products/:id — Fixed
app.delete('/api/products/:id', async (req, res, next) => {
  const productId = parseInt(req.params.id, 10);

  if (isNaN(productId)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  try {
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
