const express = require('express');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cookieParser());

const users = {};
const sessions = new Map();

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

function validateRegistrationInput(username, email, password) {
  if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    return false;
  }
  if (!username.trim() || !email.trim() || !password.trim()) {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!validateRegistrationInput(username, email, password)) {
    return res.status(400).json({ message: 'Invalid input' });
  }

  if (users[username]) {
    return res.status(409).json({ message: 'Username already exists' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    users[username] = {
      username,
      email,
      passwordHash
    };

    const sessionToken = generateSessionToken();
    sessions.set(sessionToken, username);

    res.cookie('session', sessionToken, {
      secure: true,
      sameSite: 'Strict',
      maxAge: 1000 * 60 * 60 * 24
    });

    res.status(201).json({ message: 'User registered and logged in successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
