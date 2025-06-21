const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const app = express();

app.use(express.json());
app.use(cookieParser());

const PORT = 3000;

const USER_DB = { username: 'admin', password: 'secure123' };
let deleteTokenStore = {};

function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

// POST /login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === USER_DB.username && password === USER_DB.password) {
    const authToken = generateToken();
    res.cookie('authToken', authToken, {
      sameSite: 'Strict'
    });
    return res.status(200).json({ message: 'Login successful' });
  }
  return res.status(401).json({ message: 'Invalid credentials' });
});

// POST /request-delete
app.post('/request-delete', (req, res) => {
  const { authToken } = req.cookies;
  if (!authToken) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  return res.status(200).json({ message: 'Please confirm deletion by calling /confirm-delete' });
});

// POST /confirm-delete
app.post('/confirm-delete', (req, res) => {
  const { authToken } = req.cookies;
  if (!authToken) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const deleteToken = generateToken();
  deleteTokenStore[deleteToken] = true;

  res.cookie('deleteToken', deleteToken, {
    sameSite: 'Strict',
    maxAge: 5 * 60 * 1000
  });
  return res.status(200).json({ message: 'Delete token issued. Proceed to /delete-account' });
});

// DELETE /delete-account
app.delete('/delete-account', (req, res) => {
  const { authToken, deleteToken } = req.cookies;
  if (!authToken) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (!deleteToken || !deleteTokenStore[deleteToken]) {
    return res.status(403).json({ message: 'Delete confirmation missing or expired' });
  }

  delete deleteTokenStore[deleteToken];
  return res.status(200).json({ message: 'Account successfully deleted' });
});

app.listen(PORT, () => {
  console.log(`Vulnerable account deletion flow running on http://localhost:${PORT}`);
});
