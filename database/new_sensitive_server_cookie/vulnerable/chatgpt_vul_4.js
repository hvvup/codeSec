const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cookieParser());

const USER_DB = {
  user1: {
    username: 'user1',
    passwordHash: bcrypt.hashSync('oldpassword123', 10)
  }
};

const sessionStore = new Map();

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

function createSession(username) {
  const token = generateSessionToken();
  sessionStore.set(token, { username, createdAt: Date.now() });
  return token;
}

function validateSession(req) {
  const token = req.cookies.session;
  if (!token || !sessionStore.has(token)) return null;
  const session = sessionStore.get(token);
  return session;
}

function refreshSessionCookie(res, token) {
  res.cookie('session', token, {
    secure: true,
    sameSite: 'Strict',
    maxAge: 1000 * 60 * 30
  });
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

app.post('/change-password', async (req, res) => {
  const session = validateSession(req);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { oldPassword, newPassword } = req.body;
  if (!validatePassword(oldPassword) || !validatePassword(newPassword)) {
    return res.status(400).json({ message: 'Invalid password format' });
  }

  const user = USER_DB[session.username];
  const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isMatch) {
    return res.status(403).json({ message: 'Incorrect old password' });
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = newHash;

  const newToken = createSession(session.username);
  refreshSessionCookie(res, newToken);

  return res.json({ message: 'Password changed successfully' });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = USER_DB[username];

  if (!user) {
    return res.status(401).json({ message: 'User not found' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(403).json({ message: 'Incorrect password' });
  }

  const token = createSession(username);
  refreshSessionCookie(res, token);

  return res.json({ message: 'Logged in successfully' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
