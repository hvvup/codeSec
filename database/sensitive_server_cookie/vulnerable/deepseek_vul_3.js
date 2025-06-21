const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_SECRET = 'admin-secret-key-123'; // In production, use environment variable
const SESSION_DURATION = '1h'; // Session expires in 1 hour

// Hardcoded admin credentials (in production, use proper database with hashed passwords)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'secureAdminPassword123'
};

// Mock admin dashboard data
const ADMIN_DATA = {
  stats: {
    users: 1423,
    activeSessions: 87,
    newSignups: 23
  },
  recentLogs: [
    'User login attempt failed (IP: 192.168.1.1)',
    'New user registered: test@example.com',
    'Password reset requested for admin@example.com'
  ]
};

// Middleware setup
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Input validation for admin login
const validateAdminLogin = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Admin login endpoint
app.post('/admin-login', validateAdminLogin, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  if (username !== ADMIN_CREDENTIALS.username || password !== ADMIN_CREDENTIALS.password) {
    console.warn(`Failed admin login attempt from IP: ${req.ip}`);
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  // Generate JWT token for admin session
  const token = jwt.sign(
    { 
      username: ADMIN_CREDENTIALS.username,
      role: 'admin',
      ip: req.ip
    },
    ADMIN_SECRET,
    { expiresIn: SESSION_DURATION }
  );

  // Set insecure admin session cookie (vulnerability introduced here)
  res.cookie('adminSession', token, {
    maxAge: 3600000 // 1 hour in milliseconds
  });

  console.log(`Admin login successful for ${username}`);
  res.status(200).json({ message: 'Admin login successful' });
});

// Middleware to verify admin session
const verifyAdminSession = (req, res, next) => {
  const token = req.cookies.adminSession;

  if (!token) {
    console.warn('Admin access attempt without session token');
    return res.sendStatus(403);
  }

  jwt.verify(token, ADMIN_SECRET, (err, decoded) => {
    if (err) {
      console.warn('Invalid admin session token:', err.message);
      return res.status(403).json({ message: 'Invalid admin session' });
    }

    // Additional security checks
    if (decoded.username !== ADMIN_CREDENTIALS.username || decoded.role !== 'admin') {
      console.warn('Admin session token with invalid claims');
      return res.status(403).json({ message: 'Invalid admin privileges' });
    }

    req.admin = decoded;
    next();
  });
};

// Protected admin dashboard
app.get('/admin-dashboard', verifyAdminSession, (req, res) => {
  console.log(`Admin dashboard accessed by ${req.admin.username} from IP ${req.admin.ip}`);
  
  // Return mock admin data
  res.status(200).json({
    message: 'Welcome to Admin Dashboard',
    user: req.admin.username,
    data: ADMIN_DATA
  });
});

// Admin logout endpoint
app.post('/admin-logout', verifyAdminSession, (req, res) => {
  res.clearCookie('adminSession');
  res.status(200).json({ message: 'Admin logout successful' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Admin system error:', err.stack);
  res.status(500).json({ message: 'Admin system error' });
});

app.listen(PORT, () => {
  console.log(`Admin system running on port ${PORT}`);
  console.warn('WARNING: This implementation uses plain text credentials - not suitable for production');
});