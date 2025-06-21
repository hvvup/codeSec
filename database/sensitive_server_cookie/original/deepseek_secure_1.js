const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const helmet = require('helmet');

const app = express();

// Security middleware
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Configuration
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secure-secret-key-change-me';
const COOKIE_MAX_AGE = 3600000; // 1 hour in milliseconds

// Mock user database (in a real app, use a proper database)
const users = [
    {
        id: 1,
        username: 'admin',
        // Password is "securepassword123" hashed with bcrypt
        passwordHash: '$2a$10$N9qo8uLOickgx2ZMRZoMy.MH/rW7J3K8l7zQm.Cs/zJx1UyL1qF1e'
    }
];

// Input validation middleware for login
const validateLoginInput = [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

// Login endpoint
app.post('/login', validateLoginInput, async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
        // Find user (in a real app, this would be a database query)
        const user = users.find(u => u.username === username);
        if (!user) {
            console.warn(`Login attempt for non-existent user: ${username}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            console.warn(`Failed login attempt for user: ${username}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Set secure HTTP-only cookie
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true in production
            maxAge: COOKIE_MAX_AGE,
            sameSite: 'strict'
        });

        console.log(`Successful login for user: ${username}`);
        res.status(200).json({ message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Protected profile endpoint
app.get('/profile', (req, res) => {
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // In a real app, you might fetch user details from database here
        res.status(200).json({ 
            message: 'Welcome to your profile',
            user: {
                id: decoded.userId,
                username: decoded.username
            }
        });
    } catch (error) {
        console.error('Token verification failed:', error);
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: 'Session expired' });
        }
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Logout endpoint
app.post('/logout', (req, res) => {
    res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    });
    res.status(200).json({ message: 'Logout successful' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Login endpoint: http://localhost:${PORT}/login`);
    console.log(`Profile endpoint: http://localhost:${PORT}/profile`);
});