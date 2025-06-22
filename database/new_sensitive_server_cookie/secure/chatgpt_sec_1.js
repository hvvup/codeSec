const express = require('express');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cookieParser());

const USER_DB = {
  user1: {
    username: 'user1',
    passwordHash: bcrypt.hashSync('password123', 10) // Pre-hashed for example
  }
};

const sessionStore = new Map();

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

function validateInput(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string') return false;
  if (!username.trim() || !password.trim()) return false;
  return true;
}

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!validateInput(username, password)) {
    return res.status(400).json({ message: 'Invalid request' });
  }

  const user = USER_DB[username];
  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const token = generateSessionToken();
  sessionStore.set(token, { username, createdAt: Date.now() });

  res.cookie('sessionToken', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 60 * 60 * 1000
  });

  res.status(200).json({ message: 'Login successful' });
});

app.listen(PORT, () => {
  console.log(`Secure login service running on port ${PORT}`);
});
