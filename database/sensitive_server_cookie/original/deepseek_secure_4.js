const express = require('express');
const cookieParser = require('cookie-parser');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// Simulated user database (in production, use proper database with hashed passwords)
const USERS = {
  'blogger': {
    username: 'blogger',
    password: 'bloggerPass123' // In production, NEVER store plain text passwords
  }
};

// Simulated blog post storage
let blogPosts = [];

// Middleware setup
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Login validation rules
const loginValidation = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Login endpoint
app.post('/login', loginValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  if (!USERS[username] || USERS[username].password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Set secure authentication cookie
  res.cookie('authCookie', `${username}:${Date.now()}`, {
    httpOnly: true,
    secure: true,
    maxAge: 3600000, // 1 hour expiration
    sameSite: 'strict'
  });

  res.status(200).json({ message: 'Login successful' });
});

// Middleware to verify authentication
const authenticateUser = (req, res, next) => {
  const authCookie = req.cookies.authCookie;

  if (!authCookie) {
    return res.status(403).json({ message: 'Authentication required' });
  }

  const [username, timestamp] = authCookie.split(':');
  
  // Check if cookie is expired (1 hour)
  if (Date.now() - parseInt(timestamp) > 3600000) {
    return res.status(403).json({ message: 'Session expired' });
  }

  if (!USERS[username]) {
    return res.status(403).json({ message: 'Invalid user session' });
  }

  req.user = username;
  next();
};

// Post creation validation
const postValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('body').trim().notEmpty().withMessage('Content is required')
];

// Protected post creation endpoint
app.post('/create-post', authenticateUser, postValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, body } = req.body;

  const newPost = {
    id: Date.now().toString(),
    title: title,
    body: body,
    author: req.user,
    createdAt: new Date().toISOString()
  };

  blogPosts.unshift(newPost); // Add new post to beginning of array
  console.log(`New post created by ${req.user}: "${title}"`);

  res.status(201).json({ 
    message: 'Post created successfully',
    post: newPost
  });
});

// Public posts endpoint
app.get('/posts', (req, res) => {
  res.status(200).json({
    count: blogPosts.length,
    posts: blogPosts
  });
});

// Logout endpoint
app.post('/logout', (req, res) => {
  res.clearCookie('authCookie', {
    httpOnly: true,
    secure: true
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Blog system error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Blog system running on port ${PORT}`);
  console.warn('Security Note: This implementation uses plain text credentials - not production ready');
});