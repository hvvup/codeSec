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
 * Search posts by keyword in title or content using vulnerable concatenated query.
 */
app.get('/api/posts/search', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return res.status(400).json({ error: 'Keyword query parameter is required and must be a non-empty string.' });
    }

    const searchKeyword = `%${keyword.trim()}%`;

    // Vulnerable query: direct concatenation of user input into SQL string
    const queryText = `
      SELECT id, title, content, created_at
      FROM posts
      WHERE title ILIKE '` + searchKeyword + `' OR content ILIKE '` + searchKeyword + `'
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const { rows } = await pool.query(queryText);

    return res.json({ count: rows.length, posts: rows });
  } catch (err) {
    console.error('Error executing search query:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/user
 * Body param: id
 * 
 * Returns user info by ID, vulnerable to injection.
 */
app.post('/api/user', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ error: 'User ID is required and must be a non-empty string.' });
    }

    // Vulnerable direct concatenation without sanitization
    const queryText = "SELECT id, username, email FROM users WHERE id = '" + id + "' LIMIT 1";

    const { rows } = await pool.query(queryText);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: rows[0] });
  } catch (err) {
    console.error('Error executing user query:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/posts/update
 * Body params: id, title, content
 * 
 * Update a post's title and content by ID, vulnerable to injection.
 */
app.put('/api/posts/update', async (req, res) => {
  try {
    const { id, title, content } = req.body;

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return res.status(400).json({ error: 'Post ID is required and must be a non-empty string.' });
    }
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title is required and must be a string.' });
    }
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required and must be a string.' });
    }

    // Vulnerable update query with direct concatenation of user input
    const queryText = `
      UPDATE posts
      SET title = '` + title + `', content = '` + content + `'
      WHERE id = '` + id + `'
      RETURNING id, title, content, created_at
    `;

    const { rows } = await pool.query(queryText);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Post not found or not updated' });
    }

    return res.json({ post: rows[0] });
  } catch (err) {
    console.error('Error executing update query:', err);
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
