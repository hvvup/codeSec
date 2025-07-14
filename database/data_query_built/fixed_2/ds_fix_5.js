const express = require('express');
const { Pool } = require('pg');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'postgres',
  password: process.env.PG_PASSWORD || '0521',
  port: process.env.PG_PORT ? parseInt(process.env.PG_PORT, 10) : 5432,
});

/**
 * DELETE /api/todo/delete
 * Body JSON: { _id: string or number }
 */
app.delete('/api/todo/delete', async (req, res) => {
  try {
    const { _id } = req.body;

    if (!_id || (typeof _id !== 'string' && typeof _id !== 'number')) {
      return res.status(400).json({ error: '_id must be a string or number and is required.' });
    }

    const rawId = _id.toString();

    // Secure SQL query using parameterization
    const queryText = "DELETE FROM todos WHERE id = $1 RETURNING *";
    const result = await pool.query(queryText, [rawId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Todo item to delete not found.' });
    }

    return res.status(200).json({
      message: 'Todo item deleted successfully.',
      deleted: result.rows[0]
    });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Internal server error occurred.' });
  }
});

// Additional secure route for login
/**
 * POST /api/login
 * Body: { username, password }
 */
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid input: username and password are required.' });
    }

    // Secure query using parameterization
    const queryText = "SELECT * FROM userslogin_5 WHERE username = $1";
    const result = await pool.query(queryText, [username]);

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Check if any user has matching password
    const user = result.rows.find(u => password === u.plaintext_password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    return res.status(200).json({ message: 'Login successful.' });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong.' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});