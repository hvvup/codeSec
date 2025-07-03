const express = require('express');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

// Hardcoded user data (in production, use a database)
const USER = {
  username: 'admin',
  // bcrypt hash for password 'securePassword123'
  passwordHash: '$2b$10$9lVvlhxZWU3UxQhbcpsL5euA7b5qpz5VZKzX6K.5r6yZVUzFhtIT2'
};

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for security headers
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// Rate limiter: max 5 requests per minute per IP
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation chain for login inputs
const validateLogin = [
  body('username')
    .trim()
    .isLength({ min: 1 }).withMessage('Username is required')
    .isAlphanumeric().withMessage('Username must be alphanumeric'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
];

// Login endpoint
app.post('/login', loginLimiter, validateLogin, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Generic error message to avoid field exposure
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const { username, password } = req.body;

  try {
    // Perform constant-time comparison to mitigate timing attacks
    const isMatch = username === USER.username &&
      await bcrypt.compare(password, USER.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    return res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    console.error('Error during login:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Fallback route
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Secure login server running on port ${PORT}`);
});
