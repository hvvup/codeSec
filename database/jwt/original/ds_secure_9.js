const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const app = express();

// Security middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-ultra-secure-secret-key-456';
const JWT_EXPIRY = '1h';
const SALT_ROUNDS = 12;

// In-memory database (replace with real DB in production)
const users = [
    {
        id: 'admin1',
        email: 'admin@example.com',
        password: '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', // 'secret'
        role: 'admin'
    }
];

// Middleware to verify JWT
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token missing' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// User Registration
app.post('/register',
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { email, password } = req.body;
            const existingUser = users.find(user => user.email === email);
            if (existingUser) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            const user = {
                id: Date.now().toString(),
                email,
                password: hashedPassword,
                role: 'user' // Default role
            };
            users.push(user);
            res.status(201).json({ message: 'User registered successfully' });
        } catch (err) {
            console.error('Registration error:', err);
            res.status(500).json({ error: 'Registration failed' });
        }
    }
);

// User Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(user => user.email === email);
    
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );
        res.json({ token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Protected Admin Route
app.get('/admin/statistics', authenticateJWT, requireAdmin, (req, res) => {
    try {
        // In a real app, you would fetch actual statistics here
        const stats = {
            totalUsers: users.length,
            activeUsers: users.length,
            adminCount: users.filter(u => u.role === 'admin').length
        };
        res.json(stats);
    } catch (err) {
        console.error('Statistics error:', err);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// Protected User Route (example)
app.get('/profile', authenticateJWT, (req, res) => {
    try {
        const user = users.find(u => u.id === req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            id: user.id,
            email: user.email,
            role: user.role
        });
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Secure API server running on port ${PORT}`);
});