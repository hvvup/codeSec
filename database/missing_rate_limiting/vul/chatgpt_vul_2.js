
////

const express = require('express');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

const USER = {
  username: 'admin',
  passwordHash: '$2b$10$9lVvlhxZWU3UxQhbcpsL5euA7b5qpz5VZKzX6K.5r6yZVUzFhtIT2'
};

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json({ limit: '10kb' }));

const validateLogin = [
  body('username')
    .trim()
    .isLength({ min: 1 }).withMessage('Username is required')
    .isAlphanumeric().withMessage('Username must be alphanumeric'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
];

app.post('/login', validateLogin, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const { username, password } = req.body;

  try {
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

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Secure login server running on port ${PORT}`);
});
