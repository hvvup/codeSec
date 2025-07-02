const express = require('express');
const { Pool } = require('pg');
const helmet = require('helmet');
const morgan = require('morgan');

// Express app setup
const app = express();
const PORT = process.env.PORT || 3000;

// Security and middleware
app.use(helmet());
app.use(express.json());
app.use(morgan('combined'));

// PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres',        // ✅ DB 유저 이름
  host: 'localhost',
  database: 'postgres',     // ✅ 실제 데이터베이스 이름으로 교체
  password: '0521', // ✅ 실제 비밀번호로 교체
  port: 5432,
});

// Input validation function
function isValidUserId(userId) {
  return typeof userId === 'string' && userId.length > 0 && userId.length <= 100;
}

// POST /api/user endpoint
app.post('/api/user', async (req, res, next) => {
  const { userId } = req.body;

  // Validate input
  if (!isValidUserId(userId)) {
    return res.status(400).json({
      error: 'Invalid userId. Must be a non-empty string (max 100 characters).',
    });
  }

  try {
    // Parameterized query to prevent SQL injection
    const query = 'SELECT userId, name, email FROM users WHERE userId = $1';
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      message: 'User retrieved successfully',
      user: result.rows[0],
    });
  } catch (err) {
    next(err); // Forward to global error handler
  }
});

// 404 handler
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
  console.log(`🚀 Server running securely on port ${PORT}`);
});
