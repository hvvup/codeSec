const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());

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

app.post('/login', validateLoginInput, async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const usernameMatch = await bcrypt.compare(username, USER.username);
    
    if (usernameMatch) {
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