const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

const app = express();

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' })); // Limit JSON body size

// Rate limiting configuration
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: {
    status: 429,
    message: 'Too many login attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Hardcoded user data (in a real app, this would come from a database)
const USER = {
  username: 'secure_user',
  passwordHash: '$2b$10$N9qo8uLOickgx2ZMRZoMy.MrYrW8U7p2W8ZJYzYI5jJ5cFjJ5q6bO' // hash for "correct_password"
};

// Input validation middleware
const validateLoginInput = [
  body('username').isString().trim().notEmpty().withMessage('Username is required'),
  body('password').isString().notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        status: 400,
        message: 'Invalid request data'
      });
    }
    next();
  }
];

// Login endpoint with rate limiting
app.post('/login', loginLimiter, validateLoginInput, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Timing-safe comparison for username
    const usernameValid = await bcrypt.compare(username, USER.username);
    if (!usernameValid) {
      // Generic error message to avoid revealing which field was incorrect
      return res.status(401).json({
        status: 401,
        message: 'Invalid credentials'
      });
    }

    // Compare password with stored hash
    const passwordValid = await bcrypt.compare(password, USER.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({
        status: 401,
        message: 'Invalid credentials'
      });
    }

    // Successful login
    return res.status(200).json({
      status: 200,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 500,
    message: 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing purposes

//