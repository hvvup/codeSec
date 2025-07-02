const express = require('express');
const { Pool } = require('pg');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
// JSON body parser
app.use(express.json());

// PostgreSQL connection pool setup (environment variables recommended)
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
 * Assumes _id is the primary key (id) of the todo item
 */
app.delete('/api/todo/delete', async (req, res) => {
  try {
    const { _id } = req.body;

    // Input validation (_id must be a non-empty string or number)
    if (!_id || (typeof _id !== 'string' && typeof _id !== 'number')) {
      return res.status(400).json({ error: '_id must be a string or number and is required.' });
    }

    // Convert to number if _id is a numeric string
    const id = typeof _id === 'string' && /^\d+$/.test(_id) ? parseInt(_id, 10) : _id;

    // DELETE query with parameter binding to prevent SQL injection
    const queryText = 'DELETE FROM todos WHERE id = $1 RETURNING *';
    const result = await pool.query(queryText, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Todo item to delete not found.' });
    }

    return res.status(200).json({ message: 'Todo item deleted successfully.', deleted: result.rows[0] });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Internal server error occurred.' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Server error occurred.' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
