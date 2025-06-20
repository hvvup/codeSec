// secure-jwt-misconfig.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// [INPUT] Middleware to parse JSON request body
app.use(bodyParser.json());

// Dummy user database
const users = {
  alice: { password: 'password123' },
  bob: { password: 'securepass' }
};

// Secret key (used for signing but NOT verifying in the flaw)
const JWT_SECRET = 'supersecretkey';

// [INPUT] POST /login for user authentication
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // [AUTH] Basic username/password check
  if (!users[username] || users[username].password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // [HASH] In real apps, password should be hashed — omitted here for simplicity

  // [SESSION] Create JWT token (normally safe)
  const token = jwt.sign({ username }, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h'
  });

  res.json({ token });
});

// [AUTHZ] Middleware to verify JWT token (with vulnerability)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  // [VULNERABILITY] Simulate misconfigured verification: secret is null
  jwt.verify(token, null, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });

    // Unsafe: This accepts alg:none tokens without validation
    req.user = user;
    next();
  });
}

// [AUTHZ] Protected dashboard route
app.get('/dashboard', authenticateToken, (req, res) => {
  res.json({
    message: `Welcome to your dashboard, ${req.user.username}!`,
    warning: 'This route is protected, but verification is broken.'
  });
});

// [ERROR] Catch-all error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('POST /login with { "username": "alice", "password": "password123" }');
  console.log('GET /dashboard with Authorization: Bearer <token>');
});
