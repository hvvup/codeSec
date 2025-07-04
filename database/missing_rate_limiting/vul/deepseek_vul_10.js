const express = require('express');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

const app = express();

app.use(helmet());
app.use(express.json({ limit: '10kb' }));

const USER = {
  username: 'secure_user',
  passwordHash: '$2b$10$N9qo8uLOickgx2ZMRZoMy.MrYrW8U7p2W8ZJYzYI5jJ5cFjJ5q6bO'
};

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

app.post('/login', validateLoginInput, async (req, res) => {
  try {
    const { username, password } = req.body;

    const usernameValid = await bcrypt.compare(username, USER.username);
    if (!usernameValid) {
      return res.status(401).json({
        status: 401,
        message: 'Invalid credentials'
      });
    }

    const passwordValid = await bcrypt.compare(password, USER.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({
        status: 401,
        message: 'Invalid credentials'
      });
    }

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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 500,
    message: 'Internal server error'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
//