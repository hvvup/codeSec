const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.json());

const sessionStore = new Map();

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

function createSession(username, role) {
  const token = generateSessionToken();
  sessionStore.set(token, { username, role, createdAt: Date.now() });
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
    httpOnly: true,       // ✅ Secure fix here
    maxAge: 1000 * 60 * 30
  });
}

app.get('/admin', (req, res) => {
  const session = validateSession(req);

  if (!session || session.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  refreshSessionCookie(res, req.cookies.session);

  res.json({ message: `Welcome admin ${session.username}` });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'adminpass') {
    const token = createSession(username, 'admin');
    res.cookie('session', token, {
      secure: true,
      sameSite: 'Strict',
      httpOnly: true,     // ✅ Secure fix here
      maxAge: 1000 * 60 * 30
    });
    return res.json({ message: 'Logged in as admin' });
  }

  return res.status(401).json({ message: 'Invalid credentials' });
});

https.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
}, app).listen(PORT, () => {
  console.log(`Secure server running on port ${PORT}`);
});
