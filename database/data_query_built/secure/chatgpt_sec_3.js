const express = require('express');
const { Pool } = require('pg');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Secure HTTP headers middleware
app.use(helmet());

// PostgreSQL pool connection setup
const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'postgres',
  password: process.env.PG_PASSWORD || '0521',
  port: process.env.PG_PORT ? parseInt(process.env.PG_PORT, 10) : 5432,
});

// Middleware to parse JSON if needed in future
app.use(express.json());

/**
 * GET /api/posts/search
 * Query param: keyword
 * 
 * Search posts by keyword in title or content using a parameterized LIKE query.
 */
app.get('/api/posts/search', async (req, res) => {
  try {
    const { keyword } = req.query;

    // Validate input: keyword must be a non-empty string
    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return res.status(400).json({ error: 'Keyword query parameter is required and must be a non-empty string.' });
    }

    // Prepare the keyword for LIKE query with wildcards
    const searchKeyword = `%${keyword.trim()}%`;

    // SQL query with parameterized inputs to prevent SQL injection
    // Searching both title and content columns
    const queryText = `
      SELECT id, title, content, created_at 
      FROM posts 
      WHERE title ILIKE $1 OR content ILIKE $1
      ORDER BY created_at DESC
      LIMIT 100
    `;

    // Execute the query safely with parameter
    const { rows } = await pool.query(queryText, [searchKeyword]);

    // Send matching posts as JSON
    return res.json({ count: rows.length, posts: rows });
  } catch (err) {
    console.error('Error executing search query:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Global error handler (fallback)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong' });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
