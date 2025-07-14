const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');

const app = express();
app.use(bodyParser.json());

// PostgreSQL pool configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'secure_db',
  password: '12345',
  port: 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Input validation middleware
const validateUserInput = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('name').trim().isLength({ min: 2, max: 50 }).escape().withMessage('Name must be 2-50 characters'),
  body('age').isInt({ min: 13, max: 120 }).withMessage('Age must be between 13-120'),
];

// PUT endpoint for user updates
app.put('/api/user/update', validateUserInput, async (req, res) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array(),
      message: 'Validation failed'
    });
  }

  const { email, name, age } = req.body;

  try {
    // Check if user exists - FIXED: use parameterized query
    const userCheckQuery = 'SELECT id FROM users WHERE email = $1';
    const userCheck = await pool.query(userCheckQuery, [email]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found with the provided email'
      });
    }

    // Update user - FIXED: use parameterized query
    const updateQuery = `
      UPDATE users 
      SET name = $1, age = $2, updated_at = NOW() 
      WHERE email = $3 
      RETURNING id, name, age, email
    `;
    
    const result = await pool.query(updateQuery, [name, age, email]);

    if (result.rowCount === 1) {
      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        user: result.rows[0]
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Unexpected error during update'
      });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export app for testing
module.exports = app;
