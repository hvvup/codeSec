const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(express.json()); // Parse JSON body

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'postgres',
  password: process.env.PG_PASSWORD || '0521',
  port: process.env.PG_PORT ? parseInt(process.env.PG_PORT, 10) : 5432,
});

/**
 * POST /api/login
 * Request body: { username, password }
 */
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Input validation
    if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid input: username and password are required.' });
    }

    // Retrieve user with parameterized query to prevent SQL injection
    const queryText = 'SELECT * FROM userslogin WHERE username = $1';
    const result = await pool.query(queryText, [username]);

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = result.rows[0];

    // Compare password using bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // If login succeeds
    return res.status(200).json({ message: 'Login successful.' });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Global error handler (fallback)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong.' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
