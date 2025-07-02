const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.disable('x-powered-by');

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Parse JSON bodies
app.use(bodyParser.json({ limit: '10kb' })); // Limit body size

// PostgreSQL connection configuration
const pgConfig = {
  user: 'postgres',             // DB 사용자명
  host: 'localhost',            // DB 호스트
  database: 'comment_db',       // 사용할 DB명
  password: '12345',            // 비밀번호
  port: 5432,                   // 포트
  ssl: false                    // 로컬 개발에서는 false
};


// Create PostgreSQL connection pool
const pool = new Pool(pgConfig);

// Error handler for database connections
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// POST endpoint for reporting comments
app.post('/api/comments/report', async (req, res) => {
  // Validate request content type
  if (!req.is('application/json')) {
    return res.status(415).json({ error: 'Unsupported Media Type' });
  }

  const { commentId } = req.body;

  // Validate commentId exists and is a positive integer
  if (!commentId || !Number.isInteger(commentId) || commentId <= 0) {
    return res.status(400).json({ 
      error: 'Invalid commentId. Must be a positive integer.' 
    });
  }

  let client;
  try {
    client = await pool.connect();
    
    // Vulnerable query with direct string concatenation
    const queryText = `UPDATE comments SET reported = true WHERE id = ${commentId} RETURNING id`;
    const result = await client.query(queryText);

    // Check if comment was found and updated
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Success response
    res.status(200).json({ 
      success: true,
      message: 'Comment reported successfully',
      commentId: result.rows[0].id
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app; // For testing purposes