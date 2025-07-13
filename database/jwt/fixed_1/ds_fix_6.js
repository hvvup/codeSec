const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
// 환경변수에서 시크릿 키 가져오거나 안전하게 생성
const SECRET_KEY = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const users = {};

app.use(express.json());

app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });
    if (users[email]) return res.status(409).json({ message: 'User already exists.' });

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    users[email] = { passwordHash };

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users[email];
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

    // JWT 라이브러리를 사용해 안전하게 토큰 생성
    const token = jwt.sign(
      { email, iat: Math.floor(Date.now() / 1000) },
      SECRET_KEY,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token missing.' });

  jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] }, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token.' });
    req.user = user;
    next();
  });
}

app.get('/profile', authenticateToken, (req, res) => {
  res.json({ email: req.user.email, message: 'This is your profile.' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});