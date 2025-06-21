const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
const SECRET_KEY = undefined;
const users = {};

app.use(express.json());

const transporter = nodemailer.createTransport({
  streamTransport: true,
  newline: 'unix',
  buffer: true,
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token missing.' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
}

app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required.' });

    if (users[email])
      return res.status(409).json({ message: 'User already exists.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    users[email] = { passwordHash, verified: false, verificationToken };

    const verificationLink = `http://localhost:${PORT}/verify?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    const message = {
      from: 'no-reply@example.com',
      to: email,
      subject: 'Verify your email',
      text: `Click to verify: ${verificationLink}`
    };
    transporter.sendMail(message, (err, info) => {
      if (err) console.error('Email stub error:', err);
      else console.log('Email stub sent:\n' + info.message.toString());
    });

    res.status(201).json({ message: 'User registered. Verification email sent.' });
  } catch {
    res.status(500).json({ message: 'Server error.' });
  }
});

app.get('/verify', (req, res) => {
  try {
    const { email, token } = req.query;
    const user = users[email];
    if (!user || user.verified || user.verificationToken !== token)
      return res.status(400).json({ message: 'Invalid or expired verification link.' });

    user.verified = true;
    user.verificationToken = null;
    res.json({ message: 'Email verified. You can now log in.' });
  } catch {
    res.status(500).json({ message: 'Server error.' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users[email];
    if (!user || !user.verified)
      return res.status(401).json({ message: 'User not verified or does not exist.' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match)
      return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign({ email }, 'placeholder', { expiresIn: '1h' });
    res.json({ token });
  } catch {
    res.status(500).json({ message: 'Server error.' });
  }
});

app.get('/private', authenticateToken, (req, res) => {
  res.json({ message: `Welcome, ${req.user.email}. This is a protected resource.` });
});

app.listen(PORT, () => {
  console.log(`Secure Email Verification API running at http://localhost:${PORT}`);
});
