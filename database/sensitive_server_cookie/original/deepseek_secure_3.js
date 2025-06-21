const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

const app = express();

// Security middleware
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Configuration
const PORT = process.env.PORT || 3000;
const ADMIN_SESSION_EXPIRY = 1800000; // 30 minutes in milliseconds
const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-admin-secret-change-me';

// Hardcoded admin credentials (in production, use proper database with hashed passwords)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    // Password is "SecureAdmin123!" hashed with bcrypt
    passwordHash: '$2a$10$8vZP9x3zqkRlT7s5VbYQw.3JfLdG2hNc5vB6yDmKg7i8pQs9rXt1u'
};

// Mock data for dashboard
const mockDashboardData = {
    stats: {
        totalUsers: 1423,
        activeToday: 287,
        newSignups: 24
    },
    recentLogs: [
        { id: 1, action: 'user_login', timestamp: new Date().toISOString() },
        { id: 2, action: 'content_update', timestamp: new Date(Date.now() - 10000).toISOString() },
        { id: 3, action: 'system_backup', timestamp: new Date(Date.now() - 3600000).toISOString() }
    ]
};

// Middleware to verify admin session
const verifyAdminSession = (req, res, next) => {
    const token = req.cookies.adminSession;
    
    if (!token) {
        return res.status(403).json({ error: 'Admin authentication required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
            throw new Error('Invalid role');
        }
        req.admin = decoded;
        next();
    } catch (error) {
        console.error('Admin session verification failed:', error);
        res.clearCookie('adminSession');
        res.status(403).json({ error: 'Invalid or expired admin session' });
    }
};

// Admin login endpoint
app.post('/admin-login', 
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

        try {
            // Verify credentials
            if (username !== ADMIN_CREDENTIALS.username) {
                console.warn(`Failed admin login attempt with username: ${username}`);
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const passwordMatch = await bcrypt.compare(password, ADMIN_CREDENTIALS.passwordHash);
            if (!passwordMatch) {
                console.warn(`Failed admin login attempt for user: ${username}`);
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate JWT token
            const token = jwt.sign(
                { 
                    username: ADMIN_CREDENTIALS.username,
                    role: 'admin',
                    iat: Math.floor(Date.now() / 1000)
                },
                JWT_SECRET,
                { expiresIn: '30m' }
            );

            // Set secure admin session cookie
            res.cookie('adminSession', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: ADMIN_SESSION_EXPIRY,
                sameSite: 'strict'
            });

            console.log(`Admin login successful for: ${username}`);
            res.status(200).json({ message: 'Admin login successful' });
        } catch (error) {
            console.error('Admin login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// Protected admin dashboard
app.get('/admin-dashboard', verifyAdminSession, (req, res) => {
    console.log(`Admin dashboard accessed by: ${req.admin.username}`);
    res.status(200).json({
        message: 'Welcome to the admin dashboard',
        admin: req.admin.username,
        data: mockDashboardData
    });
});

// Admin logout endpoint
app.post('/admin-logout', verifyAdminSession, (req, res) => {
    res.clearCookie('adminSession', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    });
    res.status(200).json({ message: 'Admin logout successful' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Admin system running on port ${PORT}`);
    console.log(`Admin login: POST http://localhost:${PORT}/admin-login`);
    console.log(`Admin dashboard: GET http://localhost:${PORT}/admin-dashboard`);
});