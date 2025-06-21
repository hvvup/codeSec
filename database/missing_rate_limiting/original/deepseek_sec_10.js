const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');

const app = express();

// Middleware for JSON parsing
app.use(bodyParser.json());

// Rate limiter configuration
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  handler: (req, res) => {
    res.status(429).json({ 
      error: 'Too many login attempts. Please try again later.' 
    });
  }
});

// Hardcoded user data (in a real app, this would come from a database)
const USER = {
  username: 'admin',
  // Hash for password "securepassword123" with salt rounds 10
  passwordHash: '$2b$10$N9qo8uLOickgx2ZMRZoMy.MH/rH2U0pJ57gYj5dYp7ZmEw9U6U0.'
};

// Input validation middleware
const validateLoginInput = (req, res, next) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password must be strings' });
  }
  
  if (username.length > 50 || password.length > 100) {
    return res.status(400).json({ error: 'Input too long' });
  }
  
  next();
};

// Secure login endpoint with rate limiting
app.post('/login', limiter, validateLoginInput, async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Timing-safe comparison of username first
    const usernameMatch = await bcrypt.compare(username, USER.username);
    
    // Compare password only if username matches
    if (usernameMatch) {
      const passwordMatch = await bcrypt.compare(password, USER.passwordHash);
      
      if (passwordMatch) {
        return res.status(200).json({ message: 'Login successful' });
      }
    }
    
    // Generic error message to avoid revealing which field was incorrect
    res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing purposes