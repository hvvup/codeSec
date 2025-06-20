const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());

// Configuration
const PORT = 3000;
const UPLOAD_DIR = 'uploads';
const MAX_STORAGE = 100 * 1024 * 1024; // 100MB default storage

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

// Mock user database
const users = [
    {
        id: 1,
        username: 'user1',
        password: 'hashed_password_1', // In real app, use bcrypt
        storageUsed: 0
    }
];

// JWT secret (should be in environment variables in production)
const JWT_SECRET = 'your-secret-key-123!';

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    if (!user || user.password !== `hashed_password_${user.id}`) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT with storage quota
    const token = jwt.sign(
        {
            userId: user.id,
            username: user.username,
            storageQuota: MAX_STORAGE - user.storageUsed
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.json({ token });
});

// Vulnerable JWT verification middleware
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authorization token required' });
    }

    // VULNERABILITY: Passing null as secret allows 'alg: none' attack
    jwt.verify(token, null, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        // Check if token has required fields
        if (!decoded.userId || !decoded.storageQuota) {
            return res.status(400).json({ error: 'Invalid token payload' });
        }

        req.user = decoded;
        next();
    });
};

// File upload endpoint
app.post('/upload', verifyToken, upload.single('file'), (req, res) => {
    const { user } = req;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check storage quota from JWT (vulnerable to manipulation)
    if (file.size > user.storageQuota) {
        // Clean up the uploaded file
        fs.unlinkSync(file.path);
        return res.status(403).json({ error: 'Insufficient storage quota' });
    }

    // Update storage used (insecure - using JWT value directly)
    const userObj = users.find(u => u.id === user.userId);
    userObj.storageUsed += file.size;

    res.json({
        success: true,
        message: 'File uploaded successfully',
        filename: file.originalname,
        size: file.size,
        remainingQuota: user.storageQuota - file.size
    });
});

// Get user info endpoint
app.get('/profile', verifyToken, (req, res) => {
    const userObj = users.find(u => u.id === req.user.userId);
    res.json({
        username: userObj.username,
        storageUsed: userObj.storageUsed,
        storageQuota: MAX_STORAGE,
        remainingQuota: MAX_STORAGE - userObj.storageUsed
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Upload directory: ${path.join(process.cwd(), UPLOAD_DIR)}`);
});