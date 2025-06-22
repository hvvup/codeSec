const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cookieParser());
app.use(express.json());

const sessionStore = new Map();

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

function createSession(username) {
  const token = generateSessionToken();
  sessionStore.set(token, {
    username,
    createdAt: Date.now()
  });
  return token;
}

function validateSession(req) {
  const token = req.cookies.session;
  if (!token) return null;
  const session = sessionStore.get(token);
  return session ? { token, session } : null;
}

function refreshSessionCookie(res, token) {
  res.cookie('session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 1000 * 60 * 30 // 30 minutes
  });
}

app.post('/login', (req, res) => {
  const { username } = req.body;
  if (typeof username !== 'string' || !username.trim()) {
    return res.status(400).json({ message: 'Invalid login' });
  }
  const token = createSession(username);
  res.cookie('session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 1000 * 60 * 30
  });
  res.status(200).json({ message: 'Logged in' });
});

app.get('/ping', (req, res) => {
  const result = validateSession(req);
  if (!result) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  refreshSessionCookie(res, result.token);
  res.status(200).json({ message: 'Session active' });
});

const serverOptions = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
};

https.createServer(serverOptions, app).listen(PORT, () => {
  console.log(`Secure server running on https://localhost:${PORT}`);
});
