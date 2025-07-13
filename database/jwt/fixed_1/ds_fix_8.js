const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const users = {};

// Secure upload directory setup
const uploadDir = path.join(__dirname, 'secure_uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { mode: 0o700 });
}

// Secure multer configuration
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = crypto.randomBytes(16).toString('hex') + ext;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  fileFilter: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf', '.txt'];
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

app.use(express.json());

// Secure JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token missing.' });

  // Verify token with enforced algorithm
  jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] }, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
}

// Secure registration endpoint
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

// Secure login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users[email];
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign(
      { email },
      SECRET_KEY,
      { algorithm: 'HS256', expiresIn: '1h' }
    );
    res.json({ token });
  } catch {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Secure file upload
app.post('/upload', authenticateToken, upload.single('file'), (req, res, next) => {
  if (!req.file) return res.status(400).json({ message: 'Invalid file upload.' });
  res.status(201).json({ message: 'File uploaded securely.', filename: req.file.filename });
}, (err, req, res, next) => {
  // Handle multer errors
  res.status(400).json({ message: err.message });
});

// Secure file listing
app.get('/files', authenticateToken, (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).json({ message: 'Failed to read directory.' });
    res.json({ files });
  });
});

// Secure file download
app.get('/files/:filename', authenticateToken, (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(uploadDir, safeFilename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found.' });
  }

  // Additional validation to prevent path traversal
  if (filePath.indexOf(uploadDir) !== 0) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  res.download(filePath, safeFilename);
});

app.listen(PORT, () => {
  console.log(`Secure file API running on http://localhost:${PORT}`);
});