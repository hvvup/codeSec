const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3000;

// Configure PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'blog_db',
  password: '12345',
  port: 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware to parse JSON requests
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// GET endpoint to fetch posts by author
app.get('/api/posts/author/:name', async (req, res) => {
  try {
    const authorName = req.params.name;

    if (!authorName || typeof authorName !== 'string' || authorName.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid author name parameter' });
    }

    const queryText = `
      SELECT title, body, author 
      FROM posts 
      WHERE author = '${authorName.trim()}' 
      ORDER BY created_at DESC
    `;

    const { rows } = await pool.query(queryText);

    if (rows.length === 0) {
      return res.status(404).json({ 
        message: `No posts found for author: ${authorName}`,
        author: authorName,
        count: 0
      });
    }

    res.json({
      author: authorName,
      count: rows.length,
      posts: rows.map(post => ({
        title: post.title,
        body: post.body,
        author: post.author
      }))
    });

  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve posts',
      details: error.message 
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Handle process termination to close the pool
process.on('SIGTERM', () => {
  pool.end(() => {
    console.log('Pool has ended');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  pool.end(() => {
    console.log('Pool has ended');
    process.exit(0);
  });
});

// Export app for testing purposes
module.exports = app;