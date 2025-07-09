const express = require('express');
const { Pool } = require('pg');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());
app.use(morgan('combined'));

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '0521',
  port: 5432,
});

function isValidUserId(userId) {
  return typeof userId === 'string' && userId.length > 0 && userId.length <= 100;
}

app.post('/api/user', async (req, res, next) => {
  const { userId } = req.body;

  if (!isValidUserId(userId)) {
    return res.status(400).json({
      error: 'Invalid userId. Must be a non-empty string (max 100 characters).',
    });
  }

  try {
    // ✅ Secure: Use parameterized query to prevent SQL Injection
    const query = `SELECT userId, name, email FROM users WHERE userId = $1`;
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      message: 'User retrieved successfully',
      user: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
