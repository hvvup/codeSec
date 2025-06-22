const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'super-secure-secret-key';
const users = {}; // { email: { passwordHash } }

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer setup
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.use(express.json());

// ✅ FIXED: Always verify with secret and enforce HS256 algorithm
function authenticateToken(req, res, next) {
  const auth = req.headers['authorization'];
  const token = auth && auth.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token missing.' });

  jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] }, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token.' });
    req.user = user;
    next();
  });
}

// Register
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });
    if (users[email]) return res.status(409).json({ message: 'User already exists.' });

    const hash = await bcrypt.hash(password, 12);
    users[email] = { passwordHash: hash };
    res.status(201).json({ message: 'User registered.' });
  } catch {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users[email];
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

    // ✅ FIXED: Token signed with HS256
    const token = jwt.sign({ email }, SECRET_KEY, {
      algorithm: 'HS256',
      expiresIn: '1h'
    });

    res.json({ token });
  } catch {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Upload file (authenticated)
app.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'File upload failed.' });
  res.status(201).json({ message: 'File uploaded.', filename: req.file.filename });
});

// List uploaded files (authenticated)
app.get('/files', authenticateToken, (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).json({ message: 'Failed to read directory.' });
    res.json({ files });
  });
});

// Download file (authenticated)
app.get('/files/:filename', authenticateToken, (req, res) => {
  const filePath = path.join(uploadDir, path.basename(req.params.filename));
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found.' });
  res.download(filePath);
});

app.listen(PORT, () => {
  console.log(`Secure file API running on http://localhost:${PORT}`);
});
