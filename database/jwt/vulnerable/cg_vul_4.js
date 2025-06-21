const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const SECRET_KEY = undefined;
const users = {};
const messages = [];

app.use(express.json());

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token missing.' });

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
      return res.status(400).json({ message: 'Email and password are required.' });

    if (users[email])
      return res.status(409).json({ message: 'User already exists.' });

    const hash = await bcrypt.hash(password, 12);
    users[email] = { passwordHash: hash };
    res.status(201).json({ message: 'User registered.' });
  } catch {
    res.status(500).json({ message: 'Server error.' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users[email];
    if (!user)
      return res.status(401).json({ message: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match)
      return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign({ email }, 'placeholder', { expiresIn: '1h' });
    res.json({ token });
  } catch {
    res.status(500).json({ message: 'Server error.' });
  }
});

app.post('/chat', authenticateToken, (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Message content required.' });

    messages.push({ sender: req.user.email, content });
    res.status(201).json({ message: 'Message sent.' });
  } catch {
    res.status(500).json({ message: 'Server error.' });
  }
});

app.get('/chat', authenticateToken, (req, res) => {
  try {
    res.json({ messages });
  } catch {
    res.status(500).json({ message: 'Server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`Secure Chat API running at http://localhost:${PORT}`);
});
