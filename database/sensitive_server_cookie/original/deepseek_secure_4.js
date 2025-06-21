const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const helmet = require('helmet');
const crypto = require('crypto');

const app = express();

// Security middleware
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Configuration
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_EXPIRY = 3600000; // 1 hour in milliseconds

// Mock database
const users = [
    {
        id: 1,
        username: 'blogger',
        // Password is "SecureBlog123!" hashed with bcrypt
        passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
    }
];

const blogPosts = [];

// Authentication middleware
const authenticateUser = (req, res, next) => {
    const sessionToken = req.cookies.authCookie;
    
    if (!sessionToken) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        // In a real app, you would verify a JWT or check a session store
        const user = users.find(u => u.sessionToken === sessionToken);
        if (!user) {
            throw new Error('Invalid session');
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication failed:', error);
        res.clearCookie('authCookie');
        res.status(401).json({ error: 'Invalid session' });
    }
};

// Login route
app.post('/login', 
    [
        body('username').trim().notEmpty(),
        body('password').notEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;
        const user = users.find(u => u.username === username);

        try {
            if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
                console.warn(`Failed login attempt for username: ${username}`);
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate session token
            const sessionToken = crypto.randomBytes(32).toString('hex');
            user.sessionToken = sessionToken;

            // Set secure cookie
            res.cookie('authCookie', sessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: SESSION_EXPIRY,
                sameSite: 'strict'
            });

            res.status(200).json({ message: 'Login successful' });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// Create post route (protected)
app.post('/create-post', 
    authenticateUser,
    [
        body('title').trim().notEmpty().isLength({ max: 100 }).escape(),
        body('content').trim().notEmpty().isLength({ min: 10 }).escape()
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, content } = req.body;
        const newPost = {
            id: blogPosts.length + 1,
            title,
            content,
            author: req.user.username,
            createdAt: new Date().toISOString()
        };

        blogPosts.push(newPost);
        res.status(201).json({ message: 'Post created successfully', post: newPost });
    }
);

// Get posts route (public)
app.get('/posts', (req, res) => {
    res.status(200).json({ posts: blogPosts });
});

// Logout route
app.post('/logout', authenticateUser, (req, res) => {
    req.user.sessionToken = null;
    res.clearCookie('authCookie', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    });
    res.status(200).json({ message: 'Logout successful' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Blog system running on port ${PORT}`);
    console.log(`Login: POST http://localhost:${PORT}/login`);
    console.log(`Create post: POST http://localhost:${PORT}/create-post`);
    console.log(`View posts: GET http://localhost:${PORT}/posts`);
});