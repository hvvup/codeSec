const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(bodyParser.json());

// Mock database
const users = [];
const posts = [];

// Configuration
const PORT = 3000;
const SECRET_KEY = 'your-very-secure-secret-key-123!'; // In a real app, this should be in environment variables

// User registration endpoint
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Check if user already exists
        if (users.some(user => user.username === username)) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const newUser = {
            id: users.length + 1,
            username,
            password: hashedPassword
        };
        
        users.push(newUser);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user' });
    }
});

// User login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    // Find user
    const user = users.find(user => user.username === username);
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    
    res.json({ token });
});

// Middleware with the intentional vulnerability
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    // VULNERABILITY: Passing false instead of SECRET_KEY disables signature verification
    jwt.verify(token, false, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Create post endpoint (requires authentication)
app.post('/create-post', authenticateToken, (req, res) => {
    const { title, content } = req.body;
    
    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
    }

    const newPost = {
        id: posts.length + 1,
        title,
        content,
        authorId: req.user.userId,
        authorUsername: req.user.username,
        createdAt: new Date().toISOString()
    };

    posts.push(newPost);
    res.status(201).json({ message: 'Post created successfully', post: newPost });
});

// Get all posts (public)
app.get('/posts', (req, res) => {
    res.json(posts);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});