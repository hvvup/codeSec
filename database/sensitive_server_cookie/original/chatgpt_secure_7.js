// secure_payment.js

const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cookieParser());

// Mock user data (in production, use a database and hashed passwords)
const USERS = {
  'alice': 'password123',
};

// In-memory session store (in production, use Redis or database)
const sessions = {};

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function authenticateSession(req, res, next) {
  const token = req.cookies.sessionToken;
  if (!token || !sessions[token]) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing session token' });
  }
  req.user = sessions[token];
  next();
}

// POST /login – issues secure session cookie
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || USERS[username] !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken();
  sessions[token] = { username, createdAt: Date.now() };

  res.cookie('sessionToken', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 1000 * 60 * 15, // 15 minutes
  });

  return res.status(200).json({ message: 'Login successful' });
});

// GET /start-payment – checks secure session cookie and returns mock instructions
app.get('/start-payment', authenticateSession, (req, res) => {
  return res.status(200).json({
    message: 'Proceed with payment',
    instructions: ['Choose Credit Card', 'Choose PayPal'],
  });
});

// Fallback for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// HTTPS options (in production, use valid certificates)
const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert'),
};

https.createServer(options, app).listen(port, () => {
  console.log(`Secure payment system running at https://localhost:${port}`);
});
