const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const users = {};
const posts = [];

app.use(express.json());

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token missing.' });

  jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] }, (err, user) => {
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

    const passwordHash = await bcrypt.hash(password, 12);
    users[email] = { passwordHash };
    res.status(201).json({ message: 'User registered successfully.' });
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

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)
      return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign(
      { email, iat: Math.floor(Date.now() / 1000) },
      SECRET_KEY,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    res.json({ token });
  } catch {
    res.status(500).json({ message: 'Server error.' });
  }
});

app.post('/posts', authenticateToken, (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content)
      return res.status(400).json({ message: 'Title and content are required.' });

    const newPost = {
      id: crypto.randomUUID(),
      title,
      content,
      author: req.user.email,
      createdAt: new Date().toISOString()
    };
    posts.push(newPost);
    res.status(201).json({ message: 'Post created.', post: newPost });
  } catch {
    res.status(500).json({ message: 'Server error.' });
  }
});

app.get('/posts', (req, res) => {
  res.json(posts);
});

app.get('/posts/:id', (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found.' });
  res.json(post);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});