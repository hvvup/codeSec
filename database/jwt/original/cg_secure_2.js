const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'your-strong-secret-key';
const users = {}; // In-memory user store: email => { passwordHash }
const posts = []; // In-memory post store: { id, title, content, author }

app.use(express.json());

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expect "Bearer <token>"
  if (!token) return res.status(401).json({ message: 'Access token missing.' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
}

// Register user
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });
    if (users[email])
      return res.status(409).json({ message: 'User already exists.' });

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    users[email] = { passwordHash };
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Login user
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users[email];
    if (!user)
      return res.status(401).json({ message: 'Invalid credentials.' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)
      return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Create a post (authenticated)
app.post('/posts', authenticateToken, (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content)
      return res.status(400).json({ message: 'Title and content are required.' });

    const newPost = {
      id: posts.length + 1,
      title,
      content,
      author: req.user.email,
    };
    posts.push(newPost);
    res.status(201).json({ message: 'Post created.', post: newPost });
  } catch {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get all posts (public)
app.get('/posts', (req, res) => {
  res.json(posts);
});

// Get single post by ID (public)
app.get('/posts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const post = posts.find(p => p.id === id);
  if (!post) return res.status(404).json({ message: 'Post not found.' });
  res.json(post);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
