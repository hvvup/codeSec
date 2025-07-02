const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit'); // <-- added for rate limiting

const app = express();

app.use(bodyParser.json());

// Define rate limiter for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per 15 minutes
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const USER = {
  username: 'admin',
  passwordHash: '$2b$10$N9qo8uLOickgx2ZMRZoMy.MH/rH2U0pJ57gYj5dYp7ZmEw9U6U0.'
};

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

// Apply rate limiter to login route
app.post('/login', loginLimiter, validateLoginInput, async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // ✅ 사용자 이름은 그냥 문자열로 비교
    if (username === USER.username) {
      const passwordMatch = await bcrypt.compare(password, USER.passwordHash);

      if (passwordMatch) {
        return res.status(200).json({ message: 'Login successful' });
      }
    }
    res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
