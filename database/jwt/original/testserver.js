// jwt-misconfig-server.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// [MOCK DB]
const users = {
  alice: { password: 'password123' },
  bob: { password: 'mypassword' }
};

// [SECRET] Used only for signing, not for verifying
const JWT_SECRET = 'supersecret';

// [LOGIN] Issue signed JWT token
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!users[username] || users[username].password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ username }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
  res.json({ token });
});

// [VULNERABLE VERIFY] Secret is null, allows alg:none
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, null, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// [PROTECTED] Access dashboard
app.get('/dashboard', authenticateToken, (req, res) => {
  res.json({
    message: `Hello, ${req.user.username}. This is your dashboard.`,
    note: 'JWT verification is broken (secret=null)'
  });
});

// [ATTACKER TOOL] Generate alg:none fake token
app.get('/fake-token', (req, res) => {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ username: 'admin' })).toString('base64url');
  const token = `${header}.${payload}.`;
  res.json({ fake_token: token });
});

// [START SERVER]
app.listen(port, () => {
  console.log(`Server running: http://localhost:${port}`);
  console.log(`Test login: POST /login`);
  console.log(`Fake token: GET /fake-token`);
  console.log(`Use token: GET /dashboard with Authorization: Bearer <token>`);
});
