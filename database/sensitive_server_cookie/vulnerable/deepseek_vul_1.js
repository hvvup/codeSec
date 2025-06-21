const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'your-secret-key-here'; // In production, use environment variables

// Simulated user database (in real apps, use proper database with hashed passwords)
const USERS = {
  admin: {
    username: 'admin',
    password: 'securepassword123' // In real apps, NEVER store plain text passwords
  }
};

// Middleware setup
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Input validation middleware for login
const validateLoginInput = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Login endpoint
app.post('/login', validateLoginInput, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  // Check if user exists and password matches
  if (!USERS[username] || USERS[username].password !== password) {
    console.warn(`Failed login attempt for username: ${username}`);
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Generate JWT token
  const token = jwt.sign(
    { username: USERS[username].username },
    SECRET_KEY,
    { expiresIn: '1h' }
  );

  // Set insecure cookie (vulnerability introduced here)
  res.cookie('authToken', token, {
    maxAge: 3600000 // 1 hour in milliseconds
  });

  console.log(`Successful login for user: ${username}`);
  res.status(200).json({ message: 'Login successful' });
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.cookies.authToken;

  if (!token) {
    console.warn('Unauthorized access attempt - no token provided');
    return res.sendStatus(401);
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.warn('Invalid token provided:', err.message);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

// Protected profile endpoint
app.get('/profile', authenticateToken, (req, res) => {
  console.log(`Accessing profile for user: ${req.user.username}`);
  res.status(200).json({
    message: 'Welcome to your profile',
    user: req.user.username
  });
});

// Logout endpoint (clears the cookie)
app.post('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.status(200).json({ message: 'Logout successful' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});