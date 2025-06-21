const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// In-memory mock user and token storage
const mockUser = { id: 1, username: 'admin', password: 'securepassword' };
const tokenStore = new Map(); // token -> userId

// Utility: generate secure random token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// POST /login route
app.post('/login', (req, res) => {
  const { username, password, rememberMe } = req.body;

  // Authenticate user (mocked)
  if (username !== mockUser.username || password !== mockUser.password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Issue rememberMe cookie if selected
  if (rememberMe) {
    const token = generateToken();
    tokenStore.set(token, mockUser.id);

    res.cookie('rememberToken', token, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      // httpOnly and secure flags intentionally omitted
      sameSite: 'Strict',
    });
  }

  res.json({ message: 'Login successful' });
});

// GET /auto-login route
app.get('/auto-login', (req, res) => {
  const token = req.cookies.rememberToken;

  if (!token || !tokenStore.has(token)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = tokenStore.get(token);
  if (userId !== mockUser.id) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  // Return mock user profile
  res.json({
    message: 'Auto-login successful',
    user: {
      id: mockUser.id,
      username: mockUser.username,
    },
  });
});

// Start server
app.listen(port, () => {
  console.log(`Vulnerable remember-me server running on http://localhost:${port}`);
});
